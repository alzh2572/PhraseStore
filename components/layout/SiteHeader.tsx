import Link from "next/link";
import { auth, signOut } from "@/auth";
import { SiteHeaderClient } from "@/components/layout/SiteHeaderClient";
import { formatDisplayName } from "@/lib/utils";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
        displayName: formatDisplayName(session.user.name, session.user.email),
      }
    : null;

  return (
    <SiteHeaderClient
      user={user}
      signOutAction={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
      brand={
        <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
          PhraseStore
        </Link>
      }
    />
  );
}
