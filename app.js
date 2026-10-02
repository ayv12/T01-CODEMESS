/* SkillProof — realtime evidence engine (vanilla JS, GSAP-enhanced landing) */
"use strict";
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const badge = s => s==="proven" ? '<span class="badge b-proven">✓ PROVEN</span>' : s==="partial" ? '<span class="badge b-partial">◐ PARTIAL</span>' : '<span class="badge b-claimed">✕ CLAIMED-ONLY</span>';

/* ---------- Skill taxonomy ---------- */
const TAX = [
  {n:"Python",cat:"Languages",a:["python"],L:["Python"],f:["\\.py$"],d:["django","flask","fastapi","pytest","pandas","numpy"]},
  {n:"JavaScript",cat:"Languages",a:["javascript","\\bjs\\b"],L:["JavaScript"],f:["\\.jsx?$","\\.mjs$"],d:["react","express","node","jest"]},
  {n:"TypeScript",cat:"Languages",a:["typescript"],L:["TypeScript"],f:["\\.tsx?$"],d:["typescript","angular","next"]},
  {n:"Java",cat:"Languages",a:["java(?!script)"],L:["Java"],f:["\\.java$"],d:["spring"]},
  {n:"C++",cat:"Languages",a:["c\\+\\+","\\bcpp\\b"],L:["C++"],f:["\\.(cpp|cc|hpp)$"],d:[]},
  {n:"C",cat:"Languages",a:["\\bc\\b"],L:["C"],f:["\\.c$","\\.h$"],d:[]},
  {n:"Go",cat:"Languages",a:["golang","\\bgo\\b"],L:["Go"],f:["\\.go$"],d:[]},
  {n:"HTML",cat:"Languages",a:["html"],L:["HTML"],f:["\\.html?$"],d:[]},
  {n:"CSS",cat:"Languages",a:["css"],L:["CSS"],f:["\\.css$","\\.scss$"],d:["tailwind"]},
  {n:"React",cat:"Frameworks",a:["react"],L:[],f:["\\.jsx$","\\.tsx$"],d:["react"],dep:1},
  {n:"Angular",cat:"Frameworks",a:["angular"],L:[],f:[],d:["angular"],dep:1},
  {n:"Vue",cat:"Frameworks",a:["vue","nuxt"],L:[],f:["\\.vue$"],d:["vue","nuxt"],dep:1},
  {n:"Flask",cat:"Frameworks",a:["flask"],L:[],f:["\\.py$"],d:["flask"],dep:1},
  {n:"Django",cat:"Frameworks",a:["django"],L:[],f:["\\.py$"],d:["django"],dep:1},
  {n:"FastAPI",cat:"Frameworks",a:["fastapi","fast api"],L:[],f:["\\.py$"],d:["fastapi"],dep:1},
  {n:"Node.js",cat:"Frameworks",a:["node(\\.js)?","nodejs","express"],L:[],f:["package\\.json$"],d:["express","node"],dep:1},
  {n:"Spring Boot",cat:"Frameworks",a:["spring( boot)?"],L:[],f:["\\.java$","pom\\.xml$"],d:["spring"],dep:1},
  {n:"PostgreSQL",cat:"Databases",a:["postgres(ql)?","psql"],L:[],f:["\\.sql$"],d:["postgres","psql"]},
  {n:"MySQL",cat:"Databases",a:["mysql"],L:[],f:["\\.sql$"],d:["mysql"]},
  {n:"MongoDB",cat:"Databases",a:["mongo(db)?","mongoose"],L:[],f:[],d:["mongo"]},
  {n:"SQLite",cat:"Databases",a:["sqlite"],L:[],f:["\\.db$","\\.sqlite"],d:["sqlite"]},
  {n:"Redis",cat:"Databases",a:["redis"],L:[],f:[],d:["redis"]},
  {n:"Docker",cat:"DevOps",a:["docker"],L:[],f:[],d:["docker"],sp:"docker"},
  {n:"Kubernetes",cat:"DevOps",a:["kubernetes","\\bk8s\\b","kubectl"],L:[],f:[],d:["kubernetes","kubectl"]},
  {n:"AWS",cat:"Cloud",a:["aws","amazon web services","\\bec2\\b","\\bs3\\b","lambda","elastic beanstalk"],L:[],f:[],d:["aws","amazon"]},
  {n:"Azure",cat:"Cloud",a:["azure"],L:[],f:[],d:["azure"]},
  {n:"GCP",cat:"Cloud",a:["gcp","google cloud"],L:[],f:[],d:["google cloud","gcp"]},
  {n:"Git",cat:"Tools",a:["\\bgit\\b","github"],L:[],f:[],d:["git"],sp:"git"},
  {n:"Linux",cat:"Tools",a:["linux","\\bbash\\b","shell script"],L:["Shell"],f:["\\.sh$"],d:[]},
  {n:"CI/CD",cat:"DevOps",a:["ci\\/?cd","continuous integration","github actions","jenkins","gitlab ci"],L:[],f:[],d:["actions","jenkins"],sp:"cicd"},
  {n:"Testing",cat:"Tools",a:["testing","pytest","jest","unittest","selenium","cypress","vitest"],L:[],f:[],d:["pytest","jest"],sp:"tests"},
  {n:"REST APIs",cat:"Concepts",a:["rest(ful)?( api)?","\\bapi\\b","endpoint"],L:[],f:[],d:["rest","endpoint"],sp:"rest"},
  {n:"Machine Learning",cat:"Concepts",a:["machine learning","tensorflow","pytorch","scikit"],L:["Jupyter Notebook"],f:["\\.ipynb$"],d:["tensorflow","pytorch","sklearn"]},
  {n:"Firebase",cat:"Cloud",a:["firebase","firestore"],L:[],f:[],d:["firebase"]},
  {n:"Deployment",cat:"DevOps",a:["vercel","netlify","\\brender\\b","heroku","deployed","deployment","live demo"],L:[],f:[],d:["vercel","netlify","render","heroku"],sp:"deploy",dep:1},
];
const byName = n => TAX.find(t => t.n === n);
/* Accept "ayv12", "@ayv12", "github.com/ayv12", "https://github.com/ayv12/" … */
function normalizeGithub(input){
  let u = String(input||"").trim();
  u = u.replace(/^https?:\/\//i,"").replace(/^www\./i,"");
  const m = u.match(/github\.com\/([A-Za-z0-9-]{1,39})/i);
  if (m) return m[1];
  u = u.replace(/^@/,"").split(/[\s\/]+/)[0];
  return u;
}
const rx = p => new RegExp(`\\b(?:${p})\\b`, "i");
const anyRx = arr => new RegExp(`\\b(?:${arr.join("|")})\\b`, "i");

function extractSkills(text){
  const t = " " + String(text||"").replace(/[\s_]+/g," ") + " ";
  return TAX.filter(d => rx(d.a.join("|")).test(t)).map(d => d.n);
}
function matchManualSkills(text){
  const tokens = String(text||"").toLowerCase().split(/[,\n;|]/).map(s=>s.trim()).filter(Boolean);
  const found = new Set();
  tokens.forEach(tok => {
    TAX.forEach(d => {
      if (d.n.toLowerCase() === tok || rx(d.a.join("|")).test(" "+tok+" ")) found.add(d.n);
    });
  });
  return [...found];
}

const ROLES = [
  {n:"Backend Developer", s:["Python","Flask","REST APIs","PostgreSQL","Docker","Git","Testing"]},
  {n:"Frontend Developer", s:["JavaScript","React","HTML","CSS","Git","REST APIs","Deployment"]},
  {n:"Full-stack Developer", s:["JavaScript","Node.js","React","PostgreSQL","Docker","Git","REST APIs"]},
  {n:"Data Analyst", s:["Python","PostgreSQL","Machine Learning","Git","Linux"]},
  {n:"AI/ML Engineer", s:["Python","Machine Learning","REST APIs","Git","Linux","Docker"]},
  {n:"DevOps Engineer", s:["Docker","CI/CD","Linux","Git","AWS","Deployment"]},
];
const TASKS = {
  "Docker":{t:"~45 min",x:r=>`Containerize <b>${r}</b>: add a <code>Dockerfile</code> + <code>docker-compose.yml</code> (app + database), build &amp; run locally, document the commands in the README.`},
  "PostgreSQL":{t:"~60 min",x:r=>`Add a real database layer to <b>${r}</b>: schema + migrations (<code>Alembic</code> / <code>knex</code>), seed data, and push one fresh migration commit.`},
  "AWS":{t:"~2 hrs",x:r=>`Deploy <b>${r}</b> to <code>AWS EC2 / Elastic Beanstalk</code> (free tier), add the live URL + a short architecture section to the README.`},
  "CI/CD":{t:"~30 min",x:r=>`Add <code>.github/workflows/ci.yml</code> to <b>${r}</b> that installs deps and runs your tests on every push, plus a status badge in the README.`},
  "Testing":{t:"~45 min",x:r=>`Add a meaningful test suite to <b>${r}</b> (<code>pytest</code> / <code>jest</code>, 10+ tests) and wire it into CI so results are visible.`},
  "Redis":{t:"~60 min",x:r=>`Add caching or session storage with <code>Redis</code> to <b>${r}</b> and document the before/after response times in the README.`},
  "Kubernetes":{t:"~2 hrs",x:r=>`Write <code>deployment.yaml + service.yaml</code> for <b>${r}</b>, deploy to a local cluster (<code>minikube/kind</code>), screenshot the running pods.`},
  "TypeScript":{t:"~60 min",x:r=>`Migrate one module of <b>${r}</b> to <code>TypeScript</code> with strict mode on and fix every type error — commit the diff.`},
  "Machine Learning":{t:"~3 hrs",x:r=>`Ship one end-to-end ML notebook in <b>${r}</b>: dataset → training → evaluation metrics → saved model + model card.`},
};
const fallbackTask = (s,r) => ({t:"~1 hr", x:`Build one focused feature using <b>${esc(s)}</b> inside <b>${r}</b>, write tests for it, and document what you did in the README — then push.`});

/* ---------- State ---------- */
let ANALYSIS = null;   // {mode,...}
let renderedFor = 0;
let analysisSeq = 0;

/* ---------- GitHub API ---------- */
async function gh(path, token){
  const res = await fetch(`https://api.github.com${path}`, {headers:{Accept:"application/vnd.github+json", ...(token?{Authorization:`Bearer ${token}`}:{})}});
  if (res.status === 404) { const e = new Error("not-found"); e.code = 404; throw e; }
  if (res.status === 403 || res.status === 429) {
    const reset = res.headers.get("x-ratelimit-reset");
    const e = new Error("rate"); e.code = 403;
    e.reset = reset ? new Date(+reset*1000).toLocaleTimeString() : null;
    throw e;
  }
  if (!res.ok) { const e = new Error("http "+res.status); e.code = res.status; throw e; }
  return res.json();
}
async function ghRawReadme(full, token){
  try {
    const res = await fetch(`https://api.github.com/repos/${full}/readme`, {headers:{Accept:"application/vnd.github.raw", ...(token?{Authorization:`Bearer ${token}`}:{})}});
    if (!res.ok) return "";
    return await res.text();
  } catch { return ""; }
}
function errMsg(e, username){
  if (e.code === 404) return `GitHub user “${username}” not found. Check the spelling and try again.`;
  if (e.code === 403) return `GitHub rate limit hit (60 req/hr without a token)${e.reset?`, resets ~${e.reset}`:""}. Add a token in Advanced options, or wait and retry.`;
  if (e.message === "Failed to fetch") return "Network error reaching GitHub. Check your connection and retry.";
  return `GitHub request failed (${esc(e.message||"unknown")}). Retry, or add a token.`;
}

/* ---------- PDF parsing (local) ---------- */
async function parsePdf(file){
  if (!window.pdfjsLib) throw new Error("PDF reader library failed to load (needs internet once). Paste your skills manually instead.");
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const buf = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({data:buf}).promise;
  let out = "";
  const n = Math.min(pdf.numPages, 15);
  for (let i=1;i<=n;i++){
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    out += tc.items.map(it=>it.str).join(" ") + "\n";
  }
  return out;
}

/* ---------- Pipeline ---------- */
function setStages(steps){
  const box = $("pulseList"); box.innerHTML = "";
  return steps.map(s => {
    const d = document.createElement("div"); d.className = "pulse-row";
    d.innerHTML = `<div class="dot"></div><div style="flex:1"><strong style="font-size:14px">${esc(s)}</strong><div class="muted stage-sub" style="font-size:13px"></div></div>`;
    box.appendChild(d);
    return {row:d, set:(t, done)=>{ d.querySelector(".stage-sub").innerHTML = t||""; d.classList.remove("active"); if(done){d.classList.add("done"); d.querySelector(".dot").textContent="✓";} }};
  });
}
function markActive(rows, i){ rows.forEach((r,j)=>{ r.row.classList.toggle("active", j===i); if(j===i) r.row.querySelector(".dot").textContent=""; }); }
function ago(iso){
  if(!iso) return "unknown";
  const d = new Date(iso), diff = Date.now()-d.getTime();
  const days = Math.floor(diff/864e5);
  if (days < 1) return "today"; if (days < 30) return `${days} day${days>1?"s":""} ago`;
  const mo = Math.floor(days/30); if (mo < 12) return `${mo} mo ago`;
  return `${Math.floor(mo/12)} yr ago`;
}
function monthsSince(iso){ return (Date.now()-new Date(iso).getTime())/ (30.44*864e5); }

async function runPipeline({mode, name, username, token, resumeFile, manualSkills, jdText}){
  location.hash = "#/analyzing";
  await new Promise(r=>setTimeout(r,30));
  $("loadErr").hidden = true; $("loadRetry").hidden = true;
  const seq = ++analysisSeq;
  const ok = () => seq === analysisSeq;
  const fail = msg => { if(!ok())return; $("loadErr").innerHTML = msg; $("loadErr").hidden = false; $("loadRetry").hidden = false; throw new Error("stopped"); };

  const rows = setStages(["Reading resume","Contacting GitHub","Scanning repository contents","Reading collaboration activity","Scoring claim-vs-code","Matching the job"]);
  try {
    /* 1 — resume */
    markActive(rows,0);
    let resumeText = "";
    if (resumeFile) {
      if (resumeFile.size > 5*1024*1024) fail("Resume exceeds 5 MB. Please use a smaller PDF.");
      rows[0].set("Parsing PDF in your browser…");
      try { resumeText = await parsePdf(resumeFile); }
      catch(e){ fail(esc(e.message||"Could not read that PDF. Try pasting your skills instead.")); }
    }
    let claimed = extractSkills(resumeText);
    const manual = matchManualSkills(manualSkills);
    manual.forEach(s=>{ if(!claimed.includes(s)) claimed.push(s); });
    if (!claimed.length) fail("No recognizable skills found. Upload a text-based PDF (not a scan) or paste skills like “Python, Flask, React”.");
    if(!ok())return;
    rows[0].set(`<strong>${claimed.length} claimed skills:</strong> ${claimed.map(esc).join(", ")}`, true);

    /* 2 — github user */
    markActive(rows,1);
    rows[1].set(`Fetching @${esc(username)} …`);
    let user;
    try { user = await gh(`/users/${encodeURIComponent(username)}`, token); }
    catch(e){ fail(errMsg(e, username)); }
    if(!ok())return;
    if (!user.public_repos) {
      // still continue — zero repos is a valid (weak) signal
    }
    let repos = [];
    try {
      const per = 100;
      const p1 = await gh(`/users/${encodeURIComponent(username)}/repos?per_page=${per}&page=1&sort=pushed`, token);
      repos = repos.concat(p1);
      if (user.public_repos > per) {
        const p2 = await gh(`/users/${encodeURIComponent(username)}/repos?per_page=${per}&page=2&sort=pushed`, token);
        repos = repos.concat(p2);
      }
    } catch(e){ fail(errMsg(e, username)); }
    if(!ok())return;
    rows[1].set(`<strong>${user.public_repos} public repos</strong> · followers ${user.followers} · analyzing the most recently pushed`, true);

    /* 3 — repo contents */
    markActive(rows,2);
    const sorted = [...repos].sort((a,b)=>(a.fork?-1:1)-(b.fork?-1:1) || new Date(b.pushed_at)-new Date(a.pushed_at));
    const DEPTH = 8;
    const targets = sorted.slice(0, DEPTH);
    const skipped = repos.length - targets.length;
    const details = [];
    const pool = 4;
    let done = 0;
    async function scanOne(r){
      const d = {full:r.full_name, push:r.pushed_at, langs:{}, paths:[], readme:"", fork:r.fork};
      try {
        const [langs, tree] = await Promise.all([
          gh(`/repos/${r.full_name}/languages`, token).catch(()=>({})),
          gh(`/repos/${r.full_name}/git/trees/${encodeURIComponent(r.default_branch||"HEAD")}?recursive=1`, token).catch(()=>null),
        ]);
        d.langs = langs||{};
        if (tree && tree.tree) d.paths = tree.tree.filter(t=>t.type==="blob").map(t=>t.path.toLowerCase()).slice(0,4000);
        d.readme = await ghRawReadme(r.full_name, token);
      } catch { /* keep partial */ }
      // derived flags
      const P = d.paths, has = re => P.some(p=>re.test(p));
      d.hasDocker = has(/(^|\/)(dockerfile|docker-compose.*\.ya?ml)$/);
      d.hasWorkflows = has(/\.github\/workflows\//);
      d.hasTests = has(/(\/tests?\/|test_.*\.py$|.*_test\.(js|ts|py)$|\.test\.(js|ts|jsx|tsx)$|conftest\.py$|pytest\.ini$|jest\.config)/);
      d.hasSh = has(/\.sh$/);
      d.hasSql = has(/\.sql$/);
      d.deployHit = /(vercel\.app|netlify\.app|onrender\.com|herokuapp\.com|aws\.amazon|elasticbeanstalk|live demo|deployed)/i.test(d.readme||"");
      return d;
    }
    const queue = [...targets];
    async function worker(){
      while(queue.length && ok()){
        const r = queue.shift();
        details.push(await scanOne(r));
        done++;
        rows[2].set(`Scanned ${done}/${targets.length} repos…`);
      }
    }
    await Promise.all(Array.from({length:Math.min(pool,targets.length)}, worker));
    if(!ok())return;
    if (!details.length && repos.length) fail("Could not read any repository contents (rate limit or network). Add a token or retry.");
    rows[2].set(`<strong>${details.length} repos scanned in depth</strong>${skipped?` · ${skipped} overviewed only`:""}`, true);

    /* 4 — collaboration */
    markActive(rows,3);
    let collab = {pr:0, reviews:0, issues:0, pushes:0, ok:false};
    try {
      const ev = await gh(`/users/${encodeURIComponent(username)}/events/public?per_page=100`, token);
      if (Array.isArray(ev)) {
        collab.ok = true;
        ev.forEach(e=>{
          if(e.type==="PullRequestEvent") collab.pr++;
          else if(e.type==="PullRequestReviewEvent") collab.reviews++;
          else if(e.type==="IssuesEvent"||e.type==="IssueCommentEvent") collab.issues++;
          else if(e.type==="PushEvent") collab.pushes += (e.payload?.commits?.length||1);
        });
      }
    } catch { /* unavailable, not fatal */ }
    if(!ok())return;
    rows[3].set(collab.ok ? `<strong>${collab.pr} PRs opened · ${collab.reviews} reviews · ${collab.issues} issue activity</strong> (last ~90 days of public events)` : "Public event feed unavailable — collaboration marked as unknown, not guessed.", true);

    /* 5 — scoring */
    markActive(rows,4);
    rows[4].set("Applying transparent rule set…");
    await new Promise(r=>setTimeout(r,250));
    const built = buildSkills(claimed, details);
    if(!ok())return;
    rows[4].set(`<strong>${built.skills.filter(s=>s.status==="proven").length} proven · ${built.skills.filter(s=>s.status==="partial").length} partial · ${built.skills.filter(s=>s.status==="claimed").length} claimed-only</strong> · ${built.hidden.length} hidden found`, true);

    /* 6 — job match */
    markActive(rows,5);
    const jdSkills = extractSkills(jdText);
    if (!jdSkills.length) fail("No recognizable skills in the job description. Paste real requirements (e.g. “Python, Flask, PostgreSQL, Docker”) or use a role preset.");
    if(!ok())return;
    const match = buildMatch(jdSkills, built.map);
    const salary = buildSalary(jdText, built.skills);
    const roles = buildRoles(built.map);
    const topRepo = [...details].sort((a,b)=>new Date(b.push)-new Date(a.push))[0];
    const topRepoName = topRepo ? topRepo.full.split("/")[1] : "your best repo";
    const micros = buildMicros(jdSkills, built.map, topRepoName);
    rows[5].set(`<strong>${match.pct}% match</strong> · ${salary.band}`, true);

    ANALYSIS = {
      v: seq, mode, token, name: name||username, username, avatar:(name||username||"?").trim().charAt(0).toUpperCase(),
      target: jdText.split("\n")[0].slice(0,80) || "Target role",
      date: new Date().toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"}),
      analyzed: details.length, skipped, totalRepos: repos.length,
      claimed, skills: built.skills, hidden: built.hidden,
      collab, jdSkills, match, salary, roles, micros,
      questions: buildQuestions(built.skills, built.map, jdSkills),
      deployGlobal: details.some(d=>d.deployHit),
    };
    renderedFor = 0;
    await new Promise(r=>setTimeout(r,450));
    if(!ok())return;
    location.hash = mode === "recruiter" ? "#/rresults" : "#/dashboard";
  } catch(e){ /* fail() already displayed */ }
}

function buildSkills(claimed, details){
  const out = [], map = {};
  TAX.forEach(def => {
    const isClaimed = claimed.includes(def.n);
    let bytes = 0, fileHits = 0, readmeHit = false, depHit = false, reposEv = [], newest = null;
    const fileRes = def.f.map(p=>new RegExp(p,"i"));
    const depRx = def.d.length ? anyRx(def.d) : null;
    details.forEach(d => {
      let score_repo = 0, paths = [];
      (def.L||[]).forEach(L => { if (d.langs[L]) { bytes += d.langs[L]; score_repo++; } });
      fileRes.forEach(re => { d.paths.forEach(p => { if (re.test(p)) { fileHits++; score_repo++; paths.push(p); } }); });
      const rd = (d.readme||"");
      if (rx(def.a.join("|")).test(rd)) { readmeHit = true; score_repo++; }
      if (depRx && depRx.test(rd)) { depHit = true; score_repo++; }
      let special = false;
      if (def.sp === "docker" && (d.hasDocker)) special = true;
      if (def.sp === "cicd" && d.hasWorkflows) special = true;
      if (def.sp === "tests" && d.hasTests) special = true;
      if (def.sp === "deploy" && d.deployHit) special = true;
      if (def.sp === "git" && d.push) special = true;
      if (def.sp === "rest" && /(rest|endpoint|\/api[\/ ])/i.test(rd)) special = true;
      if (special) score_repo++;
      if (score_repo > 0) {
        reposEv.push({full:d.full, push:d.push, paths:paths.slice(0,6), langBytes:(def.L||[]).reduce((s,L)=>s+(d.langs[L]||0),0)});
        if (!newest || new Date(d.push) > new Date(newest)) newest = d.push;
      }
    });
    const codePt = (bytes > 2048 || fileHits >= 2 || depHit || (def.sp==="docker"&&details.some(d=>d.hasDocker)) || (def.sp==="cicd"&&details.some(d=>d.hasWorkflows)) || (def.sp==="tests"&&details.some(d=>d.hasTests)) || (def.sp==="deploy"&&details.some(d=>d.deployHit))) ? 3 : 0;
    const recent = newest && monthsSince(newest) < 12;
    const testsNear = reposEv.some(r => details.find(d=>d.full===r.full)?.hasTests);
    const deployAble = !!def.dep;
    const deployPt = (deployAble && details.some(d=>d.deployHit)) ? 1 : 0;
    let score = (isClaimed?1:0) + codePt + (recent?2:0) + (readmeHit?1:0) + (testsNear?1:0) + deployPt;
    const noClaimScore = score - (isClaimed?1:0);
    const status = score >= 7 ? "proven" : score >= 3 ? "partial" : "claimed";
    const recency = !newest ? "Stale" : monthsSince(newest) < 6 ? "Active" : monthsSince(newest) <= 24 ? "Dormant" : "Stale";
    const rec = {def, name:def.n, cat:def.cat, claimed:isClaimed, status, score:`${score}/9`, noClaimScore,
      recency, lastUsed: newest?ago(newest):"no evidence",
      repos:reposEv.length, files:fileHits, commits:null, newest,
      note: summarize(def.n, status, bytes, fileHits, reposEv.length, newest),
      reposEv: reposEv.sort((a,b)=>new Date(b.push)-new Date(a.push))};
    if (isClaimed || noClaimScore >= 4) { out.push(rec); map[def.n] = rec; }
  });
  const skills = out.filter(s=>s.claimed);
  const hidden = out.filter(s=>!s.claimed).sort((a,b)=>b.noClaimScore-a.noClaimScore);
  // order: proven, partial, claimed
  const ord = {proven:0, partial:1, claimed:2};
  skills.sort((a,b)=>ord[a.status]-ord[b.status]);
  return {skills, hidden, map};
}
function summarize(name, status, bytes, fileHits, nRepos, newest){
  const kb = bytes>1024 ? ` · ${(bytes/1024).toFixed(bytes>102400?0:1)} KB of code` : "";
  if (status === "proven") return `Strong live evidence across ${nRepos} repo${nRepos>1?"s":""}${kb}, used ${ago(newest)}.`;
  if (status === "partial") return nRepos ? `Real but thin: ${nRepos} repo${nRepos>1?"s":""}${kb}, last touched ${ago(newest)}. Strengthen it.` : "Weak signals only — needs a real project.";
  return "Listed on the resume, but no supporting code found in scanned repos.";
}

function buildMatch(jdSkills, map){
  let pts = 0;
  const rows = jdSkills.map(n => {
    const s = map[n];
    const st = !s ? "missing" : s.status;
    pts += st==="proven"?1:st==="partial"?0.5:0;
    return {name:n, status:st};
  });
  return {pct: Math.round(pts/jdSkills.length*100), rows};
}
function buildSalary(jdText, skills){
  const p = skills.filter(s=>s.status==="proven").length;
  const lvl = /senior|lead|staff/i.test(jdText) ? "Senior" : /intern/i.test(jdText) ? "Intern" : "Junior";
  let low, high;
  if (lvl==="Intern"){ low = 2+Math.min(p,6)*0.5; high = 5+Math.min(p,6); }
  else if (lvl==="Senior"){ low = 14+p; high = 22+p*1.5; }
  else { low = 4+Math.round(p*0.7); high = 8+p; }
  return {band:`₹${Math.round(low)}–${Math.round(high)} LPA`, why:`Based on ${p} proven skill${p===1?"":"s"} · ${lvl} level · India market. Rough estimate — actual offers vary by company and city.`};
}
function buildRoles(map){
  return ROLES.map(r=>{
    let pts = 0;
    r.s.forEach(s=>{ const m = map[s]; pts += !m?0:m.status==="proven"?1:m.status==="partial"?0.5:0; });
    return {name:r.n, pct:Math.round(pts/r.s.length*100)};
  }).sort((a,b)=>b.pct-a.pct).slice(0,3);
}
function buildMicros(jdSkills, map, topRepo){
  const gaps = jdSkills.filter(n=>{ const m=map[n]; return !m || m.status!=="proven"; });
  const list = gaps.slice(0,4).map(g=>{
    const t = TASKS[g] || fallbackTask(g, topRepo);
    return {gap:g, time:t.t, task: typeof t.x==="function"?t.x(`<span class="mono">${esc(topRepo)}</span>`):t.x};
  });
  return list.length?list:[{gap:"Depth", time:"ongoing", task:`Keep pushing to <span class="mono">${esc(topRepo)}</span> — consistent recent commits turn Partial skills Proven.`}];
}
function buildQuestions(skills, map, jdSkills){
  const q = [];
  const proven = skills.filter(s=>s.status==="proven").slice(0,2);
  proven.forEach(s=>{
    const r = s.reposEv[0];
    q.push(`“${s.name} is Proven — walk me through ${r?`<span class="mono">${esc(r.full)}</span>`:"your best repo"}: how is it structured and what decisions did you make?”`);
  });
  jdSkills.filter(n=>{ const m=map[n]; return !m||m.status!=="proven"; }).slice(0,3).forEach(g=>{
    q.push(`“${g} shows ${!map[g]?"no":"weak"} evidence. ${TASKS[g]?"How would you approach it live right now?":"Show how you would add it to your project today."}”`);
  });
  q.push("“Show one pull request you reviewed or opened. What did you flag, and why?”");
  return q.slice(0,5);
}

/* ---------- Rendering ---------- */
function renderSkillsInto(elId, skills){
  const el = $(elId);
  const groups = [["proven","Proven"],["partial","Partial"],["claimed","Claimed-only"]];
  el.innerHTML = groups.map(([key])=>{
    const list = skills.filter(s=>s.status===key);
    return `<div><div class="col-head">${badge(key)}<span class="count">${list.length}</span></div>
      ${list.map((s,i)=>`
      <article class="skill" style="animation-delay:${Math.min(i*90,630)}ms">
        ${badge(s.status)}
        <h4>${esc(s.name)} <span class="muted" style="font-weight:400;font-size:12px">· ${esc(s.cat)} · evidence ${esc(s.score)}</span></h4>
        <p class="meta">${esc(s.note)}</p>
        <p class="meta">${s.repos?`<span class="mono" style="font-size:12px">${s.repos} repos · ${s.files} file hits</span>`:`<span style="color:#EF4444;font-size:12.5px">No supporting repo evidence found</span>`} · <span class="recency ${s.recency==="Active"?"on":""}">${s.recency==="Active"?"●":"○"} ${s.recency} · ${esc(s.lastUsed)}</span></p>
        <button class="btn-proof" data-proof="${esc(s.name)}">Show me the proof</button>
      </article>`).join("") || `<p class="muted" style="font-size:13.5px">None.</p>`}</div>`;
  }).join("");
  el.querySelectorAll("[data-proof]").forEach(b=>b.addEventListener("click",()=>openProof(b.getAttribute("data-proof"))));
}
/* Staggered entrance for freshly rendered dashboard blocks */
function playIn(rootId){
  const root = $(rootId); if(!root) return;
  const els = root.querySelectorAll(":scope > *");
  els.forEach((el,i)=>{ el.classList.remove("play"); el.style.animationDelay = Math.min(i*80,640)+"ms"; void el.offsetWidth; el.classList.add("play"); });
}
function animateRing(ringId,numId,target){
  const ring=$(ringId), num=$(numId); if(!ring||!num) return;
  const C=502.65; let t0=null;
  (function frame(t){ if(!t0)t0=t; const p=Math.min((t-t0)/1600,1), e=p===1?1:1-Math.pow(2,-10*p); // easeOutExpo
    num.textContent=Math.round(target*e); ring.style.strokeDashoffset=C*(1-(target*e)/100);
    if(p<1) requestAnimationFrame(frame); })(performance.now());
}
function emptyState(elId, title, body, cta){
  $(elId).innerHTML = `<div class="card empty"><h2 class="section-title">${title}</h2><p class="section-sub">${body}</p><div class="cta-row" style="justify-content:center"><a class="btn btn-primary" href="#/service">${cta}</a></div></div>`;
}
function renderDashboard(){
  if (!ANALYSIS || ANALYSIS.mode!=="seeker") { $("dashBody").hidden = true; emptyState("dashEmpty","No report yet","Run a live analysis from the start form and your evidence report will appear here.","Start my analysis"); return; }
  $("dashEmpty").innerHTML = ""; $("dashBody").hidden = false;
  const A = ANALYSIS;
  $("dName").textContent = A.name;
  $("dMeta").innerHTML = `<span class="mono">${esc(A.username)}</span> · Target: ${esc(A.target)} · ${A.analyzed} repos scanned${A.skipped?` · ${A.skipped} overviewed`:""} · ${esc(A.date)}`;
  $("dRole").textContent = A.target;
  $("dMatchSub").textContent = `${A.jdSkills.length} required skills · ${A.match.rows.filter(r=>r.status==="proven").length} proven · ${A.match.rows.filter(r=>r.status==="partial").length} partial`;
  $("ringAria").setAttribute("aria-label", `Job match ${A.match.pct} percent`);
  $("dSalary").textContent = A.salary.band; $("dSalaryWhy").textContent = A.salary.why;
  $("altRoles").innerHTML = A.roles.map(r=>`<div class="role-row"><span><strong>${esc(r.name)}</strong></span><span style="display:flex;align-items:center"><strong>${r.pct}%</strong><span class="fitbar"><i style="--w:${r.pct}%"></i></span></span></div>`).join("");
  $("skillCount").textContent = `${A.skills.filter(s=>s.status==="proven").length} proven · ${A.skills.filter(s=>s.status==="partial").length} partial · ${A.skills.filter(s=>s.status==="claimed").length} claimed-only`;
  renderSkillsInto("skillCols", A.skills);
  $("hiddenGrid").innerHTML = A.hidden.length ? A.hidden.map(h=>`<div class="hidden-row"><span class="mk">✦</span><strong>${esc(h.name)}</strong> <span class="muted">· evidence ${esc(h.score)} · ${h.repos} repo${h.repos>1?"s":""}${h.files?` · ${h.files} file hits`:""} · last used ${esc(h.lastUsed)}. Not on your resume — add it.</span></div>`).join("") : `<p class="muted">No hidden skills — everything found in code is already on the resume.</p>`;
  const c = A.collab;
  $("collabBox").innerHTML = c.ok ? `<div class="role-row"><span>PRs opened</span><strong>${c.pr}</strong></div><div class="role-row"><span>Code reviews</span><strong>${c.reviews}</strong></div><div class="role-row"><span>Issue activity</span><strong>${c.issues}</strong></div><div class="role-row"><span>Pushes (recent window)</span><strong>${c.pushes}</strong></div>${teamwork(c)}` : `<div class="alert-warn">Public activity feed unavailable for this account — marked unknown, not guessed.</div>`;
  const act = A.skills.filter(s=>s.recency==="Active").map(s=>s.name), dor = A.skills.filter(s=>s.recency==="Dormant").map(s=>s.name), st = A.skills.filter(s=>s.recency==="Stale").map(s=>s.name);
  $("recencyBox").innerHTML = `<div class="role-row"><span>🟢 Active (&lt;6 mo)</span><strong>${act.length?esc(act.join(" · ")):"—"}</strong></div><div class="role-row"><span>🟡 Dormant (6–24 mo)</span><strong>${dor.length?esc(dor.join(" · ")):"—"}</strong></div><div class="role-row"><span>🔴 Stale / no evidence</span><strong>${st.length?esc(st.join(" · ")):"—"}</strong></div>`;
  $("microList").innerHTML = A.micros.map((m,i)=>`<div class="micro"><div class="n">${i+1}</div><div><strong>Fix “${esc(m.gap)}”</strong> <span class="muted" style="font-size:12.5px">· ${esc(m.time)}</span><p style="margin:6px 0 0;font-size:14px">${m.task}</p></div></div>`).join("");
  $("dLimit").innerHTML = `<strong>Scope &amp; limits:</strong> ${A.analyzed} repos scanned in depth from ${A.totalRepos} public repos · live GitHub data, re-run anytime for fresh results · commits suggest contribution but never prove authorship.`;
  animateRing("ringFg","matchNum",A.match.pct);
  playIn("dashBody");
}
function teamwork(c){
  const s = c.pr*2 + c.reviews*2 + c.issues + c.pushes*0.1;
  const lvl = s>=15?"High":s>=6?"Medium":"Low";
  return `<div class="notice" style="margin-bottom:0"><strong>Teamwork signal: ${lvl}.</strong> From public PRs, reviews and issue activity.</div>`;
}
function renderRecruiter(){
  if (!ANALYSIS || ANALYSIS.mode!=="recruiter") { $("rDashBody").hidden = true; emptyState("rDashEmpty","No screening yet","Run a screening from the start form in Recruiter mode and it will appear here.","Screen a candidate"); return; }
  $("rDashEmpty").innerHTML = ""; $("rDashBody").hidden = false;
  const A = ANALYSIS;
  $("rName").textContent = `${A.name} — screening`;
  $("rMeta").textContent = `Target: ${A.target} · @${A.username} · ${A.analyzed} repos scanned · ${A.date}`;
  const v = A.match.pct>=70?["Strong","Solid proven core — verify gaps in interview."]:A.match.pct>=45?["Moderate","Hireable for junior scope — probe the red flags below."]:["Weak","Evidence does not yet support this role — see gaps."];
  $("rVerdict").textContent = `${v[0]} · ${A.match.pct}%`; $("rVerdictSub").textContent = v[1];
  const flags = [...A.skills].sort((a,b)=>(a.status==="claimed"?0:a.status==="partial"?1:2)-(b.status==="claimed"?0:b.status==="partial"?1:2));
  const red = flags.filter(s=>s.status==="claimed").slice(0,1), amb = flags.filter(s=>s.status==="partial").slice(0,1), grn = flags.filter(s=>s.status==="proven").slice(0,1);
  const card = s => s ? `<div>${s.status==="proven"?'<span class="badge b-proven">✓ PROVEN</span>':s.status==="partial"?'<span class="badge b-partial">◐ PARTIAL</span>':'<span class="badge b-claimed">✕ CLAIMED-ONLY</span>'} <strong>${esc(s.name)}</strong><br/><small>${s.status==="proven"?"Proven · hire-ready":s.status==="partial"?"Partial · thin evidence":"Claimed-only · no code found"}</small></div>` : `<div><small class="muted">—</small></div>`;
  $("riskBox").innerHTML = card(grn[0]) + card(amb[0]) + card(red[0]);
  const bd = {proven:A.match.rows.filter(r=>r.status==="proven"), partial:A.match.rows.filter(r=>r.status==="partial"), rest:A.match.rows.filter(r=>r.status!=="proven"&&r.status!=="partial")};
  $("rBreakdown").innerHTML =
    `<div class="role-row"><span>✓ Proven</span><strong>${bd.proven.length?esc(bd.proven.map(r=>r.name).join(" · ")):"—"}</strong></div>`+
    `<div class="role-row"><span>◐ Partial</span><strong>${bd.partial.length?esc(bd.partial.map(r=>r.name).join(" · ")):"—"}</strong></div>`+
    `<div class="role-row"><span>✕ Missing / claimed-only</span><strong>${bd.rest.length?esc(bd.rest.map(r=>r.name).join(" · ")):"—"}</strong></div>`;
  renderSkillsInto("skillColsR", A.skills);
  $("intQs").innerHTML = A.questions.map(q=>`<li>${q}</li>`).join("");
  $("rLimit").innerHTML = `<strong>Scope:</strong> live public GitHub evidence only · resume claims parsed from the provided PDF · private notes stay in this browser and never alter any report.`;
  loadReview();
  animateRing("ringFg2","matchNum2",A.match.pct);
  playIn("rDashBody");
}

/* Logout everywhere: session + report + every form field wiped, so the next role starts empty */
const commitCache = {};
function clearServiceForm(){
  ["uName","uGithub","uToken","uSkills","uJd"].forEach(id=>{ const el=$(id); if(el) el.value=""; });
  const f = $("uResume"); if (f) f.value = "";
  if ($("uDropLabel")) $("uDropLabel").textContent = "Drop PDF here or browse";
  document.querySelectorAll("#uForm .chip").forEach(x=>x.setAttribute("aria-pressed","false"));
  if ($("uErr")) $("uErr").hidden = true;
}
function doLogout(){
  try { localStorage.removeItem(userKey); } catch {}
  ANALYSIS = null; renderedFor = 0;
  Object.keys(commitCache).forEach(k=>delete commitCache[k]);
  clearServiceForm();
  renderAuth();
  location.hash = "#/";
}
async function openProof(name){
  if (!ANALYSIS) return;
  const s = ANALYSIS.skills.concat(ANALYSIS.hidden).find(x=>x.name===name);
  if (!s) return;
  const b = $("proofBadge");
  b.className = "badge " + (s.status==="proven"?"b-proven":s.status==="partial"?"b-partial":"b-claimed");
  b.textContent = s.status==="proven"?"✓ PROVEN":s.status==="partial"?"◐ PARTIAL":"✕ CLAIMED-ONLY";
  $("proofTitle").textContent = s.name;
  $("proofSub").textContent = `Evidence ${s.score} · ${s.recency} · last used ${s.lastUsed}`;
  const graph = [`Skill: ${s.name}`,
    ...(s.reposEv[0]?[`Repo: ${s.reposEv[0].full}`, `Files: ${(s.reposEv[0].paths.slice(0,3).join(" · ")||"language/detector match")}`, `Activity: last push ${ago(s.reposEv[0].push)}`]:["No repository evidence found"]),
    s.reposEv[0]?`Signals: ${s.reposEv.length} repo${s.reposEv.length>1?"s":""} · ${s.files} file hits`:"Result: resume claim only (+1)"];
  $("proofBody").innerHTML = `
    <div class="kv"><div><small>Repositories</small><strong>${s.repos}</strong></div><div><small>File hits</small><strong>${s.files}</strong></div>
    <div><small>Last activity</small><strong>${esc(s.lastUsed)}</strong></div><div><small>Strength</small><strong>${esc(s.score)}</strong></div></div>
    <h3 class="mini">Evidence graph</h3>
    <div class="tree">${graph.map((g,i)=> i===0?`<div><strong>${esc(g)}</strong></div>`:`<div class="lvl" style="margin-top:6px">${esc(g)}</div>`).join("")}</div>
    <h3 class="mini" style="margin-top:16px">Source evidence (live)</h3>
    <div id="proofRepos">${s.reposEv.length ? s.reposEv.slice(0,4).map(r=>`<div class="repo"><strong class="mono" style="font-size:12.5px">${esc(r.full)}</strong><br/><small class="muted">pushed ${ago(r.push)}${r.langBytes?` · ${(r.langBytes/1024).toFixed(1)} KB`:``}</small>${r.paths.length?`<br/><span class="commit mono">${r.paths.map(esc).join("<br/>")}</span>`:""}</div>`).join("") : `<div class="alert-warn">No supporting repository evidence found in the ${ANALYSIS.analyzed} scanned repos. Only the resume claim (+1) counted.</div>`}</div>
    <div id="proofCommits"><p class="muted" style="font-size:13px">Loading latest commits…</p></div>
    <div class="limit"><strong>How to read this:</strong> rule-based signals from live public code. They suggest contribution — they don&rsquo;t prove authorship.</div>`;
  $("overlay").classList.add("open");
  const p = $("proofPanel"); p.classList.add("open"); p.setAttribute("aria-hidden","false");
  $("proofClose").focus();
  // lazy commits for top repo
  const top = s.reposEv[0];
  const cc = $("proofCommits");
  if (!top) { cc.innerHTML = ""; return; }
  try {
    if (!commitCache[top.full]) commitCache[top.full] = await gh(`/repos/${top.full}/commits?per_page=3`, ANALYSIS.token).catch(()=>null);
    const cs = commitCache[top.full];
    cc.innerHTML = cs && cs.length ? `<h3 class="mini">Latest commits · <span class="mono">${esc(top.full)}</span></h3>` + cs.map(c=>`<div class="repo"><span class="commit mono">${esc((c.sha||"").slice(0,7))} · ${ago(c.commit?.author?.date)} — ${esc(c.commit?.message?.split("\n")[0]||"")}</span><br/><small class="muted">by ${esc(c.commit?.author?.name||"unknown")}</small></div>`).join("") : `<p class="muted" style="font-size:13px">Commit history unavailable for this repo.</p>`;
  } catch { cc.innerHTML = `<p class="muted" style="font-size:13px">Commit history unavailable (rate limit).</p>`; }
}
function closeProof(){ $("overlay").classList.remove("open"); const p=$("proofPanel"); p.classList.remove("open"); p.setAttribute("aria-hidden","true"); }
$("proofClose").addEventListener("click",closeProof);
$("overlay").addEventListener("click",closeProof);
document.addEventListener("keydown",e=>{ if(e.key==="Escape") closeProof(); });

/* Animated navbar tabs: sliding pill follows hover, rests on active */
function placePill(target){
  const nav = $("mainNav"), pill = $("navPill");
  if (!nav || !pill) return;
  const el = target || nav.querySelector("a.active");
  nav.querySelectorAll("a").forEach(a=>a.classList.toggle("lit", a === el));
  if (!el) { pill.style.opacity = 0; return; }
  const nr = nav.getBoundingClientRect(), r = el.getBoundingClientRect();
  pill.style.width = r.width + "px";
  pill.style.transform = `translate(${r.left - nr.left}px,-50%)`;
  pill.style.opacity = 1;
}
(function(){
  const nav = $("mainNav");
  if (!nav) return;
  nav.querySelectorAll("a").forEach(a=>a.addEventListener("mouseenter", ()=>placePill(a)));
  nav.addEventListener("mouseleave", ()=>placePill());
  window.addEventListener("resize", ()=>placePill());
})();

/* ---------- Router (service area is gated behind login) ---------- */
const pages = ["home","login","service","analyzing","dashboard","rresults"];
const gated = ["service","analyzing","dashboard","rresults"];
function route(){
  const h = location.hash.replace("#/","") || "";
  let target = pages.includes(h.split("?")[0]) ? h.split("?")[0] : "home";
  if (gated.includes(target) && !currentUser()) {
    if (target !== "login") { location.hash = "#/login"; return; }
    target = "login";
  }
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  $("page-"+target).classList.add("active");
  document.body.classList.toggle("landing", target==="home");
  document.body.classList.toggle("creamnav", target!=="home");
  renderAuth();
  document.querySelectorAll("[data-nav]").forEach(a=>{
    a.classList.toggle("active", target==="home" && a.getAttribute("data-nav")==="home");
  });
  placePill();
  window.scrollTo({top:0});
  if (target==="service") {
    const u = currentUser();
    if ($("svcEmail")) $("svcEmail").textContent = u ? `Signed in as ${u.email}` : "";
    setMode((u && u.role === "recruiter") ? "recruiter" : "seeker");
  }
  if (target==="login" && pendingRole) { loginRole = pendingRole; pendingRole = null; paintLiSeg(); }
  if (target==="dashboard" && ANALYSIS?.v !== renderedFor) { renderedFor = ANALYSIS?.v||0; renderDashboard(); }
  if (target==="dashboard" && !ANALYSIS) renderDashboard();
  if (target==="rresults") renderRecruiter();
}
window.addEventListener("hashchange", route);

/* Go to the service form (login gate in route() handles the rest) */
let pendingRole = null;
function gotoService(){ location.hash = "#/service"; }
document.addEventListener("click", e=>{
  const g = e.target.closest("[data-goto-start]");
  if (g) { e.preventDefault(); gotoService(); return; }
  const d = e.target.closest("[data-start]");
  if (d) {
    e.preventDefault();
    const m = d.getAttribute("data-start");
    if (currentUser()) { setMode(m); gotoService(); }
    else { pendingRole = m; location.hash = "#/login"; }
  }
});

/* ---------- Role: chosen once at login, service renders only that role ---------- */
let uMode = "seeker";
let loginRole = "seeker";
function paintLiSeg(){
  document.querySelectorAll("#liDock .lidock-item").forEach(b=>b.setAttribute("aria-pressed", String(b.dataset.mode===loginRole)));
}
document.querySelectorAll("#liDock .lidock-item").forEach(b=>b.addEventListener("click",()=>{ loginRole = b.dataset.mode; paintLiSeg(); }));
function setMode(m){
  uMode = (m === "recruiter") ? "recruiter" : "seeker";
  const rec = uMode === "recruiter";
  const pg = $("page-service");
  if (pg) { pg.classList.toggle("role-rec", rec); pg.classList.toggle("role-seek", !rec); }
  if ($("svcRole")) $("svcRole").textContent = rec ? "Recruiter workspace" : "Student workspace";
  if ($("uNameLabel")) $("uNameLabel").textContent = rec ? "Candidate name" : "Your name";
  if ($("uName")) $("uName").placeholder = rec ? "Candidate name" : "e.g. Ayushi Labde";
  if ($("startSub")) $("startSub").textContent = rec
    ? "Recruiter mode: proof links, risk flags and interview questions — not keyword matches."
    : "Student mode: verify yourself against a real job and get tasks to close gaps.";
  if ($("uSubmit")) $("uSubmit").textContent = rec ? "Generate screening report →" : "Verify my skills →";
  const fair = $("svcFair");
  if (fair) fair.hidden = !rec;
}
document.querySelectorAll("#uForm .chip").forEach(c=>c.addEventListener("click",()=>{
  document.querySelectorAll("#uForm .chip").forEach(x=>x.setAttribute("aria-pressed","false"));
  c.setAttribute("aria-pressed","true");
  $("uJd").value = c.dataset.role;
}));
function wireDrop(zoneId, fileId, labelId){
  const z=$(zoneId), f=$(fileId);
  if(!z||!f) return;
  z.addEventListener("click",()=>f.click());
  z.addEventListener("keydown",e=>{ if(e.key==="Enter") f.click(); });
  f.addEventListener("change",()=>{ if(f.files[0]) $(labelId).textContent = "✓ "+f.files[0].name+" attached"; });
}
wireDrop("uDrop","uResume","uDropLabel");
function showErr(id,msg){ const e=$(id); e.innerHTML=msg; e.hidden=false; }
$("uForm").addEventListener("submit",e=>{
  e.preventDefault(); $("uErr").hidden = true;
  const username = normalizeGithub($("uGithub").value);
  const jd = $("uJd").value.trim();
  if (!username) return showErr("uErr","Enter a GitHub username — just <span class='mono'>ayv12</span>, or paste the full profile URL, both work.");
  if (!/^[A-Za-z0-9-]{1,39}$/.test(username)) return showErr("uErr",`“${esc($("uGithub").value.trim())}” doesn't look like a GitHub username. Use only the username part, e.g. <span class="mono">ayv12</span>.`);
  if (!$("uResume").files[0] && !$("uSkills").value.trim()) return showErr("uErr","Upload the resume PDF or paste skills — one of the two is needed.");
  if (!jd) return showErr("uErr","Paste the job description or tap a role preset.");
  const name = $("uName").value.trim() || username;
  runPipeline({mode:uMode, name, username, token:$("uToken").value.trim(),
    resumeFile:$("uResume").files[0]||null, manualSkills:$("uSkills").value, jdText:jd});
});
/* Standalone login page: sign in, then enter the service */
$("liForm")?.addEventListener("submit",e=>{
  e.preventDefault();
  const email = $("liEmail").value.trim(), pass = $("liPass").value;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { $("liErr").textContent = "Enter a valid email address."; $("liErr").hidden = false; return; }
  if (pass.length < 4) { $("liErr").textContent = "Password needs at least 4 characters (demo only)."; $("liErr").hidden = false; return; }
  $("liErr").hidden = true;
  try { localStorage.setItem(userKey, JSON.stringify({email, name:email.split("@")[0], role:loginRole, ts:Date.now()})); } catch {}
  renderAuth();
  location.hash = "#/service";
});
$("svcLogout")?.addEventListener("click",()=>doLogout());
/* ---------- Private review notes: localStorage, per candidate (browser-only) ---------- */
const reviewKey = u => `skillproof_review_${String(u||"").toLowerCase()}`;
function storeGet(k){ try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
function storeSet(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } }
function loadReview(){
  const saved = ANALYSIS && storeGet(reviewKey(ANALYSIS.username));
  if (saved) {
    $("reviewStatus").value = saved.status || "Not reviewed";
    $("reviewNotes").value = saved.notes || "";
    $("notesStore").textContent = `Stored only in this browser · last saved ${saved.ts||"earlier"}. Clearing browser data deletes it — nothing is sent anywhere.`;
  } else {
    $("reviewStatus").value = "Not reviewed"; $("reviewNotes").value = "";
    $("notesStore").textContent = "No saved notes for this candidate yet. They are stored only in this browser — nothing is sent anywhere.";
  }
  $("savedMsg").textContent = "";
}
$("saveReview")?.addEventListener("click",()=>{
  if (!ANALYSIS) return;
  const data = {status:$("reviewStatus").value, notes:$("reviewNotes").value, ts:new Date().toLocaleString()};
  if (storeSet(reviewKey(ANALYSIS.username), data)) {
    $("savedMsg").textContent = "✓ Saved in this browser";
    $("notesStore").textContent = `Stored only in this browser · last saved ${data.ts}. Clearing browser data deletes it — nothing is sent anywhere.`;
  } else {
    $("savedMsg").textContent = "Couldn't save (browser storage blocked)";
  }
  setTimeout(()=>{ $("savedMsg").textContent=""; },2500);
});
$("clearReview")?.addEventListener("click",()=>{
  if (!ANALYSIS) return;
  try { localStorage.removeItem(reviewKey(ANALYSIS.username)); } catch {}
  loadReview();
});
/* Download report → system print dialog (Save as PDF), print CSS isolates the report */
$("dlReport")?.addEventListener("click",()=>window.print());
$("dlReportR")?.addEventListener("click",()=>window.print());

/* ---------- Landing motion: scroll reveals + count-up ---------- */
let showDone = false;
function countShow(){
  if (showDone) return; showDone = true;
  const el = $("showPct"); if(!el) return;
  let t0 = null;
  (function f(t){ if(!t0)t0=t; const p=Math.min((t-t0)/1400,1);
    el.textContent = Math.round(72*(1-Math.pow(1-p,3)));
    if(p<1) requestAnimationFrame(f); })(performance.now());
}
/* Per-character headline fade (TextEffect-style, vanilla — no library needed) */
(function(){
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let n = 0;
  document.querySelectorAll(".apple-hero h1 .hl, .apple-hero h1 .u").forEach(line=>{
    const text = line.textContent;
    line.textContent = "";
    [...text].forEach(ch=>{
      const s = document.createElement("span");
      s.className = "ch";
      s.textContent = ch === " " ? " " : ch;
      s.style.setProperty("--d", (n++ * 24) + "ms");
      line.appendChild(s);
    });
  });
})();

/* macOS dock magnification (vanilla) */
(function(){
  if (!window.matchMedia("(pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  ["dock","liDock"].forEach(id=>{
    const dock = $(id);
    if (!dock) return;
    const items = [...dock.querySelectorAll(".dock-icon")];
    dock.addEventListener("mousemove", e=>{
      items.forEach(el=>{
        const r = el.getBoundingClientRect();
        const d = Math.abs(e.clientX - (r.left + r.width/2));
        const s = 1 + .55 * Math.max(0, 1 - d/110);
        el.style.transform = `scale(${s.toFixed(3)}) translateY(${(-(s-1)*16).toFixed(1)}px)`;
      });
    });
    dock.addEventListener("mouseleave", ()=>items.forEach(el=>{ el.style.transform = ""; }));
  });
})();

/* Demo auth (localStorage only — no backend; sign-in lives in the start form) */
const userKey = "skillproof_user";
function currentUser(){ try { return JSON.parse(localStorage.getItem(userKey)); } catch { return null; } }
function renderAuth(){
  const zone = $("authZone"); if(!zone) return;
  const u = currentUser();
  zone.innerHTML = u
    ? `<button class="user-chip" id="logoutBtn" title="Log out (${esc(u.email)})">${esc((u.name||"U").charAt(0).toUpperCase())}</button>`
    : `<a href="#/login">Log in</a>`;
  $("logoutBtn")?.addEventListener("click",()=>doLogout());
  placePill();
}
/* Hover carousel: hover/click opens a card, otherwise it auto-cycles */
(function(){
  const cards = [...document.querySelectorAll(".vcard")];
  if (!cards.length) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let i = 0, timer = null;
  function hot(n){ i = n; cards.forEach((c,k)=>c.classList.toggle("hot", k===n)); }
  function auto(){ if (reduced) return; timer = setInterval(()=>{ hot((i+1)%cards.length); }, 4000); }
  cards.forEach((c,n)=>{
    c.addEventListener("mouseenter", ()=>{ clearInterval(timer); hot(n); });
    c.addEventListener("focus", ()=>{ clearInterval(timer); hot(n); });
    c.addEventListener("click", ()=>hot(n));
  });
  document.querySelector(".vcarousel")?.addEventListener("mouseleave", ()=>{ clearInterval(timer); auto(); });
  auto();
})();

document.body.classList.add("anim"); // enables gated reveal states (no-JS keeps content visible)
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(es=>es.forEach(e=>{
    if (e.isIntersecting) {
      e.target.classList.add("in");
      if (e.target.id === "showcase") countShow();
      io.unobserve(e.target);
    }
  }),{threshold:.18});
  document.querySelectorAll(".reveal").forEach(el=>{ if(el.id!=="showcase" || !window.gsap) io.observe(el); });
} else {
  document.querySelectorAll(".reveal").forEach(el=>el.classList.add("in"));
  countShow();
}

/* Cinematic scroll layer (GSAP + ScrollTrigger, guarded — IO covers fallback) */
(function(){
  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  gsap.registerPlugin(ScrollTrigger);
  // Showcase headline sharpens with scroll position (cinematic focus pull)
  gsap.fromTo(".show-title", {opacity:.25, filter:"blur(8px)", scale:.985},
    {opacity:1, filter:"blur(0px)", scale:1, ease:"none",
    scrollTrigger:{trigger:"#showcase", start:"top 85%", end:"top 35%", scrub:true,
      onEnter:()=>countShow(), onEnterBack:()=>countShow()}});
})();

route();
