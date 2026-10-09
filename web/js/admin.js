document.addEventListener('DOMContentLoaded', () => {
    // Check if token exists, if not redirect to login
    if (!localStorage.getItem('admin_token')) {
        window.location.href = 'login.html';
        return;
    }

    lucide.createIcons();
    switchAdminTab('dashboard');
});

function switchAdminTab(tabId) {
    document.querySelectorAll('.mc-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.section-view').forEach(s => s.style.display = 'none');
    
    document.querySelector(`.mc-tab[onclick="switchAdminTab('${tabId}')"]`).classList.add('active');
    document.getElementById(`view-${tabId}`).style.display = 'block';

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
            document.getElementById('stat-live-matches').innerText = live;
            
            const tbody = document.getElementById('recent-matches-body');
            tbody.innerHTML = matchesRes.data.slice(0, 5).map(m => `
                <div class="table-row">
                    <div class="col" style="flex: 1;">${m.start_time ? m.start_time.substring(0,10) : 'TBA'}</div>
                    <div class="col" style="flex: 3;">${m.home_team_name} vs ${m.away_team_name}</div>
                    <div class="col" style="flex: 1;">${m.status}</div>
                    <div class="col" style="flex: 1;"><a href="pages/match.html?id=${m.id}" class="text-blue">View</a></div>
                </div>
            `).join('');
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

function logoutAdmin() {
    localStorage.removeItem('admin_token');
    window.location.href = 'login.html';
}
