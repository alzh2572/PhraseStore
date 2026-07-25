import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Старый URL /login → тот же сценарий, что и на главной */
export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }
  redirect("/");
}
