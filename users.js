document.addEventListener('DOMContentLoaded', async () => {
    // Zarządzanie wydarzeniami (admin-dashboard.html)
    const eventList = document.getElementById('eventList');
    if (eventList) {
        try {
            const response = await fetch('http://localhost:3000/api/admin/events', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Błąd ładowania wydarzeń');
            const events = await response.json();

            eventList.innerHTML = events.map(event => `
                <li>
                    <span>${event.title} (${new Date(event.start).toLocaleString()} - ${event.userId.email})</span>
                    <button onclick="deleteEvent('${event._id}')">Usuń</button>
                </li>
            `).join('');
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    // Zarządzanie użytkownikami (user-management.html)
    const userList = document.getElementById('userList');
    if (userList) {
        try {
            const response = await fetch('http://localhost:3000/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Błąd ładowania użytkowników');
            const users = await response.json();

            userList.innerHTML = users.map(user => `
                <li>
                    <span>${user.email} (${user.role})</span>
                    <button onclick="deleteUser('${user._id}')">Usuń</button>
                </li>
            `).join('');
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
});

// Usuwanie wydarzenia
async function deleteEvent(eventId) {
    if (!confirm('Czy na pewno chcesz usunąć to wydarzenie?')) return;

    try {
        const response = await fetch(`http://localhost:3000/api/admin/events/${eventId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Błąd usuwania');
        showToast('Wydarzenie usunięte!');
        location.reload();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// Usuwanie użytkownika
async function deleteUser(userId) {
    if (!confirm('Czy na pewno chcesz usunąć tego użytkownika i jego wydarzenia?')) return;

    try {
        const response = await fetch(`http://localhost:3000/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Błąd usuwania');
        showToast('Użytkownik usunięty!');
        location.reload();
    } catch (err) {
        showToast(err.message, 'error');
    }
}