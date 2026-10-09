import { json, methodNotAllowed } from "./_lib.js";
export default function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) return methodNotAllowed(res, ["GET", "POST"]);
  return json(res, 410, { error: "API disabled in browser-local demo mode. Use the website; reports are stored in this browser only." });
}
