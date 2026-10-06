import { cookies } from "next/headers";
import { getCustomer } from "./auth";
import { db } from "./db";
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING } from "./products";

export type CartItem = { product_id: string; name: string; category: string; price_cents: number; image_url: string; quantity: number };

export async function getGuestCartId() {
  const id = (await cookies()).get("ff_cart")?.value;
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const rows = await db()`SELECT id FROM carts WHERE id = ${id} AND customer_id IS NULL
    AND NOT EXISTS (SELECT 1 FROM orders WHERE cart_id = ${id})`;
  return rows.length ? id : null;
}

export async function getCartId() {
  const customer = await getCustomer();
  if (!customer) return getGuestCartId();
  const rows = await db()`SELECT c.active_cart_id AS id FROM customers c
    JOIN carts cart ON cart.id = c.active_cart_id
    WHERE c.id = ${customer.id} AND NOT EXISTS (SELECT 1 FROM orders WHERE cart_id = cart.id)`;
  return rows.length ? rows[0].id as string : null;
}

export async function attachGuestCartToCustomer(customerId: string, guestId: string | null) {
  if (!guestId) return;
  const sql = db();
  const guest = await sql`SELECT id FROM carts WHERE id = ${guestId} AND customer_id IS NULL
    AND NOT EXISTS (SELECT 1 FROM orders WHERE cart_id = ${guestId})`;
  if (!guest.length) return;
  const claimed = await sql`UPDATE customers SET active_cart_id = ${guestId}
    WHERE id = ${customerId} AND active_cart_id IS NULL RETURNING id`;
  if (claimed.length) {
    await sql`UPDATE carts SET customer_id = ${customerId} WHERE id = ${guestId}`;
    return;
  }
  const active = await sql`SELECT active_cart_id AS id FROM customers WHERE id = ${customerId}`;
  const activeId = active[0]?.id as string | null;
  if (!activeId || activeId === guestId) return;
  await sql`INSERT INTO cart_items (cart_id, product_id, quantity)
    SELECT ${activeId}, product_id, quantity FROM cart_items WHERE cart_id = ${guestId}
    ON CONFLICT (cart_id, product_id) DO UPDATE SET quantity = LEAST(20, cart_items.quantity + EXCLUDED.quantity)`;
  await sql`DELETE FROM carts WHERE id = ${guestId} AND customer_id IS NULL`;
}

export async function ensureCart() {
  const oldId = await getCartId();
  if (oldId) return oldId;
  const customer = await getCustomer();
  const sql = db();
  if (customer) {
    const guestId = await getGuestCartId();
    if (guestId) {
      await attachGuestCartToCustomer(customer.id, guestId);
      const adopted = await getCartId();
      if (adopted) return adopted;
    }
    const rows = await sql`INSERT INTO carts (customer_id) VALUES (${customer.id}) RETURNING id`;
    const id = rows[0].id as string;
    const claimed = await sql`UPDATE customers SET active_cart_id = ${id}
      WHERE id = ${customer.id} AND active_cart_id IS NULL RETURNING id`;
    if (claimed.length) return id;
    await sql`DELETE FROM carts WHERE id = ${id}`;
    const existing = await getCartId();
    if (existing) return existing;
    throw new Error("Could not create account cart");
  }
  const rows = await sql`INSERT INTO carts DEFAULT VALUES RETURNING id`;
  const id = rows[0].id as string;
  (await cookies()).set("ff_cart", id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return id;
}

export async function getCartItems(cartId: string): Promise<CartItem[]> {
  return await db()`SELECT ci.product_id, ci.quantity, p.name, p.category, p.price_cents, p.image_url
    FROM cart_items ci JOIN products p ON p.id = ci.product_id
    WHERE ci.cart_id = ${cartId} AND p.active = true ORDER BY p.sort_order` as CartItem[];
}

export const shippingFor = (subtotal: number) => subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : STANDARD_SHIPPING;
