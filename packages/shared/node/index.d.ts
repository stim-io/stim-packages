export interface CommandOptions {
  cwd?: string;
  env?: Record<string, string | undefined>;
  stdio?: "inherit" | "pipe" | "ignore";
}

export interface CommandCaptureResult {
  stdout: string;
  stderr: string;
}

export interface PackageJson {
  name?: string;
  version?: string;
  private?: boolean;
  [key: string]: unknown;
}

export function resolvePackageRoot(importMetaUrl: string): string;
export function stripArgumentSeparator(args: string[]): string[];
export function runCommand(
  command: string,
  args: string[],
  options?: CommandOptions,
): Promise<void>;
export function runCommandCapture(
  command: string,
  args: string[],
  options?: CommandOptions,
): Promise<CommandCaptureResult>;
export function readPackageJson(packageRoot: string): Promise<PackageJson>;
export function assertPublicPackage(
  packageRoot: string,
  action: string,
): Promise<PackageJson>;
export function emptyDirectory(directory: string): Promise<void>;
export function hasFilesWithExtensions(
  directory: string,
  extensions: string[],
): Promise<boolean>;
export function copyFilesByExtension(
  sourceDir: string,
  targetDir: string,
  extensions: string[],
): Promise<void>;
export function writeTextFileEnsured(
  filePath: string,
  content: string,
): Promise<void>;
