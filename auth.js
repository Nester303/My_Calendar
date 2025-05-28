// frontend/js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const adminButton = document.getElementById('adminButton');
    const logoutLink = document.getElementById('logoutLink');
    const adminCodeModal = document.getElementById('adminCodeModal');
    const confirmAdminCodeButton = document.getElementById('confirmAdminCode');
    let registrationData = null;

    // Dynamiczne zarządzanie nawigacją
    const token = localStorage.getItem('token');
    if (token) {
        if (logoutLink) logoutLink.style.display = 'block';
        fetch('http://localhost:3000/api/auth/admin', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(response => {
                if (response.ok && adminButton) {
                    adminButton.style.display = 'flex';
                    adminButton.onclick = () => window.location.href = 'admin_dashboard.html';
                }
            })
            .catch(() => {
                if (adminButton) adminButton.style.display = 'none';
            });
    } else {
        if (logoutLink) logoutLink.style.display = 'none';
        if (adminButton) adminButton.style.display = 'none';
    }

    // Funkcja do zamykania modalu
    window.closeAdminCodeModal = () => {
        if (adminCodeModal) adminCodeModal.classList.add('hidden');
    };

    // Sprawdzenie roli i pokazywanie modalu
    window.checkRole = () => {
        const role = document.getElementById('role').value;
        if (role === 'admin' && adminCodeModal) {
            adminCodeModal.classList.remove('hidden');
        } else if (adminCodeModal) {
            adminCodeModal.classList.add('hidden');
        }
    };

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email')?.value?.trim();
            const password = document.getElementById('password')?.value?.trim();
            const adminCode = document.getElementById('adminCode')?.value?.trim();

            if (!email || !password) {
                showToast('Wypełnij email i hasło!', 'error');
                return;
            }

            try {
                const response = await fetch('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, adminCode })
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Błąd logowania');
                localStorage.setItem('token', result.token);
                showToast('Zalogowano pomyślnie!', 'success');
                setTimeout(() => window.location.href = 'calendar.html', 1000);
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email')?.value?.trim();
            const password = document.getElementById('password')?.value?.trim();
            const confirmPassword = document.getElementById('confirmPassword')?.value?.trim();
            const role = document.getElementById('role')?.value;

            if (!email || !password || !confirmPassword) {
                showToast('Wypełnij wszystkie pola!', 'error');
                return;
            }
            if (password !== confirmPassword) {
                showToast('Hasła nie są zgodne!', 'error');
                return;
            }

            registrationData = { email, password, confirmPassword, role };

            if (role === 'admin') {
                // Modal już pokazany przez checkRole(), czekamy na potwierdzenie
                return; // Zatrzymujemy rejestrację, dopóki kod nie zostanie potwierdzony
            } else {
                // Dla użytkownika rejestracja bez kodu
                try {
                    const response = await fetch('http://localhost:3000/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(registrationData)
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.message || 'Błąd rejestracji');
                    localStorage.setItem('token', result.token);
                    showToast('Zarejestrowano pomyślnie!', 'success');
                    setTimeout(() => window.location.href = 'calendar.html', 1000);
                } catch (err) {
                    showToast(err.message, 'error');
                }
            }
        });

        // Obsługa potwierdzenia kodu w modalu
        if (confirmAdminCodeButton) {
            confirmAdminCodeButton.addEventListener('click', async () => {
                const adminCode = document.getElementById('modalAdminCode')?.value?.trim();
                if (!adminCode) {
                    showToast('Podaj kod administracyjny!', 'error');
                    return;
                }

                registrationData.adminCode = adminCode;
                closeAdminCodeModal();

                try {
                    const response = await fetch('http://localhost:3000/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(registrationData)
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.message || 'Błąd rejestracji');
                    localStorage.setItem('token', result.token);
                    showToast('Zarejestrowano pomyślnie!', 'success');
                    setTimeout(() => window.location.href = 'calendar.html', 1000);
                } catch (err) {
                    showToast(err.message, 'error');
                }
            });
        }
    }
});