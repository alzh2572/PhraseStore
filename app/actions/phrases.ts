"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { phraseFormSchema, phraseIdSchema } from "@/lib/validations/phrase";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

function revalidateCabinet() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/public");
  revalidatePath("/dashboard/favorites");
}

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Требуется вход");
  }
  return session.user.id;
}

/** Владелец может менять только свои фразы. */
async function requireOwnedPhrase(phraseId: string, userId: string) {
  const phrase = await prisma.phrase.findUnique({
    where: { id: phraseId },
    select: { id: true, ownerId: true },
  });
  if (!phrase) {
    throw new Error("Фраза не найдена");
  }
  if (phrase.ownerId !== userId) {
    throw new Error("Недостаточно прав");
  }
  return phrase;
}

function visibilityFromPublic(isPublic: boolean) {
  return isPublic ? ("PUBLIC" as const) : ("PRIVATE" as const);
}

export async function createPhrase(
  input: unknown
): Promise<ActionResult & { id?: string }> {
  try {
    const userId = await requireUserId();
    const data = phraseFormSchema.parse(input);

    const phrase = await prisma.phrase.create({
      data: {
        title: data.title,
        content: data.content,
        isPublic: data.isPublic,
        visibility: visibilityFromPublic(data.isPublic),
        publishedAt: data.isPublic ? new Date() : null,
        ownerId: userId,
        isFavorite: false,
      },
    });

    revalidateCabinet();
    return { ok: true, id: phrase.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Не удалось создать",
    };
  }
}

export async function updatePhrase(
  id: string,
  input: unknown
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    phraseIdSchema.parse({ id });
    await requireOwnedPhrase(id, userId);
    const data = phraseFormSchema.parse(input);

    await prisma.phrase.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        isPublic: data.isPublic,
        visibility: visibilityFromPublic(data.isPublic),
        publishedAt: data.isPublic ? new Date() : null,
      },
    });

    revalidateCabinet();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Не удалось обновить",
    };
  }
}

export async function deletePhrase(id: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    phraseIdSchema.parse({ id });
    await requireOwnedPhrase(id, userId);

    await prisma.phrase.delete({ where: { id } });
    revalidateCabinet();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Не удалось удалить",
    };
  }
}

export async function togglePublic(id: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    phraseIdSchema.parse({ id });
    await requireOwnedPhrase(id, userId);

    const current = await prisma.phrase.findUniqueOrThrow({
      where: { id },
      select: { isPublic: true },
    });
    const next = !current.isPublic;

    await prisma.phrase.update({
      where: { id },
      data: {
        isPublic: next,
        visibility: visibilityFromPublic(next),
        publishedAt: next ? new Date() : null,
      },
    });

    revalidateCabinet();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Не удалось переключить",
    };
  }
}

export async function toggleFavorite(id: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    phraseIdSchema.parse({ id });
    // Избранное — только для своих фраз (модель isFavorite на Phrase)
    await requireOwnedPhrase(id, userId);

    const current = await prisma.phrase.findUniqueOrThrow({
      where: { id },
      select: { isFavorite: true },
    });

    await prisma.phrase.update({
      where: { id },
      data: { isFavorite: !current.isFavorite },
    });

    revalidateCabinet();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Не удалось переключить",
    };
  }
}
