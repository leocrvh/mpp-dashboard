/* ============================================
   MPP DASHBOARD — app.js
   ============================================ */

// ---- CONFIG ----
const API_KEY_STORAGE = 'mpp_api_key';
const RANKING_STORAGE = 'mpp_ranking';
const WC_LEAGUE_ID    = 1;
const WC_SEASON       = 2026;
const REFRESH_INTERVAL = 3 * 60 * 1000; // 3 minutes
const COUNTDOWN_SECS   = 180;

// ---- FLAGS MAP (country name → emoji) ----
const FLAGS = {
  'Mexico': '🇲🇽', 'South Africa': '🇿🇦', 'Korea Republic': '🇰🇷',
  'Czech Republic': '🇨🇿', 'Czechia': '🇨🇿', 'Canada': '🇨🇦',
  'Bosnia and Herzegovina': '🇧🇦', 'Bosnia': '🇧🇦',
  'USA': '🇺🇸', 'United States': '🇺🇸', 'Paraguay': '🇵🇾',
  'Qatar': '🇶🇦', 'Switzerland': '🇨🇭', 'France': '🇫🇷',
  'Germany': '🇩🇪', 'Spain': '🇪🇸', 'Portugal': '🇵🇹',
  'Brazil': '🇧🇷', 'Argentina': '🇦🇷', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Italy': '🇮🇹', 'Netherlands': '🇳🇱', 'Belgium': '🇧🇪',
  'Morocco': '🇲🇦', 'Japan': '🇯🇵', 'Australia': '🇦🇺',
  'Croatia': '🇭🇷', 'Poland': '🇵🇱', 'Senegal': '🇸🇳',
  'Ecuador': '🇪🇨', 'Uruguay': '🇺🇾', 'Colombia': '🇨🇴',
  'Chile': '🇨🇱', 'Peru': '🇵🇪', 'Venezuela': '🇻🇪',
  'Costa Rica': '🇨🇷', 'Panama': '🇵🇦', 'Honduras': '🇭🇳',
  'Jamaica': '🇯🇲', 'Trinidad and Tobago': '🇹🇹',
  'Algeria': '🇩🇿', 'Nigeria': '🇳🇬', 'Ghana': '🇬🇭',
  'Cameroon': '🇨🇲', 'Côte d\'Ivoire': '🇨🇮', 'Ivory Coast': '🇨🇮',
  'Tunisia': '🇹🇳', 'Egypt': '🇪🇬', 'Congo DR': '🇨🇩',
  'Saudi Arabia': '🇸🇦', 'Iran': '🇮🇷', 'Iraq': '🇮🇶',
  'Australia': '🇦🇺', 'New Zealand': '🇳🇿', 'Indonesia': '🇮🇩',
  'Uzbekistan': '🇺🇿', 'South Korea': '🇰🇷', 'China': '🇨🇳',
  'Denmark': '🇩🇰', 'Sweden': '🇸🇪', 'Norway': '🇳🇴',
  'Austria': '🇦🇹', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  'Serbia': '🇷🇸', 'Romania': '🇷🇴', 'Hungary': '🇭🇺',
  'Slovakia': '🇸🇰', 'Slovenia': '🇸🇮', 'Albania': '🇦🇱',
  'Ukraine': '🇺🇦', 'Turkey': '🇹🇷', 'Greece': '🇬🇷',
  'Israel': '🇮🇱', 'New Caledonia': '🇳🇨',
};

function getFlag(name) {
  if (!name) return '🏳️';
  for (const [key, flag] of Object.entries(FLAGS)) {
    if (name.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(name.toLowerCase())) {
      return flag;
    }
  }
  return '🏳️';
}

// ---- STATE ----
let currentTab = 'recent';
let countdownValue = COUNTDOWN_SECS;
let countdownTimer = null;
let allFixtures = [];

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initRanking();
  checkApiKey();
  loadMatches();
  startAutoRefresh();
});

// ---- CLOCK ----
function initClock() {
  function tick() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('clock').textContent = `${hh}:${mm}`;
    const days = ['Dim.','Lun.','Mar.','Mer.','Jeu.','Ven.','Sam.'];
    const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    const d = now.getDate();
    const dayName = days[now.getDay()];
    const month = months[now.getMonth()];
    document.getElementById('dateDisplay').textContent = `${dayName} ${d} ${month} ${now.getFullYear()}`;
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

// ---- API KEY ----
function getApiKey() {
  return localStorage.getItem(API_KEY_STORAGE) || '';
}

function checkApiKey() {
  const key = getApiKey();
  const bar = document.getElementById('configBar');
  if (key) {
    bar.style.display = 'none';
  } else {
    bar.style.display = 'flex';
  }
}

function showApiConfig() {
  document.getElementById('apiConfigPanel').classList.add('open');
  document.getElementById('apiConfigPanel').style.display = 'flex';
  document.getElementById('adminOverlay').style.display = 'block';
  const key = getApiKey();
  if (key) document.getElementById('apiKeyInput').value = key;
}

function saveApiKey() {
  const key = document.getElementById('apiKeyInput').value.trim();
  if (!key) { alert('Entre une clé API valide.'); return; }
  localStorage.setItem(API_KEY_STORAGE, key);
  document.getElementById('apiConfigPanel').style.display = 'none';
  document.getElementById('adminOverlay').style.display = 'none';
  checkApiKey();
  loadMatches();
}

function dismissConfig() {
  document.getElementById('configBar').style.display = 'none';
}

// ---- FETCH MATCHES ----
async function loadMatches(silent = false) {
  const apiKey = getApiKey();

  if (!silent) {
    document.getElementById('matchesContainer').innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <span>Chargement des matchs…</span>
      </div>`;
  }

  if (!apiKey) {
    showMatchesDemo();
    return;
  }

  try {
    // Fetch fixtures for the World Cup
    const resp = await fetch(
      `https://v3.football.api-sports.io/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`,
      { headers: { 'x-apisports-key': apiKey } }
    );

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    if (data.errors && Object.keys(data.errors).length > 0) {
      const errMsg = JSON.stringify(data.errors);
      throw new Error(errMsg);
    }

    allFixtures = data.response || [];
    updateLiveBadge();
    renderCurrentTab();

  } catch (err) {
    console.error('API error:', err);
    document.getElementById('matchesContainer').innerHTML = `
      <div class="error-state">
        <span style="font-size:2rem">⚠️</span>
        <span>Erreur de chargement</span>
        <span style="font-size:0.75rem; color: var(--text-muted)">${err.message}</span>
        <button onclick="loadMatches()" style="margin-top:0.5rem; background:var(--blue); border:none; color:white; padding:0.4rem 1rem; border-radius:6px; cursor:pointer;">Réessayer</button>
      </div>`;
  }
}

// ---- LIVE BADGE ----
function updateLiveBadge() {
  const liveMatches = allFixtures.filter(f => {
    const s = f.fixture.status.short;
    return ['1H','HT','2H','ET','P'].includes(s);
  });

  const badge = document.getElementById('liveBadge');
  const liveText = document.getElementById('liveText');

  if (liveMatches.length > 0) {
    badge.classList.remove('offline');
    liveText.textContent = `${liveMatches.length} EN DIRECT`;
  } else {
    badge.classList.add('offline');
    liveText.textContent = 'PAS DE MATCH LIVE';
  }
}

// ---- TAB SWITCH ----
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  renderCurrentTab();
}

function renderCurrentTab() {
  if (currentTab === 'recent') renderRecent();
  else if (currentTab === 'today') renderToday();
  else if (currentTab === 'tomorrow') renderTomorrow();
}

// ---- DATE HELPERS ----
function toDateStr(date) {
  // Returns YYYY-MM-DD in local time
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fixtureDateStr(fixture) {
  const d = new Date(fixture.fixture.date);
  return toDateStr(d);
}

// ---- RENDER RECENT ----
function renderRecent() {
  const today = toDateStr(new Date());

  // Get finished matches from last 3 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 3);

  const recent = allFixtures.filter(f => {
    const status = f.fixture.status.short;
    const finished = ['FT','AET','PEN'].includes(status);
    const d = new Date(f.fixture.date);
    return finished && d >= cutoff;
  }).sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date));

  // Also include live matches at top
  const live = allFixtures.filter(f => {
    const s = f.fixture.status.short;
    return ['1H','HT','2H','ET','P'].includes(s);
  });

  const combined = [...live, ...recent];

  if (combined.length === 0) {
    document.getElementById('matchesContainer').innerHTML = `
      <div class="empty-state">
        <span style="font-size:2rem">📅</span>
        <span>Aucun résultat récent</span>
        <span style="font-size:0.75rem">Les matchs terminés apparaîtront ici</span>
      </div>`;
    return;
  }

  renderMatchList(combined);
}

// ---- RENDER TODAY ----
function renderToday() {
  const today = toDateStr(new Date());
  const todayMatches = allFixtures.filter(f => fixtureDateStr(f) === today);

  if (todayMatches.length === 0) {
    document.getElementById('matchesContainer').innerHTML = `
      <div class="empty-state">
        <span style="font-size:2rem">📅</span>
        <span>Aucun match aujourd'hui</span>
      </div>`;
    return;
  }

  renderMatchList(todayMatches.sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date)));
}

// ---- RENDER TOMORROW ----
function renderTomorrow() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = toDateStr(tomorrow);

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  const dayAfterStr = toDateStr(dayAfter);

  const upcoming = allFixtures.filter(f => {
    const ds = fixtureDateStr(f);
    const status = f.fixture.status.short;
    return (ds === tomorrowStr || ds === dayAfterStr) &&
           ['NS','TBD'].includes(status);
  }).sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));

  if (upcoming.length === 0) {
    document.getElementById('matchesContainer').innerHTML = `
      <div class="empty-state">
        <span style="font-size:2rem">📅</span>
        <span>Aucun match à venir trouvé</span>
      </div>`;
    return;
  }

  renderMatchList(upcoming);
}

// ---- RENDER MATCH LIST ----
function renderMatchList(fixtures) {
  // Group by round/date
  const groups = {};
  for (const f of fixtures) {
    const round = f.league?.round || 'Phase de groupes';
    const dateStr = toDateStr(new Date(f.fixture.date));
    const key = `${round} · ${formatShortDate(new Date(f.fixture.date))}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(f);
  }

  let html = '';
  for (const [group, matches] of Object.entries(groups)) {
    html += `<div class="group-block">`;
    html += `<div class="group-label">${group}</div>`;
    for (const f of matches) {
      html += renderMatchCard(f);
    }
    html += `</div>`;
  }

  document.getElementById('matchesContainer').innerHTML = html;
}

function formatShortDate(d) {
  const days = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
  const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

function renderMatchCard(f) {
  const home = f.teams.home.name;
  const away = f.teams.away.name;
  const homeFlag = getFlag(home);
  const awayFlag = getFlag(away);
  const status = f.fixture.status.short;
  const elapsed = f.fixture.status.elapsed;

  const isLive = ['1H','HT','2H','ET','P'].includes(status);
  const isFinished = ['FT','AET','PEN'].includes(status);
  const isUpcoming = ['NS','TBD'].includes(status);

  let cardClass = isLive ? 'live' : isFinished ? 'finished' : '';
  let scoreHtml = '';
  let timeHtml = '';

  if (isUpcoming) {
    const matchDate = new Date(f.fixture.date);
    const hh = String(matchDate.getHours()).padStart(2, '0');
    const mm = String(matchDate.getMinutes()).padStart(2, '0');
    scoreHtml = `<span class="match-score upcoming">${hh}:${mm}</span>`;
    timeHtml = `<span class="match-time">${formatShortDate(matchDate)}</span>`;
  } else {
    const hg = f.goals.home ?? '?';
    const ag = f.goals.away ?? '?';
    scoreHtml = `<span class="match-score">${hg} – ${ag}</span>`;

    if (isLive) {
      const label = status === 'HT' ? 'MI-TEMPS' : `${elapsed}'`;
      timeHtml = `<span class="match-time live">● ${label}</span>`;
    } else {
      const suffix = status === 'AET' ? ' (P.R.)' : status === 'PEN' ? ' (TAB)' : '';
      timeHtml = `<span class="match-time finished">TERMINÉ${suffix}</span>`;
    }
  }

  return `
    <div class="match-card ${cardClass}">
      <div class="match-team home">
        <span class="team-flag">${homeFlag}</span>
        <span class="team-name">${home}</span>
      </div>
      <div class="match-center">
        ${scoreHtml}
        ${timeHtml}
      </div>
      <div class="match-team away">
        <span class="team-flag">${awayFlag}</span>
        <span class="team-name">${away}</span>
      </div>
    </div>`;
}

// ---- DEMO MODE (no API key) ----
function showMatchesDemo() {
  const demoFixtures = [
    { fixture: { id:1, date:'2026-06-11T21:00:00+00:00', status:{short:'FT',elapsed:90} }, league:{round:'Groupe A'}, teams:{home:{name:'Mexico'},away:{name:'South Africa'}}, goals:{home:2,away:0} },
    { fixture: { id:2, date:'2026-06-12T04:00:00+00:00', status:{short:'NS',elapsed:null} }, league:{round:'Groupe A'}, teams:{home:{name:'Korea Republic'},away:{name:'Czechia'}}, goals:{home:null,away:null} },
    { fixture: { id:3, date:'2026-06-12T21:00:00+00:00', status:{short:'NS',elapsed:null} }, league:{round:'Groupe B'}, teams:{home:{name:'Canada'},away:{name:'Bosnia and Herzegovina'}}, goals:{home:null,away:null} },
    { fixture: { id:4, date:'2026-06-13T03:00:00+00:00', status:{short:'NS',elapsed:null} }, league:{round:'Groupe D'}, teams:{home:{name:'USA'},away:{name:'Paraguay'}}, goals:{home:null,away:null} },
    { fixture: { id:5, date:'2026-06-13T21:00:00+00:00', status:{short:'NS',elapsed:null} }, league:{round:'Groupe B'}, teams:{home:{name:'Qatar'},away:{name:'Switzerland'}}, goals:{home:null,away:null} },
  ];
  allFixtures = demoFixtures;
  updateLiveBadge();
  renderCurrentTab();

  // Show demo notice
  const container = document.getElementById('matchesContainer');
  const notice = document.createElement('div');
  notice.style.cssText = 'text-align:center; padding:0.5rem; font-size:0.72rem; color:var(--gold); border-top:1px solid var(--border); margin-top:0.5rem; flex-shrink:0;';
  notice.textContent = '⚠️ Mode démo — Configure ta clé API pour les données en temps réel';
  setTimeout(() => container.appendChild(notice), 100);
}

// ---- RANKING ----
function getDefaultRanking() {
  return [];
}

function loadRanking() {
  try {
    const data = localStorage.getItem(RANKING_STORAGE);
    return data ? JSON.parse(data) : getDefaultRanking();
  } catch { return getDefaultRanking(); }
}

function saveRankingData(ranking) {
  localStorage.setItem(RANKING_STORAGE, JSON.stringify(ranking));
}

function initRanking() {
  renderRanking(loadRanking());
}

function renderRanking(ranking) {
  const container = document.getElementById('rankingRows');

  if (!ranking || ranking.length === 0) {
    container.innerHTML = `
      <div class="ranking-empty">
        <span style="font-size:2rem">👥</span>
        <span>Aucun joueur ajouté</span>
        <span style="color:var(--text-muted); font-size:0.72rem">Clique sur ✏️ pour saisir le classement</span>
      </div>`;
    return;
  }

  container.innerHTML = ranking.map((p, i) => {
    const rank = i + 1;
    const rankClass = rank <= 3 ? `rank-top3 rank-${rank}` : '';
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
    return `
      <div class="ranking-row ${rankClass}">
        <span class="col-rank">${medal}</span>
        <span class="col-name">${escHtml(p.name)}</span>
        <span class="col-pts">${p.pts ?? '-'}</span>
        <span class="col-good">${p.good ?? '-'}</span>
        <span class="col-exact">${p.exact ?? '-'}</span>
      </div>`;
  }).join('');
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ---- ADMIN RANKING ----
function openAdmin() {
  const ranking = loadRanking();
  const panel = document.getElementById('adminPanel');
  const overlay = document.getElementById('adminOverlay');
  const rows = document.getElementById('adminRows');

  rows.innerHTML = '';
  if (ranking.length === 0) {
    // Add a few empty rows to start
    for (let i = 0; i < 5; i++) addAdminRow();
  } else {
    ranking.forEach(p => addAdminRow(p));
  }

  // Add header labels
  const header = document.createElement('div');
  header.style.cssText = 'display:grid; grid-template-columns:1fr 70px 60px 50px auto; gap:0.4rem; padding:0 0 0.2rem; font-size:0.7rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:0.08em;';
  header.innerHTML = '<span>Nom</span><span>Points</span><span>Bonnes</span><span>Exactes</span><span></span>';
  rows.prepend(header);

  panel.classList.add('open');
  overlay.style.display = 'block';
}

document.getElementById('adminToggle').addEventListener('click', openAdmin);

function closeAdmin() {
  document.getElementById('adminPanel').classList.remove('open');
  document.getElementById('apiConfigPanel').style.display = 'none';
  document.getElementById('adminOverlay').style.display = 'none';
}

function addAdminRow(player = null) {
  const rows = document.getElementById('adminRows');
  const row = document.createElement('div');
  row.className = 'admin-row';
  row.innerHTML = `
    <input type="text" placeholder="Prénom Nom" value="${player ? escHtml(player.name) : ''}" class="input-name" />
    <input type="number" placeholder="Pts" value="${player?.pts ?? ''}" min="0" class="input-pts" />
    <input type="number" placeholder="✓" value="${player?.good ?? ''}" min="0" class="input-good" />
    <input type="number" placeholder="★" value="${player?.exact ?? ''}" min="0" class="input-exact" />
    <button onclick="this.closest('.admin-row').remove()" title="Supprimer">🗑</button>`;
  rows.appendChild(row);
}

function saveRanking() {
  const rows = document.querySelectorAll('#adminRows .admin-row');
  const ranking = [];
  rows.forEach(row => {
    const name = row.querySelector('.input-name')?.value?.trim();
    if (!name) return;
    ranking.push({
      name,
      pts:   parseInt(row.querySelector('.input-pts')?.value) || 0,
      good:  parseInt(row.querySelector('.input-good')?.value) || 0,
      exact: parseInt(row.querySelector('.input-exact')?.value) || 0,
    });
  });

  // Sort by points descending
  ranking.sort((a, b) => b.pts - a.pts || b.exact - a.exact || b.good - a.good);

  saveRankingData(ranking);
  renderRanking(ranking);
  closeAdmin();

  // Brief confirmation flash
  const btn = document.getElementById('adminToggle');
  btn.textContent = '✅';
  setTimeout(() => { btn.textContent = '✏️'; }, 1500);
}
