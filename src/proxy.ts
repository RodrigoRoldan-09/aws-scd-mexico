import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/create-password"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin auth gate: redirect to login if no cookie
  // Strip locale prefix to check the actual path
  const pathWithoutLocale = pathname.replace(/^\/(es|en)/, "") || "/";

  // «Perfiles públicos» dejó de ser una pantalla aparte: era la misma colección
  // que la lista de speakers, con otras columnas y la mitad de las acciones.
  // La ruta se conserva porque estaba enlazada y puede estar en marcadores.
  //
  // La redirección va acá y no en la página: el layout del panel es un
  // componente de cliente, así que un `redirect()` de servidor dentro de él se
  // resuelve en el payload y la petición sigue respondiendo 200.
  if (pathWithoutLocale.startsWith("/admin/speakers/profiles")) {
    const locale = pathname.startsWith("/en") ? "/en" : "";
    return NextResponse.redirect(new URL(`${locale}/admin/speakers`, request.url));
  }

  // Agenda, Sesiones y Salones eran tres pantallas para un solo trabajo: armar
  // el día. «Sesiones» ni siquiera tenía acciones propias —publicar ya estaba en
  // la ficha del speaker y su «Agendar» sólo mandaba a la agenda—, y los salones
  // existen para que un bloque tenga de dónde elegir sala. Ahora es `/programa`.
  if (
    pathWithoutLocale.startsWith("/admin/agenda") ||
    pathWithoutLocale.startsWith("/admin/sessions") ||
    pathWithoutLocale.startsWith("/admin/rooms")
  ) {
    const locale = pathname.startsWith("/en") ? "/en" : "";
    return NextResponse.redirect(new URL(`${locale}/admin/programa`, request.url));
  }

  if (pathWithoutLocale.startsWith("/admin") && !PUBLIC_ADMIN_PATHS.some((p) => pathWithoutLocale.startsWith(p))) {
    const token = request.cookies.get("aws-scd-token")?.value;
    if (!token) {
      const locale = pathname.startsWith("/en") ? "en" : "es";
      const loginUrl = new URL(`/${locale}/admin/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = intlMiddleware(request);

  // Pass pathname to layout so it can hide navbar/footer on admin pages
  response.headers.set("x-next-pathname", pathname);

  return response;
}

export const config = {
  // `encuesta` se excluye para que la ruta pública /encuesta/[token] (redirección de
  // la encuesta) no la reescriba next-intl hacia /es/encuesta y devuelva 404.
  matcher: "/((?!api|trpc|encuesta|_next|_vercel|.*\\..*).*)",
};
