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
    else if (tabId === 'brackets') loadBrackets();
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
        tbody.innerHTML = res.data.map(m => `
            <tr>
                <td>${m.id}</td>
                <td>${m.event_name || '-'}</td>
                <td>${m.home_team_name}</td>
                <td>${m.away_team_name}</td>
                <td>${m.status}</td>
                <td><a href="pages/match.html?id=${m.id}" class="text-blue">View</a></td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Error loading matches</td></tr>';
    }
}

async function logoutAdmin() {
    await fetchAPI('/auth/logout', { method: 'POST' });
    window.location.href = 'login.html';
}

async function loadBrackets() {
    const res = await fetchAPI('/events');
    const select = document.getElementById('admin-bracket-event');
    if (res.success && select) {
        select.innerHTML = '<option value="">-- Select Event --</option>' + 
            res.data.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
    }
}

async function loadAdminBracket(eventId) {
    if (!eventId) {
        document.getElementById('admin-bracket-view').style.display = 'none';
        document.getElementById('admin-no-bracket').style.display = 'none';
        return;
    }
    
    const res = await fetchAPI('/matches');
    if (res.success) {
        const matches = res.data.filter(m => m.event_id == eventId && m.round && m.round.startsWith('Bracket:'));
        
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
                if (!m) return '<div>TBD vs TBD</div>';
                return `<div style="font-weight: bold; color: var(--white);">${m.home_team_name || 'TBD'} vs ${m.away_team_name || 'TBD'}</div>
                        <div style="font-size: 0.85rem; color: var(--accent); margin-top: 4px;">${m.status}</div>`;
            };
            
            document.getElementById('admin-qf1').innerHTML = renderMatch(qf1);
            document.getElementById('admin-qf2').innerHTML = renderMatch(qf2);
            document.getElementById('admin-qf3').innerHTML = renderMatch(qf3);
            document.getElementById('admin-qf4').innerHTML = renderMatch(qf4);
            document.getElementById('admin-sf1').innerHTML = renderMatch(sf1);
            document.getElementById('admin-sf2').innerHTML = renderMatch(sf2);
            document.getElementById('admin-final').innerHTML = renderMatch(finalMatch);
            
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

