const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    type: { type: String, required: true },   // e.g. "page_view", "click", "error"
    source: { type: String, required: true },   // e.g. "web", "mobile"
    user: { type: String, required: true },   // e.g. "user_42"
    meta: { type: Object, default: {} },      // any extra data
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Event', eventSchema);
