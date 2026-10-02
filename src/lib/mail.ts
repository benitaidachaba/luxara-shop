import { money } from "./products";
import nodemailer from "nodemailer";

type Receipt = { orderNumber: string; email: string; name: string; items: { name: string; quantity: number; price_cents: number }[]; total: number };

export async function sendConfirmation(receipt: Receipt) {
  const lines = receipt.items.map(item => `${item.quantity} × ${item.name} — ${money(item.quantity * item.price_cents)}`).join("\n");
  const message = `Hi ${receipt.name},\n\nThanks for your Luxara order request ${receipt.orderNumber}. We are reviewing it.\n\n${lines}\n\nEstimated total: ${money(receipt.total)}\n\nWith care,\nLuxara`;
  if (process.env.MAIL_PROVIDER === "gmail") {
    const { GMAIL_USER: user, GMAIL_APP_PASSWORD: password } = process.env;
    if (!user || !password) return "not_configured";
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", port: 465, secure: true,
      auth: { user, pass: password.replace(/\s/g, "") },
      connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000,
    });
    await transporter.sendMail({ from: `Luxara <${user}>`, to: receipt.email, subject: `Your Luxara order request ${receipt.orderNumber}`, text: message });
    return "sent";
  }

  const { MAILGUN_API_KEY: key, MAILGUN_DOMAIN: domain, MAILGUN_FROM: from } = process.env;
  if (!key || !domain || !from) return "not_configured";
  const base = process.env.MAILGUN_REGION === "eu" ? "https://api.eu.mailgun.net" : "https://api.mailgun.net";
  const body = new FormData();
  body.set("from", from); body.set("to", receipt.email); body.set("subject", `Your Luxara order request ${receipt.orderNumber}`); body.set("text", message);
  const response = await fetch(`${base}/v3/${domain}/messages`, { method: "POST", headers: { Authorization: `Basic ${Buffer.from(`api:${key}`).toString("base64")}` }, body });
  if (!response.ok) throw new Error(`Mailgun returned ${response.status}`);
  return "sent";
}
