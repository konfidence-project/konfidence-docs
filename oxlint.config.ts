import { defineConfig } from "oxlint";

// the dashboard's categories without style and nursery: the scripts here are
// small, and style warnings would bury the findings that matter
export default defineConfig({
  $schema: "./node_modules/oxlint/configuration_schema.json",
  categories: {
    correctness: "error",
    nursery: "off",
    pedantic: "off",
    perf: "warn",
    restriction: "off",
    style: "off",
    suspicious: "warn",
  },
  env: {
    browser: true,
    builtin: true,
    node: true,
  },
  plugins: ["typescript", "unicorn", "oxc", "eslint", "import", "vue"],
  rules: {
    // stylesheets are imported for their side effect
    "import/no-unassigned-import": ["warn", { allow: ["**/*.css"] }],
  },
  overrides: [
    {
      // tests favour readable steps over these rules
      files: ["**/*.test.mjs"],
      rules: {
        "eslint/no-await-in-loop": "off",
        "eslint/no-shadow": "off",
        "unicorn/consistent-function-scoping": "off",
        "unicorn/no-array-sort": "off",
      },
    },
  ],
});
