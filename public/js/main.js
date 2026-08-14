document.addEventListener('DOMContentLoaded', () => {

    const grid = document.getElementById('stations-grid');
    const loading = document.getElementById('loading');

    async function fetchStations() {
        try {
            const response = await fetch('/api/stations');
            if (!response.ok) throw new Error('Failed to fetch data');
            const stations = await response.json();
            
            renderStations(stations);
        } catch (error) {
            console.error('Error fetching stations:', error);
            loading.innerHTML = `<span class="error-message">Failed to load station data. Please try again later.</span>`;
        }
    }

    function renderStations(stations) {
        grid.innerHTML = '';
        
        stations.forEach(station => {
            const days = calculateInjuryFreeDays(station.last_injury_date);
            
            const card = document.createElement('a');
            card.href = `/station/${station.station_code}`;
            card.className = 'glass-card station-card';
            
            card.innerHTML = `
                <div class="station-code">${station.station_code}</div>
                <div class="injury-days">${days}</div>
                <div class="days-label">Injury-Free Days</div>
            `;
            
            grid.appendChild(card);
        });

        loading.classList.add('hidden');
        grid.classList.remove('hidden');
    }

    // Initial fetch
    fetchStations();

    // Setup periodic refresh every 10 minutes to handle midnight rollovers automatically
    setInterval(fetchStations, 10 * 60 * 1000);
});
