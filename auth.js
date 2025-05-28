// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const router = express.Router();

// Rejestracja
router.post('/register', async (req, res) => {
    const { email, password, confirmPassword, role, adminCode } = req.body;

    if (!email || !password || !confirmPassword) {
        return res.status(400).json({ message: 'Wypełnij wszystkie pola' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Hasła nie są zgodne' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email już istnieje' });
        }

        let userRole = 'user';
        if (role === 'admin') {
            const adminEntry = await Admin.findOne();
            if (!adminEntry || adminCode !== adminEntry.code) {
                return res.status(403).json({ message: 'Nieprawidłowy kod administracyjny' });
            }
            userRole = 'admin';
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword, role: userRole });
        await user.save();

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ token });
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

// Logowanie
router.post('/login', async (req, res) => {
    const { email, password, adminCode } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Wypełnij email i hasło' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Nieprawidłowy email lub hasło' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Nieprawidłowy email lub hasło' });
        }

        // Weryfikacja kodu admina, jeśli użytkownik jest adminem
        if (user.role === 'admin' && adminCode !== (await Admin.findOne()).code) {
            return res.status(403).json({ message: 'Nieprawidłowy kod administracyjny' });
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token });
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

// Sprawdzenie, czy użytkownik jest adminem
router.get('/admin', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Brak tokena' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Brak uprawnień admina' });
        }
        res.status(200).json({ message: 'Użytkownik jest adminem' });
    } catch (err) {
        res.status(401).json({ message: 'Nieprawidłowy token' });
    }
});

module.exports = router;