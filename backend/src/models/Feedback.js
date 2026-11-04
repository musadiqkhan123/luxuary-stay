import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    rating: { type: Number, required: [true, 'Rating is required'], min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 100, default: '' },
    comment: { type: String, trim: true, maxlength: 1000, required: [true, 'Please write a comment'] },
    response: {
      message: { type: String, trim: true, maxlength: 1000 },
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      at: { type: Date },
    },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model('Feedback', feedbackSchema);
