document.addEventListener('DOMContentLoaded', async () => {
    // Check if authenticated
    const meRes = await fetchAPI('/auth/me');
    if (!meRes.success) {
        window.location.href = 'login.html';
        return;
    }

    const userInfo = document.getElementById('user-info');
    if (userInfo && meRes.data && meRes.data.user) {
        userInfo.innerText = meRes.data.user.username;
    }

    lucide.createIcons();
    
    // Add event listeners to tabs
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            switchAdminTab(btn.getAttribute('data-target'));
        });
    });

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutAdmin);
    }

    switchAdminTab('dashboard');
});

function switchAdminTab(tabId) {
    document.querySelectorAll('.nav-item').forEach(t => {
        t.classList.remove('active', 'btn-primary');
        t.classList.add('btn-secondary');
    });
    document.querySelectorAll('.section-view').forEach(s => s.classList.remove('active'));
    
    const targetBtn = document.querySelector(`.nav-item[data-target="${tabId}"]`);
    if (targetBtn) {
        targetBtn.classList.add('active', 'btn-primary');
        targetBtn.classList.remove('btn-secondary');
    }
    
    const targetView = document.getElementById(`view-${tabId}`);
    if (targetView) targetView.classList.add('active');
    
    const title = document.getElementById('page-title');
    if (title) title.innerText = tabId.replace('-', ' ').toUpperCase();

    if (tabId === 'dashboard') loadDashboard();
    else if (tabId === 'matches') loadMatches();
    else if (tabId === 'events') loadEvents();
    else if (tabId === 'teams') loadTeams();
    else if (tabId === 'brackets') {
        loadBrackets();
        setTimeout(() => {
            if (typeof drawBracketTree === 'function') {
                drawBracketTree('admin-bracket-container', 'admin-');
            }
        }, 150);
    }
    else if (tabId === 'live-score') loadLiveScoreTab();
}

async function loadDashboard() {
    try {
        const eventsRes = await fetchAPI('/events');
        const teamsRes = await fetchAPI('/teams');
        const matchesRes = await fetchAPI('/matches');
        
        if (eventsRes.success) {
            document.getElementById('stat-events').innerText = eventsRes.data.length;
        }
        if (teamsRes.success) {
            document.getElementById('stat-teams').innerText = teamsRes.data.length;
        }
        if (matchesRes.success) {
            const live = matchesRes.data.filter(m => m.status === 'LIVE').length;
            const liveStat = document.getElementById('stat-live');
            if (liveStat) liveStat.innerText = live;
            
            const tbody = document.getElementById('dashboard-recent-matches');
            if (tbody) {
                tbody.innerHTML = matchesRes.data.slice(0, 5).map(m => `
                <tr>
                    <td>${m.start_time ? m.start_time.substring(0,10) : 'TBA'}</td>
                    <td>${m.home_team_name} vs ${m.away_team_name}</td>
                    <td>${m.status}</td>
                    <td><a href="pages/match.html?id=${m.id}" class="text-blue">View</a></td>
                </tr>
            `).join('');
            }
        }
    } catch (e) {
        console.error(e);
    }
}

async function loadEvents() {
    const res = await fetchAPI('/events');
    const tbody = document.getElementById('events-table-body');
    if (res.success) {
        tbody.innerHTML = res.data.map(e => `
            <tr>
                <td>${e.id}</td>
                <td>${e.name}</td>
                <td>${e.location || '-'}</td>
                <td>${e.start_date ? e.start_date.substring(0,10) : '-'}</td>
                <td>${e.end_date ? e.end_date.substring(0,10) : '-'}</td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Error loading events</td></tr>';
    }
}

async function loadTeams() {
    const res = await fetchAPI('/teams');
    const tbody = document.getElementById('teams-table-body');
    if (res.success) {
        tbody.innerHTML = res.data.map(t => `
            <tr>
                <td>${t.id}</td>
                <td>${t.name}</td>
                <td>${t.coach_name || '-'}</td>
                <td>${t.captain_name || '-'}</td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Error loading teams</td></tr>';
    }
}

async function loadMatches() {
    const res = await fetchAPI('/matches');
    const tbody = document.getElementById('matches-table-body');
    if (res.success) {
        tbody.innerHTML = res.data.map(m => {
            let statusBadge = `<span style="padding: 2px 8px; font-weight: 800; font-size: 0.85rem; border: 1px solid rgba(255,255,255,0.2);">${m.status}</span>`;
            if (m.status === 'LIVE') {
                statusBadge = `<span style="padding: 2px 8px; font-weight: 800; font-size: 0.85rem; background: var(--accent-red, #FF3366); color: #fff; box-shadow: 0 0 8px rgba(255,51,102,0.6);">● LIVE</span>`;
            } else if (m.status === 'HALFTIME' || m.status === 'BREAK') {
                statusBadge = `<span style="padding: 2px 8px; font-weight: 800; font-size: 0.85rem; background: #F5A623; color: #000;">⏸ HALFTIME</span>`;
            } else if (m.status === 'COMPLETED') {
                statusBadge = `<span style="padding: 2px 8px; font-weight: 800; font-size: 0.85rem; background: rgba(255,255,255,0.1); color: var(--accent);">COMPLETED</span>`;
            }
            return `
            <tr>
                <td>${m.id}</td>
                <td>${m.event_name || '-'}</td>
                <td style="font-weight: 700;">${m.home_team_name || 'TBD'}</td>
                <td style="font-weight: 700;">${m.away_team_name || 'TBD'}</td>
                <td>${statusBadge}</td>
                <td>
                    <a href="pages/match.html?id=${m.id}" target="_blank" class="text-blue" style="font-weight: 800; text-decoration: underline; margin-right: 10px;">View</a>
                    <button class="btn btn-secondary" onclick="controlMatchInAdmin(${m.id})" style="padding: 4px 10px; font-size: 0.8rem; font-weight: 900;"><span>Control Score</span></button>
                </td>
            </tr>
        `}).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Error loading matches</td></tr>';
    }
}

async function logoutAdmin() {
    await fetchAPI('/auth/logout', { method: 'POST' });
    localStorage.removeItem('sportx_token');
    window.location.href = 'login.html';
}

async function loadBrackets() {
    const res = await fetchAPI('/events');
    const select = document.getElementById('admin-bracket-event');
    if (res.success && select && res.data.length > 0) {
        select.innerHTML = res.data.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
        if (!select.value || select.value === '') {
            select.value = res.data[0].id;
        }
        loadAdminBracket(select.value);
    }
}

async function loadAdminBracket(eventId) {
    if (!eventId) {
        document.getElementById('admin-bracket-view').style.display = 'none';
        document.getElementById('admin-no-bracket').style.display = 'none';
        return;
    }
    
    const res = await fetchAPI('/matches?event_id=' + eventId);
    if (res.success) {
        const matches = res.data.filter(m => m.round && m.round.startsWith('Bracket:'));
        
        if (matches.length > 0) {
            document.getElementById('admin-no-bracket').style.display = 'none';
            document.getElementById('admin-bracket-view').style.display = 'block';
            
            const qf1 = matches.find(m => m.round === 'Bracket: QF 1');
            const qf2 = matches.find(m => m.round === 'Bracket: QF 2');
            const qf3 = matches.find(m => m.round === 'Bracket: QF 3');
            const qf4 = matches.find(m => m.round === 'Bracket: QF 4');
            const sf1 = matches.find(m => m.round === 'Bracket: SF 1');
            const sf2 = matches.find(m => m.round === 'Bracket: SF 2');
            const finalMatch = matches.find(m => m.round === 'Bracket: Final');
            
            const renderMatch = (m) => {
                if (!m) return `
                    <div class="team"><span>TBD</span><span class="score">-</span></div>
                    <div class="team"><span>TBD</span><span class="score">-</span></div>
                `;
                let hWin = false, aWin = false;
                if (m.status === 'COMPLETED') {
                    if (m.home_score > m.away_score) hWin = true;
                    if (m.away_score > m.home_score) aWin = true;
                }
                const hScore = m.home_team_name ? (m.home_score !== null ? m.home_score : '-') : '-';
                const aScore = m.away_team_name ? (m.away_score !== null ? m.away_score : '-') : '-';
                return `
                    <div class="team ${hWin ? 'winner' : ''}">
                        <span>${m.home_team_name || 'TBD'}</span>
                        <span class="score">${hScore}</span>
                    </div>
                    <div class="team ${aWin ? 'winner' : ''}">
                        <span>${m.away_team_name || 'TBD'}</span>
                        <span class="score">${aScore}</span>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--accent); margin-top: 6px; display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 4px;">
                        <span>${m.status}</span>
                        <a href="pages/match.html?id=${m.id}" target="_blank" style="color: var(--accent); text-decoration: underline;">Open</a>
                    </div>
                `;
            };
            
            document.getElementById('admin-qf1').innerHTML = renderMatch(qf1);
            document.getElementById('admin-qf2').innerHTML = renderMatch(qf2);
            document.getElementById('admin-qf3').innerHTML = renderMatch(qf3);
            document.getElementById('admin-qf4').innerHTML = renderMatch(qf4);
            document.getElementById('admin-sf1').innerHTML = renderMatch(sf1);
            document.getElementById('admin-sf2').innerHTML = renderMatch(sf2);
            document.getElementById('admin-final').innerHTML = renderMatch(finalMatch);

            requestAnimationFrame(() => {
                if (typeof drawBracketTree === 'function') {
                    drawBracketTree('admin-bracket-container', 'admin-');
                }
            });
            setTimeout(() => {
                if (typeof drawBracketTree === 'function') {
                    drawBracketTree('admin-bracket-container', 'admin-');
                }
            }, 100);
            
        } else {
            document.getElementById('admin-bracket-view').style.display = 'none';
            document.getElementById('admin-no-bracket').style.display = 'block';
        }
    }
}

async function generateBracket() {
    const eventId = document.getElementById('admin-bracket-event').value;
    if (!eventId) return alert("Please select an event first.");
    
    if (confirm("Are you sure? This will delete any existing brackets for this event!")) {
        const res = await fetchAPI('/matches/generate-bracket', {
            method: 'POST',
            body: JSON.stringify({ event_id: eventId })
        });
        if (res.success) {
            alert("Bracket generated successfully!");
            loadAdminBracket(eventId);
        } else {
            alert("Error: " + res.message);
        }
    }
}

let currentAdminMatch = null;
let adminTimerSeconds = 0;
let adminTimerInterval = null;
let adminControlsInitialized = false;

// Quick jump to control a match from the matches table
function controlMatchInAdmin(matchId) {
    switchAdminTab('live-score');
    setTimeout(() => {
        const select = document.getElementById('live-match-select');
        if (select) {
            select.value = matchId;
            select.dispatchEvent(new Event('change'));
        }
    }, 150);
}

// Load and populate the Live Score Operator Deck in Admin
async function loadLiveScoreTab() {
    const select = document.getElementById('live-match-select');
    if (!select) return;

    if (!adminControlsInitialized) {
        setupAdminDeckListeners();
        adminControlsInitialized = true;
    }
    
    const res = await fetchAPI('/matches');
    if (res.success && res.data) {
        const prevVal = select.value;
        select.innerHTML = '<option value="">-- Select Match --</option>' + 
            res.data.map(m => `<option value="${m.id}">[#${m.id}] ${m.home_team_name || 'TBD'} vs ${m.away_team_name || 'TBD'} (${m.status})</option>`).join('');
        
        if (prevVal && res.data.some(m => m.id == prevVal)) {
            select.value = prevVal;
        }
    }

    select.onchange = async () => {
        const matchId = select.value;
        const ctrlArea = document.getElementById('score-control-area');
        const noMatchMsg = document.getElementById('no-match-selected-msg');
        const quickLinks = document.getElementById('admin-match-quick-links');
        
        if (!matchId) {
            if (ctrlArea) ctrlArea.style.display = 'none';
            if (noMatchMsg) noMatchMsg.style.display = 'block';
            if (quickLinks) quickLinks.style.display = 'none';
            currentAdminMatch = null;
            stopAdminTimerTick();
            return;
        }

        await refreshAdminMatch(matchId);
    };

    if (select.value) {
        await refreshAdminMatch(select.value);
    }
}

// Fetch and refresh current match state in Admin Deck
async function refreshAdminMatch(matchId) {
    const matchRes = await fetchAPI(`/matches/${matchId}`);
    const ctrlArea = document.getElementById('score-control-area');
    const noMatchMsg = document.getElementById('no-match-selected-msg');
    const quickLinks = document.getElementById('admin-match-quick-links');

    if (matchRes.success && matchRes.data) {
        currentAdminMatch = matchRes.data;
        if (ctrlArea) ctrlArea.style.display = 'block';
        if (noMatchMsg) noMatchMsg.style.display = 'none';
        if (quickLinks) quickLinks.style.display = 'flex';

        const viewLink = document.getElementById('admin-view-match-link');
        if (viewLink) viewLink.href = `pages/match.html?id=${currentAdminMatch.id}`;

        // Header info
        const deckEvent = document.getElementById('admin-deck-event');
        const deckTitle = document.getElementById('admin-deck-title');
        const deckVenue = document.getElementById('admin-deck-venue');
        const deckBadge = document.getElementById('admin-deck-status-badge');

        if (deckEvent) deckEvent.innerText = `${currentAdminMatch.event_name || 'SPORTX TOURNAMENT'} • ${currentAdminMatch.round || 'ROUND'}`.toUpperCase();
        if (deckTitle) deckTitle.innerText = `${currentAdminMatch.home_team_name || 'HOME'} vs ${currentAdminMatch.away_team_name || 'AWAY'}`;
        if (deckVenue) deckVenue.innerText = `VENUE: ${currentAdminMatch.venue_name || 'MAIN ARENA'} • ${currentAdminMatch.venue_city || 'CAMPUS'}`;
        if (deckBadge) deckBadge.innerText = `STATUS: ${currentAdminMatch.status}`;

        // Scores and Team names
        const homeNameEl = document.getElementById('ctrl-home-team');
        const awayNameEl = document.getElementById('ctrl-away-team');
        const homeScoreEl = document.getElementById('ctrl-home-score');
        const awayScoreEl = document.getElementById('ctrl-away-score');
        const timerEl = document.getElementById('ctrl-timer');
        const statusIndicator = document.getElementById('admin-ctrl-status-indicator');

        if (homeNameEl) homeNameEl.innerText = currentAdminMatch.home_team_name || 'HOME';
        if (awayNameEl) awayNameEl.innerText = currentAdminMatch.away_team_name || 'AWAY';
        if (homeScoreEl) homeScoreEl.innerText = currentAdminMatch.home_score !== null ? currentAdminMatch.home_score : 0;
        if (awayScoreEl) awayScoreEl.innerText = currentAdminMatch.away_score !== null ? currentAdminMatch.away_score : 0;
        if (timerEl) timerEl.innerText = currentAdminMatch.timer || (currentAdminMatch.status === 'COMPLETED' ? '90:00' : '00:00');

        parseAdminTimerSeconds(timerEl.innerText);

        // Indicator styling
        if (statusIndicator) {
            if (currentAdminMatch.status === 'LIVE') {
                statusIndicator.innerHTML = '<span style="color: #00E676; font-weight: 900;">● MATCH LIVE</span>';
            } else if (currentAdminMatch.status === 'HALFTIME' || currentAdminMatch.status === 'BREAK') {
                statusIndicator.innerHTML = '<span style="color: #F5A623; font-weight: 900;">⏸ HALFTIME BREAK</span>';
            } else if (currentAdminMatch.status === 'COMPLETED') {
                statusIndicator.innerHTML = '<span style="color: var(--accent); font-weight: 900;">🏁 FULL TIME</span>';
            } else {
                statusIndicator.innerHTML = '<span style="color: var(--muted-on-ink); font-weight: 900;">⏱ SCHEDULED</span>';
            }
        }

        // Action button states
        updateAdminActionButtons(currentAdminMatch.status);

        // Timer ticking
        if (currentAdminMatch.status === 'LIVE') {
            startAdminTimerTick();
        } else {
            stopAdminTimerTick();
        }

        // Load logged events
        await loadAdminMatchEvents(currentAdminMatch.id);
        lucide.createIcons();
    }
}

// Update Action Buttons visibility in Admin Deck
function updateAdminActionButtons(status) {
    const btnStart = document.getElementById('admin-btn-start');
    const btnBreak = document.getElementById('admin-btn-break');
    const btnResume = document.getElementById('admin-btn-resume');
    const btnEnd = document.getElementById('admin-btn-end');

    if (status === 'SCHEDULED') {
        if (btnStart) btnStart.style.display = 'inline-flex';
        if (btnBreak) btnBreak.style.display = 'none';
        if (btnResume) btnResume.style.display = 'none';
        if (btnEnd) btnEnd.style.display = 'inline-flex';
    } else if (status === 'LIVE') {
        if (btnStart) btnStart.style.display = 'none';
        if (btnBreak) btnBreak.style.display = 'inline-flex';
        if (btnResume) btnResume.style.display = 'none';
        if (btnEnd) btnEnd.style.display = 'inline-flex';
    } else if (status === 'HALFTIME' || status === 'BREAK') {
        if (btnStart) btnStart.style.display = 'none';
        if (btnBreak) btnBreak.style.display = 'none';
        if (btnResume) btnResume.style.display = 'inline-flex';
        if (btnEnd) btnEnd.style.display = 'inline-flex';
    } else if (status === 'COMPLETED') {
        if (btnStart) btnStart.style.display = 'none';
        if (btnBreak) btnBreak.style.display = 'none';
        if (btnResume) btnResume.style.display = 'none';
        if (btnEnd) btnEnd.style.display = 'none';
    }
}

// Setup Event Listeners for Match Control Deck
function setupAdminDeckListeners() {
    // Refresh button
    const btnRefresh = document.getElementById('admin-btn-refresh-match');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            if (currentAdminMatch) refreshAdminMatch(currentAdminMatch.id);
        });
    }

    // Refresh events button
    const btnRefreshEvents = document.getElementById('admin-btn-refresh-events');
    if (btnRefreshEvents) {
        btnRefreshEvents.addEventListener('click', () => {
            if (currentAdminMatch) loadAdminMatchEvents(currentAdminMatch.id);
        });
    }

    // START MATCH
    const btnStart = document.getElementById('admin-btn-start');
    if (btnStart) {
        btnStart.addEventListener('click', async () => {
            if (!currentAdminMatch) return;
            btnStart.disabled = true;
            const res = await fetchAPI(`/matches/${currentAdminMatch.id}/start`, { method: 'POST' });
            btnStart.disabled = false;
            if (res.success) {
                if (typeof showNotification === 'function') {
                    showNotification(`MATCH KICKOFF: ${currentAdminMatch.home_team_name} vs ${currentAdminMatch.away_team_name} is now LIVE!`, 'start', 'MATCH STARTED');
                }
                await refreshAdminMatch(currentAdminMatch.id);
            } else {
                alert('Error starting match: ' + res.message);
            }
        });
    }

    // HALFTIME / BREAK
    const btnBreak = document.getElementById('admin-btn-break');
    if (btnBreak) {
        btnBreak.addEventListener('click', async () => {
            if (!currentAdminMatch) return;
            btnBreak.disabled = true;
            const res = await fetchAPI(`/matches/${currentAdminMatch.id}/break`, { method: 'POST' });
            btnBreak.disabled = false;
            if (res.success) {
                if (typeof showNotification === 'function') {
                    showNotification(`HALFTIME: ${currentAdminMatch.home_team_name} vs ${currentAdminMatch.away_team_name} interval break initiated.`, 'break', 'HALFTIME BREAK');
                }
                await refreshAdminMatch(currentAdminMatch.id);
            } else {
                alert('Error initiating break: ' + res.message);
            }
        });
    }

    // RESUME 2ND HALF
    const btnResume = document.getElementById('admin-btn-resume');
    if (btnResume) {
        btnResume.addEventListener('click', async () => {
            if (!currentAdminMatch) return;
            btnResume.disabled = true;
            const res = await fetchAPI(`/matches/${currentAdminMatch.id}/start`, { method: 'POST' });
            btnResume.disabled = false;
            if (res.success) {
                if (typeof showNotification === 'function') {
                    showNotification(`MATCH RESUMED: Second half underway for ${currentAdminMatch.home_team_name} vs ${currentAdminMatch.away_team_name}!`, 'start', 'MATCH RESUMED');
                }
                await refreshAdminMatch(currentAdminMatch.id);
            } else {
                alert('Error resuming match: ' + res.message);
            }
        });
    }

    // END MATCH (Open Modal)
    const btnEnd = document.getElementById('admin-btn-end');
    if (btnEnd) {
        btnEnd.addEventListener('click', () => {
            if (!currentAdminMatch) return;
            const modal = document.getElementById('admin-end-match-modal');
            const mHome = document.getElementById('admin-modal-home-name');
            const mAway = document.getElementById('admin-modal-away-name');
            const mHScore = document.getElementById('admin-modal-home-score');
            const mAScore = document.getElementById('admin-modal-away-score');
            const tieWrapper = document.getElementById('admin-modal-tie-wrapper');
            const winnerSelect = document.getElementById('admin-modal-winner-select');

            mHome.innerText = currentAdminMatch.home_team_name || 'Home';
            mAway.innerText = currentAdminMatch.away_team_name || 'Away';
            mHScore.value = currentAdminMatch.home_score !== null ? currentAdminMatch.home_score : 0;
            mAScore.value = currentAdminMatch.away_score !== null ? currentAdminMatch.away_score : 0;

            const checkTie = () => {
                const isKnockout = currentAdminMatch.round && currentAdminMatch.round.startsWith('Bracket:');
                if (isKnockout && mHScore.value === mAScore.value) {
                    tieWrapper.style.display = 'block';
                    winnerSelect.innerHTML = `
                        <option value="${currentAdminMatch.home_team_id}">${currentAdminMatch.home_team_name || 'Home'} (Advances on Penalties)</option>
                        <option value="${currentAdminMatch.away_team_id}">${currentAdminMatch.away_team_name || 'Away'} (Advances on Penalties)</option>
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
    const btnConfirmEnd = document.getElementById('admin-btn-confirm-end');
    if (btnConfirmEnd) {
        btnConfirmEnd.addEventListener('click', async () => {
            if (!currentAdminMatch) return;
            const h = parseInt(document.getElementById('admin-modal-home-score').value, 10) || 0;
            const a = parseInt(document.getElementById('admin-modal-away-score').value, 10) || 0;
            const winnerSelect = document.getElementById('admin-modal-winner-select');
            const winnerId = (h === a && winnerSelect && winnerSelect.value) ? parseInt(winnerSelect.value, 10) : null;

            btnConfirmEnd.disabled = true;
            btnConfirmEnd.innerText = 'CONCLUDING...';

            const res = await fetchAPI(`/matches/${currentAdminMatch.id}/end`, {
                method: 'POST',
                body: JSON.stringify({ home_score: h, away_score: a, winner_id: winnerId })
            });

            btnConfirmEnd.disabled = false;
            btnConfirmEnd.innerText = 'CONFIRM & END MATCH';

            if (res.success) {
                document.getElementById('admin-end-match-modal').style.display = 'none';

                if (typeof showNotification === 'function') {
                    showNotification(
                        `MATCH ENDED: ${currentAdminMatch.home_team_name} ${h} - ${a} ${currentAdminMatch.away_team_name}. Match completed!`,
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
                }

                await refreshAdminMatch(currentAdminMatch.id);
            } else {
                alert('Error ending match: ' + res.message);
            }
        });
    }

    // Score steppers
    setupAdminScoreStepper('admin-home-plus', 1, 0, true);
    setupAdminScoreStepper('admin-home-minus', -1, 0, false);
    setupAdminScoreStepper('admin-away-plus', 0, 1, true);
    setupAdminScoreStepper('admin-away-minus', 0, -1, false);

    // Event Logger
    const btnAddEvent = document.getElementById('admin-btn-add-event');
    if (btnAddEvent) {
        btnAddEvent.addEventListener('click', async () => {
            if (!currentAdminMatch) return alert("Select a match first.");
            const minute = document.getElementById('admin-event-minute').value.trim() || `${Math.floor(adminTimerSeconds / 60)}'`;
            const type = document.getElementById('admin-event-type').value;
            const teamSide = document.getElementById('admin-event-team').value;
            const teamId = teamSide === 'home' ? currentAdminMatch.home_team_id : currentAdminMatch.away_team_id;
            const desc = document.getElementById('admin-event-desc').value.trim() || `${type} recorded`;

            const res = await fetchAPI(`/matches/${currentAdminMatch.id}/events`, {
                method: 'POST',
                body: JSON.stringify({ minute, type, team_id: teamId, description: desc })
            });

            if (res.success) {
                document.getElementById('admin-event-desc').value = '';
                if (typeof showNotification === 'function') {
                    showNotification(`Event Logged: ${type} at ${minute}`, 'info', 'EVENT RECORDED');
                }
                await loadAdminMatchEvents(currentAdminMatch.id);
            } else {
                alert('Error adding event: ' + res.message);
            }
        });
    }
}

// Stepper helper for Admin Score controls
function setupAdminScoreStepper(btnId, deltaH, deltaA, isGoal) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', async () => {
        if (!currentAdminMatch) return alert("Select a match first.");
        const homeScoreEl = document.getElementById('ctrl-home-score');
        const awayScoreEl = document.getElementById('ctrl-away-score');
        const timerEl = document.getElementById('ctrl-timer');

        const oldH = Number(currentAdminMatch.home_score) || 0;
        const oldA = Number(currentAdminMatch.away_score) || 0;
        const newH = Math.max(0, oldH + deltaH);
        const newA = Math.max(0, oldA + deltaA);

        const res = await fetchAPI(`/matches/${currentAdminMatch.id}/score`, {
            method: 'PUT',
            body: JSON.stringify({ home_score: newH, away_score: newA, timer: timerEl ? timerEl.innerText : '00:00' })
        });

        if (res.success) {
            currentAdminMatch.home_score = newH;
            currentAdminMatch.away_score = newA;
            if (homeScoreEl) homeScoreEl.innerText = newH;
            if (awayScoreEl) awayScoreEl.innerText = newA;

            if (isGoal) {
                const scoringTeam = deltaH > 0 ? (currentAdminMatch.home_team_name || 'Home') : (currentAdminMatch.away_team_name || 'Away');
                const scoringTeamId = deltaH > 0 ? currentAdminMatch.home_team_id : currentAdminMatch.away_team_id;
                const min = `${Math.floor(adminTimerSeconds / 60)}'`;

                if (typeof showNotification === 'function') {
                    showNotification(`⚽ GOAL! ${scoringTeam} scores! Current: ${newH} - ${newA}`, 'live', 'GOAL SCORED');
                }

                // Log event to API
                await fetchAPI(`/matches/${currentAdminMatch.id}/events`, {
                    method: 'POST',
                    body: JSON.stringify({
                        minute: min,
                        type: 'GOAL',
                        team_id: scoringTeamId,
                        description: `Goal scored by ${scoringTeam} (${newH} - ${newA})`
                    })
                });

                await loadAdminMatchEvents(currentAdminMatch.id);
            }
        } else {
            alert("Error updating score: " + (res.message || "Unknown error"));
        }
    });
}

// Load match events in the admin timeline feed
async function loadAdminMatchEvents(matchId) {
    const stream = document.getElementById('admin-events-stream');
    if (!stream) return;

    const res = await fetchAPI(`/matches/${matchId}/events`);
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        stream.innerHTML = res.data.map(ev => {
            let color = 'var(--accent)';
            let icon = 'activity';
            if (ev.type === 'GOAL') { color = '#00E676'; icon = 'target'; }
            else if (ev.type === 'CARD_YELLOW') { color = '#F5A623'; icon = 'alert-triangle'; }
            else if (ev.type === 'CARD_RED') { color = '#FF3366'; icon = 'slash'; }
            else if (ev.type === 'SUBSTITUTION') { color = '#6EC6FF'; icon = 'refresh-cw'; }

            return `
                <div style="background: rgba(0,0,0,0.6); border-left: 3px solid ${color}; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-weight: 900; color: ${color}; font-size: 0.9rem; min-width: 32px;">${ev.minute || '•'}</span>
                        <span style="font-weight: 700; color: #fff; font-size: 0.9rem;">${ev.description || ev.type}</span>
                    </div>
                    <span style="font-size: 0.75rem; color: var(--muted-on-ink); font-weight: 800; text-transform: uppercase;">${ev.team_name || ''}</span>
                </div>
            `;
        }).join('');
    } else {
        stream.innerHTML = '<div style="color: var(--muted-on-ink); font-size: 0.9rem; padding: 6px 0;">No events logged for this match yet.</div>';
    }
}

// Admin Timer helpers
function parseAdminTimerSeconds(timerStr) {
    if (!timerStr || timerStr === '00:00') {
        adminTimerSeconds = 0;
        return;
    }
    const parts = timerStr.split(':');
    if (parts.length === 2) {
        adminTimerSeconds = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
    }
}

function startAdminTimerTick() {
    stopAdminTimerTick();
    adminTimerInterval = setInterval(() => {
        adminTimerSeconds++;
        const mins = String(Math.floor(adminTimerSeconds / 60)).padStart(2, '0');
        const secs = String(adminTimerSeconds % 60).padStart(2, '0');
        const timerEl = document.getElementById('ctrl-timer');
        if (timerEl) timerEl.innerText = `${mins}:${secs}`;
    }, 1000);
}

function stopAdminTimerTick() {
    if (adminTimerInterval) {
        clearInterval(adminTimerInterval);
        adminTimerInterval = null;
    }
}

window.controlMatchInAdmin = controlMatchInAdmin;
window.generateBracket = generateBracket;
window.loadAdminBracket = loadAdminBracket;
window.switchAdminTab = switchAdminTab;
window.logoutAdmin = logoutAdmin;
window.loadLiveScoreTab = loadLiveScoreTab;


