import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookieOptions, hashToken } from "@/lib/auth";

export async function POST(request: Request) {
  const token = (await cookies()).get("ff_session")?.value;
  if (token && process.env.DATABASE_URL) await db()`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`;
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set("ff_session", "", { ...cookieOptions, maxAge: 0 });
  return response;
}
