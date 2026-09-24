import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { localePath } from "@/lib/utils";

// Se evalúa en cada request (lee la cookie de sesión + la sesión en DB).
export const dynamic = "force-dynamic";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Si ya hay sesión válida, no renderiza el login: redirige al admin desde el
  // servidor (no se puede saltar y no hay parpadeo).
  const user = await getAuthUser();
  if (user) {
    redirect(localePath(locale, "/admin"));
  }

  return <LoginForm />;
}
