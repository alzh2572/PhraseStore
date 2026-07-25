export default function PolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Политика</h1>
      <p className="mt-4 text-slate-600">
        PhraseStore хранит публичные и приватные фразы пользователей. Публичные
        записи видны всем; приватные — только автору. Вход через Google нужен
        для создания и управления своими записями.
      </p>
      <p className="mt-4 text-sm text-muted">Скоро — полная политика конфиденциальности.</p>
    </main>
  );
}
