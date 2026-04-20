import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  if (url.pathname === "/shop" && (url.searchParams.has("success") || url.searchParams.has("session_id"))) {
    url.pathname = "/checkout-success";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/shop"],
};
