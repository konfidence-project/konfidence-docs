import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import parseYaml from "markdownlint-cli2/parsers/yaml";
import { summarizeLinks } from "../scripts/summarize-links.mjs";

const workflow = parseYaml(readFileSync(new URL("../.github/workflows/documentation-comment.yaml", import.meta.url), "utf8"));
const script = workflow.jobs.comment.steps[0].with.script;
const execute = new (async function () {}).constructor("github", "context", "core", "process", script);
const marker = "<!-- konfidence-docs-maintenance -->";
const visible = comment => comment.body.split("<!-- maintenance-state:")[0];

function annotation(tool, message, file = "README.md", line = 9) {
  return { annotation_level: "warning", path: file, start_line: line,
    message: "[" + tool.toLowerCase() + "] reported by reviewdog 🐶\n" + message + "\n\nRaw Output:\n{}" };
}

function githubFixture() {
  const fixture = { comments: [], writes: [], annotations: {}, head: "a".repeat(40), state: "open", reads: [], changedFiles: ["README.md"] };
  const endpoints = { comments: () => {}, jobs: () => {}, annotations: () => {}, files: () => {} };
  const github = {
    rest: {
      pulls: { get: async () => ({ data: { state: fixture.state, head: { sha: fixture.head } } }), listFiles: endpoints.files },
      actions: { listJobsForWorkflowRun: endpoints.jobs },
      checks: { listAnnotations: endpoints.annotations },
      issues: {
        listComments: endpoints.comments,
        createComment: async data => {
          fixture.writes.push("create");
          fixture.comments.push({ id: fixture.comments.length + 1, user: { login: "github-actions[bot]" }, body: data.body });
        },
        updateComment: async data => {
          fixture.writes.push("update");
          fixture.comments.find(item => item.id === data.comment_id).body = data.body;
        }
      }
    },
    paginate: async (endpoint, args) => {
      fixture.reads.push(args);
      assert.equal(args.per_page, 100);
      if (endpoint === endpoints.comments) return fixture.comments;
      if (endpoint === endpoints.jobs) return ["Vale", "Markdownlint", "Lychee"].map((name, index) => ({
        name, check_run_url: "https://api.github.com/repos/konfidence-project/konfidence-docs/check-runs/" + (index + 1)
      }));
      if (endpoint === endpoints.annotations) return fixture.annotations[args.check_run_id] || [];
      if (endpoint === endpoints.files) return fixture.changedFiles.map(filename => ({ filename }));
      throw new Error("Unexpected API endpoint.");
    }
  };
  fixture.run = async (tool, options = {}) => execute(github, {
    repo: { owner: "konfidence-project", repo: "konfidence-docs" },
    actor: options.actor || "skradde",
    runId: options.runId || 100,
    serverUrl: "https://github.com",
    sha: "b".repeat(40),
    payload: { pull_request: { number: 180, head: {
      sha: options.head || fixture.head,
      repo: { full_name: options.fork ? "someone/fork" : "konfidence-project/konfidence-docs" }
    } } }
  }, { notice() {} }, { env: {
    TOOL: tool, CHECK_RESULT: options.result || "success",
    GITHUB_RUN_ATTEMPT: String(options.attempt || 1),
    LINK_REPORT: JSON.stringify(options.links || { complete: true, total: 0, findings: [] })
  } });
  return fixture;
}

test("all three checks update one comment with locations and actionable findings", async () => {
  const fixture = githubFixture();
  fixture.annotations[1] = [annotation("Vale", "Did you really mean 'neccessary'?")];
  fixture.annotations[2] = [annotation("Markdownlint", "Heading levels should only increment by one level.", "README.md", 7)];
  await fixture.run("Vale");
  assert.match(visible(fixture.comments[0]), /Waiting for this check/);
  await fixture.run("Markdownlint");
  await fixture.run("Lychee");
  assert.deepEqual(fixture.writes, ["create", "update", "update"]);
  const body = visible(fixture.comments[0]);
  assert.match(body, /README\.md:9/);
  assert.match(body, /README\.md#L7/);
  assert.match(body, /No link findings/);
  assert.doesNotMatch(body, /Raw Output|Waiting for this check/);
});

test("a successful rerun removes corrected findings without losing other tool results", async () => {
  const fixture = githubFixture();
  fixture.annotations[1] = [annotation("Vale", "Test spelling finding")];
  fixture.annotations[2] = [annotation("Markdownlint", "Test heading finding")];
  await fixture.run("Vale");
  await fixture.run("Markdownlint");
  fixture.annotations[1] = [];
  await fixture.run("Vale", { attempt: 2 });
  const body = visible(fixture.comments[0]);
  assert.doesNotMatch(body, /Test spelling finding/);
  assert.match(body, /No reported findings on changed PR lines/);
  assert.match(body, /Test heading finding/);
});

test("a new PR commit clears old findings and marks unfinished checks as waiting", async () => {
  const fixture = githubFixture();
  fixture.annotations[2] = [annotation("Markdownlint", "Old finding")];
  await fixture.run("Markdownlint");
  fixture.head = "c".repeat(40);
  await fixture.run("Vale", { runId: 101 });
  assert.equal(fixture.comments.length, 1);
  assert.doesNotMatch(visible(fixture.comments[0]), /Old finding/);
  assert.match(visible(fixture.comments[0]), /ccccccc/);
  assert.match(visible(fixture.comments[0]), /### Markdownlint\n\nWaiting/);
});

test("stale commits, older attempts, and closed PRs cannot overwrite newer results", async () => {
  const fixture = githubFixture();
  await fixture.run("Vale", { runId: 102, attempt: 2 });
  const before = fixture.comments[0].body;
  await fixture.run("Vale", { runId: 101 });
  await fixture.run("Vale", { runId: 102, attempt: 1 });
  await fixture.run("Vale", { head: "c".repeat(40) });
  fixture.state = "closed";
  await fixture.run("Vale", { runId: 103 });
  assert.equal(fixture.comments[0].body, before);
  assert.deepEqual(fixture.writes, ["create"]);
});

test("technical failures and missing link reports cannot be presented as clean checks", async () => {
  const fixture = githubFixture();
  await fixture.run("Vale", { result: "failure" });
  await fixture.run("Lychee", { links: { complete: false, total: 0, findings: [] } });
  const body = visible(fixture.comments[0]);
  assert.match(body, /Check incomplete \(failure\)/);
  assert.doesNotMatch(body, /No link findings|No reported findings/);
});

test("unrelated runner notices and other bots' comments are left alone", async () => {
  const fixture = githubFixture();
  fixture.comments.push({ id: 1, user: { login: "someone" }, body: marker + "\nKeep this comment" });
  fixture.annotations[1] = [{ annotation_level: "notice", message: "Runner upgrade" },
    { annotation_level: "warning", message: "Unrelated warning" }];
  await fixture.run("Vale");
  assert.equal(fixture.comments.length, 2);
  assert.match(fixture.comments[0].body, /Keep this comment/);
  assert.doesNotMatch(visible(fixture.comments[1]), /Runner upgrade|Unrelated warning/);
});

test("comment content escapes Markdown, mentions, and unusual filenames", async () => {
  const fixture = githubFixture();
  fixture.annotations[1] = [annotation("Vale", "<script>@everyone | [click](javascript:alert(1))\nnew row", "docs/a file).md")];
  await fixture.run("Vale");
  const body = visible(fixture.comments[0]);
  assert.doesNotMatch(body, /<script>|@everyone|\[click\]/);
  assert.match(body, /docs\/a%20file%29\.md#L9/);
});

test("large reports stay bounded and link to the complete report", async () => {
  const fixture = githubFixture();
  fixture.annotations[1] = Array.from({ length: 150 }, () => annotation("Vale", "x".repeat(10000)));
  await fixture.run("Vale");
  assert.ok(fixture.comments[0].body.length < 60000);
  assert.match(visible(fixture.comments[0]), /150 reported findings/);
  assert.match(visible(fixture.comments[0]), /Showing \d+ of 150/);
});

test("fork and Dependabot runs do not attempt comment writes", async () => {
  const fixture = githubFixture();
  await fixture.run("Vale", { fork: true });
  await fixture.run("Vale", { actor: "dependabot[bot]" });
  assert.deepEqual(fixture.writes, []);
  assert.deepEqual(fixture.reads, []);
});

test("changed-file link findings appear before the older link backlog", async () => {
  const fixture = githubFixture();
  const findings = Array.from({ length: 12 }, (_, index) => ({ path: "src/old" + index + ".md", line: 1, message: "Old link" }));
  findings.push({ path: "README.md", line: 5, target: "https://vitpress.de/", message: "Check the address" });
  await fixture.run("Lychee", { links: { complete: true, total: findings.length, findings } });
  assert.match(visible(fixture.comments[0]), /README\.md:5/);
  assert.ok(visible(fixture.comments[0]).indexOf("README.md:5") < visible(fixture.comments[0]).indexOf("src/old0.md"));
});

test("the reporting workflow serializes updates and does not execute checked-out code", () => {
  assert.equal(workflow.jobs.comment.concurrency.queue, "max");
  assert.equal(workflow.jobs.comment.permissions["pull-requests"], "write");
  assert.equal(workflow.jobs.comment.permissions.contents, undefined);
  assert.equal(workflow.jobs.comment.steps.length, 1);
  assert.match(workflow.jobs.comment.steps[0].uses, /^actions\/github-script@[a-f0-9]{40}$/);
  assert.doesNotMatch(script, /\$\{\{/);
  for (const name of ["vale", "markdownlint", "lychee"]) {
    const caller = parseYaml(readFileSync(new URL("../.github/workflows/" + name + ".yaml", import.meta.url), "utf8"));
    assert.equal(caller.permissions.contents, "read");
    assert.equal(caller.jobs.report.uses, "./.github/workflows/documentation-comment.yaml");
    assert.match(caller.jobs.report.if, /always\(\)/);
  }
});

const successReport = "| 🔍 Total | 2 |\n| 🚫 Errors | 0 |\n| ⏳ Timeouts | 0 |\n";
function linkFixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), "maintenance reports "));
  const reports = path.join(root, "reports");
  mkdirSync(reports);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const write = (file, content) => {
    const destination = path.join(root, file);
    mkdirSync(path.dirname(destination), { recursive: true });
    writeFileSync(destination, content);
    return destination;
  };
  for (const mode of ["internal", "readme", "external"]) write("reports/lychee-" + mode + ".md", successReport);
  const errors = (mode, rows) => write("reports/lychee-" + mode + ".md",
    "| 🔍 Total | 3 |\n| 🚫 Errors | " + rows.length + " |\n\n## Errors per input\n\n" + rows.join("\n\n"));
  const row = (file, target, status = "404", line = 25) => "### Errors in " + path.join(root, file) + "\n\n* [" + status + "] <" + target + "> (at " + line + ":1) | Check failed";
  return { root, reports, write, errors, row, summary: () => summarizeLinks(reports, root) };
}

test("successful link reports remain distinct from missing or malformed reports", t => {
  const fixture = linkFixture(t);
  assert.deepEqual(fixture.summary(), { complete: true, total: 0, occurrences: 0, findings: [] });
  fixture.write("reports/lychee-external.md", "[Full Github Actions output](https://github.com/example)");
  assert.equal(fixture.summary().complete, false);
  rmSync(path.join(fixture.reports, "lychee-external.md"));
  assert.equal(fixture.summary().complete, false);
});

test("link reports map README and built pages to their actual source lines", t => {
  const fixture = linkFixture(t);
  fixture.write("README.md", "# Docs\n\n[Link](https://missing.example/readme)");
  fixture.write("src/docs/guide.md", "# Guide\n\n[Link](https://missing.example/guide)");
  fixture.errors("external", [
    fixture.row("README.md", "https://missing.example/readme", "404", 3),
    fixture.row(".vitepress/dist/docs/guide.html", "https://missing.example/guide")
  ]);
  const summary = fixture.summary();
  assert.equal(summary.complete, true);
  assert.deepEqual(summary.findings.map(({ path, line }) => ({ path, line })), [
    { path: "README.md", line: 3 }, { path: "src/docs/guide.md", line: 3 }
  ]);
});

test("repeated footer failures point once to the shared component", t => {
  const fixture = linkFixture(t);
  fixture.write(".vitepress/theme/Footer.vue", "<footer>\n<a href=\"https://example.org/legal\">Legal</a>\n</footer>");
  fixture.errors("external", [
    fixture.row(".vitepress/dist/docs/a.html", "https://example.org/legal", "403"),
    fixture.row(".vitepress/dist/docs/b.html", "https://example.org/legal", "403")
  ]);
  const summary = fixture.summary();
  assert.equal(summary.total, 1);
  assert.equal(summary.occurrences, 2);
  assert.equal(summary.findings[0].path, ".vitepress/theme/Footer.vue");
  assert.equal(summary.findings[0].line, 2);
  assert.match(summary.findings[0].message, /does not prove the link is broken/);
});

test("an HTML line is never presented as a source line without a matching URL", t => {
  const fixture = linkFixture(t);
  fixture.write("src/docs/guide.md", "# Guide\n\n[Relative link](./missing)");
  fixture.errors("internal", [fixture.row(".vitepress/dist/docs/guide.html", "file://" + fixture.root + "/.vitepress/dist/docs/missing.html", "ERROR", 250)]);
  const finding = fixture.summary().findings[0];
  assert.equal(finding.path, "src/docs/guide.md");
  assert.equal(finding.line, undefined);
  assert.equal(finding.target, "/docs/missing.html");
});

test("network failures, access restrictions, and missing targets get different guidance", t => {
  const fixture = linkFixture(t);
  fixture.write("README.md", "# Docs");
  fixture.errors("external", ["404", "410", "401", "403", "429", "503", "TIMEOUT"].map(status =>
    fixture.row("README.md", "https://example.org/" + status, status, 1)));
  const summary = fixture.summary();
  assert.match(summary.findings[0].message, /update the link if its target moved/);
  assert.match(summary.findings[2].message, /Check access in a browser/);
  assert.match(summary.findings[4].message, /Retry later/);
  assert.match(summary.findings[5].message, /availability/);
  assert.match(summary.findings[6].message, /address and availability/);
});

test("unknown report formats cannot silently claim that all links passed", t => {
  const fixture = linkFixture(t);
  fixture.write("reports/lychee-external.md", "| Total | 2 |\n| Errors | 1 |\n* unrecognized finding\n");
  assert.equal(fixture.summary().complete, false);
});

test("GitHub 404 responses retain the possibility of a private target", t => {
  const fixture = linkFixture(t);
  fixture.write("README.md", "# Docs");
  fixture.errors("external", [fixture.row("README.md", "https://github.com/example/private/issues/1", "404", 1)]);
  assert.match(fixture.summary().findings[0].message, /repository access/);
});

test("inputs outside the workspace do not become source links", t => {
  const fixture = linkFixture(t);
  fixture.errors("external", ["### Errors in /etc/passwd\n\n* [404] <https://missing.example> | Not found"]);
  assert.equal(fixture.summary().findings[0].path, undefined);
});
