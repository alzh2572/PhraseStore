import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/**
 * Middleware только с authConfig (без Prisma / Node-native модулей).
 * Не импортируйте сюда @/auth или @/lib/prisma — сломается Edge Runtime.
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/dashboard/:path*", "/my-phrases/:path*", "/login"],
};
