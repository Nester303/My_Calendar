let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let token = localStorage.getItem('token') || null;

document.addEventListener('DOMContentLoaded', () => {
    // Rejestracja
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        const roleSelect = document.getElementById('role');
        const adminCodeInput = document.getElementById('adminCode');
        const adminCodeLabel = document.getElementById('adminCodeLabel');

        // Pokazuj/ukrywaj pole kodu administracyjnego
        if (roleSelect && adminCodeInput && adminCodeLabel) {
            roleSelect.addEventListener('change', () => {
                if (roleSelect.value === 'admin') {
                    adminCodeInput.classList.remove('hidden');
                    adminCodeLabel.classList.remove('hidden');
                } else {
                    adminCodeInput.classList.add('hidden');
                    adminCodeLabel.classList.add('hidden');
                }
            });
        }

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const confirmPasswordInput = document.getElementById('confirmPassword');
            const roleInput = document.getElementById('role');
            const adminCodeInput = document.getElementById('adminCode');

            // Debugowanie: sprawdź, czy elementy istnieją
            console.log('Form elements:', {
                emailInput: !!emailInput,
                passwordInput: !!passwordInput,
                confirmPasswordInput: !!confirmPasswordInput,
                roleInput: !!roleInput,
                adminCodeInput: !!adminCodeInput
            });

            if (!emailInput || !passwordInput || !confirmPasswordInput || !roleInput) {
                showToast('Brak wymaganych pól formularza!', 'error');
                return;
            }

            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            const confirmPassword = confirmPasswordInput.value.trim();
            const role = roleInput.value;
            const adminCode = adminCodeInput ? adminCodeInput.value.trim() : '';

            console.log('Frontend data:', { email, password, confirmPassword, role, adminCode });

            if (!password || !confirmPassword) {
                showToast('Wypełnij oba pola haseł!', 'error');
                return;
            }

            if (password !== confirmPassword) {
                showToast('Hasła nie są zgodne!', 'error');
                return;
            }

            try {
                const response = await fetch('http://localhost:3000/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, confirmPassword, role, adminCode })
                });
                const data = await response.json();
                console.log('Backend response:', data);
                if (!response.ok) throw new Error(data.message || 'Błąd rejestracji');
                showToast(data.message);
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    // Logowanie
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            const adminCode = document.getElementById('adminCode') ? document.getElementById('adminCode').value.trim() : '';

            try {
                const response = await fetch('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, adminCode })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Błąd logowania');

                currentUser = data.user;
                token = data.token;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                localStorage.setItem('token', token);
                showToast('Zalogowano pomyślnie!');
                setTimeout(() => {
                    window.location.href = 'calendar.html';
                }, 1000);
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    // Wylogowanie
    if (window.location.pathname.includes('logout.html')) {
        currentUser = null;
        token = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        showToast('Wylogowano pomyślnie!');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }

    // Weryfikacja dostępu do panelu admina
    if (window.location.pathname.includes('admin-dashboard.html') || window.location.pathname.includes('user-management.html')) {
        if (!currentUser || !currentUser.isAdmin) {
            showToast('Brak dostępu! Musisz być administratorem.', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        }
    }

    // Przełączanie linków logowania/wylogowania
    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');
    const adminButton = document.querySelector('.admin-button');
    if (currentUser) {
        loginLink?.classList.add('hidden');
        logoutLink?.classList.remove('hidden');
        if (currentUser.isAdmin) {
            adminButton?.classList.remove('hidden');
        } else {
            adminButton?.classList.add('hidden');
        }
    } else {
        loginLink?.classList.remove('hidden');
        logoutLink?.classList.add('hidden');
        adminButton?.classList.add('hidden');
    }
});