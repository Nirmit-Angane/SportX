// API Configuration
const API_BASE_URL = 'https://sportx-api-izap.onrender.com/api';

async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${window.ENV?.API_BASE_URL || 'http://localhost:5000/api'}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Important for cookies
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Fetch Error:', error);
        return { success: false, message: error.message };
    }
}
