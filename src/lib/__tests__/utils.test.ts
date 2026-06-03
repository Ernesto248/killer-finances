import { describe, it, expect } from "vitest";
import { formatCurrency, formatNumber } from "../utils";

describe("formatCurrency", () => {
  it("formats USD correctly", () => {
    const result = formatCurrency(1234.56, "USD");
    expect(result).toBe("1,235 USD");
  });

  it("formats CUP correctly", () => {
    const result = formatCurrency(1234567.89, "CUP");
    expect(result).toContain("CUP");
    expect(result).toContain("1,234,568");
  });

  it("handles zero", () => {
    const result = formatCurrency(0, "USD");
    expect(result).toBe("0 USD");
  });

  it("handles negative amounts for USD", () => {
    const result = formatCurrency(-50.5, "USD");
    expect(result).toBe("-51 USD");
  });

  it("formats CUP whole number", () => {
    const result = formatCurrency(100, "CUP");
    expect(result).toBe("100 CUP");
  });
});

describe("formatNumber", () => {
  it("formats large numbers with thousand separators", () => {
    expect(formatNumber(1234567)).toBe("1,234,567.00");
  });

  it("formats small numbers with two decimal places", () => {
    expect(formatNumber(42)).toBe("42.00");
  });

  it("handles zero", () => {
    expect(formatNumber(0)).toBe("0.00");
  });
});
