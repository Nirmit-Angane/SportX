let previousLiveMatchIds = new Set();
let allMatches = []; // Cache for live tape

// Helper for Team Pattern Hash
function getTeamPattern(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return 'team-pattern-' + (Math.abs(hash) % 8);
}

// Helper for Live Tape
function updateLiveTape() {
    const tapeWrapper = document.getElementById('live-tape-wrapper');
    const tape = document.getElementById('live-tape');
    if (!tapeWrapper || !tape) return;
    
    const liveMatches = allMatches.filter(m => ['LIVE', 'TIMEOUT', 'UNDER REVIEW'].includes(m.status));
    const recent = allMatches.filter(m => m.status === 'COMPLETED').reverse().slice(0, 5);
    
    let items = [];
    liveMatches.forEach(m => {
        items.push(`<span style="color: var(--accent-deep);">LIVE</span> ${m.home_team_name} ${m.home_score !== null ? m.home_score : 0}-${m.away_score !== null ? m.away_score : 0} ${m.away_team_name}`);
    });
    recent.forEach(m => {
        items.push(`FT ${m.home_team_name} ${m.home_score}-${m.away_score} ${m.away_team_name}`);
    });
    
    if (items.length === 0) {
        tapeWrapper.style.display = 'none';
    } else {
        tapeWrapper.style.display = 'block';
        // Duplicate items so tape has enough length to scroll smoothly
        const text = items.join(' &nbsp;/&nbsp; ') + ' &nbsp;/&nbsp; ' + items.join(' &nbsp;/&nbsp; ');
        tape.innerHTML = text;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadHomepageData();
    setInterval(pollLiveMatches, 3000);
});

async function pollLiveMatches() {
    try {
        const matchesRes = await fetchAPI('/matches');
        if (matchesRes.success) {
            allMatches = matchesRes.data;
            const liveMatches = allMatches.filter(m => m.status === 'LIVE');
            
            const currentLiveIds = new Set(liveMatches.map(m => m.id));
            for (const match of liveMatches) {
                if (!previousLiveMatchIds.has(match.id)) {
                    showNotification(`Match Started: ${match.home_team_name} vs ${match.away_team_name}`);
                }
            }
            previousLiveMatchIds = currentLiveIds;

            renderHeroLive(allMatches);
            renderLiveRail(allMatches);
            updateLiveTape();
        }
    } catch (error) {
        console.error("Error polling matches", error);
    }
}

async function loadHomepageData() {
    try {
        const [matchesRes, eventsRes, teamsRes] = await Promise.all([
            fetchAPI('/matches'),
            fetchAPI('/events'),
            fetchAPI('/teams')
        ]);

        allMatches = matchesRes.success ? matchesRes.data : [];
        const events = eventsRes.success ? eventsRes.data : [];
        const teams = teamsRes.success ? teamsRes.data : [];
        
        const liveMatches = allMatches.filter(m => m.status === 'LIVE');
        previousLiveMatchIds = new Set(liveMatches.map(m => m.id));

        renderHeroLive(allMatches);
        renderLiveRail(allMatches);
        updateLiveTape();
        renderFeaturedTournament(events, allMatches);
        renderUpcoming(allMatches);
        renderResults(allMatches);
        renderTeams(teams);

    } catch (error) {
        console.error("Error loading homepage data", error);
    }
}

function renderHeroLive(matches) {
    const heroEl = document.getElementById('hero-live-feature');
    if (!heroEl) return;
    
    const liveMatches = matches.filter(m => ['LIVE', 'TIMEOUT', 'UNDER REVIEW'].includes(m.status));
    const nextMatches = matches.filter(m => m.status === 'SCHEDULED');
    
    let match = liveMatches.length > 0 ? liveMatches[0] : (nextMatches.length > 0 ? nextMatches[0] : null);
    
    // Ghost numeral update
    const ghost = document.getElementById('hero-ghost');
    if (ghost) {
        if (liveMatches.length > 0 && match.timer) {
            ghost.textContent = match.timer.substring(0, 2);
        } else {
            ghost.textContent = '00';
        }
    }
    
    if (!match) {
        heroEl.innerHTML = `
            <div class="hero-split-card" style="min-height: 250px;">
                <div class="hero-split-left">
                    <div class="hsc-status"><span class="tag"><span>NO MATCHES</span></span></div>
                    <div class="hsc-title">OFF SEASON</div>
                </div>
                <div class="hero-split-right">
                    <p style="font-weight: 700;">Check back later for upcoming fixtures.</p>
                </div>
            </div>
        `;
        return;
    }

    const isLive = liveMatches.length > 0;
    const statusTag = isLive ? `<span class="tag" style="background: var(--accent); color: var(--ink);"><span><span class="live-dot" style="background: var(--ink); display: inline-block; width: 8px; height: 8px; margin-right: 4px;"></span>LIVE</span></span>` : `<span class="tag"><span>KICK-OFF ${match.match_time ? match.match_time.substring(0,5) : 'TBA'}</span></span>`;
    
    // Calculate quarter for 4-segment bar (dummy logic based on timer if available, else 0)
    let segments = 0;
    if (isLive && match.timer) {
        const mins = parseInt(match.timer.split(':')[0]) || 0;
        if (mins > 0) segments = 1;
        if (mins >= 22) segments = 2;
        if (mins >= 45) segments = 3;
        if (mins >= 67) segments = 4;
    }

    let segmentBarHtml = isLive ? `
        <div class="segment-bar" style="margin-top: 2rem;">
            <div class="segment ${segments >= 1 ? 'filled' : ''}"></div>
            <div class="segment ${segments >= 2 ? 'filled' : ''}"></div>
            <div class="segment ${segments >= 3 ? 'filled' : ''}"></div>
            <div class="segment ${segments >= 4 ? 'filled' : ''}"></div>
        </div>
    ` : '';

    heroEl.innerHTML = `
        <div class="hero-split-card">
            <div class="hero-split-left">
                <div class="hsc-status">${statusTag}</div>
                <div class="hsc-title">${match.round || 'MATCH'}</div>
                ${segmentBarHtml}
            </div>
            <div class="hero-split-right">
                <div class="hsc-team-row">
                    <div>${match.home_team_name}</div>
                    <div class="hsc-score">${isLive && match.home_score !== null ? match.home_score : '-'}</div>
                </div>
                <div class="hsc-team-row">
                    <div>${match.away_team_name}</div>
                    <div class="hsc-score">${isLive && match.away_score !== null ? match.away_score : '-'}</div>
                </div>
                <div class="hsc-meta">
                    <div class="hsc-meta-item">
                        <span class="hsc-val">${isLive ? (match.timer || '00:00') : (match.match_date ? match.match_date.substring(5,10) : 'TBA')}</span>
                        <span class="hsc-lbl">${isLive ? 'MINUTE' : 'DATE'}</span>
                    </div>
                    <div class="hsc-meta-item" style="text-align: right;">
                        <span class="hsc-val" style="font-size: 1.25rem;">${match.venue_name || 'TBA'}</span>
                        <span class="hsc-lbl">VENUE</span>
                    </div>
                </div>
                <div style="margin-top: 2rem;">
                    <a href="pages/match.html?id=${match.id}" class="btn btn-secondary" style="width: 100%;">MATCH CENTER</a>
                </div>
            </div>
        </div>
    `;
}

function renderLiveRail(matches) {
    const railEl = document.getElementById('live-matches-rail');
    if (!railEl) return;
    
    const liveMatches = matches.filter(m => ['LIVE', 'TIMEOUT', 'UNDER REVIEW'].includes(m.status));
    const nextMatches = matches.filter(m => m.status === 'SCHEDULED');
    
    if (liveMatches.length === 0) {
        let nextMatchText = nextMatches.length > 0 ? `Next kick-off: ${nextMatches[0].home_team_name} vs ${nextMatches[0].away_team_name}` : '';
        railEl.innerHTML = `
            <div class="state-empty" style="background: var(--ink); border-color: var(--white); color: var(--white);">
                <h3 style="font-family: var(--font-display); font-style: italic;">NO MATCHES LIVE</h3>
                <p style="color: var(--muted-on-ink); font-weight: 700;">${nextMatchText}</p>
            </div>
        `;
        return;
    }

    let isWide = liveMatches.length === 1;
    let gridClass = isWide ? '' : 'grid-3';
    
    railEl.className = gridClass;
    railEl.innerHTML = liveMatches.map(match => `
        <a href="pages/match.html?id=${match.id}" class="card-live ${isWide ? 'card-live-wide' : ''}">
            <div class="card-live-header" style="display: flex; justify-content: space-between;">
                <span style="color: var(--accent); font-weight: 900;"><span class="live-dot" style="display: inline-block; width: 6px; height: 6px; margin-right: 4px;"></span>LIVE</span>
                <span style="font-variant-numeric: tabular-nums;">${match.timer || '00:00'}</span>
            </div>
            <div class="card-live-teams">
                <div class="card-live-team-row">
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${match.home_team_name}</span>
                    <span class="card-live-score">${match.home_score !== null ? match.home_score : 0}</span>
                </div>
                <div class="card-live-team-row">
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${match.away_team_name}</span>
                    <span class="card-live-score">${match.away_score !== null ? match.away_score : 0}</span>
                </div>
            </div>
            <div class="card-live-footer" style="padding-top: 1rem; display: flex; justify-content: space-between; align-items: center; font-weight: 700; text-transform: uppercase;">
                <span style="color: var(--muted-on-ink); font-size: 0.85rem;">${match.round || 'MATCH'}</span>
                <span style="color: var(--white); font-size: 0.85rem;">MATCH CENTER →</span>
            </div>
        </a>
    `).join('');
}

function renderFeaturedTournament(events, matches) {
    const featEl = document.getElementById('featured-tournament');
    if (!featEl) return;
    
    if (events.length === 0) {
        featEl.innerHTML = `<div class="state-empty" style="background: var(--ink); color: var(--white); border-color: var(--white);"><h3>NO ACTIVE TOURNAMENTS</h3></div>`;
        return;
    }

    const event = events[0];
    const eventMatches = matches.filter(m => m.event_id === event.id);
    const completedMatches = eventMatches.filter(m => m.status === 'COMPLETED').length;
    const totalMatches = eventMatches.length || 1; // avoid div by 0
    
    let segments = Math.floor((completedMatches / totalMatches) * 4);

    featEl.innerHTML = `
        <div class="hero-split-card">
            <div class="hero-split-left">
                <div class="hsc-status"><span class="tag"><span>FEATURED TOURNAMENT</span></span></div>
                <div class="hsc-title">${event.name}</div>
            </div>
            <div class="hero-split-right">
                <div class="hsc-meta" style="border-top: none; padding-top: 0; margin-bottom: auto;">
                    <div class="hsc-meta-item">
                        <span class="hsc-val">${eventMatches.length}</span>
                        <span class="hsc-lbl">MATCHES</span>
                    </div>
                    <div class="hsc-meta-item" style="text-align: right;">
                        <span class="hsc-val" style="font-size: 1.5rem;">${event.location || 'VARIOUS'}</span>
                        <span class="hsc-lbl">LOCATION</span>
                    </div>
                </div>
                
                <div class="segment-bar" style="margin: 2rem 0;">
                    <div class="segment ${segments >= 1 ? 'filled' : ''}" style="background: var(--ink);"></div>
                    <div class="segment ${segments >= 2 ? 'filled' : ''}" style="background: var(--ink);"></div>
                    <div class="segment ${segments >= 3 ? 'filled' : ''}" style="background: var(--ink);"></div>
                    <div class="segment ${segments >= 4 ? 'filled' : ''}" style="background: var(--ink);"></div>
                </div>
                
                <div>
                    <a href="pages/events.html" class="btn btn-primary" style="width: 100%;">VIEW TOURNAMENT</a>
                </div>
            </div>
        </div>
    `;
}

function renderUpcoming(matches) {
    const upNextEl = document.getElementById('upcoming-matches');
    if (!upNextEl) return;
    
    const upcoming = matches.filter(m => m.status === 'SCHEDULED').slice(0, 5);
    
    if (upcoming.length === 0) {
        upNextEl.innerHTML = `<div style="padding: 2rem; font-weight: 700; color: var(--muted-on-paper);">No upcoming matches.</div>`;
        return;
    }

    upNextEl.innerHTML = upcoming.map(match => `
        <a href="pages/match.html?id=${match.id}" class="fixture-row">
            <div class="f-time">${match.match_date ? match.match_date.substring(5,10) : ''}<br>${match.match_time ? match.match_time.substring(0,5) : 'TBA'}</div>
            <div class="f-team home">${match.home_team_name}</div>
            <div class="f-vs-score">VS</div>
            <div class="f-team away">${match.away_team_name}</div>
            <div class="f-action"><span class="tag tag-accent"><span>VIEW</span></span></div>
        </a>
    `).join('');
}

function renderResults(matches) {
    const resultsEl = document.getElementById('recent-results');
    if (!resultsEl) return;
    
    const completed = matches.filter(m => m.status === 'COMPLETED').reverse().slice(0, 5);
    
    if (completed.length === 0) {
        resultsEl.innerHTML = `<div style="padding: 2rem; font-weight: 700; color: var(--muted-on-paper);">No recent results.</div>`;
        return;
    }

    resultsEl.innerHTML = completed.map(match => {
        const homeWin = match.home_score > match.away_score;
        const awayWin = match.away_score > match.home_score;
        return `
        <a href="pages/match.html?id=${match.id}" class="fixture-row row-winner">
            <div class="f-time">${match.match_date ? match.match_date.substring(5,10) : ''}<br>FT</div>
            <div class="f-team home ${homeWin ? 'winner' : ''}">${match.home_team_name}</div>
            <div class="f-vs-score">${match.home_score} - ${match.away_score}</div>
            <div class="f-team away ${awayWin ? 'winner' : ''}">${match.away_team_name}</div>
            <div class="f-action"><span class="tag tag-accent"><span>RECAP</span></span></div>
        </a>
    `}).join('');
}

function renderTeams(teams) {
    const teamsEl = document.getElementById('teams-grid');
    if (!teamsEl) return;
    
    const topTeams = teams.slice(0, 8);
    
    if (topTeams.length === 0) {
        teamsEl.innerHTML = `<div class="state-empty" style="grid-column: 1 / -1; background: var(--ink); color: var(--white); border-color: var(--white);"><h3>NO TEAMS AVAILABLE</h3></div>`;
        return;
    }

    teamsEl.innerHTML = topTeams.map(team => {
        const pClass = getTeamPattern(team.name);
        return `
        <a href="pages/teams.html" class="team-card ${pClass}">
            <div class="team-badge">
                ${team.name.charAt(0)}
                <div class="badge-pattern"></div>
            </div>
            <div class="team-name">${team.name}</div>
            <div class="team-stats">${team.city || 'LOCATION TBA'}</div>
            <button class="btn btn-primary" style="color: var(--ink);">VIEW TEAM</button>
        </a>
    `}).join('');
}

function showNotification(message) {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.backgroundColor = 'var(--accent)';
    toast.style.color = 'var(--ink)';
    toast.style.padding = '1rem 1.5rem';
    toast.style.border = 'var(--border-xl) solid var(--ink)';
    toast.style.boxShadow = 'var(--shadow-sm)';
    toast.style.zIndex = '9999';
    toast.style.fontFamily = 'var(--font-display)';
    toast.style.fontWeight = '900';
    toast.style.fontStyle = 'italic';
    toast.style.textTransform = 'uppercase';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '0.5rem';

    toast.innerHTML = `<span class="live-dot" style="background: var(--ink); width: 8px; height: 8px;"></span> ${message}`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.transition = 'opacity 0.5s';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 5000);
}
