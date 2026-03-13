export function neutralizeSpreadsheetFormula(value: string) {
  if (!value) return value;
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

export function escapeCsvCell(value: string) {
  return `"${neutralizeSpreadsheetFormula(value).replace(/"/g, '""').replace(/\n/g, " ")}"`;
}
