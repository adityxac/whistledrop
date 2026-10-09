import { json, methodNotAllowed } from "../_lib.js";
export default function handler(req, res) {
  if (!["GET", "PATCH"].includes(req.method)) return methodNotAllowed(res, ["GET", "PATCH"]);
  return json(res, 410, { error: "API disabled in browser-local demo mode. Use /moderator/ in the same browser." });
}
