import { describe, expect, it } from "vitest";
import { escapeCsvCell, neutralizeSpreadsheetFormula } from "@/lib/csv";

describe("csv helpers", () => {
  it("neutralizes spreadsheet formulas", () => {
    expect(neutralizeSpreadsheetFormula("=SUM(A1:A2)")).toBe("'=SUM(A1:A2)");
    expect(neutralizeSpreadsheetFormula("+cmd")).toBe("'+cmd");
    expect(neutralizeSpreadsheetFormula("-10")).toBe("'-10");
    expect(neutralizeSpreadsheetFormula("@danger")).toBe("'@danger");
    expect(neutralizeSpreadsheetFormula("safe value")).toBe("safe value");
  });

  it("escapes quotes and line breaks for csv", () => {
    expect(escapeCsvCell('bonjour "monde"\nligne')).toBe('"bonjour ""monde"" ligne"');
  });
});
