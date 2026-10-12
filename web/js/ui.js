
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

    // Initialize Mobile Navigation
    setupMobileNav();

    // Initialize Scroll Progress Indicator & Parallax
    setupScrollProgress();

    // Initialize Scroll Animations
    initScrollAnimations();
});

// Setup Mobile Navigation Drawer
function setupMobileNav() {
    const sbContainer = document.querySelector('.sb-container');
    const sbNav = document.querySelector('.sb-nav');
    if (!sbContainer || !sbNav || document.querySelector('.mobile-nav-toggle')) return;

    // Create hamburger toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'mobile-nav-toggle';
    toggleBtn.setAttribute('aria-label', 'Toggle Navigation Menu');
    toggleBtn.innerHTML = `
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
    `;

    // Append to container
    sbContainer.appendChild(toggleBtn);

    // Create mobile menu overlay & drawer
    const drawer = document.createElement('div');
    drawer.className = 'mobile-nav-drawer';
    drawer.id = 'mobile-nav-drawer';
    
    // Clone navigation links into the drawer
    const navClone = sbNav.cloneNode(true);
    navClone.className = 'mobile-drawer-links';

    drawer.innerHTML = `
        <div class="mobile-drawer-header">
            <span class="mobile-drawer-brand">SPORTX // MENU</span>
            <button class="mobile-drawer-close" aria-label="Close Menu">&times;</button>
        </div>
    `;
    drawer.appendChild(navClone);

    // Quick links or status inside drawer
    const drawerFooter = document.createElement('div');
    drawerFooter.className = 'mobile-drawer-footer';
    drawerFooter.innerHTML = `
        <div class="drawer-live-pill"><span class="live-dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--accent);margin-right:6px;"></span> LIVE SPORTS NETWORK</div>
    `;
    drawer.appendChild(drawerFooter);

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'mobile-nav-backdrop';

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);

    const openMenu = () => {
        drawer.classList.add('open');
        backdrop.classList.add('open');
        toggleBtn.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
        drawer.classList.remove('open');
        backdrop.classList.remove('open');
        toggleBtn.classList.remove('active');
        document.body.style.overflow = '';
    };

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (drawer.classList.contains('open')) closeMenu();
        else openMenu();
    });

    const closeBtn = drawer.querySelector('.mobile-drawer-close');
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    backdrop.addEventListener('click', closeMenu);

    // Close when clicking any link inside drawer
    drawer.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer.classList.contains('open')) {
            closeMenu();
        }
    });
}

// ==========================================================================
// SCROLL PROGRESS BAR & SCROLL ANIMATIONS ENGINE
// ==========================================================================
let scrollObserver = null;

function setupScrollProgress() {
    let progressBar = document.getElementById('scroll-progress-bar');
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.id = 'scroll-progress-bar';
        progressBar.className = 'scroll-progress-bar';
        progressBar.setAttribute('aria-hidden', 'true');
        document.body.prepend(progressBar);
    }

    let ticking = false;
    const updateProgressAndParallax = () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
        
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }

        // Hero Ghost Numeral Parallax
        const heroGhost = document.getElementById('hero-ghost');
        if (heroGhost && scrollTop < 1400) {
            heroGhost.style.transform = `translate3d(0, ${scrollTop * 0.18}px, 0)`;
        }

        // Slanted panel parallax
        const slantPanel = document.querySelector('.hero-section .slant-panel');
        if (slantPanel && scrollTop < 1400) {
            slantPanel.style.transform = `translate3d(0, ${scrollTop * 0.1}px, 0)`;
        }

        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateProgressAndParallax);
            ticking = true;
        }
    }, { passive: true });

    // Initial calculation
    updateProgressAndParallax();
}

function initScrollAnimations() {
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale');

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        targets.forEach(el => el.classList.add('in-view'));
        return;
    }

    if (!scrollObserver) {
        scrollObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            rootMargin: '0px 0px -40px 0px',
            threshold: 0.08
        });
    }

    targets.forEach(el => {
        if (el.classList.contains('in-view')) return;

        const rect = el.getBoundingClientRect();
        // If element is already in or above the viewport, reveal immediately
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            el.classList.add('in-view');
        } else {
            scrollObserver.observe(el);
        }
    });
}

window.initScrollAnimations = initScrollAnimations;
window.refreshScrollAnimations = initScrollAnimations;


