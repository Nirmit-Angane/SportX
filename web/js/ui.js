
// Ticking clock for the nav
function updateClock() {
    const clockEl = document.getElementById('global-clock');
    if (!clockEl) return;
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });
}
setInterval(updateClock, 1000);
document.addEventListener('DOMContentLoaded', updateClock);

// Segment bar helper
window.updateSegmentBar = function(barId, filledCount) {
    const bar = document.getElementById(barId);
    if (!bar) return;
    const segments = bar.querySelectorAll('.segment');
    segments.forEach((seg, idx) => {
        if (idx < filledCount) seg.classList.add('filled');
        else seg.classList.remove('filled');
    });
};

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        const inputs = loginForm.querySelectorAll('input');
        const updateLogin = () => {
            let filled = 0;
            inputs.forEach(i => { if (i.value.trim().length > 0) filled++; });
            updateSegmentBar('login-progress', filled);
        };
        inputs.forEach(i => i.addEventListener('input', updateLogin));
        loginForm.addEventListener('submit', () => updateSegmentBar('login-progress', 4));
    }
    
    const regForm = document.getElementById('register-form');
    if (regForm) {
        const inputs = regForm.querySelectorAll('input, select');
        const updateReg = () => {
            let filled = 0;
            inputs.forEach(i => { if (i.value.trim().length > 0) filled++; });
            // Max inputs is 5, scale to 4 segments
            let seg = Math.min(3, Math.floor(filled * (3/5)));
            updateSegmentBar('reg-progress', seg);
        };
        inputs.forEach(i => i.addEventListener('input', updateReg));
        inputs.forEach(i => i.addEventListener('change', updateReg));
        regForm.addEventListener('submit', () => updateSegmentBar('reg-progress', 4));
    }
});


document.addEventListener('DOMContentLoaded', () => {
    // Inject slanted panel if not exists
    if (!document.querySelector('.slant-panel')) {
        const slant = document.createElement('div');
        slant.className = 'slant-panel';
        document.body.prepend(slant);
    }

    // Inject ghost numeral if not exists
    if (!document.querySelector('.ghost-numeral')) {
        const ghost = document.createElement('div');
        ghost.className = 'ghost-numeral';
        ghost.setAttribute('aria-hidden', 'true');
        const path = window.location.pathname;
        let num = '00';
        if (path.includes('events')) num = '02';
        else if (path.includes('matches') || path.includes('match')) num = '03';
        else if (path.includes('brackets')) num = '04';
        else if (path.includes('teams')) num = '05';
        else if (path.includes('register')) num = '06';
        else if (path.includes('admin') || path.includes('login')) num = '99';
        else if (path.includes('results')) num = '07';
        ghost.textContent = num;
        document.body.prepend(ghost);
    }
    
    // Inject clock if missing
    const navActions = document.querySelector('.nav-actions');
    if (navActions && !document.querySelector('.live-clock')) {
        const clockWrap = document.createElement('div');
        clockWrap.className = 'live-clock';
        clockWrap.innerHTML = `LIVE &middot; <span id="global-clock">00:00:00</span>`;
        navActions.prepend(clockWrap);
        
        // Update clock immediately
        const update = () => {
            const clockEl = document.getElementById('global-clock');
            if (clockEl) {
                clockEl.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
            }
        };
        setInterval(update, 1000);
        update();
    }
});
