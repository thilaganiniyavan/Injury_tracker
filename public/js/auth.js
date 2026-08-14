document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const usernameInput = document.getElementById('username').value;
            const passwordInput = document.getElementById('password').value;
            const errorDiv = document.getElementById('login-error');
            
            errorDiv.classList.add('hidden');
            
            try {
                const response = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: usernameInput, password: passwordInput })
                });
                
                const data = await response.json();
                
                if (response.ok && data.token) {
                    localStorage.setItem('adminToken', data.token);
                    window.location.href = '/admin';
                } else {
                    errorDiv.textContent = data.error || 'Login failed';
                    errorDiv.classList.remove('hidden');
                }
            } catch (error) {
                console.error('Login error:', error);
                errorDiv.textContent = 'An error occurred during login.';
                errorDiv.classList.remove('hidden');
            }
        });
    }

    // Handle logout button if it exists
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin-login';
        });
    }
});

// Helper for authorized API calls
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
        window.location.href = '/admin-login';
        return null;
    }
    
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };
    
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401 || response.status === 403) {
        // Token expired or invalid
        localStorage.removeItem('adminToken');
        window.location.href = '/admin-login';
        return null;
    }
    
    return response;
}
