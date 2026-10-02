import { money } from "./products";

type Receipt = { orderNumber: string; email: string; name: string; items: { name: string; quantity: number; price_cents: number }[]; total: number };

export async function sendConfirmation(receipt: Receipt) {
  const { MAILGUN_API_KEY: key, MAILGUN_DOMAIN: domain, MAILGUN_FROM: from } = process.env;
  if (!key || !domain || !from) return "not_configured";
  const base = process.env.MAILGUN_REGION === "eu" ? "https://api.eu.mailgun.net" : "https://api.mailgun.net";
  const lines = receipt.items.map(item => `${item.quantity} × ${item.name} — ${money(item.quantity * item.price_cents)}`).join("\n");
  const message = `Hi ${receipt.name},\n\nThanks for your Luxara order request ${receipt.orderNumber}. We are reviewing it.\n\n${lines}\n\nEstimated total: ${money(receipt.total)}\n\nWith care,\nLuxara`;
  const body = new FormData();
  body.set("from", from); body.set("to", receipt.email); body.set("subject", `Your Luxara order request ${receipt.orderNumber}`); body.set("text", message);
  const response = await fetch(`${base}/v3/${domain}/messages`, { method: "POST", headers: { Authorization: `Basic ${Buffer.from(`api:${key}`).toString("base64")}` }, body });
  if (!response.ok) throw new Error(`Mailgun returned ${response.status}`);
  return "sent";
}
