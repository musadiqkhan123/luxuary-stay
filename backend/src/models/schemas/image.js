import mongoose from 'mongoose';

// An image stored on Cloudinary: the URL we show and the public id we need to delete it later
const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, default: '' },
  },
  { _id: false },
);

export default imageSchema;
