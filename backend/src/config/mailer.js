import nodemailer from 'nodemailer';

let transporter = null;

export const isEmailConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

// Creates the SMTP transporter from .env (Gmail, Brevo, Mailtrap, Outlook... any SMTP)
export const getTransporter = () => {
  if (transporter || !isEmailConfigured()) return transporter;
  const port = Number(process.env.SMTP_PORT) || 587;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
};

export const verifyEmail = async () => {
  const t = getTransporter();
  if (!t) return false;
  await t.verify();
  return true;
};
