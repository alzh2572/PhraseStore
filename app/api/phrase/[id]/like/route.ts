import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/phrase/[id]/like — toggle лайка публичной фразы.
 * Идемпотентный по смыслу: повторный вызов снимает/ставит лайк.
 * Ответ: { liked, likesCount }
 */
export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Войдите, чтобы поставить лайк" },
        { status: 401 }
      );
    }

    const { id: phraseId } = await context.params;
    if (!phraseId) {
      return NextResponse.json({ error: "Не указан id фразы" }, { status: 400 });
    }

    const phrase = await prisma.phrase.findUnique({
      where: { id: phraseId },
      select: { id: true, isPublic: true },
    });

    if (!phrase || !phrase.isPublic) {
      return NextResponse.json(
        { error: "Фраза не найдена или не является публичной" },
        { status: 404 }
      );
    }

    const userId = session.user.id;
    const existing = await prisma.like.findUnique({
      where: {
        userId_phraseId: { userId, phraseId },
      },
      select: { id: true },
    });

    let liked: boolean;
    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      liked = false;
    } else {
      // Уникальный индекс защищает от гонки; при конфликте считаем, что лайк уже есть
      try {
        await prisma.like.create({
          data: { userId, phraseId },
        });
        liked = true;
      } catch {
        const again = await prisma.like.findUnique({
          where: { userId_phraseId: { userId, phraseId } },
          select: { id: true },
        });
        liked = Boolean(again);
      }
    }

    const likesCount = await prisma.like.count({ where: { phraseId } });

    return NextResponse.json({ liked, likesCount });
  } catch (error) {
    console.error("[like toggle]", error);
    return NextResponse.json(
      { error: "Попробуйте позже" },
      { status: 503 }
    );
  }
}
