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
