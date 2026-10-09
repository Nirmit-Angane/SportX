document.addEventListener('DOMContentLoaded', async () => {
    const eventSelect = document.getElementById('event-select');
    const form = document.getElementById('register-form');
    const errorMsg = document.getElementById('error-msg');
    const successMsg = document.getElementById('success-msg');
    
    // Fetch events and populate dropdown
    try {
        const res = await fetchAPI('/events');
        if (res.success && res.data) {
            res.data.forEach(ev => {
                const option = document.createElement('option');
                option.value = ev.id;
                option.textContent = ev.name;
                eventSelect.appendChild(option);
            });
        }
    } catch (err) {
        console.error("Failed to load events", err);
    }
    
    // Handle form submission
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            errorMsg.style.display = 'none';
            successMsg.style.display = 'none';
            
            const payload = {
                event_id: eventSelect.value,
                name: document.getElementById('team-name').value,
                short_name: document.getElementById('short-name').value,
                captain: document.getElementById('captain-name').value,
                coach: document.getElementById('coach-name').value || null,
                logo: null
            };
            
            const res = await fetchAPI('/teams', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            
            if (res.success) {
                successMsg.textContent = 'TEAM REGISTERED SUCCESSFULLY!';
                successMsg.style.display = 'block';
                form.reset();
                // Scroll to success message
                successMsg.scrollIntoView({ behavior: 'smooth' });
                // Reset segment bar (using ui.js logic)
                if (window.updateSegmentBar) {
                    window.updateSegmentBar('reg-progress', 0);
                }
            } else {
                errorMsg.textContent = res.message || 'Registration failed.';
                errorMsg.style.display = 'block';
                errorMsg.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
});
