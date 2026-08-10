import { NextResponse } from "next/server";

/**
 * Edge middleware placeholder.
 * Auth session refresh and tenant routing will be added with the auth module.
 */
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
