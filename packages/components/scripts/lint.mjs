import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { cac } from "cac";
import { runCommand, stripArgumentSeparator } from "@stim-io/shared/node";

const packageRoot = process.cwd();
const stylelintArgs = ["exec", "stylelint", "src/styles/**/*.scss"];
const styleBoundaryFiles = [
  "src/styles/components/stim-button/common.scss",
  "src/styles/components/stim-avatar/common.scss",
  "src/styles/components/stim-pane/common.scss",
];
const rawVisualValuePattern =
  /(?:#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl|oklch|color-mix)\(|\b\d*\.?\d+(?:rem|px)\b)/;
const lintTargets = new Map([
  ["all", runAllLint],
  ["stylelint", runStylelint],
  ["style-boundary", checkStyleBoundary],
]);

const cli = cac("lint");

cli.option(
  "--target <target>",
  "Lint target to run: all, stylelint, or style-boundary",
  { default: "all" },
);
cli.help();
const parsed = cli.parse(stripArgumentSeparator(process.argv), { run: false });
const lintTarget = lintTargets.get(parsed.options.target ?? "all");

if (!lintTarget) {
  console.error(
    `unsupported lint target '${parsed.options.target}'. expected one of: ${[
      ...lintTargets.keys(),
    ].join(", ")}`,
  );
  process.exit(1);
}

runLint(lintTarget);

function runLint(command) {
  command().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

async function runAllLint() {
  await runChecks([runStylelint(), checkStyleBoundary()]);
}

async function runChecks(checks) {
  const results = await Promise.allSettled(checks);
  const failures = results.filter((result) => result.status === "rejected");

  if (failures.length === 0) {
    return;
  }

  throw new Error(
    failures
      .map((failure) =>
        failure.reason instanceof Error
          ? failure.reason.message
          : failure.reason,
      )
      .join("\n"),
  );
}

async function runStylelint() {
  await runCommand("pnpm", stylelintArgs, { cwd: packageRoot });
}

async function checkStyleBoundary() {
  const violations = [];

  await Promise.all(
    styleBoundaryFiles.map(async (relativePath) => {
      const filePath = path.join(packageRoot, relativePath);
      const lines = (await readFile(filePath, "utf8")).split("\n");

      lines.forEach((line, index) => {
        const trimmed = line.trim();

        if (!isDeclarationLine(trimmed)) {
          return;
        }

        const [property, ...valueParts] = trimmed.split(":");
        const value = valueParts.join(":");

        if (property.trim().startsWith("--")) {
          return;
        }

        if (rawVisualValuePattern.test(value)) {
          violations.push({
            relativePath,
            line: index + 1,
            content: trimmed,
          });
        }
      });
    }),
  );

  if (violations.length > 0) {
    throw new Error(formatStyleBoundaryFailure(violations));
  }

  console.log(
    `style-boundary passed: checked ${styleBoundaryFiles.length} component style files.`,
  );
}

function isDeclarationLine(trimmed) {
  return Boolean(
    trimmed &&
    !trimmed.startsWith("//") &&
    !trimmed.startsWith("/*") &&
    !trimmed.startsWith("*") &&
    trimmed.includes(":") &&
    trimmed.endsWith(";"),
  );
}

function formatStyleBoundaryFailure(violations) {
  const lines = [
    "style-boundary failed: raw visual values must enter component CSS variables first.",
    "",
  ];

  for (const violation of violations) {
    lines.push(
      `- ${violation.relativePath}:${violation.line} :: ${violation.content}`,
    );
  }

  return lines.join("\n");
}
