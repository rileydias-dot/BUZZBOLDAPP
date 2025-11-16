// Login Page
document.addEventListener('DOMContentLoaded', () => {
    // Redirect if already logged in
    if (isAuthenticated()) {
        window.location.href = '/dashboard.html';
        return;
    }

    const form = document.getElementById('login-form');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError('error-message');

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Signing in...';

        try {
            const response = await api.login(email, password);

            if (response.status === 'success') {
                setToken(response.data.token);
                localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(response.data.user));
                window.location.href = '/dashboard.html';
            } else {
                throw new Error(response.message || 'Login failed');
            }
        } catch (error) {
            showError('error-message', error.message || 'Login failed. Please check your credentials.');
            submitButton.disabled = false;
            submitButton.textContent = 'Sign In';
        }
    });
});
