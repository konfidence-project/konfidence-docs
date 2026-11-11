import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { lint } from "markdownlint-cli2/markdownlint/promise";
import parseYaml from "markdownlint-cli2/parsers/yaml";

const root = fileURLToPath(new URL("../", import.meta.url));
const configuration = await readFile(path.join(root, ".markdownlint-cli2.yaml"), "utf8");
const { config } = parseYaml(configuration);
const cli = fileURLToPath(new URL("./markdownlint-cli2-bin.mjs", import.meta.resolve("markdownlint-cli2")));

async function findings(markdown) {
  const result = await lint({ config, strings: { example: markdown } });
  return result.example;
}

const cases = [
  ["MD001", "# Page\n\n### Skipped level\n", "# Page\n\n## Section\n"],
  ["MD005", "- Parent\n  - Child\n   - Misaligned child\n", "- Parent\n  - Child\n  - Another child\n"],
  ["MD040", "```\necho ready\n```\n", "```bash\necho ready\n```\n"],
  ["MD045", "![](diagram.png)\n", "![Deployment overview](diagram.png)\n"],
  ["MD052", "[Guide][missing]\n", "[Guide][guide]\n\n[guide]: ./guide.md\n"],
  ["MD056", "| A | B |\n| --- | --- |\n| One |\n", "| A | B |\n| --- | --- |\n| One | Two |\n"]
];

for (const [rule, invalid, valid] of cases) {
  test(`${rule} reports the intended problem as a warning and accepts its correction`, async () => {
    const actual = await findings(invalid);
    assert.deepEqual(actual.map(({ ruleNames, severity }) => [ruleNames[0], severity]), [[rule, "warning"]]);
    assert.deepEqual(await findings(valid), []);
  });
}

test("VitePress syntax and frontmatter titles do not produce false positives", async () => {
  const markdown = [
    "---", 'title: "Example page"', "layout: doc", "---", "",
    "<script setup>", 'const example = "[not a reference][missing]"', "</script>", "",
    "# Example page {#example}", "", "<AdrHeader />", "",
    '<DrawioDiagram src="./assets/example.drawio" />', "", "<DocsCards />", "",
    "## Steps", "", "::: warning", "Review the configuration.", ":::", "",
    "::: details Configuration", "", "```yaml {1} title=example.yaml",
    "enabled: true", "```", "", ":::", "",
    "::: code-group", "", "```bash [Install]", "pnpm install", "```", "", ":::", "",
    "- [x] Completed task", "", "Use [optional] settings and `VectorTemplate`.", "",
    '[Guide](./guide.md#custom-anchor) and ![Overview](overview.png)', "",
    '<img src="overview.png" alt="Deployment overview" />', ""
  ].join("\n");
  assert.deepEqual(await findings(markdown), []);
});

test("content inside VitePress containers is still checked", async () => {
  const actual = await findings("::: warning\n\n![](image.png)\n\n:::\n");
  assert.deepEqual(actual.map(({ ruleNames }) => ruleNames[0]), ["MD045"]);
});

test("HTML images need alternative text unless hidden from assistive technology", async () => {
  const actual = await findings('<img src="image.png" />\n');
  assert.deepEqual(actual.map(({ ruleNames }) => ruleNames[0]), ["MD045"]);
  assert.deepEqual(await findings('<img src="image.png" aria-hidden="true" />\n'), []);
});

test("a scoped exception does not hide the next unrelated finding", async () => {
  const actual = await findings("<!-- markdownlint-disable-next-line MD045 -->\n![](intentional.png)\n\n![](missing.png)\n");
  assert.deepEqual(actual.map(({ ruleNames, lineNumber }) => [ruleNames[0], lineNumber]), [["MD045", 4]]);
});

async function workspace(t) {
  const directory = await mkdtemp(path.join(tmpdir(), "konfidence-markdownlint-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(path.join(directory, ".markdownlint-cli2.yaml"), configuration);
  return directory;
}

function run(directory, args = [], env = {}) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: directory, encoding: "utf8", env: { ...process.env, ...env }
  });
  assert.ifError(result.error);
  return result;
}

test("the CLI checks authored pages, skips generated files, and supports a single-page check", async (t) => {
  const directory = await workspace(t);
  const included = ["README.md", "CONTRIBUTING.md", "src/guide with spaces.md", "src/docs/reference/glossary.md", "src/docs/reference/api.md"];
  const excluded = [
    "src/docs/reference/crd.md", "src/docs/reference/cli.md",
    "src/docs/reference/helm-values-konfidence.md", "src/docs/reference/helm-values-orchestrator.md",
    "node_modules/example/README.md", ".vitepress/dist/example.md", "tests/example.md", ".vale/example.md"
  ];
  const invalid = "![](missing.png)\n";
  for (const file of [...included, ...excluded]) {
    await mkdir(path.dirname(path.join(directory, file)), { recursive: true });
    await writeFile(path.join(directory, file), invalid);
  }
  const result = run(directory);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Linting: 5 files/);
  assert.match(result.stdout, /Summary: 5 issues in 5 files/);
  assert.equal(result.stderr.trim().split("\n").length, included.length);
  for (const file of included) {
    assert.ok(result.stderr.includes(`${file}:1:1 warning MD045/`), result.stderr);
    assert.equal(await readFile(path.join(directory, file), "utf8"), invalid, "linting must not rewrite files");
  }
  const single = run(directory, ["--no-globs", "src/guide with spaces.md"]);
  assert.equal(single.status, 0, single.stderr);
  assert.match(single.stdout, /Linting: 1 file/);
  assert.equal(single.stderr.trim().split("\n").length, 1);
});

test("invalid configuration fails the CLI instead of being treated as an advisory finding", async (t) => {
  const directory = await workspace(t);
  await writeFile(path.join(directory, ".markdownlint-cli2.yaml"), "config: [\n");
  const result = run(directory);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Unable to use configuration file/);
});

test("the CI formatter preserves rule identifiers, warning levels, positions, and filenames with spaces", async (t) => {
  const directory = await workspace(t);
  await mkdir(path.join(directory, "src"));
  await writeFile(path.join(directory, "src/guide with spaces.md"), "# Guide\n\n### Skipped level\n\n![](image.png)\n");
  const result = run(directory, ["--config", path.join(root, ".github/markdownlint-cli2.ci.mjs")], { RUNNER_TEMP: directory });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(await readFile(path.join(directory, "markdownlint-results.sarif"), "utf8"));
  const actual = report.runs[0].results;
  assert.deepEqual(actual.map(({ ruleId, level }) => [ruleId, level]), [["MD001", "warning"], ["MD045", "warning"]]);
  assert.deepEqual(actual.map(({ locations }) => locations[0].physicalLocation.region.startLine), [3, 5]);
  assert.ok(actual.every(({ locations }) => locations[0].physicalLocation.artifactLocation.uri === "src/guide with spaces.md"));
});
