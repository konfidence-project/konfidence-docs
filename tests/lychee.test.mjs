import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";
import { linkArguments, shellArguments } from "../scripts/check-links.mjs";

const execute = promisify(execFile);

async function fixture(t, html) {
  // Exercise both URL encoding and the quoting used by the official GitHub action.
  const root = await mkdtemp(path.join(tmpdir(), "konfidence lychee's "));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "section"));
  await mkdir(path.join(root, "empty"));
  await mkdir(path.join(root, "assets"));
  await writeFile(path.join(root, "index.html"), html);
  await writeFile(path.join(root, "guide.html"), '<h1 id="custom-anchor">Guide</h1>');
  await writeFile(path.join(root, "section/index.html"), '<h1 id="nested">Section</h1>');
  await writeFile(path.join(root, "assets/diagram with spaces.svg"), '<svg xmlns="http://www.w3.org/2000/svg" />');
  return root;
}

async function command(binary, args, cwd) {
  try {
    const output = await execute(binary, args, {
      cwd, encoding: "utf8", maxBuffer: 8 * 1024 * 1024,
      env: { ...process.env, GITHUB_TOKEN: "" }
    });
    return { ...output, code: 0 };
  } catch (error) {
    if (typeof error.code !== "number") throw error;
    return { stdout: error.stdout, stderr: error.stderr, code: error.code };
  }
}

async function check(root, mode = "internal", extra = []) {
  const args = linkArguments(mode, root);
  args.splice(args.length - 2, 0, "--format", "json", ...extra);
  const result = await command("lychee", args, root);
  assert.ok([0, 2].includes(result.code), result.stderr);
  return { ...result, report: JSON.parse(result.stdout) };
}

test("VitePress links resolve against the build, including custom anchors and static images", async (t) => {
  const root = await fixture(t, [
    '<h1 id="start">Home</h1>',
    '<a href="#start">Same page</a>',
    '<a href="guide.html#custom-anchor">Relative page</a>',
    '<a href="/guide#custom-anchor">Root-relative page without extension</a>',
    '<a href="/section/#nested">Directory index</a>',
    '<a href="https://konfidence.cloud/guide.html#custom-anchor">Absolute own-site URL</a>',
    '<a href="http://konfidence.cloud/?source=test#start">Own-site root and query</a>',
    '<img src="/assets/diagram%20with%20spaces.svg" alt="Diagram" />',
    '<pre><code><a href="missing-example.html">Example, not navigation</a></code></pre>'
  ].join("\n"));
  const result = await check(root);
  assert.equal(result.code, 0, result.stdout);
  assert.equal(result.report.errors, 0);
  assert.ok(result.report.successful >= 7, "the input must actually be checked");
  assert.ok(result.report.remaps > 0, "absolute own-site links must be checked locally");
});

for (const [name, html] of [
  ["missing page", '<a href="/missing.html">Missing page</a>'],
  ["missing image", '<img src="/assets/missing.svg" alt="Missing image" />'],
  ["missing heading", '<a href="/guide.html#missing">Missing heading</a>'],
  ["missing heading in a directory index", '<a href="/section/#missing">Missing heading</a>'],
  ["directory without an index", '<a href="/empty/">Missing index</a>'],
  ["absolute own-site link to a missing heading", '<a href="https://konfidence.cloud/guide.html#missing">Missing heading</a>']
]) {
  test(`${name} produces a link finding`, async (t) => {
    const root = await fixture(t, html);
    const result = await check(root);
    assert.equal(result.code, 2, result.stdout);
    assert.equal(result.report.errors, 1);
    assert.equal(Object.values(result.report.error_map).flat().length, 1);
  });
}

test("missing builds and invalid modes cannot silently pass", async (t) => {
  const root = await fixture(t, '<a href="guide.html">Guide</a>');
  assert.throws(() => linkArguments("internal", path.join(root, "missing")), /Run pnpm build/);
  assert.throws(() => linkArguments("typo", root), /internal or external/);
});

test("a malformed configuration fails separately from link findings", async (t) => {
  const root = await fixture(t, '<a href="guide.html">Guide</a>');
  const config = path.join(root, "invalid.toml");
  await writeFile(config, "include_fragments = [\n");
  const result = await command("lychee", ["--config", config, path.join(root, "index.html")], root);
  assert.ok([1, 3].includes(result.code), result.stderr);
  assert.match(result.stderr, /config|TOML|parse/i);
});

test("the GitHub action argument string preserves paths containing spaces and apostrophes", async (t) => {
  const root = await fixture(t, '<a href="guide.html#custom-anchor">Guide</a>');
  const result = await command("bash", ["-c", `lychee ${shellArguments(linkArguments("internal", root))}`], root);
  assert.equal(result.code, 0, result.stderr);
});

async function server(t, handler) {
  const http = createServer(handler);
  http.listen(0, "127.0.0.1");
  await once(http, "listening");
  t.after(() => new Promise(resolve => {
    http.closeAllConnections();
    http.close(resolve);
  }));
  return `http://127.0.0.1:${http.address().port}`;
}

const networkOptions = [
  "--exclude-all-private=false", "--max-retries", "0",
  "--host-request-interval", "0", "--timeout", "1"
];

test("offline checks never contact external targets, and normal external checks skip local dashboards", async (t) => {
  let requests = 0;
  const url = await server(t, (_request, response) => { requests++; response.end("OK"); });
  const root = await fixture(t, `<a href="${url}/dashboard">Dashboard</a>`);
  const offline = await check(root, "internal", networkOptions);
  assert.equal(offline.code, 0);
  const external = await check(root, "external");
  assert.equal(external.code, 0);
  assert.equal(requests, 0);
});

test("external checks accept reachable URLs and redirects", async (t) => {
  const url = await server(t, (request, response) => {
    if (request.url === "/redirect") response.writeHead(302, { location: "/ok" });
    response.end("OK");
  });
  const root = await fixture(t, `<a href="${url}/ok">OK</a><a href="${url}/redirect">Redirect</a>`);
  const result = await check(root, "external", networkOptions);
  assert.equal(result.code, 0, result.stdout);
  assert.equal(result.report.errors, 0);
  assert.equal(result.report.successful, 2);
});

test("missing pages, rate limits, and server errors stay visible with their HTTP status", async (t) => {
  const url = await server(t, (request, response) => {
    response.writeHead(Number(request.url.slice(1)));
    response.end("Check this response");
  });
  const root = await fixture(t, [404, 410, 429, 503].map(code => `<a href="${url}/${code}">${code}</a>`).join("\n"));
  const result = await check(root, "external", networkOptions);
  assert.equal(result.code, 2);
  assert.equal(result.report.errors, 4);
  for (const code of [404, 410, 429, 503]) assert.match(JSON.stringify(result.report.error_map), new RegExp(String(code)));
});

test("timeouts have their own report category", async (t) => {
  const url = await server(t, () => {});
  const root = await fixture(t, `<a href="${url}/slow">Slow site</a>`);
  const result = await check(root, "external", networkOptions);
  assert.equal(result.code, 2);
  assert.equal(result.report.timeouts, 1);
  assert.equal(Object.values(result.report.timeout_map).flat().length, 1);
});

test("failed HTTP responses are retried on the next run instead of restored from cache", async (t) => {
  let requests = 0;
  const url = await server(t, (_request, response) => {
    requests++;
    response.writeHead(requests === 1 ? 503 : 200);
    response.end("Result");
  });
  const root = await fixture(t, `<a href="${url}/changing">Changing site</a>`);
  assert.equal((await check(root, "external", networkOptions)).code, 2);
  assert.equal((await check(root, "external", networkOptions)).code, 0);
  assert.equal(requests, 2);
  assert.ok((await readFile(path.join(root, ".lycheecache"), "utf8")).length > 0);
});
