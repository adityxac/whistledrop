import test from "node:test";
import assert from "node:assert/strict";
import { CATEGORIES, STATUSES, makeCaseCode, validCaseCode, hashCode, validateEvidenceUrl } from "../api/_lib.js";

test("category allowlist matches recruitment specification", () => {
  assert.deepEqual([...CATEGORIES].sort(), ["corruption", "harassment", "other", "security", "technical"]);
});
test("report status workflow matches specification", () => {
  assert.deepEqual([...STATUSES].sort(), ["DISMISSED", "RESOLVED", "SUBMITTED", "UNDER_REVIEW"]);
});
test("generated case codes have expected format and are valid", () => {
  const code = makeCaseCode();
  assert.match(code, /^WD-[A-HJ-NP-Z2-9]{4}(?:-[A-HJ-NP-Z2-9]{4}){3}$/);
  assert.equal(validCaseCode(code), true);
});
test("invalid or malformed case codes are rejected", () => {
  for (const code of ["", "WD-1234", "WD-OOOO-OOOO-OOOO-OOOO", "wd-abcd-efgh-jklm-npqr"]) {
    assert.equal(validCaseCode(code.toUpperCase()), false, code);
  }
});
test("case-code hash is stable and does not equal raw code", () => {
  const code = "WD-ABCD-EFGH-JKLM-NPQR";
  assert.equal(hashCode(code), hashCode(code.toLowerCase()));
  assert.notEqual(hashCode(code), code);
  assert.equal(hashCode(code).length, 64);
});
test("evidence URL is optional and only permits http(s)", () => {
  assert.deepEqual(validateEvidenceUrl(undefined), { ok: true, value: null });
  assert.equal(validateEvidenceUrl("javascript:alert(1)").ok, false);
  assert.equal(validateEvidenceUrl("https://example.com/evidence").ok, true);
  assert.equal(validateEvidenceUrl("https://user:pass@example.com").ok, false);
});
