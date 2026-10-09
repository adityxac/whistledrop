import { json, methodNotAllowed } from "./_lib.js";
export default function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  return json(res, 200, { status: "ok", service: "WhistleDrop", mode: "browser-local-demo", databaseRequired: false });
}
