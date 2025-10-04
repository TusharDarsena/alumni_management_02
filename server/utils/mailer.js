import dotenv from "dotenv";
dotenv.config();

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || "no-reply@example.com";

let transporter = null;
let transporterInitializing = null;

async function ensureTransporter() {
  if (transporter) return transporter;
  if (transporterInitializing) return transporterInitializing;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  transporterInitializing = (async () => {
    // Use dynamic import to avoid bundlers or ESM loaders attempting to resolve CJS-only shims at module-eval time
    const nodemailerModule = await import("nodemailer");
    const nodemailer = nodemailerModule.default || nodemailerModule;

    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    transporterInitializing = null;
    return transporter;
  })();

  return transporterInitializing;
}

export async function sendMail({ to, subject, text, html }) {
  const t = await ensureTransporter();
  if (!t) {
    console.warn("SMTP not configured. Skipping email send.");
    console.info("Email content:", { to, subject, text, html });
    return { ok: false, info: null };
  }

  const info = await t.sendMail({ from: FROM_EMAIL, to, subject, text, html });
  return { ok: true, info };
}
