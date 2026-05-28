(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))t(s);new MutationObserver(s=>{for(const o of s)if(o.type==="childList")for(const i of o.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&t(i)}).observe(document,{childList:!0,subtree:!0});function a(s){const o={};return s.integrity&&(o.integrity=s.integrity),s.referrerPolicy&&(o.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?o.credentials="include":s.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function t(s){if(s.ep)return;s.ep=!0;const o=a(s);fetch(s.href,o)}})();const m={_currentSession:null,parsedScript:null,sessionNotes:[],get currentSession(){if(this._currentSession)return this._currentSession;const e=sessionStorage.getItem("dma_current_session");if(e)try{this._currentSession=JSON.parse(e)}catch{}return this._currentSession},set currentSession(e){this._currentSession=e,e?sessionStorage.setItem("dma_current_session",JSON.stringify(e)):sessionStorage.removeItem("dma_current_session")}},D="dma_sessions",F="dma_notes";function O(){return typeof crypto<"u"&&crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now().toString(36)}function M(){try{return JSON.parse(localStorage.getItem(D)||"[]")}catch{return[]}}function q(){try{return JSON.parse(localStorage.getItem(F)||"[]")}catch{return[]}}function V(e){localStorage.setItem(D,JSON.stringify(e))}function J(e){localStorage.setItem(F,JSON.stringify(e))}async function W(e,n){const a={id:O(),production_name:e,script_name:n||null,created_at:new Date().toISOString()},t=M();return t.unshift(a),V(t),a}async function z(){const e=M(),n=q();return e.map(a=>({...a,noteCount:n.filter(t=>t.session_id===a.id).length}))}async function Y(e,n){const a={id:O(),session_id:e,...n,created_at:new Date().toISOString()},t=q();return t.push(a),J(t),a}async function G(e){return q().filter(n=>n.session_id===e).sort((n,a)=>new Date(n.created_at)-new Date(a.created_at))}async function Z(e,n){e.innerHTML=`
    <div class="page-layout">
      <header class="topbar">
        <div class="topbar-brand">
          <span class="logo-mark">▶</span>
          <span class="topbar-title">Director Margin AI</span>
        </div>
        <nav class="topbar-nav">
          <button class="btn btn-ghost btn-sm" id="btn-settings">Settings</button>
        </nav>
      </header>

      <main class="page-main">
        <div class="page-heading">
          <h2>Your Productions</h2>
          <button class="btn btn-primary" id="btn-new-session">+ New Session</button>
        </div>

        <div id="sessions-loading" class="loading-state">Loading sessions…</div>
        <div id="sessions-error" class="message-box error hidden"></div>
        <div id="sessions-grid" class="sessions-grid hidden"></div>
        <div id="sessions-empty" class="empty-state hidden">
          <p>No sessions yet.</p>
          <p class="muted">Hit <strong>+ New Session</strong> to start your first rehearsal.</p>
        </div>
      </main>
    </div>
  `,e.querySelector("#btn-settings").addEventListener("click",()=>n("#settings")),e.querySelector("#btn-new-session").addEventListener("click",()=>n("#new-session"));const a=e.querySelector("#sessions-loading"),t=e.querySelector("#sessions-error"),s=e.querySelector("#sessions-grid"),o=e.querySelector("#sessions-empty");try{const i=await z();if(a.classList.add("hidden"),!i.length){o.classList.remove("hidden");return}s.classList.remove("hidden"),s.innerHTML=i.map(r=>{const c=new Date(r.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});return`
        <div class="session-card"
          data-id="${r.id}"
          data-name="${P(r.production_name)}"
          data-script="${P(r.script_name||"")}">
          <div class="session-card-body">
            <h3 class="session-name">${C(r.production_name)}</h3>
            ${r.script_name?`<p class="session-script">${C(r.script_name)}</p>`:""}
          </div>
          <div class="session-card-foot">
            <span class="meta-badge">${c}</span>
            <span class="meta-badge">${r.noteCount} note${r.noteCount!==1?"s":""}</span>
            <button class="btn btn-secondary btn-sm view-btn">View Notes</button>
          </div>
        </div>
      `}).join(""),s.querySelectorAll(".view-btn").forEach(r=>{r.addEventListener("click",c=>{const l=c.target.closest(".session-card");m.currentSession={id:l.dataset.id,productionName:l.dataset.name,scriptName:l.dataset.script},m.parsedScript=null,m.sessionNotes=[],n("#end-session")})})}catch(i){a.classList.add("hidden"),t.textContent=`Failed to load sessions: ${i.message}`,t.classList.remove("hidden")}}function C(e){return e?e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}function P(e){return e?e.replace(/"/g,"&quot;").replace(/'/g,"&#39;"):""}function Q(e,n){e.innerHTML=`
    <div class="page-layout">
      <header class="topbar">
        <button class="btn btn-ghost btn-sm" id="btn-back">← Back</button>
        <span class="topbar-title">New Rehearsal Session</span>
      </header>

      <main class="page-main narrow">
        <form id="session-form" novalidate>
          <div class="form-group">
            <label for="production-name">Production Name <span class="required">*</span></label>
            <input
              type="text"
              id="production-name"
              required
              placeholder="e.g. A Midsummer Night's Dream"
              autofocus
            />
          </div>

          <div class="form-group">
            <label>Script PDF <span class="optional">(optional)</span></label>
            <div class="upload-zone" id="upload-zone">
              <input type="file" id="script-file" accept=".pdf" class="visually-hidden" />
              <label for="script-file" class="upload-label">
                <span class="upload-icon">📄</span>
                <span>Click to upload a PDF script</span>
                <span class="upload-hint">If your PDF is scanned, OCR will run automatically on the first 10 pages.</span>
              </label>
            </div>
            <div id="upload-status" class="upload-status hidden"></div>
          </div>

          <div id="form-error" class="message-box error hidden"></div>
          <button type="submit" class="btn btn-primary btn-full" id="btn-start">
            Start Rehearsal
          </button>
        </form>
      </main>
    </div>
  `,e.querySelector("#btn-back").addEventListener("click",()=>n("#dashboard"));const a=e.querySelector("#script-file"),t=e.querySelector("#upload-zone"),s=e.querySelector("#upload-status");let o=null,i=null;t.addEventListener("dragover",u=>{u.preventDefault(),t.classList.add("drag-over")}),t.addEventListener("dragleave",()=>t.classList.remove("drag-over")),t.addEventListener("drop",u=>{u.preventDefault(),t.classList.remove("drag-over");const p=u.dataTransfer.files[0];p&&p.type==="application/pdf"&&r(p)}),a.addEventListener("change",u=>{const p=u.target.files[0];p&&r(p)});async function r(u){i=u.name,t.querySelector("label span:nth-child(2)").textContent=u.name,c("Parsing PDF…","loading");try{o=await X(u,c),c(`✓ Parsed ${o.length} pages successfully.`,"success")}catch(p){c(`PDF parse failed: ${p.message}`,"error"),o=null}}function c(u,p=""){s.textContent=u,s.className=`upload-status ${p}`,s.classList.remove("hidden")}const l=e.querySelector("#session-form"),d=e.querySelector("#form-error"),g=e.querySelector("#btn-start");l.addEventListener("submit",async u=>{u.preventDefault(),d.classList.add("hidden");const p=e.querySelector("#production-name").value.trim();if(!p){d.textContent="Production name is required.",d.classList.remove("hidden");return}g.disabled=!0,g.textContent="Creating session…";try{const b=await W(p,i);m.currentSession={id:b.id,productionName:b.production_name,scriptName:b.script_name},m.parsedScript=o,m.sessionNotes=[],n("#rehearsal")}catch(b){d.textContent=`Failed to create session: ${b.message}`,d.classList.remove("hidden")}finally{g.disabled=!1,g.textContent="Start Rehearsal"}})}async function X(e,n){const a=window.pdfjsLib;if(!a)throw new Error("PDF.js is not loaded — check your internet connection and reload.");const t=await e.arrayBuffer(),s=await a.getDocument({data:t}).promise,o=[];for(let r=1;r<=s.numPages;r++){n(`Extracting text — page ${r} of ${s.numPages}…`,"loading");const d=(await(await s.getPage(r)).getTextContent()).items.map(g=>g.str).join(" ").trim();o.push({pageNumber:r,text:d})}if(o.reduce((r,c)=>r+c.text.length,0)/o.length<50){n("No text found — this looks like a scanned PDF. Loading OCR…","loading"),await ee();const r=Math.min(10,s.numPages);return[...await te(t,r,n),...o.slice(r)]}return o}function ee(){return new Promise((e,n)=>{if(window.Tesseract){e();return}const a=document.createElement("script");a.src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js",a.onload=e,a.onerror=()=>n(new Error("Failed to load Tesseract.js. Check your connection.")),document.head.appendChild(a)})}async function te(e,n,a){const s=await window.pdfjsLib.getDocument({data:e.slice(0)}).promise,o=await window.Tesseract.createWorker("eng"),i=[];try{for(let r=1;r<=n;r++){a(`OCR — page ${r} of ${n}…`,"loading");const c=await s.getPage(r),l=c.getViewport({scale:2}),d=document.createElement("canvas");d.width=l.width,d.height=l.height;const g=d.getContext("2d");await c.render({canvasContext:g,viewport:l}).promise;const{data:{text:u}}=await o.recognize(d);i.push({pageNumber:r,text:u.trim()})}}finally{await o.terminate()}return i}const H="dma_hf_api_key";function j(){return{hfApiKey:localStorage.getItem(H)||""}}function se({hfApiKey:e}){localStorage.setItem(H,e||"")}const ne="https://api-inference.huggingface.co/models",ae="mistralai/Mistral-7B-Instruct-v0.2",oe=atob("aGZfdkRTUmV2V2lxQ1NVSG5od2VScUVtWEdEcE1pS3hRTVlCTg==");async function B(e){var o;const{hfApiKey:n}=j(),a=n||oe;if(!a)throw new Error("HuggingFace API key not configured. Please go to Settings.");const t=await fetch(`${ne}/${ae}`,{method:"POST",headers:{Authorization:`Bearer ${a}`,"Content-Type":"application/json"},body:JSON.stringify({inputs:e,parameters:{max_new_tokens:250,temperature:.7,return_full_text:!1}})});if(t.status===503)throw new Error("Model is loading — please wait 20–30 seconds and try again.");if(!t.ok){const i=await t.text();throw new Error(`HuggingFace API error (${t.status}): ${i}`)}const s=await t.json();if(Array.isArray(s)&&((o=s[0])==null?void 0:o.generated_text)!==void 0)return s[0].generated_text;if((s==null?void 0:s.generated_text)!==void 0)return s.generated_text;throw new Error("Unexpected response shape from HuggingFace API.")}async function re(e){const n=`<s>[INST] You are helping a theater director complete a rehearsal note. The director has written the beginning of a note. Suggest 2-3 short completions (under 15 words each) that finish the thought. Do not rewrite what they have written. Only complete it.

Note so far: "${e}"

Provide exactly 2-3 completions, one per line, without numbering or bullet points. Each completion is only the ending that follows what the director already wrote. [/INST]`,t=(await B(n)).split(`
`).map(s=>s.replace(/^[-•*\d.)\s]+/,"").trim()).filter(s=>s.length>2&&s.length<120).slice(0,3);if(t.length===0)throw new Error("No completions returned from the model.");return t}async function ie(e,n){const a=n?`

Context from the script at this moment: "${n.substring(0,200)}"`:"",t=`<s>[INST] You are a theater dramaturg helping a director reflect on their rehearsal notes. A director wrote this note: "${e}"${a}

In 2-3 sentences, explain in plain English what the director likely meant and what specific directorial concern they were addressing. Be concrete and practical. [/INST]`;return(await B(t)).trim()}function ce(e,n){const a=m.currentSession,t=m.parsedScript||[];let s=1;e.innerHTML=`
    <div class="rehearsal-layout">
      <header class="rehearsal-topbar">
        <div class="rehearsal-info">
          <span class="logo-mark">▶</span>
          <span class="rehearsal-prod">${_(a.productionName)}</span>
          <span class="live-badge">● LIVE</span>
        </div>
        <button class="btn btn-danger btn-sm" id="btn-end">End Session</button>
      </header>

      <div class="rehearsal-split">
        <!-- Script panel -->
        <div class="script-panel">
          <div class="script-nav">
            <button class="btn btn-ghost btn-sm" id="prev-page" ${t.length===0?"disabled":""}>← Prev</button>
            <span class="page-label">
              Page <input type="number" id="page-jump" class="page-jump-input" value="1" min="1" ${t.length>0?`max="${t.length}"`:""} />
              ${t.length>0?`<span class="page-total">/ ${t.length}</span>`:""}
            </span>
            <button class="btn btn-ghost btn-sm" id="next-page" ${t.length===0?"disabled":""}>Next →</button>
          </div>

          <div id="script-content" class="script-content">
            ${t.length>0?I(t,1):le()}
          </div>
        </div>

        <!-- Notes panel -->
        <div class="notes-panel">
          <div class="notes-panel-header">
            <h2>New Note</h2>
            <span class="notes-count-badge" id="notes-count">0 notes</span>
          </div>

          <div class="note-form">
            <div class="form-group">
              <label for="note-content">Note Content</label>
              <textarea
                id="note-content"
                rows="5"
                placeholder="Start typing your directorial note…"
              ></textarea>
            </div>

            <div class="suggestions-area hidden" id="suggestions-area">
              <p class="suggestions-label">Click a suggestion to append it:</p>
              <div id="suggestions-list" class="suggestions-list"></div>
            </div>

            <div class="note-meta-grid">
              <div class="form-group">
                <label for="note-page">Page</label>
                <input type="number" id="note-page" value="1" min="1" />
              </div>
              <div class="form-group">
                <label for="note-scene">Scene</label>
                <input type="text" id="note-scene" placeholder="Act 1, Sc 2" />
              </div>
              <div class="form-group">
                <label for="note-actor">Actor</label>
                <input type="text" id="note-actor" placeholder="Name" />
              </div>
              <div class="form-group">
                <label for="note-cat">Category</label>
                <select id="note-cat">
                  <option value="">— none —</option>
                  <option value="timing">Timing</option>
                  <option value="intention">Intention</option>
                  <option value="physical">Physical</option>
                  <option value="relationship">Relationship</option>
                  <option value="technical">Technical</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div id="note-error" class="message-box error hidden"></div>
            <div id="note-success" class="message-box success hidden"></div>

            <div class="note-actions">
              <button class="btn btn-secondary" id="btn-suggest">Suggest Completion</button>
              <button class="btn btn-primary" id="btn-save">Complete Note</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;const o=e.querySelector("#script-content"),i=e.querySelector("#page-jump"),r=e.querySelector("#note-page");function c(h){if(t.length===0)return;const f=Math.max(1,Math.min(t.length,h));s=f,i.value=f,r.value=f,o.innerHTML=I(t,f)}e.querySelector("#prev-page").addEventListener("click",()=>c(s-1)),e.querySelector("#next-page").addEventListener("click",()=>c(s+1)),i.addEventListener("change",()=>c(parseInt(i.value)||1)),r.addEventListener("change",()=>{const h=parseInt(r.value)||1;t.length>0?c(h):s=h}),e.querySelector("#btn-end").addEventListener("click",()=>n("#end-session"));const l=e.querySelector("#note-content"),d=e.querySelector("#suggestions-area"),g=e.querySelector("#suggestions-list"),u=e.querySelector("#note-error"),p=e.querySelector("#note-success"),b=e.querySelector("#btn-suggest"),x=e.querySelector("#btn-save"),R=e.querySelector("#notes-count");b.addEventListener("click",async()=>{const h=l.value.trim();if(!h){N("Write some of the note first before requesting suggestions.");return}k(),b.disabled=!0,b.textContent="Thinking…",d.classList.add("hidden");try{const f=await re(h);g.innerHTML=f.map(y=>`<button class="suggestion-chip">${_(y)}</button>`).join(""),d.classList.remove("hidden"),g.querySelectorAll(".suggestion-chip").forEach(y=>{y.addEventListener("click",()=>{const S=l.value.trimEnd(),L=y.textContent.trimStart(),$=(S.endsWith(".")||S.endsWith("?")||S.endsWith("!")," ");l.value=S+$+L,d.classList.add("hidden"),l.focus()})})}catch(f){N(`Suggestion failed: ${f.message}`)}finally{b.disabled=!1,b.textContent="Suggest Completion"}}),x.addEventListener("click",async()=>{const h=l.value.trim();if(!h){N("Note content cannot be empty.");return}k(),x.disabled=!0,x.textContent="Saving…";const f=parseInt(r.value)||s,y=de(t,f),S={content:h,page_number:f,scene:e.querySelector("#note-scene").value.trim()||null,actor:e.querySelector("#note-actor").value.trim()||null,emotional_category:e.querySelector("#note-cat").value||null,line_snippet:y,timestamp_seconds:Math.floor(Date.now()/1e3)};try{const L=await Y(a.id,S);m.sessionNotes.push(L);const $=m.sessionNotes.length;R.textContent=`${$} note${$!==1?"s":""}`,l.value="",e.querySelector("#note-scene").value="",e.querySelector("#note-actor").value="",e.querySelector("#note-cat").value="",d.classList.add("hidden"),p.textContent="Note saved!",p.classList.remove("hidden"),setTimeout(()=>p.classList.add("hidden"),2500),l.focus()}catch(L){N(`Failed to save: ${L.message}`)}finally{x.disabled=!1,x.textContent="Complete Note"}});function N(h){u.textContent=h,u.classList.remove("hidden"),p.classList.add("hidden")}function k(){u.classList.add("hidden"),p.classList.add("hidden")}}function I(e,n){const a=e.find(t=>t.pageNumber===n);return a?`
    <div class="script-page">
      <div class="script-page-label">Page ${n}</div>
      <pre class="script-text">${_(a.text||"(no text on this page)")}</pre>
    </div>
  `:`<p class="script-missing">Page ${n} not available.</p>`}function le(){return`
    <div class="no-script-notice">
      <p>No script uploaded.</p>
      <p class="muted">Page numbers are set manually in the note form.</p>
    </div>
  `}function de(e,n){const a=e.find(t=>t.pageNumber===n);return!a||!a.text?null:a.text.substring(0,200)}function _(e){return e?String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""}async function ue(e,n){const a=m.currentSession;e.innerHTML=`
    <div class="page-layout">
      <header class="topbar">
        <button class="btn btn-ghost btn-sm" id="btn-back">← Dashboard</button>
        <div class="topbar-center">
          <span class="logo-mark">▶</span>
          <span class="topbar-title">${E(a.productionName)}</span>
        </div>
        <span class="topbar-right-label">Session Notes</span>
      </header>

      <div class="tabs-bar">
        <button class="tab active" data-tab="all">All</button>
        <button class="tab" data-tab="actor">By Actor</button>
        <button class="tab" data-tab="page">By Page</button>
        <button class="tab" data-tab="scene">By Scene</button>
        <button class="tab" data-tab="category">By Category</button>
      </div>

      <main class="page-main">
        <div id="notes-loading" class="loading-state">Loading notes…</div>
        <div id="notes-error" class="message-box error hidden"></div>
        <div id="notes-view" class="notes-view hidden"></div>
        <div id="notes-empty" class="empty-state hidden">
          <p>No notes in this session yet.</p>
        </div>
      </main>
    </div>
  `,e.querySelector("#btn-back").addEventListener("click",()=>n("#dashboard"));const t=e.querySelector("#notes-loading"),s=e.querySelector("#notes-error"),o=e.querySelector("#notes-view"),i=e.querySelector("#notes-empty");let r=[];try{if(r=await G(a.id),t.classList.add("hidden"),!r.length){i.classList.remove("hidden");return}o.classList.remove("hidden"),A(o,r,"all"),e.querySelectorAll(".tab").forEach(c=>{c.addEventListener("click",l=>{e.querySelectorAll(".tab").forEach(d=>d.classList.remove("active")),l.target.classList.add("active"),A(o,r,l.target.dataset.tab)})})}catch(c){t.classList.add("hidden"),s.textContent=`Failed to load notes: ${c.message}`,s.classList.remove("hidden")}}function A(e,n,a){const t=pe(n,a),s=ge(t,a);e.innerHTML=s.map(o=>`
    <div class="note-group">
      ${a!=="all"?`<h3 class="group-header">${E(o)}</h3>`:""}
      <div class="note-list">
        ${t[o].map(i=>me(i)).join("")}
      </div>
    </div>
  `).join(""),e.querySelectorAll(".btn-explain").forEach(o=>{o.addEventListener("click",async i=>{const r=i.target.dataset.noteId,c=n.find(g=>g.id===r);if(!c)return;const l=e.querySelector(`#exp-${r}`),d=i.target;d.disabled=!0,d.textContent="Thinking…",l.classList.remove("hidden"),l.textContent="Getting explanation…",l.classList.remove("exp-error");try{const g=await ie(c.content,c.line_snippet);l.textContent=g.trim()}catch(g){l.textContent=`Could not get explanation: ${g.message}`,l.classList.add("exp-error")}finally{d.disabled=!1,d.textContent="What did I mean?"}})})}function pe(e,n){const a={};return e.forEach(t=>{let s;switch(n){case"actor":s=t.actor||"No Actor";break;case"page":s=t.page_number!=null?`Page ${t.page_number}`:"No Page";break;case"scene":s=t.scene||"No Scene";break;case"category":s=t.emotional_category?U(t.emotional_category):"Uncategorized";break;default:s="All Notes"}a[s]||(a[s]=[]),a[s].push(t)}),a}function ge(e,n){const t={actor:"No Actor",page:"No Page",scene:"No Scene",category:"Uncategorized"}[n];return Object.keys(e).sort((s,o)=>s===t?1:o===t?-1:n==="page"?T(s)-T(o):s.localeCompare(o))}function T(e){const n=e.match(/\d+/);return n?parseInt(n[0]):1/0}function me(e){const n=e.created_at?new Date(e.created_at).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}):"";return`
    <div class="note-card">
      <p class="note-content">${E(e.content)}</p>
      <div class="note-meta">
        ${e.page_number!=null?`<span class="meta-badge">Pg ${e.page_number}</span>`:""}
        ${e.scene?`<span class="meta-badge">${E(e.scene)}</span>`:""}
        ${e.actor?`<span class="meta-badge actor-badge">${E(e.actor)}</span>`:""}
        ${e.emotional_category?`<span class="meta-badge cat-badge">${U(e.emotional_category)}</span>`:""}
        ${n?`<span class="meta-badge time-badge">${n}</span>`:""}
      </div>
      <button class="btn btn-ghost btn-xs btn-explain" data-note-id="${e.id}">
        What did I mean?
      </button>
      <div id="exp-${e.id}" class="explanation-panel hidden"></div>
    </div>
  `}function E(e){return e?String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""}function U(e){return e.charAt(0).toUpperCase()+e.slice(1)}function he(e,n){const a=j();e.innerHTML=`
    <div class="page-layout">
      <header class="topbar">
        <button class="btn btn-ghost btn-sm" id="btn-back">← Back</button>
        <span class="topbar-title">Settings</span>
      </header>

      <main class="page-main narrow">
        <form id="settings-form" novalidate>
          <section class="settings-section">
            <h2>HuggingFace</h2>
            <p class="settings-help">
              Get your free token from
              <strong>huggingface.co → Settings → Access Tokens</strong>.
              A read-scope token is all you need.
            </p>

            <div class="form-group">
              <label for="hf-key">API Token</label>
              <div class="input-row">
                <input
                  type="password"
                  id="hf-key"
                  value="${be(a.hfApiKey)}"
                  placeholder="hf_…"
                  autocomplete="off"
                />
                <button type="button" class="btn btn-ghost btn-sm toggle-vis" data-target="hf-key">Show</button>
              </div>
            </div>
          </section>

          <div id="settings-msg" class="message-box hidden"></div>
          <button type="submit" class="btn btn-primary btn-full">Save</button>
        </form>
      </main>
    </div>
  `,e.querySelector("#btn-back").addEventListener("click",()=>{window.history.length>1?window.history.back():n("#dashboard")}),e.querySelector(".toggle-vis").addEventListener("click",s=>{const o=e.querySelector("#hf-key");o.type==="password"?(o.type="text",s.target.textContent="Hide"):(o.type="password",s.target.textContent="Show")});const t=e.querySelector("#settings-msg");e.querySelector("#settings-form").addEventListener("submit",s=>{s.preventDefault();const o=e.querySelector("#hf-key").value.trim();try{se({hfApiKey:o}),t.textContent="Saved.",t.className="message-box success",setTimeout(()=>t.className="message-box hidden",2500)}catch(i){t.textContent=`Save failed: ${i.message}`,t.className="message-box error"}})}function be(e){return e?e.replace(/"/g,"&quot;").replace(/'/g,"&#39;"):""}const w=document.getElementById("app");function v(e){window.location.hash=e}async function K(){const e=window.location.hash||"#dashboard";switch(w.innerHTML="",e){case"#dashboard":await Z(w,v);break;case"#new-session":Q(w,v);break;case"#rehearsal":if(!m.currentSession){v("#dashboard");return}ce(w,v);break;case"#end-session":if(!m.currentSession){v("#dashboard");return}await ue(w,v);break;case"#settings":he(w,v);break;default:v("#dashboard")}}window.addEventListener("hashchange",K);window.addEventListener("load",K);
