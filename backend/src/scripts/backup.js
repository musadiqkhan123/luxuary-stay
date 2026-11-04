/**
 * Simple JSON backup of every collection — run with:  npm run backup
 * Files are written to backend/backups/<timestamp>/<collection>.json
 * For production, schedule `mongodump` (MongoDB Database Tools) or use Atlas automated backups.
 */
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import logger from '../utils/logger.js';

const run = async () => {
  await connectDB();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.resolve('backups', stamp);
  await fs.mkdir(dir, { recursive: true });

  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const { name } of collections) {
    const docs = await mongoose.connection.db.collection(name).find({}).toArray();
    await fs.writeFile(path.join(dir, `${name}.json`), JSON.stringify(docs, null, 2));
    logger.info(`${name}: ${docs.length} document(s)`);
  }

  logger.success(`Backup saved to ${dir}`);
  await mongoose.connection.close();
};

run().catch(async (error) => {
  logger.error(`Backup failed: ${error.message}`);
  await mongoose.connection.close();
  process.exit(1);
});
