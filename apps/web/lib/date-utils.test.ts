import assert from "node:assert";
import { normalizeToFR, normalizeToISO } from "./date-utils.ts";

const fixtures = [
  { input: "2026-01-24", iso: "2026-01-24", fr: "24/01/2026" },
  { input: "24/01/2026", iso: "2026-01-24", fr: "24/01/2026" },
  { input: " 24/01/2026 ", iso: "2026-01-24", fr: "24/01/2026" },
  { input: "2026-01-24T00:00:00.000Z", iso: "2026-01-24", fr: "24/01/2026" }
];

fixtures.forEach(({ input, iso, fr }) => {
  assert.strictEqual(normalizeToISO(input), iso, `ISO mismatch for ${input}`);
  assert.strictEqual(normalizeToFR(input), fr, `FR mismatch for ${input}`);
});

const invalids = ["2026/13/01", "", "not-a-date"];
invalids.forEach((value) => {
  assert.strictEqual(normalizeToISO(value), null, `Expected null ISO for ${value}`);
  assert.strictEqual(normalizeToFR(value), null, `Expected null FR for ${value}`);
});

console.log("date-utils tests passed");
