// API Client
class API {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = getToken();

        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth endpoints
    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async register(name, businessName, email, password) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, businessName, email, password }),
        });
    }

    async getMe() {
        return this.request('/auth/me');
    }

    async logout() {
        return this.request('/auth/logout', { method: 'POST' });
    }

    // Profile endpoints
    async getProfile() {
        return this.request('/profile');
    }

    async updateProfile(data) {
        return this.request('/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // Social endpoints
    async getSocialAccounts() {
        return this.request('/social/accounts');
    }

    async getSocialPosts(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/social/posts?${query}`);
    }

    async createSocialPost(data) {
        return this.request('/social/posts', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getSocialAnalytics(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/social/analytics?${query}`);
    }

    // Reviews endpoints
    async getReviews(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/reviews?${query}`);
    }

    async replyToReview(reviewId, replyText) {
        return this.request(`/reviews/${reviewId}/reply`, {
            method: 'POST',
            body: JSON.stringify({ reply_text: replyText }),
        });
    }

    async sendReviewRequest(data) {
        return this.request('/reviews/requests', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getReviewAnalytics() {
        return this.request('/reviews/analytics');
    }

    // Invoice endpoints
    async getInvoices(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/invoices?${query}`);
    }

    async getInvoice(invoiceId) {
        return this.request(`/invoices/${invoiceId}`);
    }

    async createInvoice(data) {
        return this.request('/invoices', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async sendInvoice(invoiceId) {
        return this.request(`/invoices/${invoiceId}/send`, { method: 'POST' });
    }

    // Customer endpoints
    async getCustomers() {
        return this.request('/customers');
    }

    async createCustomer(data) {
        return this.request('/customers', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateCustomer(customerId, data) {
        return this.request(`/customers/${customerId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteCustomer(customerId) {
        return this.request(`/customers/${customerId}`, { method: 'DELETE' });
    }

    // Lead endpoints
    async getLeads(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/leads?${query}`);
    }

    async createLead(data) {
        return this.request('/leads', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateLead(leadId, data) {
        return this.request(`/leads/${leadId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // Task endpoints
    async getTasks(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/tasks?${query}`);
    }

    async createTask(data) {
        return this.request('/tasks', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateTask(taskId, data) {
        return this.request(`/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // Message endpoints
    async getMessages(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/messages?${query}`);
    }

    async markMessageAsRead(messageId) {
        return this.request(`/messages/${messageId}/read`, { method: 'PUT' });
    }

    // Notification endpoints
    async getNotifications(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/notifications?${query}`);
    }

    async markNotificationAsRead(notificationId) {
        return this.request(`/notifications/${notificationId}/read`, { method: 'PUT' });
    }

    // Analytics endpoints
    async getDashboardMetrics() {
        return this.request('/analytics/dashboard');
    }

    async getRevenueAnalytics() {
        return this.request('/analytics/revenue');
    }
}

// Create API instance
const api = new API(API_URL);
