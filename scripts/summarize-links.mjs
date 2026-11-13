import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function pullRequestFiles(root, base, head) {
  if (![base, head].every(sha => /^[a-f0-9]{40}$/.test(sha || ""))) {
    throw new Error("PR base and head commit IDs are required to filter link findings.");
  }
  // Compare the whole PR with its merge base, not just its latest commit.
  // Disable rename detection so both removed and new paths remain relevant.
  const files = execFileSync("git", ["diff", "--name-only", "--no-renames", "-z", base + "..." + head, "--"], {
    cwd: root, encoding: "utf8", maxBuffer: 8 * 1024 * 1024
  });
  return new Set(files.split("\0").filter(Boolean));
}

function within(root, file) {
  const relative = path.relative(root, file);
  return relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative)
    ? undefined : relative.replaceAll(path.sep, "/");
}

function includedSources(file, root, seen = new Set()) {
  if (seen.has(file) || !existsSync(file)) return [];
  seen.add(file);
  const included = [];
  for (const match of readFileSync(file, "utf8").matchAll(/<!--\s*@include:\s*(.+?\.md)(?:\{[^}]*\})?\s*-->/g)) {
    const source = path.resolve(path.dirname(file), match[1]);
    if (within(root, source) === undefined || !existsSync(source) || seen.has(source)) continue;
    included.push(source, ...includedSources(source, root, seen));
  }
  return included;
}

function localTarget(target, root) {
  let url;
  let file;
  try {
    url = new URL(target);
    if (url.protocol !== "file:") return { files: [], aliases: [] };
    file = fileURLToPath(url);
  } catch { return { files: [], aliases: [] }; }
  const relative = within(root, file);
  if (relative === undefined) return { files: [], aliases: [] };
  const built = within(path.join(root, ".vitepress/dist"), file);
  if (built === undefined) return { files: [relative], aliases: [] };
  const page = built || "index.html";
  const files = ["public/" + page, "src/" + page];
  if (page.endsWith(".html")) files.push("src/" + page.replace(/\.html$/, ".md"));
  else if (!path.posix.extname(page)) files.push("src/" + page + ".md", "src/" + page.replace(/\/$/, "") + "/index.md");
  for (const source of files.filter(file => file.endsWith(".md"))) {
    files.push(...includedSources(path.join(root, source), root).map(file => within(root, file)));
  }
  const suffix = url.search + url.hash;
  const aliases = ["/" + page + suffix, "/" + page.replace(/\.html$/, "") + suffix];
  return { files, aliases, built: page, suffix };
}

function sourceFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return ["dist", "cache", "node_modules"].includes(entry.name) ? [] : sourceFiles(file);
    return /\.(vue|[cm]?[jt]s)$/.test(entry.name) ? [file] : [];
  });
}

function location(input, target, reportedLine, root, sharedSources, local) {
  const relative = path.relative(root, path.resolve(root, input));
  if (relative.startsWith("..") || path.isAbsolute(relative)) return {};
  const built = relative.startsWith(".vitepress" + path.sep + "dist" + path.sep);
  const source = built
    ? path.join(root, "src", relative.slice(".vitepress/dist/".length).replace(/\.html$/, ".md"))
    : path.join(root, relative);
  if (!built && existsSync(source)) return { path: relative.replaceAll(path.sep, "/"), line: Number(reportedLine) || undefined };

  // HTML line numbers are not Markdown line numbers. Link only to a source line
  // when its URL is present there; shared footer links belong to the component.
  const candidates = [source, ...includedSources(source, root), ...sharedSources];
  const variants = [target, target.replaceAll("&amp;", "&")];
  try { variants.push(decodeURI(target)); } catch { /* Keep the original URL. */ }
  variants.push(...local.aliases);
  if (built && local.built) {
    const from = relative.slice(".vitepress/dist/".length).replaceAll(path.sep, "/");
    const to = path.posix.relative(path.posix.dirname(from), local.built);
    variants.push(to + local.suffix, to.replace(/\.html$/, ".md") + local.suffix,
      to.replace(/\.html$/, "") + local.suffix);
    if (from === local.built && local.suffix.startsWith("#")) variants.push(local.suffix);
  }
  variants.push(...variants.map(url => encodeURI(url)));
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    const index = readFileSync(file, "utf8").split(/\r?\n/).findIndex(line => variants.some(url => {
      if (!url) return false;
      if (/^https?:/.test(url)) return line.includes(url);
      const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp('["\'(](?:\\./)?' + escaped + '(?=["\')])').test(line);
    }));
    if (index >= 0) return { path: path.relative(root, file).replaceAll(path.sep, "/"), line: index + 1 };
  }
  return existsSync(source) ? { path: path.relative(root, source).replaceAll(path.sep, "/") } : {};
}

function advice(status, mode, detail, target) {
  if (mode !== "external") return "Check the target file or heading. " + detail;
  if (status === "404" && /^https:\/\/github\.com\//.test(target)) return "Check the address and repository access; GitHub can return HTTP 404 for a private target.";
  if (["404", "410"].includes(status)) return "Check the address and update the link if its target moved (HTTP " + status + ").";
  if (["401", "403"].includes(status)) return "Check access in a browser; HTTP " + status + " does not prove the link is broken.";
  if (status === "429") return "Retry later; the target is limiting requests (HTTP 429).";
  if (/^5\d\d$/.test(status)) return "Recheck the target's availability (HTTP " + status + ").";
  return "Check the address and availability. " + detail;
}

export function summarizeLinks(reportDirectory, root = process.cwd(), { changedFiles } = {}) {
  root = path.resolve(root);
  const changed = changedFiles === undefined ? undefined : new Set(changedFiles);
  const sharedSources = sourceFiles(path.join(root, ".vitepress"));
  const findings = [];
  let complete = true;
  for (const mode of ["internal", "readme", "external"]) {
    const report = path.join(reportDirectory, "lychee-" + mode + ".md");
    if (!existsSync(report)) { complete = false; continue; }
    const markdown = readFileSync(report, "utf8");
    if (!/Total\s+\|\s+[1-9][0-9]*/.test(markdown) || !/Errors\s+\|\s+\d+/.test(markdown)) complete = false;
    let input;
    let parsed = 0;
    for (const line of markdown.split(/\r?\n/)) {
      const heading = /^### (?:Errors|Timeouts) in (.+)$/.exec(line);
      if (heading) { input = heading[1]; continue; }
      if (!/^[*-] /.test(line)) continue;
      const finding = /^[*-] (?:\[[ x]\] )?\[([^\]]+)\] <([^>]+)>(?: \(at (\d+):\d+\))? \| (.+)$/.exec(line);
      if (!finding || !input) { complete = false; continue; }
      const [, status, target, reportedLine, detail] = finding;
      const local = localTarget(target, root);
      findings.push({
        ...location(input, target, reportedLine, root, sharedSources, local),
        target: local.aliases[0] || target.replace("file://" + root + "/.vitepress/dist", ""),
        status,
        message: advice(status, mode, detail, target),
        targetFiles: local.files,
        mode
      });
      parsed++;
    }
    if (!parsed && /(?:Errors|Timeouts)\s+\|\s+[1-9]/.test(markdown)) complete = false;
  }

  const unique = new Map();
  let occurrences = 0;
  for (const { targetFiles, mode, ...finding } of findings) {
    if (changed && !changed.has(finding.path)) {
      if (targetFiles.some(target => [...changed].some(file => file === target || file.startsWith(target.replace(/\/$/, "") + "/")))) {
        finding.message = "The linked target changed in this PR. " + finding.message;
      } else if (mode === "internal" && changed.has(".vitepress/config.mts")) {
        // Routing and srcExclude can break links on otherwise unchanged pages.
        finding.message = "The site configuration changed in this PR. " + finding.message;
      } else continue;
    }
    occurrences++;
    const key = JSON.stringify([finding.path, finding.line, finding.target, finding.status]);
    if (!unique.has(key)) unique.set(key, { ...finding, occurrences: 0 });
    unique.get(key).occurrences++;
  }
  // Filter before truncation: a large unrelated backlog must not hide PR findings.
  // Complete results remain in the native lychee report.
  const preview = [];
  let size = 0;
  for (const finding of unique.values()) {
    size += JSON.stringify(finding).length;
    if (preview.length === 10 || size > 20000) break;
    preview.push(finding);
  }
  return { complete, scope: changed ? "pull_request" : "all", total: unique.size, occurrences, findings: preview };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.cwd();
  const changedFiles = process.env.GITHUB_EVENT_NAME === "pull_request"
    ? pullRequestFiles(root, process.env.PR_BASE_SHA, process.env.PR_HEAD_SHA) : undefined;
  const report = summarizeLinks(process.env.RUNNER_TEMP || process.argv[2], root, { changedFiles });
  const output = JSON.stringify(report);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, "report=" + output + "\n");
  else console.log(output);
}
