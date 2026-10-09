(() => {
  const API = "/api";
  const $ = (s) => document.querySelector(s);
  const form = $("#reportForm"), description = $("#description");
  let toastTimer;
  function toast(message) {
    const el = $("#toast"); el.textContent = message; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }
  function setBusy(button, busy, label) { button.disabled = busy; button.dataset.label ||= button.innerHTML; button.innerHTML = busy ? "Please wait…" : (label || button.dataset.label); }
  function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c])); }
  description.addEventListener("input", () => { $("#charCount").textContent = description.value.length.toLocaleString() + " / 5,000"; });
  form.addEventListener("submit", async e => {
    e.preventDefault(); $("#reportError").textContent = "";
    const button = $("#submitReport"); setBusy(button, true);
    const payload = { category: $("#category").value, description: description.value.trim(), evidenceUrl: $("#evidenceUrl").value.trim() || null };
    try {
      const response = await fetch(API + "/reports", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload)});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Couldn't submit the report. Please try again.");
      $("#caseCode").textContent = data.caseCode; $("#successPanel").classList.remove("hidden");
      form.reset(); $("#charCount").textContent = "0 / 5,000";
      $("#successPanel").scrollIntoView({behavior:"smooth",block:"center"});
    } catch (error) { $("#reportError").textContent = error.message || "Network error. Please try again."; }
    finally { setBusy(button, false, "Send report ↗"); }
  });
  $("#copyCode").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText($("#caseCode").textContent); toast("Case code copied. Keep it somewhere private."); }
    catch { toast("Select and copy the case code manually."); }
  });
  $("#startAnother").addEventListener("click", () => { $("#successPanel").classList.add("hidden"); $("#report").scrollIntoView({behavior:"smooth"}); });
  $("#trackForm").addEventListener("submit", async e => {
    e.preventDefault(); $("#trackError").textContent = ""; $("#statusResult").classList.add("hidden");
    const button = $("#trackButton"); setBusy(button, true);
    const code = $("#caseLookup").value.trim().toUpperCase();
    try {
      const response = await fetch(API + "/reports?code=" + encodeURIComponent(code));
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Couldn't find that report.");
      const labels = {SUBMITTED:"Submitted",UNDER_REVIEW:"Under review",RESOLVED:"Resolved",DISMISSED:"Dismissed"};
      const result = $("#statusResult");
      result.innerHTML = '<div class="result-top"><strong>Report status</strong><span class="status-chip '+escapeHtml(data.status)+'">'+escapeHtml(labels[data.status] || data.status)+'</span></div><p>Category: '+escapeHtml(data.category)+'</p><p>Last updated: '+escapeHtml(new Date(data.updatedAt).toLocaleString())+'</p>' +
        ((data.updates || []).map(u => '<div class="public-update"><p><strong>'+escapeHtml(labels[u.status] || u.status)+'</strong> · '+escapeHtml(new Date(u.createdAt).toLocaleString())+'</p><p>'+escapeHtml(u.update || "Status updated.")+'</p></div>').join("") ||
        (data.statusUpdate ? '<p><strong>Update from the review team</strong><br>'+escapeHtml(data.statusUpdate)+'</p>' : '<p>No additional update has been shared yet. You can check back later with this code.</p>'));
      result.classList.remove("hidden");
    } catch (error) { $("#trackError").textContent = error.message || "Network error. Please try again."; }
    finally { setBusy(button, false, "Find my report ↗"); }
  });
  $("#caseLookup").addEventListener("input", e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""); });
})();