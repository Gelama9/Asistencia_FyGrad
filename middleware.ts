import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

const publicRoutes = ["/login", "/api/login"];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);

  const cookie = req.cookies.get("session")?.value;
  let session = null;

  if (cookie) {
    try {
      session = await decrypt(cookie);
    } catch (e) {
      // Session expired or invalid
    }
  }

  if (!isPublicRoute && !session) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isPublicRoute && session) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
