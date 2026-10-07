const mongoose = require('mongoose');

const assetHistorySchema = new mongoose.Schema(
  {
    asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
    action: {
      type: String,
      enum: ['CREATED', 'ASSIGNED', 'UNASSIGNED', 'STATUS_CHANGED', 'UPDATED', 'RETIRED'],
      required: true,
    },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fromValue: String,
    toValue: String,
    notes: String,
  },
  { timestamps: true }
);

assetHistorySchema.index({ asset: 1, createdAt: -1 });

module.exports = mongoose.model('AssetHistory', assetHistorySchema);
