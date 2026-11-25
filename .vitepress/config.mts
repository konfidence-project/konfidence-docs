import { readdirSync, readFileSync } from "node:fs";
import { sep } from "node:path";
import { defineConfig, type DefaultTheme } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

// ADR pages are numbered by id; the sidebar lists them from their
// frontmatter so adding a record never needs a config change
const adrDir = "src/docs/extend-customize/decisions";
const adrItems = readdirSync(adrDir)
  .filter((f) => /^adr-\d{4}-.*\.md$/.test(f))
  .toSorted()
  .map((f) => {
    const src = readFileSync(`${adrDir}/${f}`, "utf8");
    const id = src.match(/^id:\s*ADR-(\d{4})/m)?.[1] ?? f.slice(4, 8);
    const title = src.match(/^title:\s*"?(.*?)"?\s*$/m)?.[1] ?? f;
    return {
      text: `${id} · ${title}`,
      link: `/docs/extend-customize/decisions/${f.replace(/\.md$/, "")}`,
    };
  });

// released versions, newest first; written by `pnpm docs:version`.
// src/docs is the development version, src/<version>/docs the snapshots
const versions: { version: string; konfidence: string; klo: string }[] = JSON.parse(
  readFileSync("versions.json", "utf8"),
);
const docsBase = versions.length ? `/${versions[0].version}/docs` : "/docs";
const quickstart = (base: string) => `${base}/getting-started/quickstart`;

// pages for features that are not part of the initial release; recoverable
// from git history / re-enabled by removing them here (issue #814)
const srcExclude = [
  "docs/overview.md",
  "docs/getting-started/create-vector.md",
  "docs/develop-integrate/observe-improve/paved-road.md",
  "docs/develop-integrate/run-migrations.md",
  "docs/extend-customize/create-deployer.md",
  "docs/reference/deployer-specification.md",
  "docs/reference/releases.md",
];

// the pages of every version, keyed "" for development, so the version menu
// can open the same page in another version. Snapshots never contain the
// excluded pages or the unversioned ADRs
const listPages = (dir: string) =>
  readdirSync(dir, { recursive: true, encoding: "utf8" })
    .map((file) => file.split(sep).join("/"))
    .filter((page) => page.endsWith(".md") && !page.startsWith("extend-customize/decisions/"));
const versionPages: Record<string, string[]> = {
  "": listPages("src/docs").filter((page) => !srcExclude.includes(`docs/${page}`)),
};
for (const { version } of versions) versionPages[version] = listPages(`src/${version}/docs`);

// the default theme's dropdown; it only appears once a version exists. Each
// entry is a VersionMenuLink, which keeps the reader's current page
const versionMenu = versions.length
  ? [
      {
        text: "Versions",
        items: [
          { component: "VersionMenuLink", props: { version: "", text: "main (Development)" } },
          ...versions.map(({ version }, index) => ({
            component: "VersionMenuLink",
            props: { version, text: index ? version : `${version} (Latest)` },
          })),
        ],
      },
    ]
  : [];

// every version carries its own sidebar.json so old versions keep their
// structure. "@adr-items" marks where the generated ADR list goes
type SidebarFile = Omit<DefaultTheme.SidebarItem, "items"> & {
  items?: SidebarFile[] | "@adr-items";
};
const fillAdrItems = (items: SidebarFile[] | "@adr-items"): DefaultTheme.SidebarItem[] =>
  items === "@adr-items"
    ? adrItems
    : items.map((item) => ({ ...item, items: item.items && fillAdrItems(item.items) }));

// ADRs stay unversioned, so their links keep pointing at /docs/
const versionLinks = (
  items: DefaultTheme.SidebarItem[],
  version: string,
): DefaultTheme.SidebarItem[] =>
  items.map(({ link, items: children, ...item }) => ({
    ...item,
    ...(link && {
      link: /^\/docs\/extend-customize\/decisions(\/|$)/.test(link)
        ? link
        : link.replace(/^\/docs\//, `/${version}/docs/`),
    }),
    ...(children && { items: versionLinks(children, version) }),
  }));

const readSidebar = (path: string) => fillAdrItems(JSON.parse(readFileSync(path, "utf8")));
const sidebar: DefaultTheme.SidebarMulti = {
  "/docs/": readSidebar("src/docs/sidebar.json"),
};
for (const { version } of versions) {
  sidebar[`/${version}/docs/`] = versionLinks(
    readSidebar(`src/${version}/docs/sidebar.json`),
    version,
  );
}

// pre-release mode: shows the banner and pre-alpha badge; build with
// KONFIDENCE_PRERELEASE=false to hide them
const prerelease = process.env.KONFIDENCE_PRERELEASE !== "false";

// https://vitepress.dev/reference/site-config
export default defineConfig(
  withMermaid({
    srcDir: "./src",
    mermaid: {
      securityLevel: "strict",
    },
    // The quickstart links to the port-forwarded dashboard; localhost URLs are
    // reachable only while the reader runs the guide, so skip them in the check.
    ignoreDeadLinks: [/^https?:\/\/localhost(:\d+)?/],
    vite: {
      publicDir: "../public",
      ssr: {
        noExternal: ["vitepress-openapi"],
      },
      define: {
        __PRERELEASE__: JSON.stringify(prerelease),
      },
    },
    head: [
      ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
      ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }],
      [
        "link",
        {
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
          rel: "stylesheet",
        },
      ],
    ],
    title: "Konfidence",
    description: "Public Documentation for Project Konfidence",
    srcExclude,
    themeConfig: {
      // https://vitepress.dev/reference/default-theme-config

      logo: {
        light: "/assets/logo/full/SVG/400_konfidence_logo_light.svg",
        dark: "/assets/logo/full/SVG/400_konfidence_logo_dark.svg",
      },
      siteTitle: false,

      // Navigation bar
      nav: [{ text: "Docs", link: quickstart(docsBase) }, ...versionMenu],

      // the version banner and menu read these from the theme
      versions,
      versionPages,

      socialLinks: [{ icon: "github", link: "https://github.com/konfidence-project" }],

      // Sidebar navigation: one tree per version
      sidebar,

      // Edit link configuration
      editLink: {
        pattern: "https://github.com/konfidence-project/konfidence-docs/edit/main/src/:path",
        text: "Edit this page on GitHub",
      },

      // search configuration
      search: {
        provider: "local",
        options: {
          miniSearch: {
            searchOptions: {
              // every version is indexed; keep hits within the reader's own one.
              // serialized into the client, so it must not use config variables
              filter: (result: { id: string }) => {
                // oxlint-disable-next-line unicorn/consistent-function-scoping -- must stay inside the serialized function
                const prefix = (path: string) => path.match(/^\/(\d+\.\d+)\//)?.[1] ?? "";
                return prefix(result.id) === prefix(window.location.pathname);
              },
            },
          },
        },
      },
    },
  }),
);
