import { resolvePackageRoot, verifyPackagePayload } from "@stim-io/shared/node";

await verifyPackagePayload(resolvePackageRoot(import.meta.url));
