// Team accent colors by football-data ID

const TEAM_ACCENT_COLORS = {
    77: '#a90028',   // Athletic Club
    78: '#cb3524',   // Atlético Madrid
    79: '#d91a21',   // Osasuna
    80: '#007fc8',   // Espanyol
    81: '#a50044',   // FC Barcelona
    82: '#005999',   // Getafe
    86: '#3a5fcd',   // Real Madrid 
    87: '#e5321b',   // Rayo Vallecano
    88: '#1e5bb5',   // Levante
    89: '#c8102e',   // Mallorca
    90: '#00954c',   // Real Betis
    92: '#2a6ebb',   // Real Sociedad
    94: '#f5c400',   // Villarreal
    95: '#ee7d00',   // Valencia
    263: '#2e6fd0',  // Alavés
    285: '#00a651',  // Elche
    298: '#d81e2b',  // Girona
    558: '#6cb4e4',  // Celta
    559: '#e4002b'   // Sevilla
};

const ROLLING_WINDOW = 5;
const activeCharts = {};

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const teamId = parseInt(params.get('id') || '81', 10);

    const accent = TEAM_ACCENT_COLORS[teamId] || '#ff4b44';
    document.documentElement.style.setProperty('--team-accent', accent);

    const [allStats, standings, upcoming] = await Promise.all([
        loadJson('team_stats.json'),
        loadJson('standings.json'),
        loadJson('matches.json')
    ]);

    if (!allStats) {
        setText('team-title', 'Data File Not Found');
        return;
    }

    const teamData = allStats[teamId] || allStats[String(teamId)] || allStats.teams?.[teamId];
    if (!teamData) {
        setText('team-title', 'Team Not Found');
        return;
    }

    // Standings lookup: teamId -> position
    const table = standings?.standings?.[0]?.table || [];
    const rankById = {};
    table.forEach(row => { rankById[row.team.id] = row.position; });
    const myRank = rankById[teamId] || null;

    const matches = normalizeMatches(teamData);

    renderHeader(teamData, myRank);
    renderNextMatch(teamId, upcoming?.matches || []);
    renderLastFive(matches);

    try {
        initFormChart(matches, rankById, accent);
        initHomeChart(teamData, accent);
        initGoalsChart(teamData.matchdayGoals || [], accent);
        initRollingGoalsChart(matches, accent);
    } catch (e) {
        console.error('Chart init failed:', e);
    }
});

/* ==================== HELPERS ==================== */

async function loadJson(name) {
    for (const path of [name, './' + name, '/' + name]) {
        try {
            const res = await fetch(path);
            if (res.ok) return await res.json();
        } catch (e) { /* try next path */ }
    }
    console.error(`Could not load ${name}`);
    return null;
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

function ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Converts the generator's recentMatches into list
function normalizeMatches(team) {
    const md = team.matchdayGoals || [];
    const list = (team.recentMatches || []).map((m, i) => {
        const gf = m.gf ?? m.goalsFor ?? 0;
        const ga = m.ga ?? m.goalsAgainst ?? 0;
        return {
            matchday: m.matchday ?? md[i]?.matchday ?? i + 1,
            opponent: m.opponent || 'Opponent',
            opponentId: m.opponentId,
            gf, ga,
            isHome: !!m.isHome,
            utcDate: m.utcDate,
            result: m.result || (gf > ga ? 'W' : gf === ga ? 'D' : 'L')
        };
    });
    list.sort((a, b) => (a.utcDate && b.utcDate)
        ? new Date(a.utcDate) - new Date(b.utcDate)
        : a.matchday - b.matchday);
    return list;
}

function renderHeader(data, rank) {
    setText('team-title', data.name || 'Unknown Team');
    const crest = document.getElementById('team-crest');
    if (crest && data.crest) crest.src = data.crest;
    if (rank) setText('team-rank', `${ordinal(rank)} place`);

    // Qualifier badge: UCL top 4, relegation bottom 3, otherwise nothing
    const badge = document.querySelector('.badge-qualifier');
    if (badge && rank) {
        if (rank <= 4) {
            badge.innerText = 'UCL QUALIFIER';
        } else if (rank >= 18) {
            badge.innerText = 'RELEGATION ZONE';
            badge.style.backgroundColor = '#d39f9f';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Fills NEXT MATCH line from matches.json.

function renderNextMatch(teamId, scheduled) {
    const el = document.getElementById('next-match') ||
        [...document.querySelectorAll('.summary-panel.right *')]
            .find(n => n.children.length === 0 && /^(vs\.|@)/i.test(n.textContent.trim()));
    if (!el) {
        console.warn('Next match element not found; add id="next-match" in team.html');
        return;
    }

    const next = scheduled
        .filter(m => m.homeTeam.id === teamId || m.awayTeam.id === teamId)
        .filter(m => !['POSTPONED', 'CANCELLED', 'SUSPENDED'].includes(m.status))
        .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))[0];
    if (!next) { el.innerText = 'NO UPCOMING MATCH'; return; }

    const home = next.homeTeam.id === teamId;
    const opp = home ? next.awayTeam : next.homeTeam;
    const d = new Date(next.utcDate);
    const date = d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
    const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
    el.innerText = `${home ? 'vs.' : '@'} ${(opp.shortName || opp.name).toUpperCase()} ${date} ${time}`;
}

// last 5 results for each team
function renderLastFive(matches) {
    const label = document.getElementById('last-five-label') ||
        [...document.querySelectorAll('.summary-panel.right *')]
            .find(n => n.children.length === 0 && /^H2H\s*LAST\s*5/i.test(n.textContent.trim()));
    if (!label) {
        console.warn('Last 5 label not found; add id="last-five-label" in team.html');
        return;
    }
    label.innerText = 'LAST 5 RESULTS';

    let box = document.getElementById('last-five');
    if (!box) {
        box = document.createElement('div');
        box.id = 'last-five';
        label.insertAdjacentElement('afterend', box);
    }
    box.innerHTML = '';
    box.style.cssText = 'display:flex; gap:12px; margin-top:14px;';

    const colors = { W: '#8cd3c1', D: '#8c8c8c', L: '#d39f9f' };
    const last5 = matches.slice(-5).reverse();   // most recent first

    if (!last5.length) {
        box.innerText = 'No matches played yet';
        return;
    }

    last5.forEach(m => {
        const item = document.createElement('div');
        item.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:6px; width:74px;';
        item.title = `MD ${m.matchday}: ${m.isHome ? 'vs' : '@'} ${m.opponent} ${m.gf}-${m.ga}`;

        const pill = document.createElement('div');
        pill.innerText = m.result;
        pill.style.cssText = `width:40px; height:40px; border-radius:6px; display:flex; ` +
            `align-items:center; justify-content:center; font-weight:900; font-size:1.1rem; ` +
            `color:#000; background:${colors[m.result]};`;

        const info = document.createElement('div');
        info.innerText = `${m.isHome ? 'vs' : '@'} ${m.opponent}`;
        info.style.cssText = 'font-size:0.65rem; font-weight:700; color:#8c8c8c; text-align:center; ' +
            'line-height:1.2; max-width:74px;';

        const score = document.createElement('div');
        score.innerText = `${m.gf} - ${m.ga}`;
        score.style.cssText = 'font-size:0.8rem; font-weight:900;';

        item.append(pill, info, score);
        box.appendChild(item);
    });
}
// Make tabs switchable
window.switchTab = function (tabId) {
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

    const btn = [...document.querySelectorAll('.tab-button')]
        .find(b => (b.getAttribute('onclick') || '').includes(`'${tabId}'`));
    if (btn) btn.classList.add('active');

    const panel = document.getElementById(`panel-${tabId}`);
    if (panel) panel.classList.add('active');

    // resize charts once visible
    Object.values(activeCharts).forEach(c => c.resize());
};
/* ==================== ALGORITHMS & CHARTS ==================== */

// Rolling form - 
// Single-match rating, 0-100.
// Result is base (WDL), goal difference pushes slightly, opponent strength by table position
// rewards good results against strong teams, and away games get a smaller bonus.
function matchRating(m, oppRank) {
    let r = m.result === 'W' ? 70 : m.result === 'D' ? 42 : 15;
    r += Math.max(-10, Math.min((m.gf - m.ga) * 5, 15));
    if (oppRank) {
        const strength = (20 - oppRank) / 19;   // 1 = top of table, 0 = bottom
        r += (strength - 0.5) * 16;
    }
    if (!m.isHome) r += 3;
    return Math.max(0, Math.min(100, Math.round(r)));
}

// Rolling average algorithim
// 
function rollingAvg(values, win = ROLLING_WINDOW) {
    return values.map((_, i) => {
        const slice = values.slice(Math.max(0, i - win + 1), i + 1);
        return +(slice.reduce((a, b) => a + b, 0) / slice.length).toFixed(1);
    });
}

function initFormChart(matches, rankById, accent) {
    const ctx = document.getElementById('formChart')?.getContext('2d');
    if (!ctx || !matches.length) return;
    activeCharts.form?.destroy();

    const labels = matches.map(m => `MD ${m.matchday}`);
    const single = matches.map(m => matchRating(m, rankById[m.opponentId]));
    const rolling = rollingAvg(single);
    const resultColors = matches.map(m =>
        m.result === 'W' ? '#8cd3c1' : m.result === 'D' ? '#8c8c8c' : '#d39f9f');

    const describe = i => {
        const m = matches[i];
        return `${m.result} ${m.isHome ? 'vs' : '@'} ${m.opponent} (${m.gf}-${m.ga})`;
    };

    const opts = getCommonOptions(100, 0);
    opts.plugins.tooltip = {
        callbacks: {
            afterTitle: items => describe(items[0].dataIndex)
        }
    };

    activeCharts.form = new Chart(ctx, {
        data: {
            labels,
            datasets: [
                {
                    type: 'line',
                    label: `Rolling form (${ROLLING_WINDOW}-match avg)`,
                    data: rolling,
                    borderColor: accent,
                    backgroundColor: accent + '22',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: accent,
                    pointRadius: 5,
                    order: 1
                },
                {
                    type: 'bar',
                    label: 'Match rating',
                    data: single,
                    backgroundColor: resultColors.map(c => c + '99'),
                    borderRadius: 3,
                    order: 2
                }
            ]
        },
        options: opts
    });
}

// Other charts

// Home field advantage chart

function initHomeChart(team, accent) {
    const ctx = document.getElementById('homeChart')?.getContext('2d');
    if (!ctx) return;
    activeCharts.home?.destroy();

    // Generator stores these at top level; fall back to an optional nested object
    const r = team.homeAwayRecords || team;
    const pct = (w, g) => (g ? Math.round((w / g) * 100) : 0);
    const homePct = pct(r.homeWins, r.homeGames);
    const awayPct = pct(r.awayWins, r.awayGames);

    activeCharts.home = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Home Win %', 'Away Win %'],
            datasets: [{
                data: [homePct, awayPct],
                backgroundColor: [accent, '#444444'],
                borderRadius: 4,
                barThickness: 60
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#ffffff', font: { family: 'Montserrat', weight: '700' } }, grid: { display: false } },
                y: { min: 0, max: 100, ticks: { color: '#8c8c8c' }, grid: { color: '#333333' } }
            }
        }
    });
}

function initGoalsChart(matchdayGoals, accent) {
    const ctx = document.getElementById('goalsChart')?.getContext('2d');
    if (!ctx || !matchdayGoals.length) return;
    activeCharts.goals?.destroy();

    const sorted = [...matchdayGoals].sort((a, b) => a.matchday - b.matchday);
    activeCharts.goals = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sorted.map(m => `MD ${m.matchday}`),
            datasets: [
                { label: 'Scored', data: sorted.map(m => m.scored), backgroundColor: accent, borderRadius: 3 },
                { label: 'Conceded', data: sorted.map(m => m.conceded), backgroundColor: '#8c8c8c', borderRadius: 3 }
            ]
        },
        options: getCommonOptions(null, 0)
    });
}

// Temp chart for goals in replace for possesion - searching for new API with possesion stats
function initRollingGoalsChart(matches, accent) {
    const ctx = document.getElementById('possessionChart')?.getContext('2d');
    if (!ctx || !matches.length) return;
    activeCharts.rolling?.destroy();

    const labels = matches.map(m => `MD ${m.matchday}`);
    activeCharts.rolling = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: `Goals scored (${ROLLING_WINDOW}-match avg)`,
                    data: rollingAvg(matches.map(m => m.gf)),
                    borderColor: accent,
                    backgroundColor: accent + '33',
                    borderWidth: 3, fill: true, tension: 0.3, pointRadius: 4
                },
                {
                    label: `Goals conceded (${ROLLING_WINDOW}-match avg)`,
                    data: rollingAvg(matches.map(m => m.ga)),
                    borderColor: '#8c8c8c',
                    backgroundColor: '#8c8c8c22',
                    borderWidth: 3, fill: true, tension: 0.3, pointRadius: 4
                }
            ]
        },
        options: getCommonOptions(null, 0)
    });
}
function getCommonOptions(maxY = null) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: '#ffffff', font: { family: 'Montserrat', weight: '700' } } }
        },
        scales: {
            x: { ticks: { color: '#8c8c8c' }, grid: { color: '#333333' } },
            y: { max: maxY, ticks: { color: '#8c8c8c' }, grid: { color: '#333333' } }
        }
    };
}
