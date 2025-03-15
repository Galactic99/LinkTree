import mongoose from 'mongoose';

const linkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  icon: { type: String },
  enabled: { type: Boolean, default: true },
  order: { type: Number, required: true },
});

const linktreeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    theme: { type: String, default: 'light' },
    isDefault: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: true },
    footer: { type: String, default: 'Made with ❤️ using Next.js and Tailwind CSS' },
    links: [linkSchema],
  },
  { timestamps: true }
);

// Create indexes
linktreeSchema.index({ userId: 1 });
linktreeSchema.index({ slug: 1 }, { unique: true });

const Linktree = mongoose.models.Linktree || mongoose.model('Linktree', linktreeSchema);

export default Linktree; 