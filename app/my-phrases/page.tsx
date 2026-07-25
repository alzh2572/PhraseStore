import { redirect } from "next/navigation";

/** Старый маршрут → кабинет */
export default function MyPhrasesRedirect() {
  redirect("/dashboard");
}
