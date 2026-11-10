import { appendFileSync, existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function sourceFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return ["dist", "cache", "node_modules"].includes(entry.name) ? [] : sourceFiles(file);
    return /\.(vue|[cm]?[jt]s)$/.test(entry.name) ? [file] : [];
  });
}

function location(input, target, reportedLine, root, sharedSources) {
  const relative = path.relative(root, path.resolve(root, input));
  if (relative.startsWith("..") || path.isAbsolute(relative)) return {};
  const built = relative.startsWith(".vitepress" + path.sep + "dist" + path.sep);
  const source = built
    ? path.join(root, "src", relative.slice(".vitepress/dist/".length).replace(/\.html$/, ".md"))
    : path.join(root, relative);
  if (!built && existsSync(source)) return { path: relative.replaceAll(path.sep, "/"), line: Number(reportedLine) || undefined };

  // HTML line numbers are not Markdown line numbers. Link only to a source line
  // when its URL is present there; shared footer links belong to the component.
  const candidates = [source, ...sharedSources];
  const variants = [target, target.replaceAll("&amp;", "&")];
  try { variants.push(decodeURI(target)); } catch { /* Keep the original URL. */ }
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    const index = readFileSync(file, "utf8").split(/\r?\n/).findIndex(line => variants.some(url => line.includes(url)));
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

export function summarizeLinks(reportDirectory, root = process.cwd()) {
  root = path.resolve(root);
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
      findings.push({
        ...location(input, target, reportedLine, root, sharedSources),
        target: target.replace("file://" + root + "/.vitepress/dist", ""),
        status,
        message: advice(status, mode, detail, target)
      });
      parsed++;
    }
    if (!parsed && /(?:Errors|Timeouts)\s+\|\s+[1-9]/.test(markdown)) complete = false;
  }

  const unique = new Map();
  for (const finding of findings) {
    const key = JSON.stringify([finding.path, finding.line, finding.target, finding.status]);
    if (!unique.has(key)) unique.set(key, { ...finding, occurrences: 0 });
    unique.get(key).occurrences++;
  }
  // Leave room to prioritize changed files in the comment while bounding the
  // workflow output. Complete results remain in the native lychee report.
  const preview = [];
  let size = 0;
  for (const finding of unique.values()) {
    size += JSON.stringify(finding).length;
    if (preview.length === 100 || size > 200000) break;
    preview.push(finding);
  }
  return { complete, total: unique.size, occurrences: findings.length, findings: preview };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = summarizeLinks(process.env.RUNNER_TEMP || process.argv[2]);
  const output = JSON.stringify(report);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, "report=" + output + "\n");
  else console.log(output);
}
