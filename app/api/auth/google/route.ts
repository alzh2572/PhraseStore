import { signIn } from "@/auth";

/**
 * Надёжный старт Google OAuth через Route Handler (Node runtime).
 * GET /api/auth/google → Auth.js signIn("google")
 */
export async function GET() {
  const clientId =
    process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID;
  const clientSecret =
    process.env.GOOGLE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET;

  if (!clientId || !clientSecret) {
    return new Response(
      "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET не заданы в Environment Variables",
      { status: 500 }
    );
  }

  // signIn бросает REDIRECT на Google с полным набором query (response_type=code и т.д.)
  await signIn("google", { redirectTo: "/dashboard" });
}
