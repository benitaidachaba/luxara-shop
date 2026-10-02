import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { cookieOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.APP_URL;
  if (!clientId || !appUrl) return NextResponse.redirect(new URL("/?auth=unavailable", request.url));
  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const redirect = new URL("/api/auth/google/callback", appUrl).toString();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({ client_id: clientId, redirect_uri: redirect, response_type: "code", scope: "openid email profile", state, code_challenge: challenge, code_challenge_method: "S256", prompt: "select_account" }).toString();
  const response = NextResponse.redirect(url);
  response.cookies.set("ff_oauth_state", state, { ...cookieOptions, maxAge: 600 });
  response.cookies.set("ff_oauth_verifier", verifier, { ...cookieOptions, maxAge: 600 });
  return response;
}
