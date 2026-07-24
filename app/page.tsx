import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let notes: { id: string; title: string; createdAt: Date }[] = [];
  let errorMessage: string | null = null;

  try {
    notes = await prisma.note.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, createdAt: true },
    });
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Не удалось загрузить заметки";
  }

  return (
    <main>
      <h1>PhraseStore</h1>
      <p className="lead">Заметки из PostgreSQL (Neon) через Prisma.</p>

      {errorMessage ? (
        <p className="error">{errorMessage}</p>
      ) : notes.length === 0 ? (
        <p className="empty">
          Пока нет заметок. Выполните{" "}
          <code>npm run db:seed</code>.
        </p>
      ) : (
        <ul>
          {notes.map((note) => (
            <li key={note.id}>
              <span className="title">{note.title}</span>
              <time className="meta" dateTime={note.createdAt.toISOString()}>
                {note.createdAt.toLocaleString("ru-RU")}
              </time>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
