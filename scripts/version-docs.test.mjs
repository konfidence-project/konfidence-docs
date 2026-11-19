import assert from "node:assert/strict";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "vitest";
import {
  absoluteLinks,
  addVersion,
  compareVersions,
  fixIncludes,
  isSkipped,
  parseArguments,
  pinReferences,
  rewriteDecisionLinks,
  transformMarkdown,
  versionDocs,
} from "./version-docs.mjs";

const tags = { konfidence: "0.1.0-alpha.1", klo: "0.2.0" };

async function fixture(files) {
  const root = await mkdtemp(path.join(tmpdir(), "version-docs-"));
  for (const [name, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(root, name)), { recursive: true });
    await writeFile(path.join(root, name), content);
  }
  return root;
}

const options = (root, extra = {}) => ({
  root,
  version: "0.1",
  konfidence: "0.1.0-alpha.1",
  exclude: [],
  ...extra,
});

test("decisions and excluded pages are skipped", () => {
  const exclude = ["docs/overview.md", "docs/reference/releases.md"];
  assert.equal(isSkipped("extend-customize/decisions/adr-0001-x.md", exclude), true);
  assert.equal(isSkipped("extend-customize/decisions/assets/a.svg", exclude), true);
  assert.equal(isSkipped("overview.md", exclude), true);
  assert.equal(isSkipped("reference/releases.md", exclude), true);
  assert.equal(isSkipped("reference/glossary.md", exclude), false);
  assert.equal(isSkipped("extend-customize/index.md", exclude), false);
});

test("the copy keeps assets and leaves out skipped files", async () => {
  const spec =
    "https://github.com/konfidence-project/konfidence/blob/main/conformance/specs/deployer.md";
  const sidebar = `${JSON.stringify([{ text: "Spec", link: spec }])}\n`;
  const root = await fixture({
    "src/docs/index.md": "# Home\n",
    "src/docs/overview.md": "# Overview\n",
    "src/docs/sidebar.json": sidebar,
    "src/docs/img/a.drawio.svg": "<svg/>",
    "src/docs/extend-customize/decisions/adr-0001-x.md": "# ADR\n",
    "versions.json": "[]\n",
  });
  try {
    const summary = versionDocs(options(root, { exclude: ["docs/overview.md"] }));
    const copy = (name) => path.join(root, "src/0.1/docs", name);
    assert.equal(await readFile(copy("img/a.drawio.svg"), "utf8"), "<svg/>");
    assert.equal(
      await readFile(copy("sidebar.json"), "utf8"),
      sidebar.replace("/blob/main/", "/blob/0.1.0-alpha.1/"),
    );
    assert.ok(existsSync(copy("index.md")));
    assert.ok(!existsSync(copy("overview.md")));
    assert.ok(!existsSync(copy("extend-customize/decisions")));
    assert.deepEqual([summary.files, summary.skipped, summary.pins], [3, 2, 1]);
  } finally {
    await rm(root, { recursive: true });
  }
});

test("absolute docs links are found, except links to the decisions", () => {
  const input = [
    "[Quickstart](/docs/getting-started/quickstart)",
    "[Docs](/docs/)",
    '<a href="/docs/reference/glossary">Glossary</a>',
    "url=/docs/getting-started/quickstart",
    "[ADR](/docs/extend-customize/decisions/adr-0043-x)",
    "[Relative](./quickstart.md) [External](https://example.com/docs/page)",
  ].join("\n");
  assert.deepEqual(absoluteLinks(input), [
    "/docs/getting-started/quickstart",
    "/docs/",
    "/docs/reference/glossary",
    "/docs/getting-started/quickstart",
  ]);
});

test("a page with an absolute docs link stops the copy", async () => {
  const root = await fixture({
    "src/docs/a.md": "[Quickstart](/docs/getting-started/quickstart)\n",
    "versions.json": "[]\n",
  });
  try {
    assert.throws(() => versionDocs(options(root)), /src\/docs\/a\.md: \/docs\/getting-started/);
    assert.ok(!existsSync(path.join(root, "src/0.1")));
  } finally {
    await rm(root, { recursive: true });
  }
});

test("the development pages link to each other relatively", async () => {
  const { srcExclude } = (await import("../.vitepress/config.mts")).default;
  const files = (await readdir("src/docs", { recursive: true })).filter(
    (name) => name.endsWith(".md") && !isSkipped(name, srcExclude),
  );
  const found = [];
  for (const name of files) {
    for (const link of absoluteLinks(await readFile(path.join("src/docs", name), "utf8"))) {
      found.push(`${name}: ${link}`);
    }
  }
  assert.deepEqual(found, []);
});

test("relative links into decisions become absolute", () => {
  const input =
    "[ADR](../../extend-customize/decisions/adr-0043-x.md#why) and [other](./connect.md)";
  const { text, count } = rewriteDecisionLinks(input, "deploy-operate/plan/gateway-routing.md");
  assert.equal(count, 1);
  assert.equal(
    text,
    "[ADR](/docs/extend-customize/decisions/adr-0043-x.md#why) and [other](./connect.md)",
  );
  const index = rewriteDecisionLinks("[Log](./decisions/index.md)", "extend-customize/index.md");
  assert.equal(index.text, "[Log](/docs/extend-customize/decisions/index.md)");
  assert.equal(rewriteDecisionLinks("[X](https://example.com/decisions/a.md)", "a.md").count, 0);
});

test("includes of repository files go one level deeper", () => {
  const input = "<!--@include: ../../../CONTRIBUTING.md-->";
  const { text, count } = fixIncludes(input, "extend-customize/code-of-conduct.md");
  assert.equal(text, "<!--@include: ../../../../CONTRIBUTING.md-->");
  assert.equal(count, 1);
  // a page in the docs root needs two levels up to reach the repository root
  assert.equal(
    fixIncludes("<!--@include: ../../README.md-->", "index.md").text,
    "<!--@include: ../../../README.md-->",
  );
  // includes inside the docs folder and corrected includes stay as they are
  assert.equal(fixIncludes("<!--@include: ../shared.md-->", "a/b.md").count, 0);
  assert.equal(fixIncludes(text, "extend-customize/code-of-conduct.md").count, 0);
});

test("GitHub references are pinned to the release tags", () => {
  const input = [
    "[Script](https://github.com/konfidence-project/konfidence/blob/main/hack/quickstart/quickstart.sh)",
    "[Code](https://github.com/konfidence-project/konfidence/tree/main/pkg/deployer)",
    "[Release](https://github.com/konfidence-project/konfidence/releases/latest)",
    "[KLO](https://github.com/konfidence-project/kubernetes-landscape-orchestrator/blob/main/README.md#local-development)",
    "[Flux](https://github.com/fluxcd/flux2/blob/main/README.md)",
    "[Docs](https://github.com/konfidence-project/konfidence-docs/blob/main/README.md)",
    "[Branch](https://github.com/konfidence-project/konfidence/blob/main-old/a.md)",
    "[CLI](https://konfidence.cloud/install.sh)",
  ].join("\n");
  const { text, count } = pinReferences(input, tags);
  assert.equal(count, 4);
  assert.equal(
    text,
    [
      "[Script](https://github.com/konfidence-project/konfidence/blob/0.1.0-alpha.1/hack/quickstart/quickstart.sh)",
      "[Code](https://github.com/konfidence-project/konfidence/tree/0.1.0-alpha.1/pkg/deployer)",
      "[Release](https://github.com/konfidence-project/konfidence/releases/tag/0.1.0-alpha.1)",
      "[KLO](https://github.com/konfidence-project/kubernetes-landscape-orchestrator/blob/0.2.0/README.md#local-development)",
      "[Flux](https://github.com/fluxcd/flux2/blob/main/README.md)",
      "[Docs](https://github.com/konfidence-project/konfidence-docs/blob/main/README.md)",
      "[Branch](https://github.com/konfidence-project/konfidence/blob/main-old/a.md)",
      "[CLI](https://konfidence.cloud/install.sh)",
    ].join("\n"),
  );
});

test("references in code fences and raw.githubusercontent URLs are pinned", () => {
  const input = [
    "```bash",
    "curl -fsSL https://raw.githubusercontent.com/konfidence-project/konfidence/main/hack/quickstart/quickstart.sh | sh",
    "curl -fsSL https://raw.githubusercontent.com/konfidence-project/kubernetes-landscape-orchestrator/main/hack/a.sh | sh",
    "curl -fsSL https://konfidence.cloud/install.sh | sh",
    "```",
  ].join("\n");
  const { text } = pinReferences(input, tags);
  assert.match(text, /konfidence\/0\.1\.0-alpha\.1\/hack\/quickstart\/quickstart\.sh \| sh/);
  assert.match(text, /kubernetes-landscape-orchestrator\/0\.2\.0\/hack\/a\.sh/);
  assert.match(text, /curl -fsSL https:\/\/konfidence\.cloud\/install\.sh \| sh/);
});

test("the klo tag defaults to the konfidence tag", () => {
  assert.deepEqual(parseArguments(["0.1", "--konfidence", "v1"]), {
    version: "0.1",
    konfidence: "v1",
    klo: "v1",
    force: false,
  });
  assert.deepEqual(parseArguments(["0.1", "--konfidence", "v1", "--klo", "v2", "--force"]), {
    version: "0.1",
    konfidence: "v1",
    klo: "v2",
    force: true,
  });
  assert.throws(() => parseArguments(["0.1"]), /--konfidence/);
  assert.throws(() => parseArguments(["1", "--konfidence", "v1"]), /X\.Y/);
});

test("all rewrites are idempotent", () => {
  const input = [
    "[ADR](../../extend-customize/decisions/adr-1.md)",
    "<!--@include: ../../../CONTRIBUTING.md-->",
    "curl https://raw.githubusercontent.com/konfidence-project/konfidence/main/a.sh",
    "[Latest](https://github.com/konfidence-project/konfidence/releases/latest)",
  ].join("\n");
  const settings = { version: "0.1", ...tags };
  const once = transformMarkdown(input, "extend-customize/page.md", settings);
  const twice = transformMarkdown(once.text, "extend-customize/page.md", settings);
  assert.equal(twice.text, once.text);
  assert.equal(twice.links + twice.pins, 0);
});

test("versions are kept newest first", () => {
  assert.ok(compareVersions("0.10", "0.9") > 0);
  assert.ok(compareVersions("1.0", "0.10") > 0);
  const entry = (version) => ({ version, konfidence: version, klo: version });
  let versions = [];
  for (const version of ["0.2", "0.10", "1.0", "0.9"])
    versions = addVersion(versions, entry(version));
  assert.deepEqual(
    versions.map(({ version }) => version),
    ["1.0", "0.10", "0.9", "0.2"],
  );
  const replaced = addVersion(versions, { version: "0.9", konfidence: "new", klo: "new" });
  assert.equal(replaced.length, 4);
  assert.equal(replaced[2].konfidence, "new");
});

test("an existing version folder is only replaced with force", async () => {
  const root = await fixture({ "src/docs/index.md": "# Home\n", "versions.json": "[]\n" });
  try {
    versionDocs(options(root));
    const versions = JSON.parse(await readFile(path.join(root, "versions.json"), "utf8"));
    assert.deepEqual(versions, [
      { version: "0.1", konfidence: "0.1.0-alpha.1", klo: "0.1.0-alpha.1" },
    ]);

    await writeFile(path.join(root, "src/0.1/docs/stale.md"), "old\n");
    assert.throws(() => versionDocs(options(root)), /--force/);
    assert.ok(existsSync(path.join(root, "src/0.1/docs/stale.md")));

    versionDocs(options(root, { force: true }));
    assert.ok(!existsSync(path.join(root, "src/0.1/docs/stale.md")));
    const again = JSON.parse(await readFile(path.join(root, "versions.json"), "utf8"));
    assert.equal(again.length, 1);
  } finally {
    await rm(root, { recursive: true });
  }
});
