// La Liga Team Primary Accent Colors
const TEAM_ACCENT_COLORS = {
    81: '#a50044',  // FC Barcelona
    86: '#00205b',  // Real Madrid
    77: '#00954c',  // Real Betis / Athletic
    78: '#cb3524',  // Atlético Madrid
    90: '#005ca5',  // Real Sociedad
    95: '#d00027'   // Valencia CF
};

const activeCharts = {};

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Grab ID from URL (?id=81)
    const urlParams = new URLSearchParams(window.location.search);
    const teamIdParam = urlParams.get('id') || '81';
    const teamIdNum = parseInt(teamIdParam, 10);

    // 2. Set dynamic accent color
    const teamAccent = TEAM_ACCENT_COLORS[teamIdNum] || TEAM_ACCENT_COLORS[teamIdParam] || '#a50044';
    document.documentElement.style.setProperty('--team-accent', teamAccent);

    try {
        // 3. Robust Fetch (Tries local path first, falls back to root if nested)
        let res = await fetch('team_stats.json');
        if (!res.ok) {
            res = await fetch('./team_stats.json');
        }
        if (!res.ok) {
            res = await fetch('/team_stats.json');
        }

        if (!res.ok) {
            console.error(`Failed to fetch team_stats.json. Status: ${res.status}`);
            document.getElementById('team-title').innerText = "Data File Not Found";
            return;
        }

        const allStats = await res.json();
        console.log("Loaded team_stats.json:", allStats);

        // Match string key "81", integer key 81, or nested .teams wrapper
        const teamData = allStats[teamIdParam] || allStats[teamIdNum] || allStats.teams?.[teamIdParam] || allStats.teams?.[teamIdNum];

        if (!teamData) {
            console.error(`Team ID ${teamIdParam} not found in team_stats.json`);
            document.getElementById('team-title').innerText = "Team Not Found";
            return;
        }

        // 4. Update Header DOM Elements
        renderHeader(teamData);

        // 5. Initialize Charts
        initFormChart(teamData.recentMatches || [], teamAccent);
        initHomeChart(teamData.homeAwayRecords || {}, teamAccent);
        initGoalsChart(teamData.matchdayGoals || [], teamAccent);
        initPossessionChart(teamData.recentMatches || [], teamAccent);

    } catch (e) {
        console.error("Error executing team.js script:", e);
    }
});

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