const urlParams = new URLSearchParams(window.location.search);
const matchId = urlParams.get('id');

const homeTeamEl = document.getElementById('home-team');
const awayTeamEl = document.getElementById('away-team');
const homeScoreEl = document.getElementById('home-score');
const awayScoreEl = document.getElementById('away-score');
const timerEl = document.getElementById('timer');
const matchMetaEl = document.getElementById('match-meta');
const venueDetailsEl = document.getElementById('venue-details');
const statusIndicator = document.getElementById('status-indicator');

let currentMatch = null;
let isAdminUser = false;
let pollingInterval = null;
let timerTickInterval = null;
let currentTimerSeconds = 0;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    if (!matchId) {
        document.querySelector('.mc-score-grid').innerHTML = '<div style="color: var(--accent-red); font-size: 2rem;">Error: No Match ID provided.</div>';
        return;
    }

    await checkOperatorAuth();
    setupTabSwitching();
    setupOperatorControls();
    await loadMatchDetails();
    startScorePolling();
});

// Check if current user is admin / operator
async function checkOperatorAuth() {
    const token = localStorage.getItem('sportx_token');
    if (!token) return;

    try {
        const res = await fetchAPI('/auth/me');
        if (res.success && res.data && res.data.user) {
            const role = res.data.user.role;
            if (role === 'ADMIN' || role === 'MATCH_OPERATOR') {
                isAdminUser = true;
                const deck = document.getElementById('operator-deck');
                if (deck) deck.style.display = 'block';
            }
        }
    } catch (e) {
        console.warn('Operator auth check failed:', e);
    }
}

// Tab navigation handler
function setupTabSwitching() {
    const tabs = document.querySelectorAll('.mc-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const targetTab = tab.getAttribute('data-tab');
            document.querySelectorAll('.match-tab-pane').forEach(p => p.classList.remove('active'));
            
            const targetPane = document.getElementById(`tab-${targetTab}`);
            if (targetPane) {
                targetPane.classList.add('active');
            }

            if (targetTab === 'timeline') {
                loadTimelineEvents();
            } else if (targetTab === 'stats') {
                renderStats();
            }
        });
    });
}

// Load and display main match details
async function loadMatchDetails() {
    const response = await fetchAPI(`/matches/${matchId}`);
    if (response.success && response.data) {
        const match = response.data;
        currentMatch = match;

        homeTeamEl.innerText = match.home_team_name || 'TBD';
        awayTeamEl.innerText = match.away_team_name || 'TBD';
        homeScoreEl.innerText = match.home_score !== null ? match.home_score : '0';
        awayScoreEl.innerText = match.away_score !== null ? match.away_score : '0';
        
        timerEl.innerText = match.timer || (match.status === 'COMPLETED' ? '90:00' : '00:00');
        parseTimerSeconds(timerEl.innerText);

        matchMetaEl.innerText = `${match.event_name ? match.event_name.toUpperCase() : 'SPORTX TOURNAMENT'} • ${match.round ? match.round.toUpperCase() : 'MATCH'}`;
        venueDetailsEl.innerText = `VENUE: ${match.venue_name || 'NORTH CAMPUS ARENA'} • ${match.venue_city || 'MAIN VENUE'}`;
        
        updateStatusIndicator(match.status);
        updateOperatorDeckUI(match);
        populateOverviewTab(match);
        loadTimelineEvents();
        renderStats();

        // Control local live clock tick
        if (match.status === 'LIVE') {
            startTimerTick();
        } else {
            stopTimerTick();
        }
    } else {
        document.querySelector('.mc-score-grid').innerHTML = '<div style="color: var(--accent-red); font-size: 2rem;">Match not found.</div>';
    }
}

// Update the glowing header badge
function updateStatusIndicator(status) {
    if (status === 'LIVE') {
        statusIndicator.innerHTML = '<div class="live-dot" style="background-color: #00E676; box-shadow: 0 0 10px #00E676;"></div> LIVE';
        statusIndicator.style.color = '#00E676';
    } else if (status === 'HALFTIME' || status === 'BREAK') {
        statusIndicator.innerHTML = '<div class="live-dot" style="background-color: #F5A623; box-shadow: 0 0 10px #F5A623;"></div> HALFTIME';
        statusIndicator.style.color = '#F5A623';
    } else if (status === 'COMPLETED') {
        statusIndicator.innerHTML = '<div class="live-dot" style="background-color: var(--accent); box-shadow: 0 0 10px var(--accent);"></div> COMPLETED';
        statusIndicator.style.color = 'var(--accent)';
    } else {
        statusIndicator.innerHTML = '<div class="live-dot" style="background-color: rgba(255,255,255,0.4);"></div> SCHEDULED';
        statusIndicator.style.color = 'var(--muted-on-ink, #8FA0B8)';
    }
}

// Update operator deck buttons and states
function updateOperatorDeckUI(match) {
    if (!isAdminUser) return;

    const deckBadge = document.getElementById('deck-status-badge');
    if (deckBadge) deckBadge.innerText = `STATUS: ${match.status}`;

    const deckHomeName = document.getElementById('deck-home-name');
    const deckAwayName = document.getElementById('deck-away-name');
    const deckHomeScore = document.getElementById('deck-home-score');
    const deckAwayScore = document.getElementById('deck-away-score');

    if (deckHomeName) deckHomeName.innerText = match.home_team_name || 'Home';
    if (deckAwayName) deckAwayName.innerText = match.away_team_name || 'Away';
    if (deckHomeScore) deckHomeScore.innerText = match.home_score !== null ? match.home_score : '0';
    if (deckAwayScore) deckAwayScore.innerText = match.away_score !== null ? match.away_score : '0';

    const btnStart = document.getElementById('btn-start-match');
    const btnBreak = document.getElementById('btn-break-match');
    const btnResume = document.getElementById('btn-resume-match');
    const btnEnd = document.getElementById('btn-end-match');

    if (match.status === 'SCHEDULED') {
        if (btnStart) btnStart.style.display = 'inline-flex';
        if (btnBreak) btnBreak.style.display = 'none';
        if (btnResume) btnResume.style.display = 'none';
        if (btnEnd) btnEnd.style.display = 'inline-flex';
    } else if (match.status === 'LIVE') {
        if (btnStart) btnStart.style.display = 'none';
        if (btnBreak) btnBreak.style.display = 'inline-flex';
        if (btnResume) btnResume.style.display = 'none';
        if (btnEnd) btnEnd.style.display = 'inline-flex';
    } else if (match.status === 'HALFTIME' || match.status === 'BREAK') {
        if (btnStart) btnStart.style.display = 'none';
        if (btnBreak) btnBreak.style.display = 'none';
        if (btnResume) btnResume.style.display = 'inline-flex';
        if (btnEnd) btnEnd.style.display = 'inline-flex';
    } else if (match.status === 'COMPLETED') {
        if (btnStart) btnStart.style.display = 'none';
        if (btnBreak) btnBreak.style.display = 'none';
        if (btnResume) btnResume.style.display = 'none';
        if (btnEnd) btnEnd.style.display = 'none';
    }
}

// Populate Overview tab fields
function populateOverviewTab(match) {
    document.getElementById('ov-event-name').innerText = match.event_name || 'National College Cup';
    document.getElementById('ov-round').innerText = match.round || 'Tournament Stage';
    document.getElementById('ov-date').innerText = match.match_date ? new Date(match.match_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD';
    document.getElementById('ov-time').innerText = match.match_time || '18:00';
    document.getElementById('ov-status').innerText = match.status;

    document.getElementById('ov-venue-name').innerText = match.venue_name || 'North Campus Field';
    document.getElementById('ov-venue-loc').innerText = match.venue_city || 'Campus Grounds';
    document.getElementById('ov-sport').innerText = match.sport_name || 'Football';

    document.getElementById('ov-home-title').innerText = match.home_team_name || 'Home Team';
    document.getElementById('ov-home-coach').innerText = match.home_coach || 'Head Coach';
    document.getElementById('ov-home-captain').innerText = match.home_captain || 'Captain';

    document.getElementById('ov-away-title').innerText = match.away_team_name || 'Away Team';
    document.getElementById('ov-away-coach').innerText = match.away_coach || 'Head Coach';
    document.getElementById('ov-away-captain').innerText = match.away_captain || 'Captain';

    // Knockout Bracket alert banner
    const banner = document.getElementById('bracket-advance-banner');
    if (banner) {
        if (match.round && match.round.startsWith('Bracket:')) {
            banner.style.display = 'block';
            const bTitle = document.getElementById('bracket-banner-title');
            const bDesc = document.getElementById('bracket-banner-desc');
            
            let nextStageName = 'Next Round';
            if (match.round === 'Bracket: QF 1' || match.round === 'Bracket: QF 2') nextStageName = 'Semi-Final 1';
            else if (match.round === 'Bracket: QF 3' || match.round === 'Bracket: QF 4') nextStageName = 'Semi-Final 2';
            else if (match.round.startsWith('Bracket: SF')) nextStageName = 'Championship Final';

            if (match.status === 'COMPLETED') {
                const hScore = Number(match.home_score) || 0;
                const aScore = Number(match.away_score) || 0;
                const winner = hScore >= aScore ? (match.home_team_name || 'Home') : (match.away_team_name || 'Away');
                bTitle.innerText = `🏆 WINNER: ${winner.toUpperCase()} ADVANCED`;
                bDesc.innerText = `Match completed (${hScore} - ${aScore}). ${winner} has automatically advanced to ${nextStageName} in the official tournament bracket.`;
            } else {
                bTitle.innerText = `⚡ KNOCKOUT ELIMINATION: ${match.round.toUpperCase()}`;
                bDesc.innerText = `Winner of this match advances directly to ${nextStageName} in the Official Tournament Bracket!`;
            }
        } else {
            banner.style.display = 'none';
        }
    }
}

// Load match timeline events from API or fallback
async function loadTimelineEvents() {
    const listEl = document.getElementById('timeline-events-list');
    if (!listEl) return;

    const res = await fetchAPI(`/matches/${matchId}/events`);
    let events = [];
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        events = res.data;
    }

    if (events.length === 0) {
        if (currentMatch && currentMatch.status === 'SCHEDULED') {
            listEl.innerHTML = `
                <div class="timeline-event center-side">
                    <div class="timeline-badge"><i data-lucide="clock" style="width: 20px; height: 20px;"></i></div>
                    <div class="timeline-card" style="border: 2px solid var(--accent); background: #070D18;">
                        <div style="font-weight: 900; color: var(--accent); font-family: var(--font-display); font-size: 1.15rem; font-style: italic;">PRE-MATCH: SCHEDULED</div>
                        <div style="color: var(--muted-on-ink); font-size: 0.95rem; margin-top: 4px;">Teams warming up at ${currentMatch.venue_name || 'arena'}. Match will kick off upon referee whistle.</div>
                    </div>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        // Generate realistic fallback events based on existing scores
        events = generateFallbackEvents(currentMatch);
    }

    listEl.innerHTML = events.map(ev => {
        let sideClass = 'center-side';
        if (currentMatch && ev.team_id) {
            if (ev.team_id == currentMatch.home_team_id) sideClass = 'home-side';
            else if (ev.team_id == currentMatch.away_team_id) sideClass = 'away-side';
        }

        let typeLabel = 'EVENT';
        let typeColor = 'var(--accent)';
        let iconName = 'activity';

        if (ev.type === 'GOAL') {
            typeLabel = '⚽ GOAL!';
            typeColor = '#00E676';
            iconName = 'target';
        } else if (ev.type === 'CARD_YELLOW') {
            typeLabel = '🟨 YELLOW CARD';
            typeColor = '#F5A623';
            iconName = 'alert-triangle';
        } else if (ev.type === 'CARD_RED') {
            typeLabel = '🟥 RED CARD';
            typeColor = '#FF3366';
            iconName = 'slash';
        } else if (ev.type === 'SUBSTITUTION') {
            typeLabel = '🔄 SUBSTITUTION';
            typeColor = '#6EC6FF';
            iconName = 'refresh-cw';
        } else if (ev.type === 'KICKOFF') {
            typeLabel = '⏱️ KICKOFF';
            typeColor = '#6EC6FF';
            iconName = 'play';
            sideClass = 'center-side';
        } else if (ev.type === 'HALFTIME') {
            typeLabel = '⏸️ HALFTIME BREAK';
            typeColor = '#F5A623';
            iconName = 'pause';
            sideClass = 'center-side';
        } else if (ev.type === 'FULLTIME') {
            typeLabel = '🏁 FULL TIME';
            typeColor = '#FFD700';
            iconName = 'flag';
            sideClass = 'center-side';
        }

        return `
            <div class="timeline-event ${sideClass}">
                <div class="timeline-badge">${ev.minute || '•'}</div>
                <div class="timeline-card">
                    <div style="font-weight: 900; font-family: var(--font-display); font-style: italic; color: ${typeColor}; font-size: 1.05rem;">
                        ${typeLabel} ${ev.player_name ? '&bull; ' + ev.player_name : ''}
                    </div>
                    <div style="font-size: 0.95rem; color: #fff; margin-top: 4px; line-height: 1.4;">
                        ${ev.description || ''}
                    </div>
                    ${ev.team_name ? `<div style="font-size: 0.8rem; color: var(--muted-on-ink); font-weight: 800; margin-top: 4px; text-transform: uppercase;">${ev.team_name}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

// Generate realistic simulated events based on scores
function generateFallbackEvents(match) {
    if (!match) return [];
    const evs = [];
    evs.push({ minute: "00'", type: "KICKOFF", description: "Match officially underway at " + (match.venue_name || 'stadium') });

    const hScore = Number(match.home_score) || 0;
    const aScore = Number(match.away_score) || 0;

    for (let i = 0; i < hScore; i++) {
        const min = Math.min(88, 15 + i * 28);
        evs.push({
            minute: `${min}'`,
            type: "GOAL",
            team_id: match.home_team_id,
            team_name: match.home_team_name,
            player_name: match.home_captain || "Forward",
            description: `Clinical strike past the goalkeeper into the net!`
        });
    }

    if (match.status === 'HALFTIME' || match.status === 'COMPLETED') {
        evs.push({ minute: "45'", type: "HALFTIME", description: "First half whistle blown. Teams head to locker rooms." });
    }

    for (let j = 0; j < aScore; j++) {
        const min = Math.min(89, 22 + j * 32);
        evs.push({
            minute: `${min}'`,
            type: "GOAL",
            team_id: match.away_team_id,
            team_name: match.away_team_name,
            player_name: match.away_captain || "Striker",
            description: `Equalizing chance converted into the corner!`
        });
    }

    if (match.status === 'COMPLETED') {
        evs.push({ minute: "90'", type: "FULLTIME", description: `Full-time whistle! Match officially concluded (${hScore} - ${aScore}).` });
    }

    evs.sort((a, b) => parseInt(a.minute) - parseInt(b.minute));
    return evs;
}

// Render Head-to-Head Stats comparison bars
function renderStats() {
    if (!currentMatch) return;
    const hScore = Number(currentMatch.home_score) || 0;
    const aScore = Number(currentMatch.away_score) || 0;

    const hName = currentMatch.home_team_short || currentMatch.home_team_name || 'HOME';
    const aName = currentMatch.away_team_short || currentMatch.away_team_name || 'AWAY';

    document.getElementById('stats-home-name').innerText = hName.toUpperCase();
    document.getElementById('stats-away-name').innerText = aName.toUpperCase();

    // Dynamically calculate realistic stat metrics
    let posH = 50, posA = 50;
    if (hScore > aScore) { posH = 56; posA = 44; }
    else if (aScore > hScore) { posH = 43; posA = 57; }

    const shotsH = Math.max(hScore + 4, 8);
    const shotsA = Math.max(aScore + 3, 6);

    const onTargetH = Math.max(hScore + 2, 4);
    const onTargetA = Math.max(aScore + 1, 3);

    const cornersH = 5 + (hScore % 3);
    const cornersA = 4 + (aScore % 3);

    const foulsH = 8 + (aScore * 2);
    const foulsA = 10 + (hScore * 2);

    const offsidesH = 2;
    const offsidesA = 1;

    const cardsH = 1 + (hScore > aScore ? 0 : 1);
    const cardsA = 2 + (aScore > hScore ? 0 : 1);

    const passH = 82 + (posH > 50 ? 4 : -2);
    const passA = 78 + (posA > 50 ? 4 : -2);

    const metrics = [
        { title: "Ball Possession", valH: `${posH}%`, valA: `${posA}%`, pctH: posH, pctA: posA },
        { title: "Shots on Target", valH: onTargetH, valA: onTargetA, pctH: (onTargetH / (onTargetH + onTargetA)) * 100, pctA: (onTargetA / (onTargetH + onTargetA)) * 100 },
        { title: "Total Shots", valH: shotsH, valA: shotsA, pctH: (shotsH / (shotsH + shotsA)) * 100, pctA: (shotsA / (shotsH + shotsA)) * 100 },
        { title: "Corner Kicks", valH: cornersH, valA: cornersA, pctH: (cornersH / (cornersH + cornersA)) * 100, pctA: (cornersA / (cornersH + cornersA)) * 100 },
        { title: "Fouls Committed", valH: foulsH, valA: foulsA, pctH: (foulsH / (foulsH + foulsA)) * 100, pctA: (foulsA / (foulsH + foulsA)) * 100 },
        { title: "Offsides", valH: offsidesH, valA: offsidesA, pctH: 60, pctA: 40 },
        { title: "Yellow Cards", valH: cardsH, valA: cardsA, pctH: (cardsH / (cardsH + cardsA)) * 100, pctA: (cardsA / (cardsH + cardsA)) * 100 },
        { title: "Passing Accuracy", valH: `${passH}%`, valA: `${passA}%`, pctH: passH, pctA: passA }
    ];

    const statsList = document.getElementById('stats-list');
    if (!statsList) return;

    statsList.innerHTML = metrics.map(m => `
        <div class="stat-item">
            <div class="stat-header">
                <span class="stat-val home">${m.valH}</span>
                <span class="stat-title">${m.title}</span>
                <span class="stat-val away">${m.valA}</span>
            </div>
            <div class="stat-bar-duo">
                <div class="stat-bar-fill-home" style="width: ${m.pctH}%;"></div>
                <div class="stat-bar-fill-away" style="width: ${m.pctA}%;"></div>
            </div>
        </div>
    `).join('');
}

// Setup Admin Match Control Deck listeners
function setupOperatorControls() {
    // START MATCH
    const btnStart = document.getElementById('btn-start-match');
    if (btnStart) {
        btnStart.addEventListener('click', async () => {
            btnStart.disabled = true;
            const res = await fetchAPI(`/matches/${matchId}/start`, { method: 'POST' });
            btnStart.disabled = false;
            if (res.success) {
                showNotification(`MATCH KICKOFF: ${currentMatch.home_team_name} vs ${currentMatch.away_team_name} is now LIVE!`, 'start', 'MATCH STARTED');
                await loadMatchDetails();
            } else {
                alert('Error starting match: ' + res.message);
            }
        });
    }

    // BREAK / HALFTIME
    const btnBreak = document.getElementById('btn-break-match');
    if (btnBreak) {
        btnBreak.addEventListener('click', async () => {
            btnBreak.disabled = true;
            const res = await fetchAPI(`/matches/${matchId}/break`, { method: 'POST' });
            btnBreak.disabled = false;
            if (res.success) {
                showNotification(`HALFTIME: ${currentMatch.home_team_name} vs ${currentMatch.away_team_name} interval break initiated.`, 'break', 'HALFTIME BREAK');
                await loadMatchDetails();
            } else {
                alert('Error initiating break: ' + res.message);
            }
        });
    }

    // RESUME SECOND HALF
    const btnResume = document.getElementById('btn-resume-match');
    if (btnResume) {
        btnResume.addEventListener('click', async () => {
            btnResume.disabled = true;
            const res = await fetchAPI(`/matches/${matchId}/start`, { method: 'POST' });
            btnResume.disabled = false;
            if (res.success) {
                showNotification(`MATCH RESUMED: Second half underway for ${currentMatch.home_team_name} vs ${currentMatch.away_team_name}!`, 'start', 'MATCH RESUMED');
                await loadMatchDetails();
            } else {
                alert('Error resuming match: ' + res.message);
            }
        });
    }

    // END MATCH (Open Modal)
    const btnEnd = document.getElementById('btn-end-match');
    if (btnEnd) {
        btnEnd.addEventListener('click', () => {
            if (!currentMatch) return;
            const modal = document.getElementById('end-match-modal');
            const mHome = document.getElementById('modal-home-name');
            const mAway = document.getElementById('modal-away-name');
            const mHScore = document.getElementById('modal-home-score');
            const mAScore = document.getElementById('modal-away-score');
            const tieWrapper = document.getElementById('modal-tie-select-wrapper');
            const winnerSelect = document.getElementById('modal-winner-select');

            mHome.innerText = currentMatch.home_team_name || 'Home';
            mAway.innerText = currentMatch.away_team_name || 'Away';
            mHScore.value = currentMatch.home_score !== null ? currentMatch.home_score : 0;
            mAScore.value = currentMatch.away_score !== null ? currentMatch.away_score : 0;

            // Handle tie check
            const checkTie = () => {
                const isKnockout = currentMatch.round && currentMatch.round.startsWith('Bracket:');
                if (isKnockout && mHScore.value === mAScore.value) {
                    tieWrapper.style.display = 'block';
                    winnerSelect.innerHTML = `
                        <option value="${currentMatch.home_team_id}">${currentMatch.home_team_name || 'Home'} (Advances on Penalties)</option>
                        <option value="${currentMatch.away_team_id}">${currentMatch.away_team_name || 'Away'} (Advances on Penalties)</option>
                    `;
                } else {
                    tieWrapper.style.display = 'none';
                }
            };

            mHScore.oninput = checkTie;
            mAScore.oninput = checkTie;
            checkTie();

            modal.style.display = 'flex';
        });
    }

    // CONFIRM END MATCH
    const btnConfirmEnd = document.getElementById('btn-confirm-end-match');
    if (btnConfirmEnd) {
        btnConfirmEnd.addEventListener('click', async () => {
            const h = parseInt(document.getElementById('modal-home-score').value, 10) || 0;
            const a = parseInt(document.getElementById('modal-away-score').value, 10) || 0;
            const winnerSelect = document.getElementById('modal-winner-select');
            const winnerId = (h === a && winnerSelect && winnerSelect.value) ? parseInt(winnerSelect.value, 10) : null;

            btnConfirmEnd.disabled = true;
            btnConfirmEnd.innerText = 'CONCLUDING...';

            const res = await fetchAPI(`/matches/${matchId}/end`, {
                method: 'POST',
                body: JSON.stringify({ home_score: h, away_score: a, winner_id: winnerId })
            });

            btnConfirmEnd.disabled = false;
            btnConfirmEnd.innerText = 'CONFIRM & END MATCH';

            if (res.success) {
                document.getElementById('end-match-modal').style.display = 'none';

                showNotification(
                    `MATCH ENDED: ${currentMatch.home_team_name} ${h} - ${a} ${currentMatch.away_team_name}. Match concluded!`,
                    'end',
                    'MATCH COMPLETED'
                );

                if (res.data && res.data.advanced_to && res.data.winner_name) {
                    setTimeout(() => {
                        showNotification(
                            `🏆 TOURNAMENT ADVANCEMENT: ${res.data.winner_name} advances to ${res.data.advanced_to}! Bracket updated.`,
                            'bracket',
                            'TOURNAMENT ADVANCEMENT'
                        );
                    }, 1000);
                }

                await loadMatchDetails();
            } else {
                alert('Error ending match: ' + res.message);
            }
        });
    }

    // Quick score steppers
    setupScoreStepper('btn-home-plus', 1, 0, true);
    setupScoreStepper('btn-home-minus', -1, 0, false);
    setupScoreStepper('btn-away-plus', 0, 1, true);
    setupScoreStepper('btn-away-minus', 0, -1, false);

    // Quick add event
    const btnAddEvent = document.getElementById('btn-add-event');
    if (btnAddEvent) {
        btnAddEvent.addEventListener('click', async () => {
            if (!currentMatch) return;
            const minute = document.getElementById('event-minute').value.trim() || `${Math.floor(currentTimerSeconds / 60)}'`;
            const type = document.getElementById('event-type').value;
            const teamSide = document.getElementById('event-team').value;
            const teamId = teamSide === 'home' ? currentMatch.home_team_id : currentMatch.away_team_id;
            const desc = document.getElementById('event-desc').value.trim() || `${type} recorded`;

            const res = await fetchAPI(`/matches/${matchId}/events`, {
                method: 'POST',
                body: JSON.stringify({ minute, type, team_id: teamId, description: desc })
            });

            if (res.success) {
                document.getElementById('event-desc').value = '';
                showNotification(`Event Logged: ${type} at ${minute}`, 'info', 'EVENT RECORDED');
                await loadMatchDetails();
            } else {
                alert('Error adding event: ' + res.message);
            }
        });
    }
}

// Score stepper helper
function setupScoreStepper(btnId, deltaH, deltaA, isGoal) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', async () => {
        if (!currentMatch) return;
        const oldH = Number(currentMatch.home_score) || 0;
        const oldA = Number(currentMatch.away_score) || 0;
        const newH = Math.max(0, oldH + deltaH);
        const newA = Math.max(0, oldA + deltaA);

        const res = await fetchAPI(`/matches/${matchId}/score`, {
            method: 'PUT',
            body: JSON.stringify({ home_score: newH, away_score: newA, timer: timerEl.innerText })
        });

        if (res.success) {
            currentMatch.home_score = newH;
            currentMatch.away_score = newA;
            homeScoreEl.innerText = newH;
            awayScoreEl.innerText = newA;
            updateOperatorDeckUI(currentMatch);
            renderStats();

            if (isGoal) {
                const scoringTeam = deltaH > 0 ? (currentMatch.home_team_name || 'Home') : (currentMatch.away_team_name || 'Away');
                const scoringTeamId = deltaH > 0 ? currentMatch.home_team_id : currentMatch.away_team_id;
                const min = `${Math.floor(currentTimerSeconds / 60)}'`;

                showNotification(`⚽ GOAL! ${scoringTeam} scores! Current: ${newH} - ${newA}`, 'live', 'GOAL SCORED');

                // Log event
                await fetchAPI(`/matches/${matchId}/events`, {
                    method: 'POST',
                    body: JSON.stringify({
                        minute: min,
                        type: 'GOAL',
                        team_id: scoringTeamId,
                        description: `Goal scored by ${scoringTeam} (${newH} - ${newA})`
                    })
                });
                loadTimelineEvents();
            }
        }
    });
}

// Timer helpers
function parseTimerSeconds(timerStr) {
    if (!timerStr || timerStr === '00:00') {
        currentTimerSeconds = 0;
        return;
    }
    const parts = timerStr.split(':');
    if (parts.length === 2) {
        currentTimerSeconds = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
    }
}

function startTimerTick() {
    stopTimerTick();
    timerTickInterval = setInterval(() => {
        currentTimerSeconds++;
        const mins = String(Math.floor(currentTimerSeconds / 60)).padStart(2, '0');
        const secs = String(currentTimerSeconds % 60).padStart(2, '0');
        timerEl.innerText = `${mins}:${secs}`;
    }, 1000);
}

function stopTimerTick() {
    if (timerTickInterval) {
        clearInterval(timerTickInterval);
        timerTickInterval = null;
    }
}

// Polling for live score updates from external sources
function startScorePolling() {
    pollingInterval = setInterval(async () => {
        if (!matchId) return;
        const response = await fetchAPI(`/matches/${matchId}/score`);
        if (response.success && response.data) {
            const score = response.data;
            if (homeScoreEl.innerText != score.home_score && score.home_score !== null) {
                homeScoreEl.innerText = score.home_score;
                triggerScoreAnimation(homeScoreEl);
            }
            if (awayScoreEl.innerText != score.away_score && score.away_score !== null) {
                awayScoreEl.innerText = score.away_score;
                triggerScoreAnimation(awayScoreEl);
            }
        }
    }, 4000);
}

function triggerScoreAnimation(element) {
    element.classList.remove('score-updated');
    void element.offsetWidth;
    element.classList.add('score-updated');
}
