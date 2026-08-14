// Utility functions for the application

// Calculate Injury Free Days based on IST Date
function calculateInjuryFreeDays(lastInjuryDateStr) {
    if (!lastInjuryDateStr) return 0;

    // Get current IST date
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    
    const parts = formatter.formatToParts(new Date());
    const year = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;
    
    const todayISTString = `${year}-${month}-${day}`;
    
    // Parse dates (treating them as UTC midnights to easily calculate differences in days without daylight saving issues)
    const today = new Date(`${todayISTString}T00:00:00Z`);
    const lastInjury = new Date(`${lastInjuryDateStr}T00:00:00Z`);
    
    // Difference in milliseconds
    const diffTime = today - lastInjury;
    
    // Difference in days (add 1 to include the start date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return diffDays >= 0 ? diffDays : 0;
}

// Format date for display
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(`${dateStr}T00:00:00Z`);
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}
