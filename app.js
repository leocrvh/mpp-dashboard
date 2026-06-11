/* ============================================
   MPP DASHBOARD — app.js
   Source matchs : openfootball/worldcup.json (aucune clé API requise)
   ============================================ */

// ---- CONFIG ----
const RANKING_STORAGE  = 'mpp_ranking';
const REFRESH_INTERVAL = 3 * 60 * 1000;
const COUNTDOWN_SECS   = 180;
const WC_JSON_URL      = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';

// ---- FLAGS ----
const FLAGS = {
  'Mexico': '🇲🇽', 'South Africa': '🇿🇦', 'South Korea': '🇰🇷', 'Korea Republic': '🇰🇷',
  'Czech Republic': '🇨🇿', 'Czechia': '🇨🇿', 'Canada': '🇨🇦',
  'Bosnia': '🇧🇦', 'Bosnia and Herzegovina': '🇧🇦', 'Bosnia & Herzegovina': '🇧🇦',
  'Qatar': '🇶🇦', 'Switzerland': '🇨🇭', 'Brazil': '🇧🇷', 'Morocco': '🇲🇦',
  'Haiti': '🇭🇹', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'USA': '🇺🇸', 'United States': '🇺🇸',
  'Paraguay': '🇵🇾', 'Australia': '🇦🇺', 'Germany': '🇩🇪', 'Curaçao': '🇨🇼',
  'Ivory Coast': '🇨🇮', "Côte d'Ivoire": '🇨🇮', 'Ecuador': '🇪🇨',
  'Netherlands': '🇳🇱', 'Japan': '🇯🇵', 'Tunisia': '🇹🇳', 'Belgium': '🇧🇪',
  'Egypt': '🇪🇬', 'Iran': '🇮🇷', 'New Zealand': '🇳🇿', 'Spain': '🇪🇸',
  'Cape Verde': '🇨🇻', 'Saudi Arabia': '🇸🇦', 'Uruguay': '🇺🇾',
  'France': '🇫🇷', 'Senegal': '🇸🇳', 'Iraq': '🇮🇶', 'Norway': '🇳🇴',
  'Argentina': '🇦🇷', 'Algeria': '🇩🇿', 'Austria': '🇦🇹', 'Jordan': '🇯🇴',
  'Portugal': '🇵🇹', 'DR Congo': '🇨🇩', 'Congo DR': '🇨🇩', 'Uzbekistan': '🇺🇿',
  'Colombia': '🇨🇴', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Croatia': '🇭🇷', 'Ghana': '🇬🇭',
  'Panama': '🇵🇦', 'Italy': '🇮🇹', 'Denmark': '🇩🇰', 'Poland': '🇵🇱',
  'Serbia': '🇷🇸', 'Turkey': '🇹🇷', 'Ukraine': '🇺🇦', 'Venezuela': '🇻🇪',
  'Chile': '🇨🇱', 'Peru': '🇵🇪', 'Honduras': '🇭🇳', 'Costa Rica': '🇨🇷',
  'Jamaica': '🇯🇲', 'Nigeria': '🇳🇬', 'Cameroon': '🇨🇲', 'Greece': '🇬🇷',
  'Indonesia': '🇮🇩', 'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'Sweden': '🇸🇪', 'Romania': '🇷🇴',
  'New Caledonia': '🇳🇨', 'Slovak Republic': '🇸🇰', 'Slovakia': '🇸🇰',
};

function getFlag(name) {
  if (!name) return '🏳️';
  // Direct match
  if (FLAGS[name]) return FLAGS[name];
  // Partial match
  for (const [key, flag] of Object.entries(FLAGS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return flag;
  }
  return '🏳️';
}

// ---- STATE ----
let currentTab     = 'recent';
let countdownValue = COUNTDOWN_SECS;
let countdownTimer = null;
let allMatches     = [];

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initRanking();
  loadMatches();
  startAutoRefresh();
  // Cacher la config bar — pas besoin de clé API
  document.getElementById('configBar').style.display = 'none';
});

// ---- CLOCK ----
function initClock() {
  function tick() {
    const now = new Date();
    const hh  = String(now.getHours()).padStart(2,'0');
    const mm  = String(now.getMinutes()).padStart(2,'0');
    document.getElementById('clock').textContent = `${hh}:${mm}`;
    const days   = ['Dim.','Lun.','Mar.','Mer.','Jeu.','Ven.','Sam.'];
    const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    const d = now;
    document.getElementById('dateDisplay').textContent =
      `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }
  tick();
  setInterval(tick, 1000);
}

// ---- AUTO-REFRESH ----
function startAutoRefresh() {
  countdownValue = COUNTDOWN_SECS;
  updateCountdown();
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    countdownValue--;
    updateCountdown();
    if (countdownValue <= 0) {
      countdownValue = COUNTDOWN_SECS;
      loadMatches(true);
    }
  }, 1000);
}

function updateCountdown() {
  const el = document.getElementById('countdown');
  if (el) el.textContent = countdownValue;
}

// ---- FETCH MATCHES ----
async function loadMatches(silent = false) {
  if (!silent) {
    document.getElementById('matchesContainer').innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <span>Chargement des matchs…</span>
      </div>`;
  }

  try {
    // Cache-busting léger pour GitHub raw
    const url = `${WC_JSON_URL}?t=${Math.floor(Date.now() / 60000)}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    allMatches = data.matches || [];
    updateLiveBadge();
    renderCurrentTab();
  } catch (err) {
    console.error('Erreur chargement matchs:', err);
    document.getElementById('matchesContainer').innerHTML = `
      <div class="error-state">
        <span style="font-size:2rem">⚠️</span>
        <span>Impossible de charger les matchs</span>
        <span style="font-size:0.75rem; color:var(--text-muted)">${err.message}</span>
        <button onclick="loadMatches()" style="margin-top:0.5rem;background:var(--blue);border:none;color:white;padding:0.4rem 1rem;border-radius:6px;cursor:pointer;">Réessayer</button>
      </div>`;
  }
}

// ---- PARSE DATE/TIME ----
// Convertit "2026-06-11" + "13:00 UTC-6" en objet Date UTC
function parseMatchDate(dateStr, timeStr) {
  // timeStr ex: "13:00 UTC-6" ou "20:00 UTC-4"
  const [timePart, tzPart] = timeStr.split(' ');
  const [hh, mm] = timePart.split(':').map(Number);
  const tzOffset  = parseInt(tzPart.replace('UTC','')) || 0; // ex: -6
  const [y, mo, d] = dateStr.split('-').map(Number);
  // Date UTC = heure locale - offset
  const utcMs = Date.UTC(y, mo - 1, d, hh - tzOffset, mm);
  return new Date(utcMs);
}

// YYYY-MM-DD en heure locale navigateur
function toLocalDateStr(date) {
  const y  = date.getFullYear();
  const m  = String(date.getMonth() + 1).padStart(2,'0');
  const dd = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
}

function nowLocalDateStr() { return toLocalDateStr(new Date()); }

function matchLocalDateStr(m) {
  return toLocalDateStr(parseMatchDate(m.date, m.time));
}

// ---- STATUT ----
function matchStatus(m) {
  if (m.score1 != null && m.score2 != null) return 'finished';
  const matchTime = parseMatchDate(m.date, m.time);
  const now       = new Date();
  const diffMin   = (now - matchTime) / 60000;
  if (diffMin > 0 && diffMin < 120) return 'live';
  if (now < matchTime) return 'upcoming';
  return 'finished'; // passé sans score = probablement pas encore mis à jour
}

// ---- LIVE BADGE ----
function updateLiveBadge() {
  const liveCount = allMatches.filter(m => matchStatus(m) === 'live').length;
  const badge     = document.getElementById('liveBadge');
  const liveText  = document.getElementById('liveText');
  if (liveCount > 0) {
    badge.classList.remove('offline');
    liveText.textContent = `${liveCount} EN DIRECT`;
  } else {
    badge.classList.add('offline');
    liveText.textContent = 'PAS DE MATCH LIVE';
  }
}

// ---- TABS ----
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  renderCurrentTab();
}

function renderCurrentTab() {
  if      (currentTab === 'recent')   renderRecent();
  else if (currentTab === 'today')    renderToday();
  else if (currentTab === 'tomorrow') renderUpcoming();
}

// ---- RECENT (résultats + live) ----
function renderRecent() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 4);

  const finished = allMatches.filter(m => {
    const s = matchStatus(m);
    return s === 'finished' && m.score1 != null && parseMatchDate(m.date, m.time) >= cutoff;
  });
  const live = allMatches.filter(m => matchStatus(m) === 'live');

  // Tri : live d'abord, puis résultats du plus récent au plus vieux
  const combined = [
    ...live,
    ...finished.sort((a,b) => parseMatchDate(b.date,b.time) - parseMatchDate(a.date,a.time))
  ];

  if (combined.length === 0) {
    document.getElementById('matchesContainer').innerHTML = `
      <div class="empty-state">
        <span style="font-size:2rem">📅</span>
        <span>Aucun résultat récent</span>
        <span style="font-size:0.75rem">Les scores apparaîtront ici après chaque match</span>
      </div>`;
    return;
  }
  renderMatchList(combined);
}

// ---- TODAY ----
function renderToday() {
  const today = nowLocalDateStr();
  const todayMatches = allMatches
    .filter(m => matchLocalDateStr(m) === today)
    .sort((a,b) => parseMatchDate(a.date,a.time) - parseMatchDate(b.date,b.time));

  if (todayMatches.length === 0) {
    document.getElementById('matchesContainer').innerHTML = `
      <div class="empty-state">
        <span style="font-size:2rem">📅</span>
        <span>Aucun match aujourd'hui</span>
      </div>`;
    return;
  }
  renderMatchList(todayMatches);
}

// ---- UPCOMING (ce soir + demain) ----
function renderUpcoming() {
  const today    = nowLocalDateStr();
  const tomorrow = toLocalDateStr(new Date(Date.now() + 86400000));
  const dayAfter = toLocalDateStr(new Date(Date.now() + 2 * 86400000));

  const upcoming = allMatches
    .filter(m => {
      const ds = matchLocalDateStr(m);
      const s  = matchStatus(m);
      // inclure today upcoming + demain + après-demain
      return (ds === today || ds === tomorrow || ds === dayAfter) && s === 'upcoming';
    })
    .sort((a,b) => parseMatchDate(a.date,a.time) - parseMatchDate(b.date,b.time));

  if (upcoming.length === 0) {
    document.getElementById('matchesContainer').innerHTML = `
      <div class="empty-state">
        <span style="font-size:2rem">📅</span>
        <span>Aucun match à venir dans les 48h</span>
      </div>`;
    return;
  }
  renderMatchList(upcoming);
}

// ---- RENDER LIST ----
function renderMatchList(matches) {
  // Grouper par date locale
  const groups = {};
  for (const m of matches) {
    const key = matchLocalDateStr(m);
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  }

  let html = '';
  for (const [dateKey, list] of Object.entries(groups)) {
    const d = new Date(dateKey + 'T12:00:00');
    html += `<div class="group-block">
      <div class="group-label">${formatDate(d)}</div>`;
    for (const m of list) html += renderCard(m);
    html += `</div>`;
  }
  document.getElementById('matchesContainer').innerHTML = html;
}

function formatDate(d) {
  const days   = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const months = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

// ---- MATCH CARD ----
function renderCard(m) {
  const status   = matchStatus(m);
  const flag1    = getFlag(m.team1);
  const flag2    = getFlag(m.team2);
  const matchDate = parseMatchDate(m.date, m.time);
  const hh       = String(matchDate.getHours()).padStart(2,'0');
  const mm2      = String(matchDate.getMinutes()).padStart(2,'0');

  let cardClass  = status === 'live' ? 'live' : status === 'finished' ? 'finished' : '';
  let scoreHtml  = '';
  let timeHtml   = '';

  if (status === 'upcoming') {
    scoreHtml = `<span class="match-score upcoming">${hh}:${mm2}</span>`;
    timeHtml  = `<span class="match-time">${m.group}</span>`;
  } else if (status === 'live') {
    const s1 = m.score1 ?? '?';
    const s2 = m.score2 ?? '?';
    scoreHtml = `<span class="match-score">${s1} – ${s2}</span>`;
    timeHtml  = `<span class="match-time live">● EN DIRECT</span>`;
  } else {
    const s1 = m.score1 ?? '?';
    const s2 = m.score2 ?? '?';
    scoreHtml = `<span class="match-score">${s1} – ${s2}</span>`;
    timeHtml  = `<span class="match-time finished">${m.group}</span>`;
  }

  // Mise en valeur équipe gagnante
  let cls1 = 'team-name', cls2 = 'team-name';
  if (status === 'finished' && m.score1 != null && m.score2 != null) {
    if (m.score1 > m.score2)       { cls1 += ' winner'; }
    else if (m.score2 > m.score1)  { cls2 += ' winner'; }
  }

  return `
    <div class="match-card ${cardClass}">
      <div class="match-team home">
        <span class="team-flag">${flag1}</span>
        <span class="${cls1}">${m.team1}</span>
      </div>
      <div class="match-center">
        ${scoreHtml}
        ${timeHtml}
      </div>
      <div class="match-team away">
        <span class="team-flag">${flag2}</span>
        <span class="${cls2}">${m.team2}</span>
      </div>
    </div>`;
}

// ---- RANKING ----
function loadRanking() {
  try {
    const d = localStorage.getItem(RANKING_STORAGE);
    return d ? JSON.parse(d) : [];
  } catch { return []; }
}

function saveRankingData(ranking) {
  localStorage.setItem(RANKING_STORAGE, JSON.stringify(ranking));
}

function initRanking() { renderRanking(loadRanking()); }

function renderRanking(ranking) {
  const container = document.getElementById('rankingRows');
  if (!ranking || ranking.length === 0) {
    container.innerHTML = `
      <div class="ranking-empty">
        <span style="font-size:2rem">👥</span>
        <span>Aucun joueur ajouté</span>
        <span style="color:var(--text-muted);font-size:0.72rem">Clique sur ✏️ pour saisir le classement</span>
      </div>`;
    return;
  }
  container.innerHTML = ranking.map((p, i) => {
    const rank   = i + 1;
    const cls    = rank <= 3 ? `rank-top3 rank-${rank}` : '';
    const medal  = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
    return `
      <div class="ranking-row ${cls}">
        <span class="col-rank">${medal}</span>
        <span class="col-name">${escHtml(p.name)}</span>
        <span class="col-pts">${p.pts ?? '-'}</span>
        <span class="col-good">${p.good ?? '-'}</span>
        <span class="col-exact">${p.exact ?? '-'}</span>
      </div>`;
  }).join('');
}

function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

// ---- ADMIN ----
function openAdmin() {
  const ranking = loadRanking();
  const rows    = document.getElementById('adminRows');
  rows.innerHTML = '';

  // Header
  const header = document.createElement('div');
  header.style.cssText = 'display:grid;grid-template-columns:1fr 70px 60px 50px auto;gap:0.4rem;padding:0 0 0.2rem;font-size:0.7rem;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:0.08em;';
  header.innerHTML = '<span>Nom</span><span>Points</span><span>Bonnes</span><span>Exactes</span><span></span>';
  rows.appendChild(header);

  if (ranking.length === 0) {
    for (let i = 0; i < 5; i++) addAdminRow();
  } else {
    ranking.forEach(p => addAdminRow(p));
  }

  document.getElementById('adminPanel').classList.add('open');
  document.getElementById('adminOverlay').style.display = 'block';
}

document.getElementById('adminToggle').addEventListener('click', openAdmin);

function closeAdmin() {
  document.getElementById('adminPanel').classList.remove('open');
  document.getElementById('apiConfigPanel').style.display = 'none';
  document.getElementById('adminOverlay').style.display  = 'none';
}

function addAdminRow(player = null) {
  const rows = document.getElementById('adminRows');
  const row  = document.createElement('div');
  row.className = 'admin-row';
  row.innerHTML = `
    <input type="text"   placeholder="Prénom Nom" value="${player ? escHtml(player.name) : ''}" class="input-name" />
    <input type="number" placeholder="Pts"        value="${player?.pts   ?? ''}"  min="0" class="input-pts"   />
    <input type="number" placeholder="✓"          value="${player?.good  ?? ''}"  min="0" class="input-good"  />
    <input type="number" placeholder="★"          value="${player?.exact ?? ''}"  min="0" class="input-exact" />
    <button onclick="this.closest('.admin-row').remove()" title="Supprimer">🗑</button>`;
  rows.appendChild(row);
}

function saveRanking() {
  const rows    = document.querySelectorAll('#adminRows .admin-row');
  const ranking = [];
  rows.forEach(row => {
    const name = row.querySelector('.input-name')?.value?.trim();
    if (!name) return;
    ranking.push({
      name,
      pts:   parseInt(row.querySelector('.input-pts')?.value)   || 0,
      good:  parseInt(row.querySelector('.input-good')?.value)  || 0,
      exact: parseInt(row.querySelector('.input-exact')?.value) || 0,
    });
  });
  ranking.sort((a,b) => b.pts - a.pts || b.exact - a.exact || b.good - a.good);
  saveRankingData(ranking);
  renderRanking(ranking);
  closeAdmin();
  const btn = document.getElementById('adminToggle');
  btn.textContent = '✅';
  setTimeout(() => { btn.textContent = '✏️'; }, 1500);
}

// ---- Fonctions stubées pour éviter erreurs HTML ----
function showApiConfig() {}
function dismissConfig()  { document.getElementById('configBar').style.display = 'none'; }
function saveApiKey()     {}
