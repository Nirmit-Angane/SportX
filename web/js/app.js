document.addEventListener('DOMContentLoaded', () => {
    loadHomepageData();
    // Poll for live matches every 3 seconds to keep scores updated
    setInterval(pollLiveMatches, 3000);
});

async function pollLiveMatches() {
    try {
        const matchesRes = await fetchAPI('/matches');
        if (matchesRes.success) {
            const matches = matchesRes.data;
            renderHeroLive(matches);
            renderLiveRail(matches);
        }
    } catch (error) {
        console.error("Error polling matches", error);
    }
}

async function loadHomepageData() {
    try {
        // Fetch all necessary data in parallel
        const [matchesRes, eventsRes, teamsRes] = await Promise.all([
            fetchAPI('/matches'),
            fetchAPI('/events'),
            fetchAPI('/teams')
        ]);

        const matches = matchesRes.success ? matchesRes.data : [];
        const events = eventsRes.success ? eventsRes.data : [];
        const teams = teamsRes.success ? teamsRes.data : [];

        renderHeroLive(matches);
        renderLiveRail(matches);
        renderFeaturedTournament(events, matches);
        renderUpcoming(matches);
        renderResults(matches);
        renderTeams(teams);

    } catch (error) {
        console.error("Error loading homepage data", error);
    }
}

function renderHeroLive(matches) {
    const heroEl = document.getElementById('hero-live-feature');
    const liveMatches = matches.filter(m => ['LIVE', 'TIMEOUT', 'UNDER REVIEW'].includes(m.status));
    
    if (liveMatches.length === 0) {
        heroEl.innerHTML = `
            <div class="empty-state">
                <i data-lucide="radio" style="width: 48px; height: 48px; margin-bottom: 1rem;"></i>
                <h3>NO LIVE MATCHES</h3>
                <p>There are currently no matches in progress.</p>
                <a href="pages/matches.html" class="btn btn-primary" style="margin-top: 1.5rem;">VIEW UPCOMING</a>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    const match = liveMatches[0];
    heroEl.innerHTML = `
        <div class="hero-scoreboard-header">
            <div class="live-indicator"><div class="live-dot"></div> LIVE</div>
            <div style="font-family: var(--font-display); color: var(--text-secondary); text-transform: uppercase;">
                ${match.round || 'MATCH'}
            </div>
        </div>
        <div class="hero-scoreboard-body">
            <div class="hero-team home" style="text-align: right;">${match.home_team_name}</div>
            <div class="hero-score-wrapper">
                <div class="hero-score-value">${match.home_score !== null ? match.home_score : 0}</div>
                <div class="hero-score-divider">—</div>
                <div class="hero-score-value">${match.away_score !== null ? match.away_score : 0}</div>
            </div>
            <div class="hero-team away" style="text-align: left;">${match.away_team_name}</div>
        </div>
        <div class="hero-scoreboard-footer">
            <div class="hero-timer">${match.timer || '00:00'}</div>
            <div class="hero-venue">${match.venue_name || 'TBA'}</div>
        </div>
        <div style="text-align: center; margin-top: 2rem; border-top: 1px solid var(--border-color); padding-top: 2rem;">
            <a href="pages/match.html?id=${match.id}" class="btn btn-secondary">MATCH CENTER →</a>
        </div>
    `;
}

function renderLiveRail(matches) {
    const railEl = document.getElementById('live-matches-rail');
    const liveMatches = matches.filter(m => ['LIVE', 'TIMEOUT', 'UNDER REVIEW'].includes(m.status));
    
    if (liveMatches.length === 0) {
        railEl.innerHTML = `<p class="text-muted" style="padding: 2rem;">No matches currently live.</p>`;
        return;
    }

    railEl.innerHTML = liveMatches.map(match => `
        <div class="card-live" onclick="window.location.href='pages/match.html?id=${match.id}'">
            <div class="card-live-header">
                <span class="live-indicator" style="font-size: 0.8rem;"><div class="live-dot" style="width: 6px; height: 6px;"></div> LIVE</span>
                <span>${match.timer || '00:00'}</span>
            </div>
            <div class="card-live-teams">
                <div class="card-live-team-row">
                    <span>${match.home_team_name}</span>
                    <span class="card-live-score">${match.home_score !== null ? match.home_score : 0}</span>
                </div>
                <div class="card-live-team-row">
                    <span>${match.away_team_name}</span>
                    <span class="card-live-score">${match.away_score !== null ? match.away_score : 0}</span>
                </div>
            </div>
            <div class="card-live-footer">
                <span>${match.round || 'Match'}</span>
                <span>MATCH CENTER →</span>
            </div>
        </div>
    `).join('');
}

function renderFeaturedTournament(events, matches) {
    const featEl = document.getElementById('featured-tournament');
    if (events.length === 0) {
        featEl.innerHTML = `
            <div class="empty-state">
                <h3>NO ACTIVE TOURNAMENTS</h3>
                <p>Check back soon for upcoming events.</p>
            </div>
        `;
        return;
    }

    const event = events[0];
    const eventMatches = matches.filter(m => m.event_id === event.id);

    featEl.innerHTML = `
        <h3 style="color: var(--text-secondary); font-family: var(--font-display); letter-spacing: 2px; margin-bottom: 1rem;">FEATURED TOURNAMENT</h3>
        <div class="tournament-title">${event.name}</div>
        <div class="tournament-stats">
            <div class="t-stat">
                <span class="t-stat-val">${eventMatches.length}</span>
                <span class="t-stat-label">MATCHES</span>
            </div>
            <div class="t-stat">
                <span class="t-stat-val">${event.location || 'VARIOUS'}</span>
                <span class="t-stat-label">LOCATION</span>
            </div>
        </div>
        <a href="pages/events.html" class="btn btn-primary">VIEW TOURNAMENT →</a>
    `;
}

function renderUpcoming(matches) {
    const upNextEl = document.getElementById('upcoming-matches');
    const upcoming = matches.filter(m => m.status === 'SCHEDULED').slice(0, 5);
    
    if (upcoming.length === 0) {
        upNextEl.innerHTML = `<div class="empty-state"><p>No upcoming matches.</p></div>`;
        return;
    }

    upNextEl.innerHTML = upcoming.map(match => `
        <a href="pages/match.html?id=${match.id}" class="fixture-row">
            <div class="f-time">${match.match_time ? match.match_time.substring(0,5) : 'TBA'}</div>
            <div class="f-team home">${match.home_team_name}</div>
            <div class="f-vs-score">VS</div>
            <div class="f-team away">${match.away_team_name}</div>
            <div class="f-tournament">${match.round || '-'}</div>
            <div class="f-action">VIEW →</div>
        </a>
    `).join('');
}

function renderResults(matches) {
    const resultsEl = document.getElementById('recent-results');
    const completed = matches.filter(m => m.status === 'COMPLETED').reverse().slice(0, 5);
    
    if (completed.length === 0) {
        resultsEl.innerHTML = `<div class="empty-state"><p>No recent results.</p></div>`;
        return;
    }

    resultsEl.innerHTML = completed.map(match => {
        const homeWin = match.home_score > match.away_score;
        const awayWin = match.away_score > match.home_score;
        return `
        <a href="pages/match.html?id=${match.id}" class="fixture-row">
            <div class="f-time" style="font-size: 0.9rem;">FT</div>
            <div class="f-team home" style="${homeWin ? 'color: var(--brand-blue);' : ''}">${match.home_team_name}</div>
            <div class="f-vs-score">${match.home_score} - ${match.away_score}</div>
            <div class="f-team away" style="${awayWin ? 'color: var(--brand-blue);' : ''}">${match.away_team_name}</div>
            <div class="f-tournament">${match.match_date ? match.match_date.substring(5,10) : ''}</div>
            <div class="f-action">RECAP →</div>
        </a>
    `}).join('');
}

function renderTeams(teams) {
    const teamsEl = document.getElementById('teams-grid');
    const topTeams = teams.slice(0, 8);
    
    if (topTeams.length === 0) {
        teamsEl.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;"><p>No teams available.</p></div>`;
        return;
    }

    teamsEl.innerHTML = topTeams.map(team => `
        <div class="card" style="text-align: center;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--surface-elevated); margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center; font-size: 2rem; border: 1px solid var(--border-color);">
                ${team.name.charAt(0)}
            </div>
            <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">${team.name}</h3>
            <p class="text-muted" style="margin-bottom: 1.5rem; font-size: 0.9rem; text-transform: uppercase;">${team.city || ''}</p>
            <a href="pages/teams.html" class="btn btn-secondary" style="width: 100%; font-size: 0.9rem;">VIEW TEAM</a>
        </div>
    `).join('');
}
