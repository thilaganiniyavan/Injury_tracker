document.addEventListener('DOMContentLoaded', async () => {
    // Check if token exists, if not redirect
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin-login';
        return;
    }

    const table = document.getElementById('admin-stations-table');
    const tbody = document.getElementById('admin-table-body');
    const loading = document.getElementById('loading');

    // Modals
    const resetModal = document.getElementById('reset-modal');
    const confirmResetBtn = document.getElementById('confirm-reset-btn');
    const cancelResetBtn = document.getElementById('cancel-reset-btn');
    const resetModalText = document.getElementById('reset-modal-text');

    const pwdModal = document.getElementById('pwd-modal');
    const changePwdBtn = document.getElementById('change-pwd-btn');
    const cancelPwdBtn = document.getElementById('cancel-pwd-btn');
    const pwdForm = document.getElementById('pwd-form');

    let currentResetStationId = null;
    let stationsData = [];

    // Verify session
    try {
        const res = await fetchWithAuth('/api/admin/me');
        if (!res) return; // Handled by fetchWithAuth
    } catch (e) {
        return;
    }

    let currentLogPage = 1;
    let totalLogPages = 1;

    const prevLogsBtn = document.getElementById('prev-logs-btn');
    const nextLogsBtn = document.getElementById('next-logs-btn');
    const logsPageInfo = document.getElementById('logs-page-info');
    const logsPagination = document.getElementById('logs-pagination');

    const exportLogsBtn = document.getElementById('export-logs-btn');

    if (exportLogsBtn) {
        exportLogsBtn.addEventListener('click', async () => {
            try {
                const res = await fetchWithAuth('/api/admin/logs/export');
                if (!res || !res.ok) return;

                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'reset_logs.csv';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } catch (err) {
                console.error('Failed to export CSV', err);
                alert('Failed to export logs CSV.');
            }
        });
    }

    if (prevLogsBtn) {
        prevLogsBtn.addEventListener('click', () => {
            if (currentLogPage > 1) {
                currentLogPage--;
                loadLogs(currentLogPage);
            }
        });
    }

    if (nextLogsBtn) {
        nextLogsBtn.addEventListener('click', () => {
            if (currentLogPage < totalLogPages) {
                currentLogPage++;
                loadLogs(currentLogPage);
            }
        });
    }

    // Load logs with pagination (10 per page)
    async function loadLogs(page = 1) {
        const logsTable = document.getElementById('admin-logs-table');
        const logsBody = document.getElementById('logs-table-body');
        const logsLoading = document.getElementById('logs-loading');
        const noLogsMsg = document.getElementById('no-logs-msg');
        
        logsLoading.classList.remove('hidden');
        logsTable.classList.add('hidden');
        noLogsMsg.classList.add('hidden');
        if (logsPagination) logsPagination.classList.add('hidden');

        try {
            const res = await fetchWithAuth(`/api/admin/logs?page=${page}&limit=10`);
            if (!res) return;
            
            const data = await res.json();
            const logs = data.logs || [];
            currentLogPage = data.page || 1;
            totalLogPages = data.totalPages || 1;
            
            if (logs.length === 0) {
                noLogsMsg.classList.remove('hidden');
            } else {
                logsBody.innerHTML = '';
                logs.forEach(log => {
                    // Format timestamp
                    const dateObj = new Date(log.reset_timestamp + 'Z'); // SQLite CURRENT_TIMESTAMP is UTC
                    const formattedDate = dateObj.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' });
                    
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td style="color: var(--text-secondary);">${formattedDate}</td>
                        <td style="font-weight: 600;">${log.station_code}</td>
                        <td>${formatDate(log.previous_last_injury_date)}</td>
                        <td style="color: var(--accent-color); font-weight: 600;">${formatDate(log.new_last_injury_date)}</td>
                    `;
                    logsBody.appendChild(tr);
                });
                logsTable.classList.remove('hidden');

                if (logsPagination) {
                    logsPagination.classList.remove('hidden');
                    logsPageInfo.textContent = `Page ${currentLogPage} of ${totalLogPages}`;
                    prevLogsBtn.disabled = currentLogPage <= 1;
                    nextLogsBtn.disabled = currentLogPage >= totalLogPages;
                    prevLogsBtn.style.opacity = currentLogPage <= 1 ? '0.4' : '1';
                    nextLogsBtn.style.opacity = currentLogPage >= totalLogPages ? '0.4' : '1';
                }
            }
        } catch (e) {
            console.error('Error loading logs', e);
            noLogsMsg.textContent = 'Error loading logs.';
            noLogsMsg.classList.remove('hidden');
        } finally {
            logsLoading.classList.add('hidden');
        }
    }

    // Load stations
    async function loadStations() {
        try {
            const res = await fetchWithAuth('/api/stations');
            if (!res) return;
            
            stationsData = await res.json();
            renderTable();
        } catch (e) {
            console.error('Error loading stations', e);
            loading.innerHTML = '<div class="error-message">Failed to load data.</div>';
        }
    }

    // Get current IST date formatted
    function getTodayISTFormatted() {
        const formatter = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Kolkata',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        return formatter.format(new Date());
    }

    function renderTable() {
        tbody.innerHTML = '';
        
        stationsData.forEach(station => {
            const days = calculateInjuryFreeDays(station.last_injury_date);
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: 600;">${station.station_code}</td>
                <td>
                    <input type="date" class="form-control date-input campaign-date" data-id="${station.id}" value="${station.campaign_start_date}">
                </td>
                <td>
                    <input type="date" class="form-control date-input last-injury-date" data-id="${station.id}" value="${station.last_injury_date}">
                </td>
                <td><span class="days-count" id="days-${station.id}" style="font-size: 1.25rem; font-weight: 700; color: var(--accent-color);">${days}</span></td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-primary save-btn" data-id="${station.id}">Save</button>
                        <button class="btn btn-danger reset-btn" data-id="${station.id}" data-code="${station.station_code}">Reset to Today</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Add event listeners to date inputs for instant UI recalculation on change
        document.querySelectorAll('.last-injury-date').forEach(input => {
            input.addEventListener('change', (e) => {
                const id = e.target.getAttribute('data-id');
                const daysSpan = document.getElementById(`days-${id}`);
                if (daysSpan) {
                    daysSpan.textContent = calculateInjuryFreeDays(e.target.value);
                }
            });
        });

        // Add event listeners to save buttons
        document.querySelectorAll('.save-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                const row = e.target.closest('tr');
                const campaignDateInput = row.querySelector('.campaign-date');
                const lastInjuryDateInput = row.querySelector('.last-injury-date');

                btn.disabled = true;
                const origText = btn.textContent;
                btn.textContent = 'Saving...';

                try {
                    const res = await fetchWithAuth(`/api/admin/stations/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            campaign_start_date: campaignDateInput.value,
                            last_injury_date: lastInjuryDateInput.value
                        })
                    });

                    if (res && res.ok) {
                        btn.textContent = 'Saved!';
                        setTimeout(() => { btn.textContent = origText; btn.disabled = false; }, 1500);
                        await loadStations();
                        await loadLogs(1);
                    } else {
                        alert('Failed to update station dates.');
                        btn.disabled = false;
                        btn.textContent = origText;
                    }
                } catch (err) {
                    console.error(err);
                    alert('Error saving station dates.');
                    btn.disabled = false;
                    btn.textContent = origText;
                }
            });
        });

        // Add event listeners to reset buttons
        document.querySelectorAll('.reset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const code = e.target.getAttribute('data-code');
                openResetModal(id, code);
            });
        });

        loading.classList.add('hidden');
        table.classList.remove('hidden');
    }

    // Reset Modal Logic
    function openResetModal(id, code) {
        currentResetStationId = id;
        const todayStr = getTodayISTFormatted();
        resetModalText.textContent = `Reset Station ${code}'s last injury date to today (${todayStr})?`;
        resetModal.classList.add('active');
    }

    function closeResetModal() {
        resetModal.classList.remove('active');
        currentResetStationId = null;
    }

    cancelResetBtn.addEventListener('click', closeResetModal);

    confirmResetBtn.addEventListener('click', async () => {
        if (!currentResetStationId) return;

        confirmResetBtn.disabled = true;
        confirmResetBtn.textContent = 'Resetting...';

        try {
            const res = await fetchWithAuth(`/api/admin/stations/${currentResetStationId}/reset`, {
                method: 'POST'
            });

            if (res && res.ok) {
                // Refresh data
                await loadStations();
                await loadLogs();
                closeResetModal();
            } else {
                alert('Failed to reset station.');
            }
        } catch (e) {
            console.error(e);
            alert('Error during reset.');
        } finally {
            confirmResetBtn.disabled = false;
            confirmResetBtn.textContent = 'Confirm Reset';
        }
    });

    // Password Modal Logic
    changePwdBtn.addEventListener('click', () => {
        document.getElementById('current-pwd').value = '';
        document.getElementById('new-pwd').value = '';
        document.getElementById('pwd-error').classList.add('hidden');
        document.getElementById('pwd-success').classList.add('hidden');
        pwdModal.classList.add('active');
    });

    cancelPwdBtn.addEventListener('click', () => {
        pwdModal.classList.remove('active');
    });

    pwdForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('current-pwd').value;
        const newPassword = document.getElementById('new-pwd').value;
        const errorDiv = document.getElementById('pwd-error');
        const successDiv = document.getElementById('pwd-success');
        const submitBtn = pwdForm.querySelector('button[type="submit"]');
        
        errorDiv.classList.add('hidden');
        successDiv.classList.add('hidden');
        submitBtn.disabled = true;

        try {
            const res = await fetchWithAuth('/api/admin/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await res.json();

            if (res.ok) {
                successDiv.textContent = 'Password changed successfully.';
                successDiv.classList.remove('hidden');
                setTimeout(() => {
                    pwdModal.classList.remove('active');
                }, 2000);
            } else {
                errorDiv.textContent = data.error || 'Failed to change password.';
                errorDiv.classList.remove('hidden');
            }
        } catch (e) {
            errorDiv.textContent = 'An error occurred.';
            errorDiv.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
        }
    });

    // Initial Load
    loadStations();
    loadLogs();
});
