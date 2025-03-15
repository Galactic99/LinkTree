import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
});

const abTestSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    linktreeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Linktree', required: true },
    linkId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed'],
      default: 'active',
    },
    startDate: { type: Date, required: true },
    endDate: Date,
    variants: [variantSchema],
  },
  { timestamps: true }
);

// Create indexes
abTestSchema.index({ userId: 1 });
abTestSchema.index({ linktreeId: 1 });
abTestSchema.index({ linkId: 1 });

const ABTest = mongoose.models.ABTest || mongoose.model('ABTest', abTestSchema);

export default ABTest; 