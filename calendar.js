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
    const token = localStorage.getItem('token');

    // Sprawdź token
    if (!token) {
        showToast('Zaloguj się, aby korzystać z kalendarza!', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
        return;
    }

    // Pobierz wydarzenia z backendu
    let events = [];
    try {
        console.log('Fetching events with token:', token);
        const response = await fetch('http://localhost:3000/api/events', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Błąd pobierania wydarzeń');
        events = await response.json();
        console.log('Fetched events:', events);
    } catch (err) {
        showToast(err.message, 'error');
    }

    // Inicjalizacja FullCalendar
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: false,
        events: events,
        editable: true,
        selectable: true,
        selectMirror: true,
        eventClick: (info) => {
            document.getElementById('eventTitleInput').value = info.event.title;
            document.getElementById('eventDateStart').value = info.event.start.toISOString().slice(0, 16);
            document.getElementById('eventDateEnd').value = info.event.end ? info.event.end.toISOString().slice(0, 16) : '';
            document.getElementById('eventCategory').value = info.event.extendedProps.category || '';
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
                if (!response.ok) throw new Error('Błąd aktualizacji');
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
                if (!response.ok) throw new Error('Błąd aktualizacji');
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
        const end = new Date(start.getTime() + 60 * 60 * 1000); // +1h

        const eventData = {
            title,
            start: start.toISOString(),
            end: end.toISOString(),
            category: 'other',
            color: '#f4b400',
            description: ''
        };
        console.log('Quick add event data:', eventData);

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
            calendar.addEvent(newEvent);
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
        const titleInput = document.getElementById('eventTitleInput');
        const startInput = document.getElementById('eventDateStart');
        const endInput = document.getElementById('eventDateEnd');
        const categoryInput = document.getElementById('eventCategory');
        const colorInput = document.getElementById('eventColor');
        const descriptionInput = document.getElementById('eventDescription');

        console.log('Form elements:', {
            titleInput: !!titleInput,
            startInput: !!startInput,
            endInput: !!endInput,
            categoryInput: !!categoryInput,
            colorInput: !!colorInput,
            descriptionInput: !!descriptionInput
        });

        if (!titleInput || !startInput) {
            showToast('Brak wymaganych pól formularza!', 'error');
            return;
        }

        const title = titleInput.value.trim();
        const start = startInput.value ? new Date(startInput.value) : null;
        const end = endInput.value ? new Date(endInput.value) : null;
        const category = categoryInput.value || 'other';
        const color = colorInput.value || '#1a73e8';
        const description = descriptionInput.value || '';

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
        console.log('Event form data:', eventData);

        try {
            let response;
            if (eventId) {
                // Aktualizacja istniejącego wydarzenia
                response = await fetch(`http://localhost:3000/api/events/${eventId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(eventData)
                });
            } else {
                // Dodawanie nowego wydarzenia
                response = await fetch('http://localhost:3000/api/events', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(eventData)
                });
            }

            const result = await response.json();
            console.log('Backend response:', result);
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
                calendar.addEvent(result);
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
            if (!response.ok) throw new Error('Błąd usuwania');
            calendar.getEventById(eventId).remove();
            eventModal.classList.add('hidden');
            showToast('Wydarzenie usunięte!');
        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    // Aktualizacja koloru na podstawie kategorii
    document.getElementById('eventCategory').addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        const color = selectedOption.dataset.color || '#1a73e8';
        document.getElementById('eventColor').value = color;
    });
});