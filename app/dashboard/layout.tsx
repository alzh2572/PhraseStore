import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { formatDisplayName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { user } = session;
  const display = formatDisplayName(user.name, user.email);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border bg-white px-4 sm:px-6">
        <Link href="/" className="text-lg font-bold text-slate-900">
          PhraseStore
        </Link>
        <div className="flex items-center gap-3">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={display}
              className="h-8 w-8 rounded-full object-cover"
              width={32}
              height={32}
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-800">
              {display.slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="hidden text-sm text-slate-700 sm:inline">
            {user.name ?? display}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button type="submit" variant="ghost" size="sm">
              Выйти
            </Button>
          </form>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <DashboardSidebar
          name={user.name}
          email={user.email}
          image={user.image}
        />
        <main className="flex-1 overflow-auto bg-[#f7f9fc] p-5 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
