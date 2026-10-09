import { STATUSES, CATEGORIES, json, methodNotAllowed, getBody, normalizedText, requireModerator, supabase, handleError } from "../_lib.js";

export default async function handler(req, res) {
  try {
    if (!["GET", "PATCH"].includes(req.method)) return methodNotAllowed(res, ["GET", "PATCH"]);
    if (!requireModerator(req, res)) return;
    if (req.method === "GET") {
      const category = normalizedText(req.query?.category).toLowerCase();
      const status = normalizedText(req.query?.status).toUpperCase();
      const search = normalizedText(req.query?.search);
      if (category && category !== "all" && !CATEGORIES.has(category)) return json(res, 400, { error: "Invalid category filter." });
      if (status && status !== "ALL" && !STATUSES.has(status)) return json(res, 400, { error: "Invalid status filter." });
      const params = new URLSearchParams({select:"id,category,description,evidence_url,status,status_update,created_at,updated_at",order:"created_at.desc",limit:"200"});
      if (category && category !== "all") params.set("category", "eq." + category);
      if (status && status !== "ALL") params.set("status", "eq." + status);
      if (search) params.set("description", "ilike.*" + search.replace(/[,*()]/g, " ") + "*");
      const { data } = await supabase("reports?" + params.toString());
      return json(res, 200, { reports: Array.isArray(data) ? data : [] });
    }
    const body = getBody(req), id = normalizedText(body.id), status = normalizedText(body.status).toUpperCase(), statusUpdate = normalizedText(body.statusUpdate);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return json(res, 400, { error: "A valid report ID is required." });
    if (!STATUSES.has(status)) return json(res, 400, { error: "Choose a valid status: SUBMITTED, UNDER_REVIEW, RESOLVED, or DISMISSED." });
    if (statusUpdate.length > 1000) return json(res, 400, { error: "Status update must be 1,000 characters or fewer." });
    const { data: current } = await supabase("reports?select=id,status&id=eq." + encodeURIComponent(id));
    if (!Array.isArray(current) || !current.length) return json(res, 404, { error: "Report not found." });
    const { data: updated } = await supabase("reports?id=eq." + encodeURIComponent(id), {method:"PATCH",headers:{Prefer:"return=representation"},body:JSON.stringify({status,status_update:statusUpdate,updated_at:new Date().toISOString()})});
    if (!Array.isArray(updated) || !updated.length) return json(res, 404, { error: "Report not found." });
    await supabase("report_updates", {method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({report_id:id,status,public_update:statusUpdate})});
    return json(res, 200, {success:true,report:{id,status:updated[0].status,statusUpdate:updated[0].status_update,updatedAt:updated[0].updated_at}});
  } catch (error) { return handleError(res, error); }
}
