function $with<Value, Result>(
  value: Value | null | undefined,
  block: (value: Value) => Result,
): Result | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  return block(value);
}

export const aesthetic = {
  $with,
} as const;
