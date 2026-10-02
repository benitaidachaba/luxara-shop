import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cookieOptions, hashToken, newToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCartId } from "@/lib/cart";

export async function GET(request: Request) {
  const appUrl = process.env.APP_URL || new URL(request.url).origin;
  const params = new URL(request.url).searchParams;
  const jar = await cookies();
  const state = jar.get("ff_oauth_state")?.value;
  const verifier = jar.get("ff_oauth_verifier")?.value;
  jar.delete("ff_oauth_state"); jar.delete("ff_oauth_verifier");
  if (!state || !verifier || !params.get("code") || params.get("state") !== state) return NextResponse.redirect(new URL("/?auth=failed", appUrl));
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code: params.get("code")!, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, redirect_uri: new URL("/api/auth/google/callback", appUrl).toString(), grant_type: "authorization_code", code_verifier: verifier }),
    });
    if (!tokenResponse.ok) throw new Error("Google token exchange failed");
    const token = await tokenResponse.json();
    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${token.access_token}` } });
    if (!profileResponse.ok) throw new Error("Google profile failed");
    const profile = await profileResponse.json();
    if (!profile.sub || !profile.email || profile.email_verified !== true) throw new Error("Google email unverified");
    const sql = db();
    const rows = await sql`INSERT INTO customers (google_sub, email, name, picture)
      VALUES (${profile.sub}, ${profile.email}, ${profile.name || profile.email}, ${profile.picture || null})
      ON CONFLICT (google_sub) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, picture = EXCLUDED.picture
      RETURNING id`;
    const customerId = rows[0].id as string;
    const session = newToken();
    await sql`INSERT INTO sessions (token_hash, customer_id, expires_at) VALUES (${hashToken(session)}, ${customerId}, now() + interval '30 days')`;
    const cartId = await getCartId();
    if (cartId) await sql`UPDATE carts SET customer_id = ${customerId} WHERE id = ${cartId} AND customer_id IS NULL`;
    const response = NextResponse.redirect(new URL("/checkout", appUrl));
    response.cookies.set("ff_session", session, { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 });
    return response;
  } catch { return NextResponse.redirect(new URL("/?auth=failed", appUrl)); }
}
