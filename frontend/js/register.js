// Register Page
document.addEventListener('DOMContentLoaded', () => {
    // Redirect if already logged in
    if (isAuthenticated()) {
        window.location.href = '/dashboard.html';
        return;
    }

    const form = document.getElementById('register-form');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError('error-message');

        const name = document.getElementById('name').value;
        const businessName = document.getElementById('businessName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (password.length < 8) {
            showError('error-message', 'Password must be at least 8 characters long');
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Creating account...';

        try {
            const response = await api.register(name, businessName, email, password);

            if (response.status === 'success') {
                setToken(response.data.token);
                localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(response.data.user));
                window.location.href = '/dashboard.html';
            } else {
                throw new Error(response.message || 'Registration failed');
            }
        } catch (error) {
            showError('error-message', error.message || 'Registration failed. Please try again.');
            submitButton.disabled = false;
            submitButton.textContent = 'Create Account';
        }
    });
});
