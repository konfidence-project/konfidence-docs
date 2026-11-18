import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";
import { createMarkdownRenderer } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

const config = withMermaid({});
const md = await createMarkdownRenderer(process.cwd(), config.markdown);

test("Mermaid flowcharts and sequence diagrams render as components, not code blocks", () => {
  for (const source of ["flowchart LR\n  A --> B\n", "sequenceDiagram\n  A->>B: Hello\n"]) {
    const html = md.render(`\`\`\`mermaid\n${source}\`\`\`\n`);
    assert.match(html, /<Mermaid /);
    const encoded = html.match(/graph="([^"]*)"/)[1];
    assert.equal(decodeURIComponent(encoded), source);
    assert.doesNotMatch(html, /<pre/);
  }
});

test("diagram source cannot escape the component attribute", () => {
  const source = "flowchart LR\n  A[\"<script>alert('x')</script>\"]\n";
  const html = md.render(`\`\`\`mermaid\n${source}\`\`\`\n`);
  assert.doesNotMatch(html, /<script>/i);
  assert.match(html, /%22/);
  assert.equal(decodeURIComponent(html.match(/graph="([^"]*)"/)[1]), source);
});

test("ordinary code fences keep the VitePress renderer", () => {
  const html = md.render("```yaml\nartifactType: app.example.com\n```\n");
  assert.match(html, /language-yaml/);
  assert.doesNotMatch(html, /<Mermaid /);
});

test("ADR-0044 renders both diagrams", async () => {
  const source = await readFile(
    new URL(
      "../src/docs/extend-customize/decisions/adr-0044-deployer-conformance-test-setup.md",
      import.meta.url,
    ),
    "utf8",
  );
  const html = md.render(source);
  assert.equal((html.match(/<Mermaid /g) ?? []).length, 2);
  assert.doesNotMatch(html, /language-mermaid/);
});
