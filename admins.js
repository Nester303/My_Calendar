// backend/routes/Admin.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Event = require('../models/Event');
const router = express.Router();

// Middleware do weryfikacji admina
const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Brak tokena' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Brak uprawnień admina' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Nieprawidłowy token' });
    }
};

// Pobierz wszystkie wydarzenia
router.get('/events', verifyAdmin, async (req, res) => {
    try {
        const events = await Event.find().populate('userId', 'email');
        res.status(200).json(events); // Zwraca tablicę obiektów z id
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

// Usuń wydarzenie
router.delete('/events/:id', verifyAdmin, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Wydarzenie nie znalezione' });
        }
        await Event.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Wydarzenie usunięte', id: req.params.id });
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

module.exports = router;