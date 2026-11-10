import { tmpdir } from "node:os";
import { join } from "node:path";

// Add machine-readable output in CI; rules and file selection stay in the root YAML.
export default {
  outputFormatters: [
    ["markdownlint-cli2-formatter-sarif", {
      name: join(process.env.RUNNER_TEMP || tmpdir(), "markdownlint-results.sarif")
    }]
  ]
};
