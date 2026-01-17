import assert from "node:assert";
import { formatISOToDDMMYYYY, normalizeDateToISO } from "./date.ts";

const passing = [
  { input: "2026-01-24", iso: "2026-01-24", fr: "24/01/2026" },
  { input: "24/01/2026", iso: "2026-01-24", fr: "24/01/2026" },
  { input: " 24/01/2026 ", iso: "2026-01-24", fr: "24/01/2026" }
];

for (const fixture of passing) {
  assert.strictEqual(normalizeDateToISO(fixture.input), fixture.iso, `ISO mismatch for ${fixture.input}`);
  assert.strictEqual(formatISOToDDMMYYYY(fixture.iso), fixture.fr, `DD/MM mismatch for ${fixture.iso}`);
}

const invalid = ["2026/13/01", "", "abc"];
for (const value of invalid) {
  assert.strictEqual(normalizeDateToISO(value), null, `Expected null for ${value}`);
}

console.log("date helpers ok");
