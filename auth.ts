import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";

/**
 * Auth.js + Google OAuth + Prisma Adapter.
 *
 * Важно: session.strategy = "jwt" — чтобы middleware работал на Edge
 * без Prisma (иначе ошибка node:util/types).
 *
 * Адаптер всё равно создаёт User/Account в БД при первом входе;
 * стабильный user.id кладём в JWT → session.user.id.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Prisma 7 + driver adapter: Auth.js типы ещё под классический client
  adapter: PrismaAdapter(prisma as never),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      // Первый вход: user приходит из адаптера с id из таблицы User
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
