// Get Match ID from URL params
const urlParams = new URLSearchParams(window.location.search);
const matchId = urlParams.get('id');

// DOM Elements
const homeTeamEl = document.getElementById('home-team');
const awayTeamEl = document.getElementById('away-team');
const homeScoreEl = document.getElementById('home-score');
const awayScoreEl = document.getElementById('away-score');
const timerEl = document.getElementById('timer');
const matchDetailsEl = document.getElementById('match-details');
const venueDetailsEl = document.getElementById('venue-details');
const statusIndicator = document.getElementById('status-indicator');

let pollingInterval;

async function loadMatchDetails() {
    if (!matchId) {
        matchDetailsEl.innerText = "Error: No Match ID provided.";
        return;
    }

    const response = await fetchAPI(`/matches/${matchId}`);
    if (response.success) {
        const match = response.data;
        homeTeamEl.innerText = match.home_team_name || 'Home Team';
        awayTeamEl.innerText = match.away_team_name || 'Away Team';
        homeScoreEl.innerText = match.home_score !== null ? match.home_score : '-';
        awayScoreEl.innerText = match.away_score !== null ? match.away_score : '-';
        timerEl.innerText = match.timer || '00:00';
        venueDetailsEl.innerText = `VENUE: ${match.venue_name || 'TBA'}`;
        
        if (match.status === 'LIVE') {
            statusIndicator.innerHTML = '● LIVE';
            statusIndicator.style.color = 'var(--accent-red)';
            statusIndicator.style.animation = 'pulse 2s infinite';
        } else {
            statusIndicator.innerHTML = match.status;
            statusIndicator.style.color = 'var(--text-muted)';
            statusIndicator.style.animation = 'none';
        }
    } else {
        matchDetailsEl.innerText = "Match not found or server offline.";
    }
}

// Polling for live score updates (Phase 11)
function startScorePolling() {
    // Poll every 3 seconds
    pollingInterval = setInterval(async () => {
        if (!matchId) return;
        const response = await fetchAPI(`/matches/${matchId}/score`);
        if (response.success) {
            const score = response.data;
            if (homeScoreEl.innerText != score.home_score) {
                homeScoreEl.innerText = score.home_score;
                animateScoreUpdate(homeScoreEl);
            }
            if (awayScoreEl.innerText != score.away_score) {
                awayScoreEl.innerText = score.away_score;
                animateScoreUpdate(awayScoreEl);
            }
            if (timerEl.innerText != score.timer) {
                timerEl.innerText = score.timer;
            }
        }
    }, 3000);
}

function animateScoreUpdate(element) {
    element.style.color = 'var(--text-main)';
    setTimeout(() => {
        element.style.color = 'var(--accent-blue)';
    }, 300);
}

// Initialize
if (matchId) {
    loadMatchDetails();
    startScorePolling();
}
