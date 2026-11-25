import { describe, expect, it } from "vitest";
import { docsPage, pageLink, switchLink } from "./versions";

const pages = {
  "": ["index.md", "getting-started/quickstart.md", "core-concepts/stages.md", "new-page.md"],
  "0.1": ["index.md", "getting-started/quickstart.md", "core-concepts/stages.md"],
};

describe("docsPage", () => {
  it("reads the version and page", () => {
    expect(docsPage("docs/core-concepts/stages.md")).toEqual({
      version: "",
      page: "core-concepts/stages.md",
    });
    expect(docsPage("0.1/docs/core-concepts/stages.md")).toEqual({
      version: "0.1",
      page: "core-concepts/stages.md",
    });
  });

  it("skips ADRs and pages outside the docs", () => {
    expect(docsPage("docs/extend-customize/decisions/adr-0001-x.md")).toBeUndefined();
    expect(docsPage("index.md")).toBeUndefined();
  });
});

describe("pageLink", () => {
  it("drops the extension and index", () => {
    expect(pageLink("", "core-concepts/stages.md")).toBe("/docs/core-concepts/stages");
    expect(pageLink("0.1", "index.md")).toBe("/0.1/docs/");
    expect(pageLink("0.1", "reference/index.md")).toBe("/0.1/docs/reference/");
  });
});

describe("switchLink", () => {
  it("keeps the page when the target version has it", () => {
    expect(switchLink("docs/core-concepts/stages.md", "0.1", pages)).toBe(
      "/0.1/docs/core-concepts/stages",
    );
    expect(switchLink("0.1/docs/core-concepts/stages.md", "", pages)).toBe(
      "/docs/core-concepts/stages",
    );
  });

  it("falls back to the Quickstart when the page is missing", () => {
    expect(switchLink("docs/new-page.md", "0.1", pages)).toBe(
      "/0.1/docs/getting-started/quickstart",
    );
  });

  it("opens the Quickstart from ADRs and pages outside the docs", () => {
    expect(switchLink("docs/extend-customize/decisions/adr-0001-x.md", "0.1", pages)).toBe(
      "/0.1/docs/getting-started/quickstart",
    );
    expect(switchLink("index.md", "", pages)).toBe("/docs/getting-started/quickstart");
  });
});
