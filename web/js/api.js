// API Configuration & Networking Layer

function resolveApiBaseUrl() {
    if (typeof window !== 'undefined' && window.ENV && window.ENV.API_BASE_URL) {
        return window.ENV.API_BASE_URL;
    }

    const hostname = (typeof window !== 'undefined' && window.location) ? window.location.hostname : '';

    const isLocal = !hostname || 
        hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname === '[::1]' ||
        hostname.endsWith('.local') ||
        /^192\.168\./.test(hostname) ||
        /^10\./.test(hostname) ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
        /^26\./.test(hostname); // Local networks / Radmin VPN

    if (isLocal) {
        return `http://${hostname || 'localhost'}:5000/api`;
    }

    // Default to live backend on Render when deployed to Netlify or remote hosting
    return 'https://sportx-api-izap.onrender.com/api';
}

const API_BASE_URL = resolveApiBaseUrl();

async function fetchAPI(endpoint, options = {}) {
    try {
        const baseUrl = (typeof window !== 'undefined' && window.ENV?.API_BASE_URL) || API_BASE_URL;
        const token = typeof localStorage !== 'undefined' ? localStorage.getItem('sportx_token') : null;

        const defaultHeaders = {
            'Content-Type': 'application/json'
        };

        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }

        const headers = {
            ...defaultHeaders,
            ...(options.headers || {})
        };

        const response = await fetch(`${baseUrl}${endpoint}`, {
            credentials: 'include', // Pass cookies in same-site/cross-site contexts
            ...options,
            headers
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            const errorMsg = data?.message || `HTTP error! status: ${response.status}`;
            return { success: false, message: errorMsg, status: response.status };
        }

        return data || { success: true };
    } catch (error) {
        console.error('API Fetch Error:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Dynamic Tournament Bracket Tree Connector
 * Draws seamless right-angled SVG connector branches linking matches across rounds:
 * [ QF 1 ] ──┐
 *            ├──> [ SF 1 ]
 * [ QF 2 ] ──┘
 *
 * @param {string} containerId - ID of .bracket-container element
 * @param {string} prefix - Match element ID prefix ('admin-' or '')
 */
function drawBracketTree(containerId, prefix = '') {
    const container = document.getElementById(containerId);
    if (!container || container.offsetParent === null) return;

    const scrollWidth = container.scrollWidth;
    const scrollHeight = container.scrollHeight;
    if (!scrollWidth || !scrollHeight) return;

    let svg = container.querySelector('.bracket-svg-overlay');
    if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'bracket-svg-overlay');
        container.insertBefore(svg, container.firstChild);
    }

    svg.setAttribute('width', scrollWidth);
    svg.setAttribute('height', scrollHeight);
    svg.setAttribute('viewBox', `0 0 ${scrollWidth} ${scrollHeight}`);
    svg.style.width = scrollWidth + 'px';
    svg.style.height = scrollHeight + 'px';
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '1';

    const containerRect = container.getBoundingClientRect();
    const scrollLeft = container.scrollLeft || 0;
    const scrollTop = container.scrollTop || 0;

    function getCoords(id) {
        const el = document.getElementById(id);
        if (!el || el.offsetParent === null) return null;
        const r = el.getBoundingClientRect();
        return {
            left: r.left - containerRect.left + scrollLeft,
            right: r.right - containerRect.left + scrollLeft,
            top: r.top - containerRect.top + scrollTop,
            bottom: r.bottom - containerRect.top + scrollTop,
            centerY: r.top - containerRect.top + scrollTop + (r.height / 2)
        };
    }

    function createForkPath(topId, botId, targetId) {
        const top = getCoords(topId);
        const bot = getCoords(botId);
        const target = getCoords(targetId);
        if (!top || !bot || !target) return '';

        const x1 = Math.round(top.right) - 1;
        const y1 = Math.round(top.centerY);
        const x2 = Math.round(bot.right) - 1;
        const y2 = Math.round(bot.centerY);
        const xTarget = Math.round(target.left) + 1;
        const yTarget = Math.round(target.centerY);

        const midX = Math.round((Math.max(x1, x2) + xTarget) / 2);

        return `M ${x1} ${y1} H ${midX} V ${yTarget} M ${x2} ${y2} H ${midX} V ${yTarget} M ${midX} ${yTarget} H ${xTarget}`;
    }

    const pairs = [
        [prefix + 'qf1', prefix + 'qf2', prefix + 'sf1'],
        [prefix + 'qf3', prefix + 'qf4', prefix + 'sf2'],
        [prefix + 'sf1', prefix + 'sf2', prefix + 'final']
    ];

    let pathsHtml = '';
    pairs.forEach(([top, bot, tgt]) => {
        const d = createForkPath(top, bot, tgt);
        if (d) {
            pathsHtml += `<path d="${d}" fill="none" stroke="#6EC6FF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />`;
        }
    });

    svg.innerHTML = pathsHtml;

    if (window.ResizeObserver && !container._bracketObserved) {
        container._bracketObserved = true;
        const ro = new ResizeObserver(() => {
            requestAnimationFrame(() => drawBracketTree(containerId, prefix));
        });
        ro.observe(container);
    }
}

window.drawBracketTree = drawBracketTree;

window.addEventListener('resize', () => {
    if (document.getElementById('bracket-container')) {
        drawBracketTree('bracket-container', '');
    }
    if (document.getElementById('admin-bracket-container')) {
        drawBracketTree('admin-bracket-container', 'admin-');
    }
});

// Keep track of recent toasts to prevent identical duplicates from piling up
const recentToastMessages = new Map();
const handledStorageNotifyIds = new Set();

/**
 * Global Cyber-Brutalist Live Notification System
 * Supports Start, Break, End, and Tournament Advancement notifications with cross-tab broadcast.
 */
function showNotification(message, type = 'info', title = 'SPORTX LIVE', broadcast = true) {
    if (!message) return;

    const trimmedMsg = String(message).trim();
    const now = Date.now();

    // 1. Debounce duplicate notifications within 2.5 seconds
    const lastTime = recentToastMessages.get(trimmedMsg);
    if (lastTime && (now - lastTime) < 2500) {
        return; // Suppress duplicate notification
    }
    recentToastMessages.set(trimmedMsg, now);
    if (recentToastMessages.size > 50) {
        for (const [k, t] of recentToastMessages) {
            if (now - t > 10000) recentToastMessages.delete(k);
        }
    }

    let container = document.getElementById('sportx-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'sportx-toast-container';
        container.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999999; display: flex; flex-direction: column; gap: 12px; pointer-events: none; max-width: 540px; width: min(92vw, 540px); align-items: center;';
        document.body.appendChild(container);
    } else {
        // 2. Check if a toast with this exact text is already visibly active in the DOM
        const activeToasts = container.querySelectorAll('.sportx-toast-text');
        for (const tEl of activeToasts) {
            if (tEl.textContent.trim() === trimmedMsg) {
                return; // Already actively displayed in the container!
            }
        }
    }

    // Keep at most 2 toasts at a time on screen
    while (container.children.length >= 2) {
        container.firstElementChild.remove();
    }

    const toast = document.createElement('div');
    toast.style.cssText = `
        background: #03060B;
        border: 2px solid var(--accent, #6EC6FF);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), 6px 6px 0 var(--accent, #6EC6FF);
        color: #fff;
        padding: 1rem 1.25rem;
        font-family: var(--font-display, inherit);
        pointer-events: auto;
        transform: translateY(-50px);
        transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease;
        opacity: 0;
        width: 100%;
        box-sizing: border-box;
        position: relative;
    `;

    let dotColor = 'var(--accent, #6EC6FF)';
    let badgeTitle = title;
    if (type === 'live' || type === 'start') {
        dotColor = '#00E676';
        if (title === 'SPORTX LIVE') badgeTitle = 'MATCH STARTED';
    } else if (type === 'break' || type === 'halftime') {
        dotColor = '#F5A623';
        if (title === 'SPORTX LIVE') badgeTitle = 'HALFTIME BREAK';
    } else if (type === 'end' || type === 'completed') {
        dotColor = '#FF3366';
        if (title === 'SPORTX LIVE') badgeTitle = 'MATCH ENDED';
    } else if (type === 'bracket' || type === 'trophy') {
        dotColor = '#FFD700';
        if (title === 'SPORTX LIVE') badgeTitle = 'TOURNAMENT ADVANCEMENT';
    }

    toast.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 8px; font-weight: 900; font-size: 0.85rem; letter-spacing: 1px; color: ${dotColor}; text-transform: uppercase; font-style: italic;">
                <span class="live-dot" style="background: ${dotColor}; width: 9px; height: 9px; box-shadow: 0 0 8px ${dotColor}; border-radius: 50%;"></span>
                <span>${badgeTitle}</span>
            </div>
            <button style="background: none; border: none; color: rgba(255,255,255,0.6); font-size: 1.4rem; cursor: pointer; line-height: 1; padding: 0 4px;" onclick="this.closest('#sportx-toast-container > div').remove()">&times;</button>
        </div>
        <div class="sportx-toast-text" style="font-weight: 700; font-size: 1rem; color: #fff; line-height: 1.4;">
            ${message}
        </div>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    });

    // 3. Broadcast notification across browser tabs ONLY IF broadcast is true
    if (broadcast) {
        const uniqueId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        handledStorageNotifyIds.add(uniqueId);
        try {
            localStorage.setItem('sportx_latest_notify', JSON.stringify({
                id: uniqueId,
                message,
                type,
                title: badgeTitle,
                time: Date.now()
            }));
        } catch (e) {}
    }

    // Auto dismiss after 5 seconds
    setTimeout(() => {
        toast.style.transform = 'translateY(-50px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 5000);
}

window.showNotification = showNotification;

// Listen for broadcast notifications across tabs (without echoing)
window.addEventListener('storage', (e) => {
    if (e.key === 'sportx_latest_notify' && e.newValue) {
        try {
            const data = JSON.parse(e.newValue);
            if (!data || !data.message) return;
            if (data.id && handledStorageNotifyIds.has(data.id)) return;
            if (data.id) {
                handledStorageNotifyIds.add(data.id);
                if (handledStorageNotifyIds.size > 50) handledStorageNotifyIds.clear();
            }
            if (Date.now() - (data.time || 0) < 4000) {
                // Must pass broadcast = false to prevent echo loopback!
                showNotification(data.message, data.type, data.title, false);
            }
        } catch (err) {}
    }
});


