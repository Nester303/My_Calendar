// frontend/js/calendar.js
document.addEventListener('DOMContentLoaded', async () => {
    const calendarEl = document.getElementById('calendar');
    const eventModal = document.getElementById('eventModal');
    const eventForm = document.getElementById('eventForm');
    const closeModal = document.querySelector('.close');
    const quickAddButton = document.getElementById('quickAddButton');
    const quickAddInput = document.getElementById('quickAddInput');
    const viewMonth = document.getElementById('viewMonth');
    const viewWeek = document.getElementById('viewWeek');
    const viewDay = document.getElementById('viewDay');
    const prevMonth = document.getElementById('prevMonth');
    const nextMonth = document.getElementById('nextMonth');
    const monthYear = document.getElementById('monthYear');

    if (!calendarEl) {
        showToast('Brak elementu kalendarza!', 'error');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Zaloguj się, aby korzystać z kalendarza!', 'error');
        setTimeout(() => window.location.href = 'login.html', 1000);
        return;
    }

    // Pobierz wydarzenia
    let events = [];
    try {
        const response = await fetch('http://localhost:3000/api/events', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const text = await response.text(); // Debug: Sprawdź, co serwer zwraca
            console.error('Odpowiedź serwera:', text);
            throw new Error('Błąd pobierania wydarzeń');
        }
        const data = await response.json(); // Parsowanie JSON
        events = Array.isArray(data) ? data : [];
    } catch (err) {
        showToast(err.message, 'error');
        console.error('Błąd fetch:', err);
    }

    // Inicjalizacja FullCalendar
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: false,
        events: events.map(event => ({
            id: event.id || event._id, // Użyj id z transformacji lub _id jako fallback
            title: event.title,
            start: event.start,
            end: event.end,
            backgroundColor: event.color,
            extendedProps: {
                category: event.category,
                description: event.description
            }
        })),
        editable: true,
        selectable: true,
        selectMirror: true,
        eventClick: (info) => {
            document.getElementById('eventTitleInput').value = info.event.title;
            document.getElementById('eventDateStart').value = info.event.start.toISOString().slice(0, 16);
            document.getElementById('eventDateEnd').value = info.event.end ? info.event.end.toISOString().slice(0, 16) : '';
            document.getElementById('eventCategory').value = info.event.extendedProps.category || 'other';
            document.getElementById('eventColor').value = info.event.backgroundColor || '#1a73e8';
            document.getElementById('eventDescription').value = info.event.extendedProps.description || '';
            document.getElementById('deleteEvent').classList.remove('hidden');
            eventModal.dataset.eventId = info.event.id;
            eventModal.classList.remove('hidden');
        },
        select: (info) => {
            document.getElementById('eventForm').reset();
            document.getElementById('eventDateStart').value = info.startStr.slice(0, 16);
            document.getElementById('eventDateEnd').value = info.endStr.slice(0, 16);
            document.getElementById('eventColor').value = '#1a73e8';
            document.getElementById('deleteEvent').classList.add('hidden');
            eventModal.dataset.eventId = '';
            eventModal.classList.remove('hidden');
            calendar.unselect();
        },
        eventDrop: async (info) => {
            try {
                const response = await fetch(`http://localhost:3000/api/events/${info.event.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: info.event.title,
                        start: info.event.start.toISOString(),
                        end: info.event.end ? info.event.end.toISOString() : null,
                        category: info.event.extendedProps.category,
                        color: info.event.backgroundColor,
                        description: info.event.extendedProps.description
                    })
                });

                calendar.render();

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Błąd aktualizacji');
                }
                showToast('Wydarzenie przesunięte!');
            } catch (err) {
                showToast(err.message, 'error');
                info.revert();
            }
        },
        eventResize: async (info) => {
            try {
                const response = await fetch(`http://localhost:3000/api/events/${info.event.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: info.event.title,
                        start: info.event.start.toISOString(),
                        end: info.event.end ? info.event.end.toISOString() : null,
                        category: info.event.extendedProps.category,
                        color: info.event.backgroundColor,
                        description: info.event.extendedProps.description
                    })
                });
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Błąd aktualizacji');
                }
                showToast('Czas wydarzenia zmieniony!');
            } catch (err) {
                showToast(err.message, 'error');
                info.revert();
            }
        },
        dateClick: (info) => {
            document.getElementById('eventForm').reset();
            document.getElementById('eventDateStart').value = info.dateStr + 'T09:00';
            document.getElementById('eventColor').value = '#1a73e8';
            document.getElementById('deleteEvent').classList.add('hidden');
            eventModal.dataset.eventId = '';
            eventModal.classList.remove('hidden');
        }
    });

    calendar.render();

    // Aktualizacja nagłówka miesiąca
    const updateMonthYear = () => {
        monthYear.textContent = calendar.view.title;
    };
    updateMonthYear();

    // Przełączanie widoków
    viewMonth.addEventListener('click', () => {
        calendar.changeView('dayGridMonth');
        viewMonth.classList.add('active');
        viewWeek.classList.remove('active');
        viewDay.classList.remove('active');
        updateMonthYear();
    });

    viewWeek.addEventListener('click', () => {
        calendar.changeView('timeGridWeek');
        viewWeek.classList.add('active');
        viewMonth.classList.remove('active');
        viewDay.classList.remove('active');
        updateMonthYear();
    });

    viewDay.addEventListener('click', () => {
        calendar.changeView('timeGridDay');
        viewDay.classList.add('active');
        viewMonth.classList.remove('active');
        viewWeek.classList.remove('active');
        updateMonthYear();
    });

    // Nawigacja po miesiącach
    prevMonth.addEventListener('click', () => {
        calendar.prev();
        updateMonthYear();
    });

    nextMonth.addEventListener('click', () => {
        calendar.next();
        updateMonthYear();
    });

    // Zamykanie modalu
    closeModal.addEventListener('click', () => {
        eventModal.classList.add('hidden');
    });

    // Szybkie dodawanie wydarzenia
    quickAddButton.addEventListener('click', async () => {
        const title = quickAddInput.value.trim();
        if (!title) {
            showToast('Wpisz tytuł wydarzenia!', 'error');
            return;
        }

        const now = new Date();
        const start = new Date(now.setHours(now.getHours() + 1));
        const end = new Date(start.getTime() + 60 * 60 * 1000);

        const eventData = {
            title,
            start: start.toISOString(),
            end: end.toISOString(),
            category: 'other',
            color: '#f4b400',
            description: ''
        };

        try {
            const response = await fetch('http://localhost:3000/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(eventData)
            });
            const newEvent = await response.json();
            if (!response.ok) throw new Error(newEvent.message || 'Błąd dodawania');
            calendar.addEvent({
                id: newEvent._id,
                title: newEvent.title,
                start: newEvent.start,
                end: newEvent.end,
                backgroundColor: newEvent.color,
                extendedProps: {
                    category: newEvent.category,
                    description: newEvent.description
                }
            });
            quickAddInput.value = '';
            showToast('Wydarzenie dodane!');
        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    // Obsługa formularza wydarzenia
    eventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const eventId = eventModal.dataset.eventId;
        const title = document.getElementById('eventTitleInput').value.trim();
        const start = new Date(document.getElementById('eventDateStart').value);
        const end = document.getElementById('eventDateEnd').value ? new Date(document.getElementById('eventDateEnd').value) : null;
        const category = document.getElementById('eventCategory').value || 'other';
        const color = document.getElementById('eventColor').value || '#1a73e8';
        const description = document.getElementById('eventDescription').value || '';

        if (!title || !start || isNaN(start)) {
            showToast('Wypełnij tytuł i poprawną datę rozpoczęcia!', 'error');
            return;
        }

        const eventData = {
            title,
            start: start.toISOString(),
            end: end && !isNaN(end) ? end.toISOString() : null,
            category,
            color,
            description
        };

        try {
            const response = await fetch(`http://localhost:3000/api/events${eventId ? `/${eventId}` : ''}`, {
                method: eventId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(eventData)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Błąd operacji');

            if (eventId) {
                const event = calendar.getEventById(eventId);
                event.setProp('title', result.title);
                event.setStart(result.start);
                event.setEnd(result.end);
                event.setProp('backgroundColor', result.color);
                event.setExtendedProp('category', result.category);
                event.setExtendedProp('description', result.description);
                showToast('Wydarzenie zaktualizowane!');
            } else {
                calendar.addEvent({
                    id: result._id,
                    title: result.title,
                    start: result.start,
                    end: result.end,
                    backgroundColor: result.color,
                    extendedProps: {
                        category: result.category,
                        description: result.description
                    }
                });
                showToast('Wydarzenie dodane!');
            }

            eventModal.classList.add('hidden');
            eventForm.reset();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    // Usuwanie wydarzenia
    document.getElementById('deleteEvent').addEventListener('click', async () => {
        const eventId = eventModal.dataset.eventId;
        if (!eventId) return;

        try {
            const response = await fetch(`http://localhost:3000/api/events/${eventId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Błąd usuwania');
            }
            calendar.getEventById(eventId).remove();
            eventModal.classList.add('hidden');
            showToast('Wydarzenie usunięte!');
        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    // Aktualizacja koloru na podstawie kategorii
    document.getElementById('eventCategory').addEventListener('change', (e) => {
        const colors = {
            work: '#ff6d00',
            personal: '#34c759',
            other: '#1a73e8'
        };
        const category = e.target.value;
        document.getElementById('eventColor').value = colors[category] || '#1a73e8';
    });
});