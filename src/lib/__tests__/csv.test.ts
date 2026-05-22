import { describe, it, expect } from "vitest";
import { parseCSVLine, parseCSV, stripBOM } from "@/lib/csv";

describe("parseCSVLine", () => {
  it("parses simple comma-separated values", () => {
    expect(parseCSVLine("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("trims whitespace around values", () => {
    expect(parseCSVLine("  a , b , c ")).toEqual(["a", "b", "c"]);
  });

  it("handles quoted values", () => {
    expect(parseCSVLine('"a b",c')).toEqual(["a b", "c"]);
  });

  it("handles commas inside quoted values", () => {
    expect(parseCSVLine('"a,b",c')).toEqual(["a,b", "c"]);
  });

  it("handles trailing empty field", () => {
    expect(parseCSVLine("a,b,")).toEqual(["a", "b", ""]);
  });

  it("handles leading empty field", () => {
    expect(parseCSVLine(",a,b")).toEqual(["", "a", "b"]);
  });

  it("handles single value", () => {
    expect(parseCSVLine("hello")).toEqual(["hello"]);
  });

  it("handles empty quoted field", () => {
    expect(parseCSVLine('a,"",c')).toEqual(["a", "", "c"]);
  });

  it("handles empty string", () => {
    expect(parseCSVLine("")).toEqual([""]);
  });
});

describe("stripBOM", () => {
  it("removes UTF-8 BOM from start", () => {
    const withBOM = "﻿date,amount";
    expect(stripBOM(withBOM)).toBe("date,amount");
  });

  it("returns string unchanged if no BOM", () => {
    expect(stripBOM("date,amount")).toBe("date,amount");
  });
});

describe("parseCSV", () => {
  it("parses headers and rows", () => {
    const result = parseCSV("date,amount,note\n2024-01-01,100,test\n2024-01-02,200,foo");
    expect(result.headers).toEqual(["date", "amount", "note"]);
    expect(result.rows).toEqual([
      ["2024-01-01", "100", "test"],
      ["2024-01-02", "200", "foo"],
    ]);
  });

  it("strips BOM from headers", () => {
    const result = parseCSV("﻿date,amount\n2024-01-01,100");
    expect(result.headers).toEqual(["date", "amount"]);
  });

  it("filters empty lines", () => {
    const result = parseCSV("a,b\n1,2\n\n3,4\n");
    expect(result.rows).toEqual([
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("returns empty headers/rows for single line", () => {
    const result = parseCSV("only,headers");
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
  });

  it("returns empty for empty input", () => {
    const result = parseCSV("");
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
  });

  it("handles quoted values with commas", () => {
    const result = parseCSV('date,note\n2024-01-01,"note, with comma"');
    expect(result.rows[0][1]).toBe("note, with comma");
  });
});
