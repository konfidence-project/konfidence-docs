import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const project = fileURLToPath(new URL("../", import.meta.url));
const usage = "Usage: pnpm docs:version <X.Y> --konfidence <tag> [--klo <tag>] [--force]";

// ADRs are project history, not part of a release
const decisions = "extend-customize/decisions/";
const unversioned = /^\/docs\/extend-customize\/decisions(?:[/#?]|$)/;

export function parseArguments(argv) {
  const options = { force: false };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--force") options.force = true;
    else if (arg === "--konfidence" || arg === "--klo") options[arg.slice(2)] = argv[++i];
    else if (arg.startsWith("--")) throw new Error(`Unknown option ${arg}. ${usage}`);
    else positional.push(arg);
  }
  const [version, ...extra] = positional;
  if (!/^\d+\.\d+$/.test(version ?? "") || extra.length) {
    throw new Error(`Give the version as X.Y, for example 0.1. ${usage}`);
  }
  if (!options.konfidence || /\s/.test(options.konfidence) || options.konfidence.startsWith("--")) {
    throw new Error(`Give the Konfidence release tag with --konfidence. ${usage}`);
  }
  const klo = options.klo ?? options.konfidence;
  if (/\s/.test(klo) || klo.startsWith("--"))
    throw new Error(`Give a valid tag with --klo. ${usage}`);
  return { version, konfidence: options.konfidence, klo, force: options.force };
}

// X.Y versions compared as numbers, so 0.10 is newer than 0.9
export function compareVersions(a, b) {
  const [aMajor, aMinor] = a.split(".").map(Number);
  const [bMajor, bMinor] = b.split(".").map(Number);
  return aMajor - bMajor || aMinor - bMinor;
}

// Newest first; an entry for the same version is replaced.
export function addVersion(versions, entry) {
  return [entry, ...versions.filter(({ version }) => version !== entry.version)].toSorted((a, b) =>
    compareVersions(b.version, a.version),
  );
}

// relative is the path inside src/docs, with forward slashes.
export function isSkipped(relative, exclude) {
  return relative.startsWith(decisions) || exclude.includes(`docs/${relative}`);
}

// Pages link to each other relatively, so a copy stays inside its version. An
// absolute /docs/ link would send snapshot readers to the development docs.
const absoluteLink = /(?:\]\(|href=["']|url=|\(["'])(\/docs(?:\/[^)"'\s]*)?)/g;

export function absoluteLinks(text) {
  return [...text.matchAll(absoluteLink)]
    .map((match) => match[1])
    .filter((link) => !unversioned.test(link));
}

// A relative link into decisions/ breaks once the page moves to another folder.
export function rewriteDecisionLinks(text, relative) {
  let count = 0;
  const result = text.replace(
    /(\]\()([^)\s#?]+)([#?][^)\s]*)?\)/g,
    (match, open, target, rest = "") => {
      if (target.startsWith("/") || target.includes(":")) return match;
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(relative), target));
      if (!resolved.startsWith(decisions)) return match;
      count++;
      return `${open}/docs/${resolved}${rest})`;
    },
  );
  return { text: result, count };
}

// Includes of repository files such as CONTRIBUTING.md climb out of src/docs,
// and the snapshot sits one folder deeper. Only the original depth is changed,
// so a corrected include stays as it is.
export function fixIncludes(text, relative) {
  const depth = relative.split("/").length - 1;
  let count = 0;
  const result = text.replace(/(<!--\s*@include:\s*)((?:\.\.\/)+)/g, (match, open, ups) => {
    if (ups.length / 3 !== depth + 2) return match;
    count++;
    return `${open}../${ups}`;
  });
  return { text: result, count };
}

const repositories = [
  ["konfidence", "konfidence"],
  ["kubernetes-landscape-orchestrator", "klo"],
];

// Pin GitHub references to the release tags, also in code fences.
export function pinReferences(text, tags) {
  let count = 0;
  const replace = (pattern, replacement) => {
    text = text.replace(pattern, (...args) => {
      count++;
      return replacement(...args);
    });
  };
  for (const [repository, key] of repositories) {
    const tag = tags[key];
    const name = repository.replaceAll("-", "\\-");
    const base = `konfidence-project/${name}`;
    replace(
      new RegExp(`(https://github\\.com/${base}/(?:blob|tree))/main(?![\\w.-])`, "g"),
      (m, head) => `${head}/${tag}`,
    );
    replace(
      new RegExp(`(https://raw\\.githubusercontent\\.com/${base})/main/`, "g"),
      (m, head) => `${head}/${tag}/`,
    );
    replace(
      new RegExp(`(https://github\\.com/${base}/releases)/latest(?![\\w.-])`, "g"),
      (m, head) => `${head}/tag/${tag}`,
    );
  }
  return { text, count };
}

export function transformMarkdown(text, relative, { konfidence, klo }) {
  const steps = [
    (t) => rewriteDecisionLinks(t, relative),
    (t) => fixIncludes(t, relative),
    (t) => pinReferences(t, { konfidence, klo }),
  ];
  const counts = [];
  for (const step of steps) {
    const { text: next, count } = step(text);
    text = next;
    counts.push(count);
  }
  return { text, links: counts[0] + counts[1], pins: counts[2] };
}

function* walk(directory, prefix = "") {
  for (const entry of readdirSync(path.join(directory, prefix), { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) yield* walk(directory, relative);
    else yield relative;
  }
}

// exclude is the srcExclude list of the VitePress config.
export function versionDocs({
  root = project,
  version,
  konfidence,
  klo = konfidence,
  force = false,
  exclude,
}) {
  const source = path.join(root, "src/docs");
  const target = path.join(root, "src", version, "docs");
  if (existsSync(target)) {
    if (!force) throw new Error(`src/${version}/docs exists already. Use --force to replace it.`);
    rmSync(target, { recursive: true });
  }
  const absolute = [...walk(source)]
    .filter((relative) => relative.endsWith(".md") && !isSkipped(relative, exclude))
    .flatMap((relative) =>
      absoluteLinks(readFileSync(path.join(source, relative), "utf8")).map(
        (link) => `src/docs/${relative}: ${link}`,
      ),
    );
  if (absolute.length) {
    throw new Error(`Make these links relative first:\n${absolute.join("\n")}`);
  }
  const summary = { files: 0, markdown: 0, skipped: 0, links: 0, pins: 0 };
  for (const relative of walk(source)) {
    if (isSkipped(relative, exclude)) {
      summary.skipped++;
      continue;
    }
    const to = path.join(target, relative);
    mkdirSync(path.dirname(to), { recursive: true });
    summary.files++;
    if (relative === "sidebar.json") {
      // the sidebar also links to GitHub
      const result = pinReferences(readFileSync(path.join(source, relative), "utf8"), {
        konfidence,
        klo,
      });
      writeFileSync(to, result.text);
      summary.pins += result.count;
      continue;
    }
    if (!relative.endsWith(".md")) {
      cpSync(path.join(source, relative), to);
      continue;
    }
    const result = transformMarkdown(readFileSync(path.join(source, relative), "utf8"), relative, {
      konfidence,
      klo,
    });
    writeFileSync(to, result.text);
    summary.markdown++;
    summary.links += result.links;
    summary.pins += result.pins;
  }
  const file = path.join(root, "versions.json");
  const versions = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
  writeFileSync(
    file,
    `${JSON.stringify(addVersion(versions, { version, konfidence, klo }), null, 2)}\n`,
  );
  return summary;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseArguments(process.argv.slice(2));
    // one source of truth for the pages that are not published
    const { default: config } = await import("../.vitepress/config.mts");
    const summary = versionDocs({ ...options, exclude: config.srcExclude ?? [] });
    console.log(`Created src/${options.version}/docs and updated versions.json.`);
    console.log(
      `Copied ${summary.files} files (${summary.markdown} Markdown), skipped ${summary.skipped}.`,
    );
    console.log(`Rewrote ${summary.links} links and pinned ${summary.pins} GitHub references.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
