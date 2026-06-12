'use strict';

const REFRESH_MS = 60_000;
let countdown = 60;

// ── FLAG HELPERS ──────────────────────────────────────────────────

const countryCodeMap = {
  mexico:'mx', mexique:'mx',
  'south africa':'za', 'afrique du sud':'za',
  'korea republic':'kr', 'south korea':'kr', 'corée du sud':'kr', 'coree du sud':'kr',
  czechia:'cz', 'czech republic':'cz', tchéquie:'cz', tchequie:'cz',
  canada:'ca',
  'bosnia and herzegovina':'ba', 'bosnia-herzegovina':'ba', 'bosnia & herzegovina':'ba',
  'bosnie-herzégovine':'ba', 'bosnie-herzegovine':'ba', bosnie:'ba',
  usa:'us', 'united states':'us', 'états-unis':'us', 'etats-unis':'us',
  qatar:'qa', switzerland:'ch', suisse:'ch', paraguay:'py',
  brazil:'br', brésil:'br', bresil:'br', france:'fr',
  argentina:'ar', argentine:'ar',
  england:'gb-eng', angleterre:'gb-eng',
  spain:'es', espagne:'es', germany:'de', allemagne:'de', portugal:'pt',
  japan:'jp', japon:'jp', morocco:'ma', maroc:'ma',
  netherlands:'nl', 'pays-bas':'nl', belgium:'be', belgique:'be',
  croatia:'hr', croatie:'hr', denmark:'dk', danemark:'dk',
  poland:'pl', pologne:'pl', serbia:'rs', serbie:'rs',
  uruguay:'uy', ecuador:'ec', équateur:'ec', equateur:'ec',
  australia:'au', australie:'au', iran:'ir',
  'saudi arabia':'sa', 'arabie saoudite':'sa',
  senegal:'sn', sénégal:'sn', cameroon:'cm', cameroun:'cm',
  ghana:'gh', nigeria:'ng',
  'ivory coast':'ci', 'cote d ivoire':'ci', "côte d'ivoire":'ci',
  chile:'cl', chili:'cl', colombia:'co', colombie:'co',
  peru:'pe', pérou:'pe', perou:'pe',
  wales:'gb-wls', galles:'gb-wls',
  scotland:'gb-sct', ecosse:'gb-sct', écosse:'gb-sct',
  turkey:'tr', turquie:'tr', ukraine:'ua',
  norway:'no', norvège:'no', norvege:'no',
  sweden:'se', suede:'se', suède:'se',
  austria:'at', autriche:'at',
  'new zealand':'nz', indonesia:'id', venezuela:'ve',
  'costa rica':'cr', panama:'pa', honduras:'hn', jamaica:'jm',
  algeria:'dz', algérie:'dz', algerie:'dz',
  egypt:'eg', égypte:'eg', egypte:'eg',
  iraq:'iq', china:'cn', chine:'cn', uzbekistan:'uz',
};

const flagEmojiMap = {
  mexico:'🇲🇽','south africa':'🇿🇦','korea republic':'🇰🇷',czechia:'🇨🇿',
  canada:'🇨🇦','bosnia and herzegovina':'🇧🇦',usa:'🇺🇸','united states':'🇺🇸',
  qatar:'🇶🇦',switzerland:'🇨🇭',paraguay:'🇵🇾',brazil:'🇧🇷',france:'🇫🇷',
  argentina:'🇦🇷',england:'🏴',spain:'🇪🇸',germany:'🇩🇪',portugal:'🇵🇹',
  japan:'🇯🇵',morocco:'🇲🇦',netherlands:'🇳🇱',belgium:'🇧🇪',croatia:'🇭🇷',
  denmark:'🇩🇰',poland:'🇵🇱',serbia:'🇷🇸',uruguay:'🇺🇾',ecuador:'🇪🇨',
  australia:'🇦🇺',iran:'🇮🇷','saudi arabia':'🇸🇦',senegal:'🇸🇳',cameroon:'🇨🇲',
  ghana:'🇬🇭',nigeria:'🇳🇬',chile:'🇨🇱',colombia:'🇨🇴',peru:'🇵🇪',
  wales:'🏴',scotland:'🏴',turkey:'🇹🇷',ukraine:'🇺🇦',norway:'🇳🇴',
  sweden:'🇸🇪',austria:'🇦🇹',
};

function normKey(name) {
  return String(name||'').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}
function guessCode(name) { return countryCodeMap[normKey(name)] || null; }
function guessEmoji(name) { return flagEmojiMap[normKey(name)] || '⚽'; }

function flagMarkup(name, forceCode, fallbackUrl) {
  const code = forceCode || guessCode(name);
  if (code) return `<img class="flag-img" src="https://flagcdn.com/w80/${code}.png" srcset="https://flagcdn.com/w160/${code}.png 2x" alt="${esc(name)}" loading="eager">`;
  if (fallbackUrl && /^https?:/i.test(fallbackUrl)) return `<img class="flag-img" src="${esc(fallbackUrl)}" alt="${esc(name)}" loading="eager">`;
  return `<span class="flag-emoji">${guessEmoji(name)}</span>`;
}

// ── DOM UTILS ─────────────────────────────────────────────────────

function $(id) { return document.getElementById(id); }
function esc(v) {
  return String(v??'').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

// ── HORLOGE ───────────────────────────────────────────────────────

function renderClock() {
  const now = new Date();
  $('clock').textContent = now.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
  $('dateDisplay').textContent = now.toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long' });
}

// ── ESPN FETCH ────────────────────────────────────────────────────

function parisDateKey(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone:'Europe/Paris', year:'numeric', month:'2-digit', day:'2-digit'
  }).formatToParts(d).reduce((a,p) => (a[p.type]=p.value, a), {});
  return `${parts.year}${parts.month}${parts.day}`;
}

function mapEspnEvent(ev) {
  const comp = ev?.competitions?.[0] || {};
  const competitors = comp.competitors || [];
  const home = competitors.find(c => c.homeAway === 'home') || competitors[0] || {};
  const away = competitors.find(c => c.homeAway === 'away') || competitors[1] || {};
  const state     = ev?.status?.type?.state || 'pre';
  const completed = ev?.status?.type?.completed || false;

  let status = 'scheduled';
  if (completed) status = 'finished';
  else if (state === 'in') status = 'live';

  const homeName = home.team?.displayName || home.team?.shortDisplayName || home.team?.abbreviation || 'À définir';
  const awayName = away.team?.displayName || away.team?.shortDisplayName || away.team?.abbreviation || 'À définir';

  return {
    id: ev.id,
    utcDate: ev.date,
    localTime: ev.date ? new Date(ev.date).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit', timeZone:'Europe/Paris' }) : null,
    status,
    group: comp?.note?.headline || ev?.season?.slug || '',
    homeTeam: homeName,
    awayTeam: awayName,
    homeCountryCode: guessCode(homeName),
    awayCountryCode: guessCode(awayName),
    homeScore: home.score ?? null,
    awayScore: away.score ?? null,
    note: ev.status?.type?.shortDetail || ev.status?.type?.detail || '',
  };
}

async function fetchEspnDate(dateKey) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateKey}&limit=100`;
  const res = await fetch(url, { cache:'no-store' });
  if (!res.ok) throw new Error(`ESPN ${dateKey}: HTTP ${res.status}`);
  const json = await res.json();
  return (json.events || []).map(mapEspnEvent);
}

async function loadEspnMatches() {
  const keys = [parisDateKey(-1), parisDateKey(0), parisDateKey(1)];
  const all = (await Promise.all(keys.map(fetchEspnDate))).flat();
  const seen = new Set();
  return all.filter(m => {
    const k = m.id || `${m.utcDate}-${m.homeTeam}-${m.awayTeam}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ── CLASSIFICATION DES MATCHS ─────────────────────────────────────

function parisParts(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone:'Europe/Paris', year:'numeric', month:'2-digit',
    day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23'
  }).formatToParts(date).reduce((a,p) => (a[p.type]=p.value, a), {});
}

function isoKey(offsetDays = 0) {
  const k = parisDateKey(offsetDays);
  return `${k.slice(0,4)}-${k.slice(4,6)}-${k.slice(6,8)}`;
}

function classifyMatch(m) {
  const d = new Date(m.utcDate);
  if (isNaN(d)) return null;
  const p = parisParts(d);
  const key = `${p.year}-${p.month}-${p.day}`;
  const h = Number(p.hour);
  const yesterday = isoKey(-1), today = isoKey(0), tomorrow = isoKey(1);
  if (key === yesterday && h >= 18) return 'Résultats de la veille';
  if (key === today && h < 12)     return 'Résultats de la nuit';
  if (key === today)               return 'Matchs du jour';
  if (key === tomorrow && h < 6)   return 'Cette nuit';
  return null;
}

// ── RENDU MATCHS ──────────────────────────────────────────────────

function normalizeStatus(s) {
  const v = String(s||'').toLowerCase();
  if (['live','in_play','first_half','second_half','halftime'].some(x => v.includes(x))) return 'live';
  if (['finished','full_time','ft','terminé','termine'].some(x => v.includes(x))) return 'finished';
  return 'scheduled';
}

function renderMatchCard(m) {
  const status = normalizeStatus(m.status);
  const scoreIsReal = m.homeScore !== null && m.homeScore !== undefined
                   && m.awayScore !== null && m.awayScore !== undefined
                   && status !== 'scheduled';
  const scoreText = scoreIsReal ? `${m.homeScore} - ${m.awayScore}` : 'vs';
  const timeDisplay = m.localTime || (m.utcDate ? new Date(m.utcDate).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit', timeZone:'Europe/Paris' }) : '--:--');
  const badgeText = status === 'live' ? (m.note || 'En direct') : status === 'finished' ? 'Terminé' : timeDisplay;
  const subline = m.group ? `<div class="match-group">${esc(m.group)}</div>` : '';

  return `
    <article class="match-card${status === 'live' ? ' live' : ''}">
      <div class="team home">
        <span class="flag">${flagMarkup(m.homeTeam, m.homeCountryCode)}</span>
        <span class="team-name">${esc(m.homeTeam)}</span>
      </div>
      <div class="center">
        ${subline}
        <div class="score">${esc(scoreText)}</div>
        <span class="badge${status === 'live' ? ' live' : ''}">${esc(badgeText)}</span>
      </div>
      <div class="team away">
        <span class="team-name">${esc(m.awayTeam)}</span>
        <span class="flag">${flagMarkup(m.awayTeam, m.awayCountryCode)}</span>
      </div>
    </article>`;
}

function renderMatches(matches) {
  const ORDER = ['Résultats de la veille','Résultats de la nuit','Matchs du jour','Cette nuit'];
  const groups = Object.fromEntries(ORDER.map(l => [l, []]));

  matches
    .filter(m => m.utcDate)
    .sort((a,b) => new Date(a.utcDate) - new Date(b.utcDate))
    .forEach(m => { const label = classifyMatch(m); if (label) groups[label].push(m); });

  let html = '';
  for (const label of ORDER) {
    const list = groups[label];
    if (!list.length) continue;
    html += `<div class="match-section">
      <div class="section-title">${esc(label)}</div>
      ${list.slice(0,3).map(renderMatchCard).join('')}
    </div>`;
  }

  $('matches').innerHTML = html || `<div class="empty">Aucun match dans la fenêtre affichée.<br>Le dashboard couvre la veille soir, la nuit, aujourd'hui et la nuit suivante.</div>`;

  // Live badge header
  const liveCount = matches.filter(m => normalizeStatus(m.status) === 'live').length;
  const badge = $('liveBadge');
  if (liveCount > 0) {
    badge.classList.remove('offline');
    $('liveText').textContent = `${liveCount} EN DIRECT`;
  } else {
    badge.classList.add('offline');
    $('liveText').textContent = 'PAS DE MATCH LIVE';
  }
}

// ── BOUCLE PRINCIPALE ─────────────────────────────────────────────

async function refresh() {
  try {
    const matches = await loadEspnMatches();
    renderMatches(matches);
    $('status').textContent    = `ESPN ✓ — ${matches.length} match(s)`;
    $('updatedAt').textContent = `Dernière MàJ : ${new Date().toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}`;
  } catch (err) {
    $('status').textContent = `Erreur ESPN : ${err.message}`;
    $('matches').innerHTML  = `<div class="empty">Impossible de charger les matchs.<br>${esc(err.message)}</div>`;
  }
  countdown = Math.round(REFRESH_MS / 1000);
}

// Countdown
setInterval(() => {
  countdown--;
  if (countdown < 0) countdown = 0;
  $('countdown').textContent = countdown;
}, 1000);

// ── START ──────────────────────────────────────────────────────────

renderClock();
setInterval(renderClock, 1_000);
refresh();
setInterval(refresh, REFRESH_MS);
