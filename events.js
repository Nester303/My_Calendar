const express = require('express');
const jwt = require('jsonwebtoken');
const Event = require('../models/Event');
const router = express.Router();

// Middleware do weryfikacji tokena JWT
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'Brak tokenu' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Nieprawidłowy token' });
    }
};

// Pobieranie wydarzeń użytkownika
router.get('/', authMiddleware, async (req, res) => {
    try {
        console.log('Fetching events for user:', req.user.userId);
        const events = await Event.find({ userId: req.user.userId });
        console.log('Found events:', events);
        res.json(events);
    } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).json({ message: 'Błąd serwera', error: err.message });
    }
});

// Dodawanie wydarzenia
router.post('/', authMiddleware, async (req, res) => {
    const { title, start, end, category, color, description } = req.body;
    console.log('Received event data:', req.body);
    try {
        if (!title || !start) {
            return res.status(400).json({ message: 'Tytuł i data rozpoczęcia są wymagane' });
        }
        const startDate = new Date(start);
        if (isNaN(startDate)) {
            return res.status(400).json({ message: 'Nieprawidłowa data rozpoczęcia' });
        }
        const event = new Event({
            title,
            start: startDate,
            end: end ? new Date(end) : null,
            category: category || 'other',
            color: color || '#1a73e8',
            description: description || '',
            userId: req.user.userId
        });
        await event.save();
        res.status(201).json(event);
    } catch (err) {
        console.error('Error saving event:', err);
        res.status(500).json({ message: 'Błąd serwera', error: err.message });
    }
});
// Aktualizacja wydarzenia
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { title, start, end, category, color, description } = req.body;

    try {
        const event = await Event.findOne({ _id: id, userId: req.user.userId });
        if (!event) {
            return res.status(404).json({ message: 'Wydarzenie nie znalezione' });
        }

        event.title = title;
        event.start = start;
        event.end = end;
        event.category = category;
        event.color = color;
        event.description = description;

        await event.save();
        res.json(event);
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

// Usuwanie wydarzenia
router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const event = await Event.findOneAndDelete({ _id: id, userId: req.user.userId });
        if (!event) {
            return res.status(404).json({ message: 'Wydarzenie nie znalezione' });
        }

        res.json({ message: 'Wydarzenie usunięte' });
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

module.exports = router;