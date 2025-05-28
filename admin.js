// frontend/js/admin.js
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Zaloguj się jako admin!', 'error');
        setTimeout(() => window.location.href = 'login.html', 1000);
        return;
    }

    // Sprawdź, czy użytkownik jest adminem
    try {
        const response = await fetch('http://localhost:3000/api/auth/admin', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Brak uprawnień admina');
    } catch (err) {
        showToast(err.message, 'error');
        setTimeout(() => window.location.href = 'login.html', 1000);
        return;
    }

    // Ładowanie użytkowników i wydarzeń
    await Promise.all([loadUsers(), loadEvents()]);
});

async function loadUsers() {
    const userList = document.getElementById('userList');
    if (!userList) return;

    try {
        const response = await fetch('http://localhost:3000/api/admin/users', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error('Błąd pobierania użytkowników');
        const users = await response.json();

        userList.innerHTML = users.map(user => `
            <li>
                ${user.email} (${user.role || 'user'})
                <button onclick="deleteUser('${user._id}')">Usuń</button>
            </li>
        `).join('');
    } catch (err) {
        showToast('Błąd ładowania użytkowników', 'error');
    }
}

async function loadEvents() {
    const eventList = document.getElementById('eventList');
    if (!eventList) return;

    try {
        const response = await fetch('http://localhost:3000/api/admin/events', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error('Błąd pobierania wydarzeń');
        const events = await response.json();

        eventList.innerHTML = events.map(event => `
            <li>
                ${event.title} (${new Date(event.start).toLocaleString()}) - ${event.userId?.email || 'Brak użytkownika'}
                <button onclick="deleteEvent('${event._id}')">Usuń</button>
            </li>
        `).join('');
    } catch (err) {
        showToast('Błąd ładowania wydarzeń', 'error');
    }
}

window.deleteUser = async (userId) => {
    if (!confirm('Czy na pewno chcesz usunąć tego użytkownika?')) return;

    try {
        const response = await fetch(`http://localhost:3000/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Błąd usuwania użytkownika');
        }
        showToast('Użytkownik usunięty!');
        loadUsers();
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.deleteEvent = async (eventId) => {
    if (!confirm('Czy na pewno chcesz usunąć to wydarzenie?')) return;

    try {
        const response = await fetch(`http://localhost:3000/api/admin/events/${eventId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Błąd usuwania wydarzenia');
        }
        showToast('Wydarzenie usunięte!');
        loadEvents();
    } catch (err) {
        showToast(err.message, 'error');
    }
};