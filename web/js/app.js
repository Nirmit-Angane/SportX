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

// Helper for Team Short Code & Initials
function getTeamCode(teamName, shortName) {
    if (shortName && shortName.trim().length > 0) return shortName.trim().toUpperCase();
    if (!teamName) return 'TBA';
    const words = teamName.trim().split(/\s+/);
    if (words.length >= 2) {
        return (words[0].substring(0, 2) + words[1].substring(0, 1)).toUpperCase();
    }
    return teamName.substring(0, 3).toUpperCase();
}

function getTeamInitial(teamName) {
    if (!teamName) return '?';
    const words = teamName.trim().split(/\s+/);
    if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }
    return teamName.substring(0, 2).toUpperCase();
}

function renderHeroLive(matches) {
    const heroEl = document.getElementById('hero-live-feature');
    if (!heroEl) return;
    
    const liveMatches = matches.filter(m => ['LIVE', 'TIMEOUT', 'UNDER REVIEW'].includes(m.status));
    const nextMatches = matches.filter(m => m.status === 'SCHEDULED');
    const pastMatches = matches.filter(m => m.status === 'COMPLETED');
    
    let match = liveMatches.length > 0 ? liveMatches[0] : (nextMatches.length > 0 ? nextMatches[0] : (pastMatches.length > 0 ? pastMatches[pastMatches.length - 1] : null));
    
    // Ghost numeral update
    const ghost = document.getElementById('hero-ghost');
    if (ghost) {
        if (liveMatches.length > 0 && match && match.timer) {
            ghost.textContent = match.timer.substring(0, 2);
        } else if (match && (match.home_score !== null || match.away_score !== null)) {
            const h = match.home_score !== null ? match.home_score : 0;
            const a = match.away_score !== null ? match.away_score : 0;
            ghost.textContent = `${h}${a}`.slice(-2);
        } else {
            ghost.textContent = '00';
        }
    }
    
    if (!match) {
        heroEl.innerHTML = `
            <div class="hero-scoreboard">
                <div class="hsb-header">
                    <div class="hsb-header-left">
                        <div class="hsb-live-badge is-scheduled">
                            <span>FIXTURES</span>
                        </div>
                        <div class="hsb-event-pill">
                            <i data-lucide="calendar"></i>
                            <span>OFF-SEASON</span>
                        </div>
                    </div>
                    <div class="hsb-header-right">
                        <span class="hsb-round-tag">NO LIVE ACTION</span>
                    </div>
                </div>
                <div class="hsb-arena" style="grid-template-columns: 1fr; text-align: center; padding: 2.25rem 1.25rem;">
                    <div style="font-family: var(--font-display); font-size: 2rem; font-style: italic; color: var(--white); text-transform: uppercase;">
                        STADIUM STANDBY
                    </div>
                    <p style="color: var(--muted-on-ink); font-size: 0.95rem; margin-top: 0.4rem;">
                        No live fixtures currently underway. Check the tournament schedule for upcoming matchdays.
                    </p>
                </div>
                <div class="hsb-footer">
                    <div class="hsb-venue">
                        <i data-lucide="map-pin"></i>
                        <span>SPORTX CENTRAL ARENA</span>
                    </div>
                    <a href="pages/matches.html" class="hsb-btn">
                        <span>VIEW SCHEDULE</span>
                        <i data-lucide="arrow-right" class="hsb-btn-arrow"></i>
                    </a>
                </div>
            </div>
        `;
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
        return;
    }

    const isLive = ['LIVE', 'TIMEOUT', 'UNDER REVIEW'].includes(match.status);
    const isCompleted = match.status === 'COMPLETED';
    const isScheduled = match.status === 'SCHEDULED';
    
    // Status Badge Logic
    let statusBadgeClass = 'is-scheduled';
    let statusBadgeHtml = '<span>UPCOMING</span>';
    if (match.status === 'LIVE') {
        statusBadgeClass = 'is-live';
        statusBadgeHtml = `<span class="live-dot"></span><span>LIVE</span>`;
    } else if (match.status === 'TIMEOUT') {
        statusBadgeClass = 'is-timeout';
        statusBadgeHtml = `<span class="live-dot" style="background:#000;"></span><span>TIMEOUT</span>`;
    } else if (match.status === 'UNDER REVIEW') {
        statusBadgeClass = 'is-review';
        statusBadgeHtml = `<span class="live-dot" style="background:#000;"></span><span>VAR REVIEW</span>`;
    } else if (isCompleted) {
        statusBadgeClass = 'is-completed';
        statusBadgeHtml = `<span>FINAL</span>`;
    }

    // Match Timeline / Quarters calculation
    const timerStr = match.timer || '00:00';
    const mins = parseInt(timerStr.split(':')[0]) || 0;
    let segs = 0;
    if (isLive) {
        if (mins >= 1) segs = 1;
        if (mins >= 23) segs = 2;
        if (mins >= 46) segs = 3;
        if (mins >= 68) segs = 4;
    } else if (isCompleted) {
        segs = 4;
    }

    // Period / Status label under score
    let periodText = 'MATCHDAY';
    if (match.status === 'TIMEOUT') periodText = 'TIMEOUT';
    else if (match.status === 'UNDER REVIEW') periodText = 'VAR REVIEW';
    else if (isCompleted) periodText = 'FULL TIME';
    else if (isLive) periodText = mins <= 45 ? '1ST HALF' : '2ND HALF';
    else if (match.match_time) periodText = `KICKOFF ${match.match_time.substring(0, 5)}`;

    // Team metadata
    const homePattern = getTeamPattern(match.home_team_name || 'Home');
    const awayPattern = getTeamPattern(match.away_team_name || 'Away');
    const homeInitial = getTeamInitial(match.home_team_name || 'Home');
    const awayInitial = getTeamInitial(match.away_team_name || 'Away');
    const homeCode = getTeamCode(match.home_team_name, match.home_team_short);
    const awayCode = getTeamCode(match.away_team_name, match.away_team_short);
    const eventName = match.event_name || 'SPORTX CHAMPIONSHIP';
    const roundText = (match.round || 'ROUND OF 16').toUpperCase();
    const venueName = match.venue_name || 'MAIN STADIUM';

    const homeScore = match.home_score !== null ? match.home_score : 0;
    const awayScore = match.away_score !== null ? match.away_score : 0;
    const homeLead = (isLive || isCompleted) && homeScore > awayScore;
    const awayLead = (isLive || isCompleted) && awayScore > homeScore;

    // Center Clash Zone HTML
    let clashCenterHtml = '';
    if (isLive || isCompleted) {
        clashCenterHtml = `
            <div class="hsb-clash-center">
                <div class="hsb-score-board">
                    <span class="hsb-score-num ${homeLead ? 'is-leader' : ''}">${match.home_score !== null ? match.home_score : 0}</span>
                    <span class="hsb-score-sep">:</span>
                    <span class="hsb-score-num ${awayLead ? 'is-leader' : ''}">${match.away_score !== null ? match.away_score : 0}</span>
                </div>
                <div class="hsb-period-tag">${periodText}</div>
                <div class="hsb-rail">
                    <div class="hsb-rail-seg ${segs >= 1 ? 'active' : ''}"></div>
                    <div class="hsb-rail-seg ${segs >= 2 ? 'active' : ''}"></div>
                    <div class="hsb-rail-seg ${segs >= 3 ? 'active' : ''}"></div>
                    <div class="hsb-rail-seg ${segs >= 4 ? 'active' : ''}"></div>
                </div>
            </div>
        `;
    } else {
        clashCenterHtml = `
            <div class="hsb-clash-center">
                <div class="hsb-vs-badge">VS</div>
                <div class="hsb-kickoff-time">${match.match_time ? match.match_time.substring(0, 5) : 'TBA'}</div>
                <span class="hsb-kickoff-sub">${match.match_date ? match.match_date.substring(5, 10) : 'SCHEDULED'}</span>
            </div>
        `;
    }

    heroEl.innerHTML = `
        <div class="hero-scoreboard">
            <div class="hsb-header">
                <div class="hsb-header-left">
                    <div class="hsb-live-badge ${statusBadgeClass}">
                        ${statusBadgeHtml}
                    </div>
                    <div class="hsb-event-pill" title="${eventName}">
                        <i data-lucide="trophy"></i>
                        <span>${eventName}</span>
                    </div>
                </div>
                <div class="hsb-header-right">
                    <span class="hsb-round-tag">${roundText}</span>
                    ${isLive ? `
                        <div class="hsb-clock-pill">
                            <i data-lucide="clock"></i>
                            <span class="hsb-clock-val">${timerStr}</span>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="hsb-arena">
                <div class="hsb-team hsb-team-home">
                    <div class="hsb-crest-wrap">
                        <div class="team-badge ${homePattern} hsb-crest">
                            <div class="badge-pattern"></div>
                            <span>${homeInitial}</span>
                        </div>
                    </div>
                    <div class="hsb-team-info">
                        <span class="hsb-team-role">HOME</span>
                        <h4 class="hsb-team-name" title="${match.home_team_name || 'Home'}">${match.home_team_name || 'Home'}</h4>
                        <span class="hsb-team-code">${homeCode}</span>
                    </div>
                </div>

                ${clashCenterHtml}

                <div class="hsb-team hsb-team-away">
                    <div class="hsb-crest-wrap">
                        <div class="team-badge ${awayPattern} hsb-crest">
                            <div class="badge-pattern"></div>
                            <span>${awayInitial}</span>
                        </div>
                    </div>
                    <div class="hsb-team-info">
                        <span class="hsb-team-role">AWAY</span>
                        <h4 class="hsb-team-name" title="${match.away_team_name || 'Away'}">${match.away_team_name || 'Away'}</h4>
                        <span class="hsb-team-code">${awayCode}</span>
                    </div>
                </div>
            </div>

            <div class="hsb-footer">
                <div class="hsb-venue">
                    <i data-lucide="map-pin"></i>
                    <span>${venueName}</span>
                </div>
                <a href="pages/match.html?id=${match.id}" class="hsb-btn">
                    <span>MATCH CENTER</span>
                    <i data-lucide="arrow-right" class="hsb-btn-arrow"></i>
                </a>
            </div>
        </div>
    `;

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
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
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, 'start', 'MATCH STARTED');
    }
}

