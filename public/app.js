(() => {
 const $=s=>document.querySelector(s), key="whistledrop.demo.reports.v1", alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
 const labels={SUBMITTED:"Submitted",UNDER_REVIEW:"Under review",RESOLVED:"Resolved",DISMISSED:"Dismissed"};
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const read=()=>{try{const x=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(x)?x:[]}catch{return[]}};
 const save=x=>localStorage.setItem(key,JSON.stringify(x));
 const code=()=>{const b=new Uint8Array(16);crypto.getRandomValues(b);const s=[...b].map(n=>alphabet[n&31]).join("");return "WD-"+s.match(/.{4}/g).join("-")};
 const valid=c=>/^WD-[A-HJ-NP-Z2-9]{4}(?:-[A-HJ-NP-Z2-9]{4}){3}$/.test(c);
 const form=$("#reportForm"), desc=$("#description");
 desc.addEventListener("input",()=>$("#charCount").textContent=desc.value.length+" / 5,000");
 form.addEventListener("submit",e=>{e.preventDefault();$("#reportError").textContent="";const category=$("#category").value,description=desc.value.trim(),evidenceUrl=$("#evidenceUrl").value.trim();
 if(description.length<20||description.length>5000){$("#reportError").textContent="Description must be between 20 and 5,000 characters.";return}
 if(evidenceUrl){try{const u=new URL(evidenceUrl);if(!["http:","https:"].includes(u.protocol))throw Error()}catch{$("#reportError").textContent="Enter a valid HTTP or HTTPS evidence URL.";return}}
 try{const reports=read(),caseCode=code(),stamp=new Date().toISOString();reports.unshift({id:crypto.randomUUID(),caseCode,category,description,evidenceUrl:evidenceUrl||null,status:"SUBMITTED",statusUpdate:"",updates:[],createdAt:stamp,updatedAt:stamp});save(reports);$("#caseCode").textContent=caseCode;$("#successPanel").classList.remove("hidden");form.reset();$("#charCount").textContent="0 / 5,000";$("#successPanel").scrollIntoView({behavior:"smooth",block:"center"})}catch{$("#reportError").textContent="Browser storage is unavailable. Enable site storage and try again."}});
 $("#copyCode").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("#caseCode").textContent);$("#toast").textContent="Case code copied. Keep it private."}catch{$("#toast").textContent="Select and copy the code manually."}$("#toast").classList.add("show")});
 $("#startAnother").addEventListener("click",()=>{$("#successPanel").classList.add("hidden");$("#report").scrollIntoView({behavior:"smooth"})});
 $("#trackForm").addEventListener("submit",e=>{e.preventDefault();$("#trackError").textContent="";$("#statusResult").classList.add("hidden");const c=$("#caseLookup").value.trim().toUpperCase();if(!valid(c)){$("#trackError").textContent="Enter a case code in the format WD-XXXX-XXXX-XXXX-XXXX.";return}
 const r=read().find(x=>x.caseCode===c);if(!r){$("#trackError").textContent="No report found in this browser's demo storage. Use the same browser and device where it was submitted.";return}
 const updates=(r.updates||[]).map(u=>'<div class="public-update"><p><strong>'+esc(labels[u.status]||u.status)+'</strong> · '+esc(new Date(u.createdAt).toLocaleString())+'</p><p>'+esc(u.update||"Status updated.")+'</p></div>').join("");
 $("#statusResult").innerHTML='<div class="result-top"><strong>Report status</strong><span class="status-chip '+esc(r.status)+'">'+esc(labels[r.status]||r.status)+'</span></div><p>Category: '+esc(r.category)+'</p><p>Last updated: '+esc(new Date(r.updatedAt).toLocaleString())+'</p>'+(updates||(r.statusUpdate?'<p><strong>Update from the review team</strong><br>'+esc(r.statusUpdate)+'</p>':'<p>No additional update has been shared yet.</p>'));$("#statusResult").classList.remove("hidden")});
 $("#caseLookup").addEventListener("input",e=>e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g,""));
})();