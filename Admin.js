// backend/models/Admin.js
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('Admin', adminSchema);