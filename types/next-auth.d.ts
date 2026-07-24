import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      /** Стабильный id пользователя из таблицы User */
      id: string;
    } & DefaultSession["user"];
  }
}
