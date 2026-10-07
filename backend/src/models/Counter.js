const mongoose = require('mongoose');

// Generic atomic counter used to generate human-friendly sequential IDs
// (ticket numbers, asset tags) without race conditions under concurrent writes.
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. "ticket", "asset"
  seq: { type: Number, default: 1000 },
});

const Counter = mongoose.model('Counter', counterSchema);

async function nextSequence(name) {
  const doc = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
}

module.exports = { Counter, nextSequence };
