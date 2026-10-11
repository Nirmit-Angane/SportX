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
