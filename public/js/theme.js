document.addEventListener('DOMContentLoaded', () => {
    const themeBtn = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // Apply saved theme
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeBtn) themeBtn.innerHTML = '☀️';
    } else {
        if (themeBtn) themeBtn.innerHTML = '🌙';
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            if (newTheme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
                themeBtn.innerHTML = '☀️';
            } else {
                document.documentElement.removeAttribute('data-theme');
                themeBtn.innerHTML = '🌙';
            }
            
            localStorage.setItem('theme', newTheme);
        });
    }
});

// Run immediately to prevent flash of wrong theme
const initialTheme = localStorage.getItem('theme');
if (initialTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
}
