import assert from "node:assert";
import { formatISOToDDMMYYYY, normalizeDateToISO } from "./date";

const passing = [
  { input: "2026-01-24", iso: "2026-01-24", fr: "24/01/2026" },
  { input: "24/01/2026", iso: "2026-01-24", fr: "24/01/2026" },
  { input: " 24/01/2026 ", iso: "2026-01-24", fr: "24/01/2026" },
  { input: new Date("2026-01-24"), iso: "2026-01-24", fr: "24/01/2026" } // Test Date object
];

for (const fixture of passing) {
  const result = normalizeDateToISO(fixture.input);
  assert.strictEqual(result, fixture.iso, `ISO mismatch for ${JSON.stringify(fixture.input)}: expected ${fixture.iso}, got ${result}`);
  if (fixture.iso) {
    assert.strictEqual(formatISOToDDMMYYYY(fixture.iso), fixture.fr, `DD/MM mismatch for ${fixture.iso}`);
  }
}

// normalizeDateToISO retourne null pour les valeurs invalides (ne lance plus d'exception)
const invalid = ["2026/13/01", "", "abc", null, undefined];
for (const value of invalid) {
  const result = normalizeDateToISO(value);
  assert.strictEqual(result, null, `Expected null for invalid input ${JSON.stringify(value)}, got ${result}`);
}

console.log("date helpers ok");
