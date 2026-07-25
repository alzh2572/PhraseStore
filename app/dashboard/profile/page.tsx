import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { formatDisplayName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { user } = session;
  const display = formatDisplayName(user.name, user.email);

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900">Личный кабинет</h1>
      <h2 className="mt-1 text-lg font-semibold text-slate-700">Профиль</h2>

      <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={display}
              className="h-16 w-16 rounded-full object-cover"
              width={64}
              height={64}
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-xl font-semibold text-sky-800">
              {display.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-lg font-semibold">{user.name ?? display}</p>
            <p className="text-sm text-muted">{user.email}</p>
          </div>
        </div>

        <dl className="mt-6 space-y-3 text-sm">
          <div>
            <dt className="text-muted">userId</dt>
            <dd>
              <code className="rounded bg-slate-50 px-1.5 py-0.5 text-xs">
                {user.id}
              </code>
            </dd>
          </div>
        </dl>

        <form
          className="mt-6"
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button type="submit" variant="secondary">
            Выйти
          </Button>
        </form>
      </section>
    </div>
  );
}
