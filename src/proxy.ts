import { NextRequest, NextResponse } from "next/server";

export const proxy = (request: NextRequest) => {
  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("userRole")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (request.nextUrl.pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
};

export const config = {
  matcher: ["/admin/:path*", "/favorites", "/profile"],
};
