import logger from '../utils/logger.js';

// Logs every API request with status code and response time (monitoring/debugging)
const requestLogger = (req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    logger.request(req.method, req.originalUrl, res.statusCode, ms.toFixed(0));
  });
  next();
};

export default requestLogger;
