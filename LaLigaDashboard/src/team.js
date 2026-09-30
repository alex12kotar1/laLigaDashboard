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

function renderHeader(data) {
    const titleEl = document.getElementById('team-title');
    const crestEl = document.getElementById('team-crest');
    const rankEl = document.getElementById('team-rank');

    if (titleEl) titleEl.innerText = data.name || "Unknown Team";
    if (crestEl && data.crest) crestEl.src = data.crest;
    if (rankEl && data.rank) rankEl.innerText = `${data.rank} place`;
}

// Attach switchTab to global window scope so HTML onclick handlers work
window.switchTab = function(tabId) {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

    if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add('active');
    }

    const targetPanel = document.getElementById(`panel-${tabId}`);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }
};

/* ==================== ALGORITHMS & CHARTS ==================== */

// 1. RECENT FORM: Rating algorithm (0-100) based on GD & Possession
function initFormChart(recentMatches, accentColor) {
    const ctx = document.getElementById('formChart')?.getContext('2d');
    if (!ctx || !recentMatches.length) return;
    if (activeCharts.form) activeCharts.form.destroy();

    const last5 = recentMatches.slice(-5);
    const labels = last5.map(m => `MD ${m.matchday}`);
    
    const ratings = last5.map(m => {
        const gd = (m.goalsFor || 0) - (m.goalsAgainst || 0);
        const pos = m.possession || 50;
        let base = m.result === 'W' ? 60 : m.result === 'D' ? 40 : 20;
        return Math.min(Math.max(Math.round(base + (gd * 8) + ((pos - 50) * 0.4)), 10), 100);
    });

    activeCharts.form = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Performance Rating',
                data: ratings,
                borderColor: accentColor,
                backgroundColor: accentColor + '22',
                borderWidth: 3,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: accentColor,
                pointRadius: 6
            }]
        },
        options: getCommonOptions(100)
    });
}

// 2. HOME FIELD ADVANTAGE: Compare Home Win % vs Away Win %
function initHomeChart(records, accentColor) {
    const ctx = document.getElementById('homeChart')?.getContext('2d');
    if (!ctx) return;
    if (activeCharts.home) activeCharts.home.destroy();

    const homeWinPct = records.homeGames ? Math.round((records.homeWins / records.homeGames) * 100) : 0;
    const awayWinPct = records.awayGames ? Math.round((records.awayWins / records.awayGames) * 100) : 0;

    activeCharts.home = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Home Win %', 'Away Win %'],
            datasets: [{
                data: [homeWinPct, awayWinPct],
                backgroundColor: [accentColor, '#444444'],
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
                y: { max: 100, ticks: { color: '#8c8c8c' }, grid: { color: '#333333' } }
            }
        }
    });
}

// 3. GOALS SCORED / AGAINST: Working Matchday Bar Chart
function initGoalsChart(matchdayGoals, accentColor) {
    const ctx = document.getElementById('goalsChart')?.getContext('2d');
    if (!ctx || !matchdayGoals.length) return;
    if (activeCharts.goals) activeCharts.goals.destroy();

    const sortedGoals = [...matchdayGoals].sort((a, b) => a.matchday - b.matchday);

    activeCharts.goals = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedGoals.map(m => `MD ${m.matchday}`),
            datasets: [
                {
                    label: 'Scored',
                    data: sortedGoals.map(m => m.scored),
                    backgroundColor: accentColor,
                    borderRadius: 3
                },
                {
                    label: 'Conceded',
                    data: sortedGoals.map(m => m.conceded),
                    backgroundColor: '#8c8c8c',
                    borderRadius: 3
                }
            ]
        },
        options: getCommonOptions()
    });
}

// 4. POSSESSION: Last 5 Matchdays Line Chart
function initPossessionChart(recentMatches, accentColor) {
    const ctx = document.getElementById('possessionChart')?.getContext('2d');
    if (!ctx || !recentMatches.length) return;
    if (activeCharts.possession) activeCharts.possession.destroy();

    const last5 = recentMatches.slice(-5);
    const labels = last5.map(m => `MD ${m.matchday}`);
    const possessionData = last5.map(m => m.possession ?? 50);

    activeCharts.possession = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Possession %',
                data: possessionData,
                borderColor: accentColor,
                backgroundColor: accentColor + '33',
                borderWidth: 3,
                fill: true,
                tension: 0.25,
                pointBackgroundColor: accentColor,
                pointRadius: 5
            }]
        },
        options: getCommonOptions(100)
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
