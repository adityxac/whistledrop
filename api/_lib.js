import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const CATEGORIES = new Set(["security", "harassment", "corruption", "technical", "other"]);
export const STATUSES = new Set(["SUBMITTED", "UNDER_REVIEW", "RESOLVED", "DISMISSED"]);
export const MAX_BODY = 12_000;
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function json(res, status, data) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(data);
}
export function methodNotAllowed(res, allowed) {
  res.setHeader("Allow", allowed.join(", "));
  return json(res, 405, { error: "Method not allowed." });
}
export function getBody(req) {
  if (req.body && typeof req.body === "object" && !Array.isArray(req.body)) return req.body;
  if (typeof req.body === "string") {
    if (Buffer.byteLength(req.body, "utf8") > MAX_BODY) throw Object.assign(new Error("Request body is too large."), { status: 413 });
    try {
      const parsed = JSON.parse(req.body);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return {};
}
export function normalizedText(value) { return typeof value === "string" ? value.trim() : ""; }
export function makeCaseCode() {
  // 16 random bytes = 128 bits of entropy. Rejection is unnecessary for a short-lived
  // code alphabet here: bytes are masked to a 5-bit alphabet index.
  const bytes = randomBytes(16);
  const chars = [...bytes].map(b => alphabet[b & 31]).join("");
  return "WD-" + chars.match(/.{4}/g).join("-");
}
export function validCaseCode(code) {
  return /^WD-[A-HJ-NP-Z2-9]{4}(?:-[A-HJ-NP-Z2-9]{4}){3}$/.test(code);
}
export function hashCode(code) {
  return createHash("sha256").update(code.trim().toUpperCase(), "utf8").digest("hex");
}
export function requireModerator(req, res) {
  const expected = process.env.MODERATOR_TOKEN;
  if (!expected || expected.length < 32) {
    json(res, 503, { error: "Moderator access is not configured. Set a strong MODERATOR_TOKEN in Vercel environment variables." });
    return false;
  }
  const header = req.headers?.authorization || "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    json(res, 401, { error: "Unauthorized. A valid moderator bearer token is required." });
    return false;
  }
  return true;
}
export function validateEvidenceUrl(value) {
  if (value === undefined || value === null || value === "") return { ok: true, value: null };
  if (typeof value !== "string" || value.length > 2048) return { ok: false };
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password) return { ok: false };
    return { ok: true, value: url.toString() };
  } catch { return { ok: false }; }
}
export async function supabase(path, options = {}) {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw Object.assign(new Error("Database is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel."), { status: 503 });
  const response = await fetch(new URL("/rest/v1/" + path, base), {
    ...options,
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const raw = await response.text();
  let data = null;
  if (raw) { try { data = JSON.parse(raw); } catch { data = { message: raw }; } }
  if (!response.ok) {
    const status = response.status >= 500 ? 502 : response.status;
    throw Object.assign(new Error("Database request failed."), { status, detail: data?.message || data?.details || undefined });
  }
  return { response, data };
}
export function handleError(res, error) {
  if (error?.status) return json(res, error.status, { error: error.message });
  return json(res, 500, { error: "An unexpected server error occurred." });
}
