import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import parseYaml from "markdownlint-cli2/parsers/yaml";
import { pullRequestFiles, summarizeLinks } from "../scripts/summarize-links.mjs";

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
  const fixture = { comments: [], writes: [], annotations: {}, head: "a".repeat(40), state: "open", reads: [] };
  const endpoints = { comments: () => {}, jobs: () => {}, annotations: () => {} };
  const github = {
    rest: {
      pulls: { get: async () => ({ data: { state: fixture.state, head: { sha: fixture.head } } }) },
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
    LINK_REPORT: JSON.stringify(options.links || { complete: true, scope: "pull_request", total: 0, findings: [] })
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

test("the comment reports only the scoped count and links to the full website report", async () => {
  const fixture = githubFixture();
  const findings = [{ path: "README.md", line: 5, target: "https://vitpress.de/", message: "Check the address" }];
  await fixture.run("Lychee", { links: { complete: true, scope: "pull_request", total: 1, findings } });
  assert.match(visible(fixture.comments[0]), /README\.md:5/);
  assert.match(visible(fixture.comments[0]), /1 link finding relevant to this PR/);
  assert.match(visible(fixture.comments[0]), /Open full website and README link report/);
  assert.doesNotMatch(visible(fixture.comments[0]), /findings across the website/);
});

test("an unfiltered link report cannot publish the backlog or claim a clean PR", async () => {
  const fixture = githubFixture();
  await fixture.run("Lychee", { links: { complete: true, scope: "all", total: 1,
    findings: [{ path: "src/old.md", message: "Unrelated finding" }] } });
  assert.match(visible(fixture.comments[0]), /Check incomplete/);
  assert.doesNotMatch(visible(fixture.comments[0]), /Unrelated finding|No link findings/);
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
  return { root, reports, write, errors, row, summary: changedFiles => summarizeLinks(reports, root, { changedFiles }) };
}

test("successful link reports remain distinct from missing or malformed reports", t => {
  const fixture = linkFixture(t);
  assert.deepEqual(fixture.summary(), { complete: true, scope: "all", total: 0, occurrences: 0, findings: [] });
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
  fixture.write("src/docs/guide.md", "# Guide\n\nA component generates the link.");
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

test("PR reports keep changed pages and README findings and omit unrelated pages", t => {
  const fixture = linkFixture(t);
  fixture.write("README.md", "[Link](https://missing.example/readme)");
  fixture.write("src/docs/guide.md", "[Link](https://missing.example/guide)");
  fixture.write("src/docs/old.md", "[Link](https://missing.example/old)");
  fixture.errors("external", [
    fixture.row("README.md", "https://missing.example/readme", "404", 1),
    fixture.row(".vitepress/dist/docs/guide.html", "https://missing.example/guide"),
    fixture.row(".vitepress/dist/docs/old.html", "https://missing.example/old")
  ]);
  const summary = fixture.summary(["README.md", "src/docs/guide.md"]);
  assert.equal(summary.scope, "pull_request");
  assert.deepEqual(summary.findings.map(item => item.path), ["README.md", "src/docs/guide.md"]);
  assert.equal(summary.total, 2);
  assert.equal(fixture.summary().total, 3, "full local reports must retain the backlog");
  assert.equal(fixture.summary([]).total, 0, "an empty PR diff must not mean the whole website");
});

test("shared footer findings are relevant only when the component or target changes", t => {
  const fixture = linkFixture(t);
  fixture.write("src/docs/guide.md", "# Guide");
  fixture.write(".vitepress/theme/Footer.vue", '<a href="https://missing.example/legal">Legal</a>');
  fixture.errors("external", [
    fixture.row(".vitepress/dist/docs/guide.html", "https://missing.example/legal", "403"),
    fixture.row(".vitepress/dist/docs/other.html", "https://missing.example/legal", "403")
  ]);
  assert.equal(fixture.summary(["src/docs/guide.md"]).total, 0);
  const summary = fixture.summary([".vitepress/theme/Footer.vue"]);
  assert.equal(summary.total, 1);
  assert.equal(summary.findings[0].occurrences, 2);
});

for (const [name, target, changed, markdown] of [
  ["changed heading", "docs/target.html#removed", ["src/docs/target.md"], "./target.md#removed"],
  ["renamed page", "docs/old-name.html", ["src/docs/old-name.md", "src/docs/new-name.md"], "./old-name.md"],
  ["deleted asset", "assets/missing.png", ["public/assets/missing.png"], "/assets/missing.png"],
  ["directory index", "docs/section/index.html#removed", ["src/docs/section/index.md"], "./section/index.md#removed"],
  ["extensionless page", "docs/target#removed", ["src/docs/target.md"], "./target#removed"],
  ["encoded filename", "docs/target%20with%20spaces.html#removed", ["src/docs/target with spaces.md"], "./target%20with%20spaces.md#removed"]
]) {
  test("an unchanged page stays relevant for a " + name, t => {
    const fixture = linkFixture(t);
    fixture.write("src/docs/guide.md", "# Guide\n\n[Target](" + markdown + ")");
    fixture.errors("internal", [fixture.row(".vitepress/dist/docs/guide.html",
      "file://" + fixture.root + "/.vitepress/dist/" + target, "ERROR")]);
    const summary = fixture.summary(changed);
    assert.equal(summary.total, 1);
    assert.equal(summary.findings[0].path, "src/docs/guide.md");
    assert.equal(summary.findings[0].line, 3);
    assert.match(summary.findings[0].message, /target changed in this PR/);
    assert.equal(fixture.summary(["src/docs/unrelated.md"]).total, 0);
  });
}

test("relative links and same-page fragments map to Markdown lines, not HTML lines", t => {
  const fixture = linkFixture(t);
  fixture.write("src/docs/guide.md", "# Guide\n\n[Target](./missing.md#section)\n[Heading](#removed)");
  fixture.errors("internal", [
    fixture.row(".vitepress/dist/docs/guide.html", "file://" + fixture.root + "/.vitepress/dist/docs/missing.html#section", "ERROR", 250),
    fixture.row(".vitepress/dist/docs/guide.html", "file://" + fixture.root + "/.vitepress/dist/docs/guide.html#removed", "ERROR", 250)
  ]);
  assert.deepEqual(fixture.summary(["src/docs/guide.md"]).findings.map(item => item.line), [3, 4]);
});

test("README links to changed repository files remain relevant", t => {
  const fixture = linkFixture(t);
  fixture.write("README.md", "# Docs\n\n[Guide](CONTRIBUTING.md#removed)");
  fixture.errors("readme", [fixture.row("README.md", "file://" + fixture.root + "/CONTRIBUTING.md#removed", "ERROR", 3)]);
  const summary = fixture.summary(["CONTRIBUTING.md"]);
  assert.equal(summary.total, 1);
  assert.equal(summary.findings[0].line, 3);
});

test("README directory links remain relevant when the last file in the directory is deleted", t => {
  const fixture = linkFixture(t);
  fixture.write("README.md", "[Licenses](LICENSES/)");
  fixture.errors("readme", [fixture.row("README.md", "file://" + fixture.root + "/LICENSES/", "ERROR", 1)]);
  assert.equal(fixture.summary(["LICENSES/Apache-2.0.txt"]).total, 1);
  assert.equal(fixture.summary(["src/docs/unrelated.md"]).total, 0);
});

test("links in included Markdown point to the changed include file", t => {
  const fixture = linkFixture(t);
  fixture.write("src/docs/extend-customize/code-of-conduct.md", "# Policy\n<!--@include: ../../../CONTRIBUTING.md-->");
  fixture.write("CONTRIBUTING.md", "# Contributing\n[Link](https://missing.example/contributing)");
  fixture.errors("external", [fixture.row(".vitepress/dist/docs/extend-customize/code-of-conduct.html", "https://missing.example/contributing")]);
  const summary = fixture.summary(["CONTRIBUTING.md"]);
  assert.equal(summary.total, 1);
  assert.equal(summary.findings[0].path, "CONTRIBUTING.md");
  assert.equal(summary.findings[0].line, 2);
});

test("a changed included heading keeps incoming links from unchanged pages in scope", t => {
  const fixture = linkFixture(t);
  fixture.write("src/docs/extend-customize/code-of-conduct.md", "# Policy\n<!--@include: ../../../CONTRIBUTING.md-->");
  fixture.write("CONTRIBUTING.md", "# New heading\n<!--@include: CONTRIBUTING.md-->");
  fixture.write("src/index.md", "[Policy](./docs/extend-customize/code-of-conduct.md#old-heading)");
  fixture.errors("internal", [fixture.row(".vitepress/dist/index.html",
    "file://" + fixture.root + "/.vitepress/dist/docs/extend-customize/code-of-conduct.html#old-heading", "ERROR")]);
  const summary = fixture.summary(["CONTRIBUTING.md"]);
  assert.equal(summary.total, 1);
  assert.equal(summary.findings[0].path, "src/index.md");
  assert.match(summary.findings[0].message, /target changed in this PR/);
});

test("site configuration changes include internal routing failures, not unrelated external links", t => {
  const fixture = linkFixture(t);
  fixture.write("src/docs/guide.md", "[Target](./excluded.md)\n[External](https://missing.example/unrelated)");
  fixture.errors("internal", [fixture.row(".vitepress/dist/docs/guide.html",
    "file://" + fixture.root + "/.vitepress/dist/docs/excluded.html", "ERROR")]);
  fixture.errors("external", [fixture.row(".vitepress/dist/docs/guide.html", "https://missing.example/unrelated")]);
  const summary = fixture.summary([".vitepress/config.mts"]);
  assert.equal(summary.total, 1);
  assert.match(summary.findings[0].message, /site configuration changed/);
});

test("filtering precedes preview limits even behind a large unrelated backlog", t => {
  const fixture = linkFixture(t);
  const rows = [];
  for (let index = 0; index < 120; index++) {
    fixture.write("src/docs/old" + index + ".md", "[Link](https://missing.example/old" + index + ")");
    rows.push(fixture.row(".vitepress/dist/docs/old" + index + ".html", "https://missing.example/old" + index));
  }
  const changed = [];
  for (let index = 0; index < 12; index++) {
    const file = "src/docs/new" + index + ".md";
    fixture.write(file, "[Link](https://missing.example/new" + index + ")");
    changed.push(file);
    rows.push(fixture.row(".vitepress/dist/docs/new" + index + ".html", "https://missing.example/new" + index));
  }
  fixture.errors("external", rows);
  const summary = fixture.summary(changed);
  assert.equal(summary.total, 12);
  assert.equal(summary.occurrences, 12);
  assert.equal(summary.findings.length, 10);
  assert.ok(summary.findings.every(item => item.path.startsWith("src/docs/new")));
});

test("missing or invalid PR commit IDs cannot silently turn into a full-site report", () => {
  for (const values of [[undefined, undefined], ["main", "a".repeat(40)], ["a".repeat(40), "--help"]]) {
    assert.throws(() => pullRequestFiles(process.cwd(), ...values), /commit IDs are required/);
  }
  const caller = parseYaml(readFileSync(new URL("../.github/workflows/lychee.yaml", import.meta.url), "utf8"));
  assert.equal(caller.jobs.links.steps.find(step => step.name === "Checkout").with["fetch-depth"], 0);
  const step = caller.jobs.links.steps.find(step => step.id === "summary");
  assert.equal(step.env.PR_BASE_SHA, "${{ github.event.pull_request.base.sha }}");
  assert.equal(step.env.PR_HEAD_SHA, "${{ github.event.pull_request.head.sha }}");
});
