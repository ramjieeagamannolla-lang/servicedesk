const mongoose = require('mongoose');
const { ASSET_TYPES, ASSET_STATUS } = require('../config/constants');

const assetSchema = new mongoose.Schema(
  {
    assetTag: { type: String, required: true, unique: true, trim: true }, // e.g. LAP-1024
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ASSET_TYPES, required: true },
    brand: { type: String, trim: true },
    model: { type: String, trim: true },
    serialNumber: { type: String, trim: true },

    purchaseDate: Date,
    warrantyExpiry: Date,

    status: { type: String, enum: ASSET_STATUS, default: 'AVAILABLE' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    location: { type: String, trim: true },

    notes: { type: String },
  },
  { timestamps: true }
);

assetSchema.index({ status: 1 });
assetSchema.index({ type: 1 });
assetSchema.index({ assignedTo: 1 });
assetSchema.index({ name: 'text', assetTag: 'text', serialNumber: 'text' });

module.exports = mongoose.model('Asset', assetSchema);
