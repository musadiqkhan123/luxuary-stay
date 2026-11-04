import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import routes from './routes/index.js';
import { isCloudinaryConfigured } from './config/cloudinary.js';
import requestLogger from './middleware/requestLogger.js';
import securityHeaders from './middleware/securityHeaders.js';
import sanitizeInput from './middleware/sanitizeInput.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.disable('x-powered-by');
app.use(cors({ origin: allowedOrigins, credentials: true }));
// Image uploads arrive as base64, so that one route accepts bigger bodies
app.use('/api/uploads', express.json({ limit: '8mb' }));
app.use(express.json({ limit: '1mb' }));
app.use(securityHeaders);
app.use(sanitizeInput);
app.use(requestLogger);

app.get('/api/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    success: true,
    message: 'LuxuryStay HMS API is running',
    database: states[mongoose.connection.readyState] || 'unknown',
    imageUploads: isCloudinaryConfigured() ? 'cloudinary' : 'not configured',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
