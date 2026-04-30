export function unreachable(value: never, message: string): never {
  throw new Error(`${message}: ${String(value)}`);
}
