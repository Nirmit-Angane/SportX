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

let pollingInterval;

async function loadMatchDetails() {
    if (!matchId) {
        document.querySelector('.mc-score-grid').innerHTML = '<div style="color: var(--accent-red); font-size: 2rem;">Error: No Match ID provided.</div>';
        return;
    }

    const response = await fetchAPI(`/matches/${matchId}`);
    if (response.success) {
        const match = response.data;
        homeTeamEl.innerText = match.home_team_name || 'Home Team';
        awayTeamEl.innerText = match.away_team_name || 'Away Team';
        homeScoreEl.innerText = match.home_score !== null ? match.home_score : '0';
        awayScoreEl.innerText = match.away_score !== null ? match.away_score : '0';
        timerEl.innerText = match.timer || '00:00';
        matchMetaEl.innerText = `${match.round || 'MATCH'} • SPORTX CENTER`;
        venueDetailsEl.innerText = `VENUE: ${match.venue_name || 'TBA'}`;
        
        updateStatusIndicator(match.status);
    } else {
        document.querySelector('.mc-score-grid').innerHTML = '<div style="color: var(--accent-red); font-size: 2rem;">Match not found.</div>';
    }
}

function updateStatusIndicator(status) {
    if (status === 'LIVE') {
        statusIndicator.innerHTML = '<div class="live-dot"></div> LIVE';
        statusIndicator.style.color = 'var(--accent-red)';
    } else if (status === 'TIMEOUT') {
        statusIndicator.innerHTML = '<div class="live-dot" style="background-color: #F5A623; box-shadow: 0 0 10px #F5A623;"></div> TIMEOUT';
        statusIndicator.style.color = '#F5A623';
    } else if (status === 'UNDER REVIEW') {
        statusIndicator.innerHTML = '<div class="live-dot" style="background-color: #F8E71C; box-shadow: 0 0 10px #F8E71C;"></div> UNDER REVIEW';
        statusIndicator.style.color = '#F8E71C';
    } else {
        statusIndicator.innerHTML = status;
        statusIndicator.style.color = 'var(--text-secondary)';
    }
}

function startScorePolling() {
    pollingInterval = setInterval(async () => {
        if (!matchId) return;
        const response = await fetchAPI(`/matches/${matchId}/score`);
        if (response.success) {
            const score = response.data;
            
            // Handle Home Score Animation
            if (homeScoreEl.innerText != score.home_score && score.home_score !== null) {
                homeScoreEl.innerText = score.home_score;
                triggerScoreAnimation(homeScoreEl);
            }
            // Handle Away Score Animation
            if (awayScoreEl.innerText != score.away_score && score.away_score !== null) {
                awayScoreEl.innerText = score.away_score;
                triggerScoreAnimation(awayScoreEl);
            }
            // Handle Timer
            if (timerEl.innerText != score.timer) {
                timerEl.innerText = score.timer || '00:00';
            }
            // Assuming the status might change from API in a real scenario, we could fetch the full match occasionally, but this is fine for now.
        }
    }, 3000);
}

function triggerScoreAnimation(element) {
    // Remove class if it exists to restart animation
    element.classList.remove('score-updated');
    // Trigger reflow
    void element.offsetWidth;
    // Add class back
    element.classList.add('score-updated');
}

if (matchId) {
    loadMatchDetails();
    startScorePolling();
}
