const KEY = "pyPractice.v1";
const $ = id => document.getElementById(id);
let done = {};
try { done = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) {} };
const P = {
  l: { n: "LeetCode", u: s => `https://leetcode.com/problems/${s}/` },
  h: { n: "HackerRank", u: s => `https://www.hackerrank.com/challenges/${s}/problem` },
  c: { n: "CodeChef", u: s => `https://www.codechef.com/problems/${s}` },
  w: { n: "Codewars", u: s => `https://www.codewars.com/kata/${s}/train/python` }
};
const DL = { E: "Easy", M: "Medium", H: "Hard" }, SEC = ["Warm-up", "Patterns", "Core", "Challenge"];
const pretty = s => s.replace(/^py-/, "").split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");

function parse(raw, cid, sec) {
  return raw.trim().split(/\s+/).map(t => {
    const a = t.split(":"); let p = "l", k, d;
    if (a.length > 1 && a[0].length === 1 && P[a[0]]) { p = a[0]; k = a[1]; d = a[2]; } else { k = a[0]; d = a[1]; }
    const [key, title] = k.split("="); d = d || "E";
    return { id: `${cid}:${p}:${key}`, p, d, title: title ? title.replace(/_/g, " ") : pretty(key),
      sec: sec || { E: "Warm-up", M: "Core", H: "Challenge" }[d], url: P[p].u(key) };
  });
}
const seenAll = new Set();
DATA.forEach(c => {
  const all = [...parse(c.raw || "", c.id, ""), ...Object.entries(c.extra || {}).flatMap(([s, r]) => parse(r, c.id, s === "_" ? "" : s))];
  const seen = new Set();
  c.items = all.filter(i => { const g = i.id.slice(i.id.indexOf(":") + 1); if (seen.has(i.id) || seenAll.has(g)) return false; seen.add(i.id); return true; }).sort((a, b) => SEC.indexOf(a.sec) - SEC.indexOf(b.sec));
  c.items.forEach(i => seenAll.add(i.id.slice(i.id.indexOf(":") + 1)));
});

let cur = DATA[0].id, plat = "";
try { cur = localStorage.getItem(KEY + ".tab") || cur; } catch (e) {}
if (!DATA.some(c => c.id === cur)) cur = DATA[0].id;
const count = c => c.items.filter(i => done[i.id]).length;
const stage = () => DATA.find(c => c.id === cur);
const hue = c => DATA.indexOf(c) * 45 + 200;
const goStage = id => { cur = id; try { localStorage.setItem(KEY + ".tab", id); } catch (e) {} render(); };

function renderSide() {
  $("path").innerHTML = "";
  DATA.forEach((c, k) => {
    const n = count(c), b = document.createElement("button");
    b.className = "step" + (c.id === cur ? " active" : "") + (n === c.items.length ? " full" : "");
    b.style.setProperty("--th", hue(c));
    b.innerHTML = `<span class="dot" style="--p:${n / c.items.length * 100}">${n === c.items.length ? "✓" : k + 1}</span><span><b>${c.icon || "🐍"} ${c.name}</b><small>${n}/${c.items.length}</small></span>`;
    b.onclick = () => { goStage(c.id); window.scrollTo({ top: 0, behavior: "smooth" }); };
    $("path").appendChild(b);
  });
  const all = DATA.reduce((a, c) => a + c.items.length, 0), d = DATA.reduce((a, c) => a + count(c), 0);
  $("ring").style.setProperty("--p", d / all * 100);
  $("ringText").textContent = Math.round(d / all * 100) + "%";
  $("overallText").textContent = `${d} / ${all} solved`;
}

function renderHero(c) {
  const n = count(c), i = DATA.indexOf(c);
  $("builds").textContent = `Stage ${i + 1} of ${DATA.length} · ${c.builds}`;
  $("title").textContent = `${c.icon || "🐍"} ${c.name}`;
  $("desc").textContent = c.desc;
  $("stageBar").style.width = n / c.items.length * 100 + "%";
  $("stageText").textContent = `${n} of ${c.items.length} solved`;
  $("next").textContent = n === c.items.length ? "Next stage →" : "Continue →";
}

function renderChips() {
  $("chips").innerHTML = "";
  [["", "All"], ...Object.entries(P).map(([k, v]) => [k, v.n])].forEach(([k, n]) => {
    const b = document.createElement("button");
    b.className = "chip" + (plat === k ? " on" : "") + (k ? " p-" + k : "");
    b.textContent = n; b.onclick = () => { plat = k; renderChips(); renderList(); };
    $("chips").appendChild(b);
  });
}

function renderList() {
  const c = stage(); document.documentElement.style.setProperty("--h", hue(c));
  const q = $("search").value.toLowerCase(), lv = $("fDiff").value, st = $("fStat").value, box = $("sections");
  box.innerHTML = "";
  const g = {};
  c.items.filter(i => (!q || i.title.toLowerCase().includes(q)) && (!plat || i.p === plat) && (!lv || i.d === lv) &&
    (!st || (st === "done") === !!done[i.id])).forEach(i => (g[i.sec] = g[i.sec] || []).push(i));
  SEC.filter(s => g[s]).forEach(s => {
    const det = document.createElement("details"); det.open = true;
    det.innerHTML = `<summary><span>${{ "Warm-up": "🌱 Warm-up", Patterns: "🔺 Patterns", Core: "⚙️ Core", Challenge: "🔥 Challenge" }[s]}</span><small>${g[s].filter(i => done[i.id]).length}/${g[s].length}</small></summary><div class="grid"></div>`;
    g[s].forEach(i => {
      const el = document.createElement("div");
      el.className = "card" + (done[i.id] ? " done" : ""); el.dataset.id = i.id;
      el.innerHTML = `<button class="chk" aria-label="Mark solved"></button><a class="t" href="${i.url}" target="_blank" rel="noopener">${i.title}</a>
        <div class="meta"><span class="pl p-${i.p}">${P[i.p].n}</span><span class="lv d-${i.d}">${DL[i.d]}</span></div>`;
      el.onclick = e => {
        if (e.target.closest(".chk")) { done[i.id] ? delete done[i.id] : done[i.id] = 1; save(); render(); return; }
        if (e.target.closest("a") && (e.ctrlKey || e.metaKey || e.shiftKey)) return;
        e.preventDefault(); openProblem(i);
      };
      det.querySelector(".grid").appendChild(el);
    });
    box.appendChild(det);
  });
  if (!box.children.length) box.innerHTML = '<p class="empty">No problems match your filters.</p>';
}

$("next").onclick = () => {
  const c = stage(), nx = c.items.find(i => !done[i.id]);
  if (!nx) { const k = DATA.indexOf(c); if (k < DATA.length - 1) goStage(DATA[k + 1].id); return; }
  ["search", "fDiff", "fStat"].forEach(id => $(id).value = ""); plat = ""; renderChips(); renderList();
  const el = [...document.querySelectorAll(".card")].find(e => e.dataset.id === nx.id);
  if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.add("pulse"); setTimeout(() => el.classList.remove("pulse"), 1800); }
};

function openProblem(i) {
  const m = $("mode").value;
  if (m === "frame") {
    $("vtitle").textContent = i.title; $("vopen").href = i.url; $("vframe").src = i.url;
    $("viewer").hidden = false; document.body.classList.add("withViewer"); return;
  }
  if (m === "split") {
    const W = screen.availWidth, H = screen.availHeight, L = screen.availLeft || 0, T = screen.availTop || 0;
    const w = window.open(i.url, "problemWin", `popup=yes,width=${Math.round(W / 2)},height=${H},left=${L + Math.round(W / 2)},top=${T}`);
    if (w) { try { w.opener = null; w.focus(); } catch (e) {} return; }
  }
  window.open(i.url, "_blank", "noopener");
}
$("vclose").onclick = () => { $("viewer").hidden = true; $("vframe").src = "about:blank"; document.body.classList.remove("withViewer"); };
try { $("mode").value = localStorage.getItem(KEY + ".mode") || "split"; } catch (e) {}
$("mode").onchange = () => { try { localStorage.setItem(KEY + ".mode", $("mode").value); } catch (e) {} };

function render() { renderSide(); renderHero(stage()); renderList(); }
["search", "fDiff", "fStat"].forEach(id => $(id).addEventListener("input", renderList));
$("reset").onclick = () => { if (confirm("Reset all progress?")) { done = {}; save(); render(); } };
renderChips(); render();
