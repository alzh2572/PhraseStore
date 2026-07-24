import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";

/**
 * Auth.js (NextAuth v5) + Google OAuth + Prisma.
 * session.strategy = "database" → server-side сессии в таблице Session.
 * При первом входе адаптер создаёт User (+ Account) в PostgreSQL.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Prisma 7 + driver adapter: типы адаптера Auth.js ещё ожидают классический client
  adapter: PrismaAdapter(prisma as never),
  session: {
    strategy: "database",
    // 30 дней
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Пробрасываем стабильный user.id из БД в session.user.id
     * (по умолчанию в session его может не быть).
     */
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
