import { pixelifySans, shareTechMono } from "@/lib/fonts";
import { NotFoundScreen } from "@/components/not-found-screen";

// Fallback 404 raíz (rutas que no caen bajo [locale]). Devuelve un 404 real
// con la página de marca, en vez de redirigir al home (evita el "soft 404").
// app/layout.tsx solo pasa children, así que aquí montamos <html>/<body>.
export default function RootNotFound() {
  return (
    <html lang="es" className={`${pixelifySans.variable} ${shareTechMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-[var(--bg-base)] text-[var(--text-primary)] font-body">
        <NotFoundScreen />
      </body>
    </html>
  );
}
