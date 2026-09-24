import { jetbrainsMono } from "@/lib/fonts";
import { NotFoundScreen } from "@/components/not-found-screen";

// Fallback 404 raíz (rutas que no caen bajo [locale]). Devuelve un 404 real
// con la página de marca, en vez de redirigir al home (evita el "soft 404").
// app/layout.tsx solo pasa children, así que aquí montamos <html>/<body>.
export default function RootNotFound() {
  return (
    <html lang="es" className={`${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-surface-900 text-surface-100 font-sans">
        <NotFoundScreen />
      </body>
    </html>
  );
}
