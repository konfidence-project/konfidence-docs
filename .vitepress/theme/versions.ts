// Paths shared by the version menu and the version banner. A version is "" for
// the development docs in src/docs and "X.Y" for a snapshot in src/X.Y/docs.
// Pages are paths inside the docs folder, such as "getting-started/quickstart.md".

const quickstart = "getting-started/quickstart.md";

// the version and page of a docs page; undefined for the unversioned ADRs and
// for pages outside the docs, such as the home page
export function docsPage(relativePath: string) {
  const match = relativePath.match(/^(?:(\d+\.\d+)\/)?docs\/(.*)$/);
  if (!match || match[2].startsWith("extend-customize/decisions/")) return undefined;
  return { version: match[1] ?? "", page: match[2] };
}

export function pageLink(version: string, page: string) {
  const root = version ? `/${version}/docs/` : "/docs/";
  return root + page.replace(/(^|\/)index\.md$/, "$1").replace(/\.md$/, "");
}

// The same page in the target version, or the target's Quickstart when that
// version has no such page. pages lists the pages of every version.
export function switchLink(relativePath: string, target: string, pages: Record<string, string[]>) {
  const current = docsPage(relativePath);
  const page = current && pages[target]?.includes(current.page) ? current.page : quickstart;
  return pageLink(target, page);
}
