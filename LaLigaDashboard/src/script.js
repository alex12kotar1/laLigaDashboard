document.addEventListener("DOMContentLoaded", async () => {
    // fetch Standings
    try {
        const standingsRes = await fetch('standings.json');
        const standingsData = await standingsRes.json();
        renderStandings(standingsData.standings[0].table);
    } catch (e) {
        console.error("Error loading standings.json:", e);
    }

    // fetch Upcoming Matches
    try {
        const matchesRes = await fetch('matches.json');
        const matchesData = await matchesRes.json();
        renderMatches(matchesData.matches);
    } catch (e) {
        console.error("Error loading matches.json:", e);
    }

    // fetch Recent Results
    try {
        const resultsRes = await fetch('results.json');
        const resultsData = await resultsRes.json();
        renderRecentMatches(resultsData.matches || resultsData);
    } catch (e) {
        console.error("Error loading results.json:", e);
    }
    
    // fetch Top Scorers
    try {
        const scorersRes = await fetch('scorers.json');
        const scorersData = await scorersRes.json();
        renderScorers(scorersData.scorers);
    } catch (e) {
        console.error("Error loading scorers.json:", e);
    }
});

function renderStandings(tableArray) {
    const container = document.getElementById('standings-table');
    container.innerHTML = '';
    
    tableArray.forEach(entry => {
        const row = document.createElement('div');
        row.className = 'table-row';
        
        if (entry.position <= 4) {
            row.classList.add('ucl');
        } else if (entry.position >= 18) {
            row.classList.add('rel');
        } else {
            row.classList.add('mid');
        }
        
        const gdFormatted = entry.goalDifference > 0 ? `+${entry.goalDifference}` : entry.goalDifference;
        const teamDisplayName = entry.team.shortName || entry.team.name;

        row.innerHTML = `
            <div class="pos">${entry.position}</div>
            <div class="team-info">
                <div class="team-details">
                    <img src="${entry.team.crest}" alt="${entry.team.name}" class="team-crest">
                    <span class="team-name">${teamDisplayName}</span>
                </div>
                <div class="stats-group">
                    <span class="stat-box">${entry.goalsFor}</span>
                    <span class="stat-box">${gdFormatted}</span>
                    <span class="stat-box pts">${entry.points}</span>
                    <span class="stat-box">${entry.playedGames}</span>
                </div>
            </div>
        `;
        
        row.addEventListener('click', () => {
            if (entry.team && entry.team.id) {
                window.location.href = `team.html?id=${entry.team.id}`;
            }
        });
        
        container.appendChild(row);
    });
}

function renderMatches(matchesArray) {
    const container = document.getElementById('upcoming-feed');
    if (!container) return;
    container.innerHTML = '';
    
    const upcoming = matchesArray.slice(0, 5);
    
    upcoming.forEach(match => {
        const row = document.createElement('div');
        row.className = 'match-row';
        
        const dateObj = new Date(match.utcDate);
        const dateStr = dateObj.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const homeName = match.homeTeam.shortName || match.homeTeam.name;
        const awayName = match.awayTeam.shortName || match.awayTeam.name;

        row.innerHTML = `
            <span>${homeName} vs ${awayName}</span>
            <span>${dateStr} @ ${timeStr}</span>
        `;
        
        container.appendChild(row);
    });
}

function renderRecentMatches(resultsArray) {
    const container = document.getElementById('recent-feed');
    if (!container || !resultsArray) return;
    container.innerHTML = '';
    
    // top 5 recent
    const recent = resultsArray.slice(0, 5);
    
    recent.forEach(match => {
        const row = document.createElement('div');
        row.className = 'match-row';
        
        const homeName = match.homeTeam.shortName || match.homeTeam.name;
        const awayName = match.awayTeam.shortName || match.awayTeam.name;
        
        const homeScore = match.score?.fullTime?.home ?? 0;
        const awayScore = match.score?.fullTime?.away ?? 0;

        row.innerHTML = `
            <span>${homeName} vs ${awayName}</span>
            <span>${homeScore} - ${awayScore}</span>
        `;
        
        container.appendChild(row);
    });
}

/**
 * Renders the top goalscorers feed into Column 3
 * @param {Array} scorersArray - Array of scorer objects from scorers.json (data.scorers)
 */
function renderScorers(scorersArray) {
    const container = document.getElementById('scorers-feed');
    if (!container) return;

    container.innerHTML = '';

    // backup incase free tier dosent support - tested and WORKS
    if (!scorersArray || !Array.isArray(scorersArray) || scorersArray.length === 0) {
        container.innerHTML = '<div class="match-row"><span>No scorer data available</span></div>';
        return;
    }

    // top 5 scorers
    const topScorers = scorersArray.slice(0, 5);

    topScorers.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'match-row';

        const rank = index + 1;
        
        // short / clean display name
        let displayName = item.player.name;
        if (item.player.firstName && item.player.lastName) {
            displayName = `${item.player.firstName.charAt(0)}. ${item.player.lastName}`;
        }

        // check for shorter name ("BAR", "RMA", "ATM")
        const teamCode = item.team.tla || item.team.shortName || item.team.name;
        const goals = item.goals ?? 0;

        row.innerHTML = `
            <span><strong>${rank}.</strong> ${displayName} <span style="font-weight: 600; color: #333;">(${teamCode})</span></span>
            <span><strong>${goals}</strong> G</span>
        `;

        container.appendChild(row);
    });
}
