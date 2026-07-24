import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Защита маршрутов через Auth.js.
 * Сессия читается server-side (таблица Session) → стабильный userId.
 *
 * /dashboard, /my-phrases — только для авторизованных.
 * /login — если уже вошёл, редирект в кабинет.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;

  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/my-phrases");

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/login") && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/my-phrases/:path*", "/login"],
};
