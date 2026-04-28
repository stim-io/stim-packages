import process from "node:process";
import { cac } from "cac";
import {
  assertPublicPackage,
  resolvePackageRoot,
  runCommand,
  stripArgumentSeparator,
} from "@stim-io/shared/node";

const packageRoot = resolvePackageRoot(import.meta.url);
const targetHandlers = new Map([
  ["all", runPack],
  ["pack", runPack],
]);

const cli = cac("pack");

cli.option("--target <target>", "Pack target to run: all or pack", {
  default: "all",
});
cli.option("--dry-run", "Run npm pack without writing a tarball", {
  default: true,
});
cli.help();

const parsed = cli.parse(stripArgumentSeparator(process.argv), { run: false });
const target = parsed.options.target;
const targetHandler = targetHandlers.get(target);

if (!targetHandler) {
  console.error(
    `unsupported pack target '${target}'. expected one of: ${[
      ...targetHandlers.keys(),
    ].join(", ")}`,
  );
  process.exit(1);
}

await assertPublicPackage(packageRoot, "packed");
await targetHandler({ dryRun: parsed.options.dryRun });

async function runPack(packOptions) {
  await runCommand(
    "npm",
    ["pack", ...(packOptions.dryRun ? ["--dry-run"] : [])],
    { cwd: packageRoot },
  );
}
