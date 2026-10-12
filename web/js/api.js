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

