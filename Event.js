// backend/models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date },
    category: { type: String, default: 'other' },
    color: { type: String, default: '#1a73e8' },
    description: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

// Upewnij się, że _id jest dostępny jako id w odpowiedzi JSON
eventSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Event', eventSchema);