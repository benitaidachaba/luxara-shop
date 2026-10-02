import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCartId, getCartItems, shippingFor } from "@/lib/cart";
import { getCustomer } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendConfirmation } from "@/lib/mail";
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING } from "@/lib/products";

const fields = z.object({
  email: z.email().max(254), fullName: z.string().trim().min(2).max(120),
  addressLine1: z.string().trim().min(3).max(160), addressLine2: z.string().trim().max(160).default(""),
  city: z.string().trim().min(2).max(100), region: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().max(30).default(""), country: z.string().trim().min(2).max(100),
});

export async function POST(request: Request) {
  const parsed = fields.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check your contact and delivery details." }, { status: 400 });
  try {
    const cartId = await getCartId();
    if (!cartId) return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });
    const items = await getCartItems(cartId);
    if (!items.length) return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });
    const subtotal = items.reduce((sum, item) => sum + item.price_cents * item.quantity, 0);
    const shipping = shippingFor(subtotal);
    const customer = await getCustomer();
    const id = randomUUID();
    const number = `LX-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
    const f = parsed.data;
    const sql = db();
    const result = await sql`WITH selected AS MATERIALIZED (
        SELECT ci.product_id, ci.quantity, p.name, p.price_cents
        FROM cart_items ci JOIN products p ON p.id = ci.product_id
        WHERE ci.cart_id = ${cartId} AND p.active = true
      ), totals AS (
        SELECT COALESCE(sum(quantity * price_cents), 0)::integer AS subtotal FROM selected
      ), new_order AS (
        INSERT INTO orders (id, order_number, customer_id, cart_id, email, full_name, address_line1, address_line2, city, region, postal_code, country, subtotal_cents, shipping_cents, total_cents)
        SELECT ${id}, ${number}, ${customer?.id ?? null}, ${cartId}, ${f.email}, ${f.fullName}, ${f.addressLine1}, ${f.addressLine2}, ${f.city}, ${f.region}, ${f.postalCode}, ${f.country}, subtotal,
          CASE WHEN subtotal >= ${FREE_SHIPPING_THRESHOLD} THEN 0 ELSE ${STANDARD_SHIPPING} END,
          subtotal + CASE WHEN subtotal >= ${FREE_SHIPPING_THRESHOLD} THEN 0 ELSE ${STANDARD_SHIPPING} END
        FROM totals WHERE subtotal > 0 RETURNING id
      ), saved_items AS (
        INSERT INTO order_items (order_id, product_id, name, price_cents, quantity)
        SELECT new_order.id, selected.product_id, selected.name, selected.price_cents, selected.quantity FROM new_order CROSS JOIN selected RETURNING product_id
      ) SELECT id FROM new_order`;
    if (!result.length) return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });
    let emailStatus = "pending";
    try {
      emailStatus = await sendConfirmation({ orderNumber: number, email: f.email, name: f.fullName, items, total: subtotal + shipping });
    } catch { emailStatus = "failed"; }
    try { await sql`UPDATE orders SET email_status = ${emailStatus} WHERE id = ${id}`; } catch { /* The order is saved even if email status cannot be updated. */ }
    const response = NextResponse.json({ orderNumber: number, emailStatus });
    response.cookies.set("ff_cart", "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    if (String(error).includes("orders_cart_id_key")) return NextResponse.json({ error: "This order was already placed." }, { status: 409 });
    return NextResponse.json({ error: "We could not place your order. Please try again." }, { status: 503 });
  }
}
