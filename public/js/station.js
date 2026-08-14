document.addEventListener('DOMContentLoaded', () => {
    // Extract station code from URL path (e.g., /station/A)
    const pathParts = window.location.pathname.split('/');
    const stationCode = pathParts[pathParts.length - 1];

    const loading = document.getElementById('loading');
    const details = document.getElementById('station-details');
    const errorMsg = document.getElementById('error-message');

    const nameEl = document.getElementById('station-name');
    const daysEl = document.getElementById('injury-days');
    const dateEl = document.getElementById('last-injury-date');

    async function fetchStation() {
        if (!stationCode) {
            showError('Invalid Station URL');
            return;
        }

        try {
            const response = await fetch(`/api/stations/${stationCode}`);
            if (!response.ok) {
                if (response.status === 404) throw new Error('Station not found');
                throw new Error('Failed to fetch data');
            }
            const station = await response.json();
            
            renderStation(station);
        } catch (error) {
            console.error('Error fetching station:', error);
            showError(error.message);
        }
    }

    function renderStation(station) {
        const days = calculateInjuryFreeDays(station.last_injury_date);
        
        nameEl.textContent = `Station ${station.station_code}`;
        daysEl.textContent = days;
        dateEl.textContent = formatDate(station.last_injury_date);

        loading.classList.add('hidden');
        errorMsg.classList.add('hidden');
        details.classList.remove('hidden');
    }

    function showError(message) {
        loading.classList.add('hidden');
        details.classList.add('hidden');
        errorMsg.textContent = message;
        errorMsg.classList.remove('hidden');
    }

    // Initial fetch
    fetchStation();

    // Setup periodic refresh every 10 minutes to handle midnight rollovers
    setInterval(fetchStation, 10 * 60 * 1000);
});
