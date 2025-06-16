/**
 * Unit tests for str-enum functionality
 */
import { strEnum, StrEnumKeys } from "../src/str-enum.js";

describe("str-enum.ts", () => {
  describe("strEnum", () => {
    const TestEnum = strEnum("foo", "bar", "baz");

    it("should create an enum with string keys", () => {
      expect(TestEnum.foo).toBe("foo");
      expect(TestEnum.bar).toBe("bar");
      expect(TestEnum.baz).toBe("baz");
    });

    it("should provide values array", () => {
      expect(TestEnum.values).toEqual(["foo", "bar", "baz"]);
    });

    it("should provide length property", () => {
      expect(TestEnum.length).toBe(3);
    });

    it("should check if value is included", () => {
      expect(TestEnum.has("foo")).toBe(true);
      expect(TestEnum.has("bar")).toBe(true);
      expect(TestEnum.has("baz")).toBe(true);
      expect(TestEnum.has("qux")).toBe(false);
      expect(TestEnum.has(null)).toBe(false);
      expect(TestEnum.has(undefined)).toBe(false);
    });

    it("should be iterable", () => {
      const values: string[] = [];
      for (const value of TestEnum) {
        values.push(value);
      }
      expect(values).toEqual(["foo", "bar", "baz"]);
    });

    it("should support array destructuring", () => {
      const [first, second, third] = TestEnum;
      expect(first).toBe("foo");
      expect(second).toBe("bar");
      expect(third).toBe("baz");
    });

    it("should have correct Symbol.toStringTag", () => {
      expect(Object.prototype.toString.call(TestEnum)).toBe("[object StrEnum]");
    });

    it("should handle duplicate values", () => {
      const DupeEnum = strEnum("a", "b", "a", "c", "b");
      expect(DupeEnum.values).toEqual(["a", "b", "c"]);
      expect(DupeEnum.length).toBe(3);
    });
  });

  describe("StrEnumKeys type helper", () => {
    it("should extract keys from enum", () => {
      const DirectionEnum = strEnum("North", "South", "East", "West");
      type Direction = StrEnumKeys<typeof DirectionEnum>;

      // This is a compile-time test - if it compiles, it works
      const direction: Direction = "North";
      expect(DirectionEnum.has(direction)).toBe(true);
    });
  });
});
