import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/**
 * Middleware только с authConfig (без Prisma).
 * Защищает доступ к БД и кабинету до авторизации.
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/db/:path*",
    "/dashboard/:path*",
    "/my-phrases/:path*",
    "/login",
  ],
};
