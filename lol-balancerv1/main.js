const MAX_PLAYERS = 10;
const STORAGE_KEY = 'lol_balancer_v1';
const ROLES = ['top','jungle','mid','adc','support'];

let players = []; 
document.getElementById('maxPlayersSpan').textContent = MAX_PLAYERS;
document.getElementById('currentCount').textContent = 0;

// helpers
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(players)); document.getElementById('currentCount').textContent = players.length; }
function load() { const raw = localStorage.getItem(STORAGE_KEY); players = raw ? JSON.parse(raw) : []; document.getElementById('currentCount').textContent = players.length; }
function resetAll(){ players = []; save(); renderPlayers(); renderResult(null); }
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m])); }


const themeToggle = document.getElementById("themeToggle");

// Charger préférence utilisateur
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
  themeToggle.textContent = "☀️";
}

// Toggle mode
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  // Met à jour l’icône
  if (document.body.classList.contains("dark-mode")) {
    themeToggle.textContent = "☀️";
    localStorage.setItem("theme", "dark");
  } else {
    themeToggle.textContent = "🌙";
    localStorage.setItem("theme", "light");
  }
});

const form = document.getElementById('playerForm');
form.addEventListener('submit', e => {
  e.preventDefault();
  if (players.length >= MAX_PLAYERS) return alert('Nombre max de joueurs atteint');
  const name = document.getElementById('inpPseudo').value.trim();
  if (!name) return;
  const p = {
    id: uid(),
    name,
    roles: {
      top: Number(document.getElementById('sTop').value||0),
      jungle: Number(document.getElementById('sJungle').value||0),
      mid: Number(document.getElementById('sMid').value||0),
      adc: Number(document.getElementById('sAdc').value||0),
      support: Number(document.getElementById('sSup').value||0)
    },
    prefs: [ document.getElementById('pref1').value || null, document.getElementById('pref2').value || null ],
    assignedRole: null,
    avatarUrl: document.getElementById('avatarUrl').value.trim() || null
  };
  players.push(p); save(); form.reset();
  // reset numbers
  document.getElementById('sTop').value = 50; document.getElementById('sJungle').value = 50;
  document.getElementById('sMid').value = 50; document.getElementById('sAdc').value = 50; document.getElementById('sSup').value = 50;
  document.getElementById('avatarUrl').value = '';
  renderPlayers();
});

// render players
function renderPlayers(){
  const c = document.getElementById('playersContainer');
  c.innerHTML = '';
  if (players.length === 0) { c.innerHTML = '<div class="empty">Aucun joueur</div>'; return; }
  players.forEach((p, idx) => {
    const div = document.createElement('div'); div.className = 'player';
    div.innerHTML = `
      <div class="avatar">${p.avatarUrl ? `<img src="${escapeHtml(p.avatarUrl)}" alt="${escapeHtml(p.name)}">` : `<svg width="38" height="38" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="#0b1220"></rect><text x="50%" y="55%" text-anchor="middle" font-size="10" fill="#9fb0d6" font-family="Arial">${escapeHtml(String(p.name).charAt(0).toUpperCase())}</text></svg>`}</div>
      <div class="meta">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="badge">${idx+1}</div>
          <div>
            <div style="font-weight:700">${escapeHtml(p.name)}</div>
            <div class="small">prefs: ${(p.prefs.filter(Boolean).join(' • ') || '—')}</div>
          </div>
        </div>
      </div>
      <div class="kv">Top: ${p.roles.top}</div>
      <div class="kv">Jng: ${p.roles.jungle}</div>
      <div class="kv">Mid: ${p.roles.mid}</div>
      <div class="kv">ADC: ${p.roles.adc}</div>
      <div class="kv">Sup: ${p.roles.support}</div>
      <div>
        <label>Rôle attribué:
          <select class="roleSelect" data-id="${p.id}">
            <option value="">— auto —</option>
            ${ROLES.map(r => `<option value="${r}" ${p.assignedRole===r ? 'selected':''}>${r}</option>`).join('')}
          </select>
        </label>
      </div>
      <div style="margin-left:auto;display:flex;gap:8px">
        <button data-action="avatar" data-id="${p.id}" class="btn ghost">Set avatar</button>
        <button data-action="edit" data-id="${p.id}" class="btn ghost">Modifier</button>
        <button data-action="del" data-id="${p.id}" class="btn danger">Suppr</button>
      </div>
    `;
    c.appendChild(div);
  });

  // listeners
  c.querySelectorAll('select.roleSelect').forEach(sel=>{
    sel.addEventListener('change', ()=> {
      const id = sel.dataset.id; const pl = players.find(x=>x.id===id); pl.assignedRole = sel.value || null; save();
    });
  });
  c.querySelectorAll('button[data-action="del"]').forEach(b=>{
    b.addEventListener('click', ()=> { const id = b.dataset.id; players = players.filter(x=>x.id!==id); save(); renderPlayers(); });
  });
  c.querySelectorAll('button[data-action="edit"]').forEach(b=>{
    b.addEventListener('click', ()=> {
      const id = b.dataset.id; const pl = players.find(x=>x.id===id);
      const newName = prompt('Pseudo', pl.name); if (!newName) return;
      pl.name = newName.trim();
      // optionnel: edit avatar
      const newAvatar = prompt('Avatar URL (laisser vide = inchangé)', pl.avatarUrl||'') ;
      if (newAvatar !== null) pl.avatarUrl = newAvatar.trim() || null;
      save(); renderPlayers();
    });
  });
  c.querySelectorAll('button[data-action="avatar"]').forEach(b=>{
    b.addEventListener('click', ()=> {
      const id = b.dataset.id; const pl = players.find(x=>x.id===id);
      const url = prompt('Colle une URL d\'avatar (image) pour ' + pl.name, pl.avatarUrl||'');
      if (url === null) return;
      pl.avatarUrl = url.trim() || null; save(); renderPlayers();
    });
  });
}

// autoAssignRoles (pref1, pref2, autofill) meme logique qu'avant
function autoAssignRoles(){
  const needEach = Math.floor(MAX_PLAYERS / ROLES.length);
  const targetCount = {}; ROLES.forEach(r=> targetCount[r]=needEach);
  players.forEach(p=>p.assignedRole=null);

  ROLES.forEach(role=>{
    const candidates = players.filter(p=>p.prefs[0]===role && !p.assignedRole);
    candidates.sort((a,b)=> b.roles[role] - a.roles[role]);
    for (const c of candidates) { if (targetCount[role]>0){ c.assignedRole=role; targetCount[role]--; } }
  });

  ROLES.forEach(role=>{
    const candidates = players.filter(p=>p.prefs[1]===role && !p.assignedRole);
    candidates.sort((a,b)=> b.roles[role] - a.roles[role]);
    for (const c of candidates) { if (targetCount[role]>0){ c.assignedRole=role; targetCount[role]--; } }
  });

  for (const role of ROLES) {
    while (targetCount[role] > 0) {
      const cand = players.filter(p=>!p.assignedRole).sort((a,b)=> b.roles[role] - a.roles[role])[0];
      if (!cand) break; cand.assignedRole = role; targetCount[role]--;
    }
  }

  players.filter(p=>!p.assignedRole).forEach(p=>{ const bestRole = ROLES.slice().sort((a,b)=> p.roles[b]-p.roles[a])[0]; p.assignedRole = bestRole; });
  save(); renderPlayers();
}

// generateTeams avec pairing en prio
function generateTeams(){
  if (players.length !== MAX_PLAYERS) return alert(`Il faut exactement ${MAX_PLAYERS} joueurs pour générer`);
  const unassigned = players.filter(p=>!p.assignedRole);
  if (unassigned.length > 0){
    if (!confirm('Certains joueurs n\'ont pas de rôle attribué. Continuer (les rôles seront forcés automatiquement) ?')) return;
    autoAssignRoles();
  }

  const pList = players.map(p=> ({...p, finalScore: p.roles[p.assignedRole]}));
  const indices = [...Array(pList.length).keys()]; const half = pList.length / 2;
  const combs = combinations(indices, half);

  let best = null;
  for (const c of combs){
    const teamA = c.map(i=> pList[i]);
    const teamB = indices.filter(i=> !c.includes(i)).map(i=> pList[i]);
    if (!validTeamRoles(teamA) || !validTeamRoles(teamB)) continue;
    const sA = teamA.reduce((a,b)=> a + (b.finalScore||0), 0);
    const sB = teamB.reduce((a,b)=> a + (b.finalScore||0), 0);
    const totalDiff = Math.abs(sA - sB);
    let pairDiff = 0; let validPairing = true;
    for (const role of ROLES){
      const pa = teamA.find(x=> x.assignedRole === role);
      const pb = teamB.find(x=> x.assignedRole === role);
      if (!pa || !pb) { validPairing=false; break; }
      pairDiff += Math.abs((pa.finalScore||0) - (pb.finalScore||0));
    }
    if (!validPairing) continue;
    if (best === null || pairDiff < best.pairDiff || (pairDiff === best.pairDiff && totalDiff < best.diff)) {
      best = { teamA, teamB, sA, sB, diff: totalDiff, pairDiff };
    }
  }

  if (!best) { alert('Aucune répartition valide trouvée.'); return; }
  renderResultWithPairing(best);
}

// helpers utilisés avant
function validTeamRoles(team){ const roles = team.map(p=>p.assignedRole); return ROLES.every(r => roles.filter(x=>x===r).length === 1); }
function combinations(arr,k){ const res=[]; (function helper(start,combo){ if (combo.length===k){ res.push(combo.slice()); return; } for(let i=start;i<arr.length;i++){ combo.push(arr[i]); helper(i+1,combo); combo.pop(); } })(0,[]); return res; }

// renderers
function renderResultWithPairing(best){
  const el = document.getElementById('resultArea'); if (!best){ el.innerHTML = '<div class="empty">Aucune équipe générée</div>'; return; }
  const perRole = ROLES.map(role=>{
    const a = best.teamA.find(p=>p.assignedRole===role);
    const b = best.teamB.find(p=>p.assignedRole===role);
    return { role, a: a.name, b: b.name, av: a.finalScore, bv: b.finalScore, diff: Math.abs(a.finalScore - b.finalScore) };
  });

  // html avec avatar pour chaque joueur and un placeholder pour role-champion 
  el.innerHTML = `
    <div class="resultTeams">
      <div class="team">
        <h3>Équipe 1 — total: ${best.sA}</h3>
        <ul>
          ${best.teamA.map(p=>`<li>
            <div style="width:36px;height:36px;border-radius:8px;overflow:hidden;margin-right:8px">${p.avatarUrl ? `<img src="${escapeHtml(p.avatarUrl)}" style="width:36px;height:36px;object-fit:cover">` : `<div class="roleIcon">${escapeHtml(p.assignedRole.charAt(0).toUpperCase())}</div>`}</div>
            <div><strong>${escapeHtml(p.name)}</strong><div class="small">${p.assignedRole} — ${p.finalScore}</div></div>
          </li>`).join('')}
        </ul>
      </div>
      <div class="team">
        <h3>Équipe 2 — total: ${best.sB}</h3>
        <ul>
          ${best.teamB.map(p=>`<li>
            <div style="width:36px;height:36px;border-radius:8px;overflow:hidden;margin-right:8px">${p.avatarUrl ? `<img src="${escapeHtml(p.avatarUrl)}" style="width:36px;height:36px;object-fit:cover">` : `<div class="roleIcon">${escapeHtml(p.assignedRole.charAt(0).toUpperCase())}</div>`}</div>
            <div><strong>${escapeHtml(p.name)}</strong><div class="small">${p.assignedRole} — ${p.finalScore}</div></div>
          </li>`).join('')}
        </ul>
      </div>
    </div>
    <div class="small" style="margin-top:10px">Diff équipes: ${best.diff} — Somme écarts vis-à-vis: ${best.pairDiff}</div>
    <div style="margin-top:8px"><strong>Détails par rôle (A vs B)</strong>
      <ul>${perRole.map(r=>`<li>${r.role}: ${escapeHtml(r.a)}(${r.av}) — ${escapeHtml(r.b)}(${r.bv}) → écart ${r.diff}</li>`).join('')}</ul>
    </div>
  `;
}

// renderResult alias and champ vide
function renderResult(best){ const el=document.getElementById('resultArea'); if(!best){ el.innerHTML = '<div class="empty">Aucune équipe générée</div>'; } else { renderResultWithPairing(best);} }

// fonction export / import 
function exportJson(){ const data = JSON.stringify({players, MAX_PLAYERS, ROLES, ts: new Date().toISOString()}, null, 2); const blob = new Blob([data], {type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='lol_balancer_export.json'; a.click(); }

function importJsonFile(file){
  const reader = new FileReader();
  reader.onload = ()=> {
    try {
      const obj = JSON.parse(reader.result);
      if (!obj.players) return alert('Fichier invalide');
      players = obj.players.slice(0, MAX_PLAYERS);
      save(); renderPlayers(); renderResult(null); alert('Import OK');
    } catch(e){ alert('Import failed: ' + e.message); }
  };
  reader.readAsText(file);
}

//  boutons
document.getElementById('btnAssign').addEventListener('click', ()=>{ autoAssignRoles(); alert('Rôles assignés (tu peux modifier manuellement si besoin)'); });
document.getElementById('btnGenerate').addEventListener('click', ()=>{ generateTeams(); });
document.getElementById('btnReset').addEventListener('click', ()=>{ if(confirm('Tout supprimer ?')) resetAll(); });
document.getElementById('btnExport').addEventListener('click', exportJson);
document.getElementById('btnImport').addEventListener('click', ()=> document.getElementById('fileImport').click());
document.getElementById('fileImport').addEventListener('change', (ev)=> { const file = ev.target.files[0]; if (!file) return; importJsonFile(file); ev.target.value = ''; });

// petite aide
document.getElementById('btnClearInput').addEventListener('click', ()=> { form.reset(); document.getElementById('sTop').value=50; document.getElementById('sJungle').value=50; document.getElementById('sMid').value=50; document.getElementById('sAdc').value=50; document.getElementById('sSup').value=50; document.getElementById('avatarUrl').value=''; });

// chargement initial
load(); renderPlayers(); renderResult(null);

// aide rapide
document.getElementById('btnHelp').addEventListener('click', ()=> {
  alert('Ajoute 10 joueurs (pseudo + notes + prefs).Clique "Assigner rôles" puis Générer équipes. Tu peux "exporter/importer" le JSON. Clique sur un joueur puis "Set avatar" pour personnaliser l\'image.');
});
