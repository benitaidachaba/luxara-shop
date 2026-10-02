import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureCart, getCartId, getCartItems, shippingFor } from "@/lib/cart";
import { db } from "@/lib/db";

const change = z.object({ productId: z.string().min(1), quantity: z.number().int().min(0).max(20) });

export async function GET() {
  try {
    const cartId = await getCartId();
    const items = cartId ? await getCartItems(cartId) : [];
    const subtotal = items.reduce((sum, item) => sum + item.price_cents * item.quantity, 0);
    return NextResponse.json({ items, subtotal, shipping: shippingFor(subtotal), total: subtotal + shippingFor(subtotal) });
  } catch { return NextResponse.json({ error: "Cart unavailable" }, { status: 503 }); }
}

export async function POST(request: Request) {
  const parsed = change.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid cart item" }, { status: 400 });
  try {
    const { productId, quantity } = parsed.data;
    const sql = db();
    const product = await sql`SELECT id FROM products WHERE id = ${productId} AND active = true`;
    if (!product.length) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    const cartId = await ensureCart();
    if (quantity === 0) await sql`DELETE FROM cart_items WHERE cart_id = ${cartId} AND product_id = ${productId}`;
    else await sql`INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (${cartId}, ${productId}, ${quantity})
      ON CONFLICT (cart_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity`;
    await sql`UPDATE carts SET updated_at = now() WHERE id = ${cartId}`;
    return GET();
  } catch { return NextResponse.json({ error: "Could not update cart" }, { status: 503 }); }
}
