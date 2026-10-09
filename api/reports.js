import { CATEGORIES, json, methodNotAllowed, getBody, normalizedText, makeCaseCode, validCaseCode, hashCode, validateEvidenceUrl, supabase, handleError } from "./_lib.js";

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const body = getBody(req);
      const category = normalizedText(body.category).toLowerCase();
      const description = normalizedText(body.description);
      const evidence = validateEvidenceUrl(body.evidenceUrl);
      if (!CATEGORIES.has(category)) return json(res, 400, { error: "Choose a valid category: security, harassment, corruption, technical, or other." });
      if (description.length < 20 || description.length > 5000) return json(res, 400, { error: "Description must be between 20 and 5,000 characters." });
      if (!evidence.ok) return json(res, 400, { error: "Evidence URL must be a valid http or https URL without embedded credentials, up to 2,048 characters." });

      const caseCode = makeCaseCode();
      const codeHash = hashCode(caseCode);
      const { data } = await supabase("reports", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          case_code_hash: codeHash,
          category,
          description,
          evidence_url: evidence.value,
          status: "SUBMITTED"
        })
      });
      if (!Array.isArray(data) || !data.length) throw new Error("Report could not be saved.");
      // Code is only returned in this create response; the raw value is never stored.
      return json(res, 201, { success: true, caseCode, status: "SUBMITTED", message: "Report submitted. Save your case code privately; it cannot be recovered if lost." });
    }
    if (req.method === "GET") {
      const rawCode = normalizedText(req.query?.code).toUpperCase();
      if (!validCaseCode(rawCode)) return json(res, 400, { error: "Enter a case code in the format WD-XXXX-XXXX-XXXX-XXXX." });
      const hash = hashCode(rawCode);
      const { data } = await supabase("reports?select=id,category,status,status_update,created_at,updated_at&case_code_hash=eq." + encodeURIComponent(hash) + "&limit=1");
      if (!Array.isArray(data) || !data.length) return json(res, 404, { error: "No report was found for that case code." });
      const report = data[0];
      const { data: updates } = await supabase("report_updates?select=status,public_update,created_at&report_id=eq." + encodeURIComponent(report.id) + "&order=created_at.desc&limit=20");
      return json(res, 200, {
        category: report.category,
        status: report.status,
        statusUpdate: report.status_update || null,
        updates: Array.isArray(updates) ? updates.map(u => ({ status: u.status, update: u.public_update, createdAt: u.created_at })) : [],
        createdAt: report.created_at,
        updatedAt: report.updated_at
      });
    }
    return methodNotAllowed(res, ["GET", "POST"]);
  } catch (error) {
    return handleError(res, error);
  }
}
