import { test } from "node:test";
import assert from "node:assert/strict";
import { csvCell } from "../src/lib/download.js";
test("CSV escapes quotes and neutralizes spreadsheet formulas", () => {
  assert.equal(csvCell('A "quoted" value'), '"A ""quoted"" value"');
  assert.equal(csvCell("=SUM(1,2)"), '"\'=SUM(1,2)"');
  assert.equal(csvCell(" @formula"), '"\' @formula"');
  assert.equal(csvCell(98), '"98"');
});
