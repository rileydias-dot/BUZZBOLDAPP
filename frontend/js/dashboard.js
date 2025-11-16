// Dashboard Page
document.addEventListener('DOMContentLoaded', () => {
    requireAuth();

    // Load dashboard data
    loadDashboardMetrics();
    loadUpcomingTasks();
    loadNotifications();

    // Logout button
    document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            await api.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            removeToken();
            window.location.href = '/index.html';
        }
    });
});

async function loadDashboardMetrics() {
    try {
        const response = await api.getDashboardMetrics();

        if (response.status === 'success') {
            const data = response.data;

            document.getElementById('total-leads').textContent = data.leads || 0;
            document.getElementById('total-customers').textContent = data.customers || 0;
            document.getElementById('total-revenue').textContent = formatCurrency(data.revenue || 0);
            document.getElementById('avg-rating').textContent = (data.avg_rating || 0).toFixed(1);
        }
    } catch (error) {
        console.error('Error loading metrics:', error);
    }
}

async function loadUpcomingTasks() {
    const container = document.getElementById('upcoming-tasks');

    try {
        const response = await api.getTasks({ status: 'pending' });

        if (response.status === 'success' && response.data.length > 0) {
            const tasks = response.data.slice(0, 5);
            container.innerHTML = tasks.map(task => `
                <div class="task-item">
                    <div>
                        <strong>${task.title}</strong>
                        <br>
                        <small>${task.due_date ? formatDate(task.due_date) : 'No due date'}</small>
                    </div>
                    <span class="badge ${task.priority === 'high' ? 'badge-danger' : ''}">${task.priority}</span>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-muted">No upcoming tasks</p>';
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        container.innerHTML = '<p class="text-muted">Error loading tasks</p>';
    }
}

async function loadNotifications() {
    try {
        const response = await api.getNotifications({ read: false });

        if (response.status === 'success') {
            const count = response.data.length;
            document.getElementById('notification-count').textContent = count;
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}
