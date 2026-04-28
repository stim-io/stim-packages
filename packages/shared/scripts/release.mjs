import process from "node:process";
import { cac } from "cac";
import {
  assertPublicPackage,
  resolvePackageRoot,
  runCommand,
  stripArgumentSeparator,
} from "@stim-io/shared/node";

const registry = "https://npm.pkg.github.com";
const packageRoot = resolvePackageRoot(import.meta.url);
const targetHandlers = new Map([
  ["all", runRelease],
  ["release", runRelease],
]);

const cli = cac("release");

cli.option("--target <target>", "Release target to run: all or release", {
  default: "all",
});
cli.option("--tag <tag>", "npm dist-tag to release with");
cli.option("--dry-run", "Run npm publish without publishing", {
  default: true,
});
cli.help();

const parsed = cli.parse(stripArgumentSeparator(process.argv), { run: false });
const target = parsed.options.target;
const targetHandler = targetHandlers.get(target);

if (!targetHandler) {
  console.error(
    `unsupported release target '${target}'. expected one of: ${[
      ...targetHandlers.keys(),
    ].join(", ")}`,
  );
  process.exit(1);
}

await assertPublicPackage(packageRoot, "released");
await targetHandler({
  dryRun: parsed.options.dryRun,
  tag: parsed.options.tag,
});

async function runRelease(releaseOptions) {
  const args = [
    "publish",
    ...(releaseOptions.dryRun ? ["--dry-run"] : []),
    `--registry=${registry}`,
  ];

  if (releaseOptions.tag) {
    args.push("--tag", releaseOptions.tag);
  }

  await runCommand("npm", args, { cwd: packageRoot });
}
