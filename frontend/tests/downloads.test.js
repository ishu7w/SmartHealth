import { test } from "node:test";
import assert from "node:assert/strict";
import { csvCell, download } from "../src/lib/download.js";
test("CSV escapes quotes and neutralizes spreadsheet formulas", () => {
  assert.equal(csvCell('A "quoted" value'), '"A ""quoted"" value"');
  assert.equal(csvCell("=SUM(1,2)"), '"\'=SUM(1,2)"');
  assert.equal(csvCell(" @formula"), '"\' @formula"');
  assert.equal(csvCell(98), '"98"');
});

test("downloads attach the link before clicking and clean up after a failed click", (t) => {
  const originalDocument = globalThis.document;
  let attached = false,
    removed = false,
    revoke,
    revoked;
  const link = {
    click() {
      assert.equal(attached, true, "the download link must be in the document");
      throw new Error("blocked click");
    },
    remove() {
      removed = true;
    },
  };
  globalThis.document = {
    createElement: () => link,
    body: {
      appendChild() {
        attached = true;
      },
    },
  };
  t.mock.method(URL, "createObjectURL", () => "blob:test");
  t.mock.method(URL, "revokeObjectURL", (url) => {
    revoked = url;
  });
  t.mock.method(globalThis, "setTimeout", (fn) => {
    revoke = fn;
  });
  try {
    assert.throws(
      () => download("test", "test.csv", "text/csv"),
      /blocked click/,
    );
    assert.equal(removed, true);
    assert.equal(typeof revoke, "function");
    revoke();
    assert.equal(revoked, "blob:test");
  } finally {
    globalThis.document = originalDocument;
  }
});
