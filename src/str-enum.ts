import { Nullable } from "./nullable.js";

// See https://basarat.gitbooks.io/typescript/content/docs/types/literal-types.html

export type StrEnumType<T extends string> = {
  [K in T]: K;
};

/**
 * Helper methods and properties for string enum types created with {@link strEnum}.
 *
 * Provides type-safe utilities for working with predefined string literal types,
 * including validation, comparison, and transformation operations.
 *
 * @template T - The union of string literals that make up this enum
 */
export type StrEnumHelpers<T extends string> = {
  /** Array of all valid enum values in declaration order */
  values: T[];

  /** Number of enum values */
  length: number;

  /**
   * Synonym for {@link includes}. Checks if a string is a valid enum value.
   * @param s - String to check (can be null/undefined)
   * @returns Type predicate indicating if s is a valid enum value
   */
  has(s: Nullable<string>): s is T;

  /**
   * Makes the StrEnum iterable, allowing use in for...of loops and array destructuring.
   * @returns Iterator that yields enum values in declaration order
   * @example
   * const Colors = strEnum("red", "green", "blue");
   * for (const color of Colors) {
   *   console.log(color); // "red", "green", "blue"
   * }
   * const [first, second] = Colors; // first="red", second="green"
   */
  [Symbol.iterator](): IterableIterator<T>;

  /**
   * String tag used by Object.prototype.toString() for better debugging.
   * @example
   * const Colors = strEnum("red", "green", "blue");
   * Object.prototype.toString.call(Colors) // "[object StrEnum]"
   */
  [Symbol.toStringTag]: "StrEnum";
};

export type StrEnum<T extends string> = StrEnumType<T> & StrEnumHelpers<T>;

export type StrEnumKeys<Type> = Type extends StrEnum<infer X> ? X : never;

export function strEnum<T extends string>(...o: T[]): StrEnum<T> {
  const values = Object.freeze([...new Set(o)]) as T[];
  const valueToIndex = Object.fromEntries(
    values.map((ea, idx) => [ea as string, idx]),
  );

  const dict: StrEnumType<T> = {} as StrEnumType<T>;
  for (const ea of values) {
    dict[ea] = ea;
  }

  const indexOf = (s: Nullable<string>) =>
    s != null ? valueToIndex[s] : undefined;

  const has = (s: Nullable<string>): s is T => indexOf(s) != null;

  return {
    ...dict,
    values,
    length: values.length,
    has,
    [Symbol.iterator]: () => values[Symbol.iterator](),
    [Symbol.toStringTag]: "StrEnum",
  };
}

// Example usage:

// export const Directions = strEnum("North", "South", "East", "West");
// export type Direction = StrEnumKeys<typeof Directions>;
