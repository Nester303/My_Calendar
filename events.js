// backend/routes/events.js
const express = require('express');
const jwt = require('jsonwebtoken');
const Event = require('../models/Event');
const Admin = require('../models/Admin');
const router = express.Router();

// Middleware do weryfikacji tokena
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Brak tokenu' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Nieprawidłowy token' });
    }
};

// Pobieranie wydarzeń
router.get('/', authMiddleware, async (req, res) => {
    try {
        const events = await (await Admin.findOne({ userId: req.user.userId })
            ? Event.find()
            : Event.find({ userId: req.user.userId }));
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera', error: err.message });
    }
});

// Dodawanie wydarzenia
router.post('/', authMiddleware, async (req, res) => {
    const { title, start, end, category, color, description } = req.body;

    try {
        if (!title || !start) return res.status(400).json({ message: 'Tytuł i start wymagane' });
        const event = new Event({
            title, start: new Date(start), end: end ? new Date(end) : null,
            category, color, description, userId: req.user.userId
        });
        await event.save();
        res.status(201).json(event);
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera', error: err.message });
    }
});

// Aktualizacja wydarzenia
router.put('/:id', authMiddleware, async (req, res) => {
    const { title, start, end, category, color, description } = req.body;

    try {
        if (!title || !start) return res.status(400).json({ message: 'Tytuł i start wymagane' });
        const event = await Event.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.userId },
            { title, start: new Date(start), end: end ? new Date(end) : null, category, color, description },
            { new: true, runValidators: true }
        );
        if (!event) return res.status(404).json({ message: 'Wydarzenie nie znalezione' });
        res.json(event);
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera', error: err.message });
    }
});

// Usuwanie wydarzenia
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const event = await (await Admin.findOne({ userId: req.user.userId })
            ? Event.findByIdAndDelete(req.params.id)
            : Event.findOneAndDelete({ _id: req.params.id, userId: req.user.userId }));
        if (!event) return res.status(404).json({ message: 'Wydarzenie nie znalezione' });
        res.json({ message: 'Wydarzenie usunięte' });
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera', error: err.message });
    }
});

module.exports = router;