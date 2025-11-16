// API Configuration
const API_URL = 'http://localhost:5000/api';

const CONFIG = {
    API_URL,
    TOKEN_KEY: 'buzzbold_token',
    USER_KEY: 'buzzbold_user',
};

// Set auth token in localStorage
function setToken(token) {
    localStorage.setItem(CONFIG.TOKEN_KEY, token);
}

// Get auth token from localStorage
function getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
}

// Remove auth token
function removeToken() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
}

// Check if user is authenticated
function isAuthenticated() {
    return !!getToken();
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/index.html';
    }
}
