import 'dotenv/config';
import mongoose from 'mongoose';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import cloudinary, { configureCloudinary } from './src/config/cloudinary.js';
import { verifyEmail, isEmailConfigured } from './src/config/mailer.js';
import Setting from './src/models/Setting.js';
import logger from './src/utils/logger.js';

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  logger.banner('LuxuryStay HMS — API Server');

  if (!process.env.JWT_SECRET) {
    logger.error('JWT_SECRET is missing. Copy backend/.env.example to backend/.env and fill it in.');
    process.exit(1);
  }

  try {
    await connectDB();
    await Setting.getSingleton(); // make sure hotel settings exist
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    logger.info('Make sure MongoDB is running and MONGO_URI in backend/.env is correct.');
    process.exit(1);
  }

  if (configureCloudinary()) {
    try {
      await cloudinary.api.ping();
      logger.success(`Cloudinary connected → ${process.env.CLOUDINARY_CLOUD_NAME}`);
    } catch (error) {
      logger.warn(`Cloudinary keys found but the connection failed: ${error.message || error.error?.message}`);
    }
  } else {
    logger.warn('Cloudinary is not configured — image uploads are off. Add CLOUDINARY_* keys to backend/.env');
  }

  if (isEmailConfigured()) {
    try {
      await verifyEmail();
      logger.success(`Email (SMTP) connected → ${process.env.SMTP_HOST}`);
    } catch (error) {
      logger.warn(`SMTP settings found but login failed: ${error.message}`);
    }
  } else {
    logger.warn('Email is not configured — emails are logged instead of sent. Add SMTP_* keys to backend/.env');
  }

  const server = app.listen(PORT, () => {
    logger.success(`Server running in ${process.env.NODE_ENV || 'development'} mode`);
    logger.success(`API base URL  → http://localhost:${PORT}/api`);
    logger.info(`Health check  → http://localhost:${PORT}/api/health`);
  });

  const shutdown = (signal) => {
    logger.warn(`${signal} received — shutting down gracefully...`);
    server.close(async () => {
      await mongoose.connection.close();
      logger.info('Server and database connection closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled rejection: ${reason?.message || reason}`);
});

startServer();
