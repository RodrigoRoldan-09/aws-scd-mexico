"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { Turnstile, type TurnstileHandle } from "@/components/ui/turnstile";
import { useAuth } from "@/contexts/auth-context";
import { useHydrated } from "@/hooks/use-hydrated";
import { DotHeading } from "@/components/ui/dot-heading";
import { normalizeEmail } from "@/lib/normalize";
import { EVENT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { localePath } from "@/lib/utils";

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

export function LoginForm() {
  const tf = useTranslations("Forms");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef<TurnstileHandle>(null);
  // El widget de Turnstile necesita el DOM montado para inicializarse.
  const captchaMounted = useHydrated() && !!siteKey;
  const { user, login } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "es";

  // Si ya hay sesión, salir del login (el server component también redirige).
  useEffect(() => {
    if (user) router.replace(localePath(locale, "/admin"));
  }, [user, router, locale]);

  /**
   * Se valida al salir del campo y no en cada tecla: avisar mientras la persona
   * todavía escribe la dirección es ruido, porque está incompleta por
   * definición.
   */
  const checkEmail = () => {
    if (!email.trim()) return setEmailError("");
    const r = normalizeEmail(email);
    setEmailError(r.ok ? "" : r.reason ?? "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (siteKey && !captchaToken) return;

    // Se comprueba también acá: el servidor valida igual, pero atajarlo antes
    // ahorra un viaje y gasta un captcha menos.
    const checked = normalizeEmail(email);
    if (!checked.ok) {
      setEmailError(checked.reason ?? "");
      return;
    }

    setError("");
    setEmailError("");
    setLoading(true);
    try {
      await login(checked.value, password, captchaToken);
      router.replace(localePath(locale, "/admin"));
      // loading se queda en true mientras Next navega
    } catch (err) {
      setError((err as Error).message);
      setCaptchaToken("");
      captchaRef.current?.reset();
      setLoading(false);
    }
  };

  // El botón sólo se habilita cuando hay algo que enviar: cada intento consume
  // un token de captcha.
  const emailOk = email.trim().length > 0 && normalizeEmail(email).ok;
  const canSubmit = emailOk && password.length > 0 && (!siteKey || !!captchaToken) && !loading;

  const handleCaptchaVerify = useCallback((token: string) => setCaptchaToken(token), []);
  const handleCaptchaError = useCallback(() => {
    setError("Error de captcha. Intenta de nuevo.");
    setCaptchaToken("");
  }, []);

  const fieldClass =
    "w-full min-h-11 rounded-[6px] border border-[#2C2550] bg-[#0E0E1A] px-4 py-3 font-mono text-sm text-[#E6E4DA] " +
    "placeholder:text-[#73726C] outline-none transition-all " +
    "focus:border-[#C143BC] focus:ring-1 focus:ring-[#C143BC]/30";

  return (
    <main className="flex min-h-screen flex-col bg-[#0E0E1A] text-[#E6E4DA] pt-20">
      <div className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <DotHeading flicker className="text-[#E6E4DA]">
              acceso
            </DotHeading>
          </div>

          <form
            suppressHydrationWarning
            onSubmit={handleSubmit}
            className="relative flex flex-col gap-5 rounded-[12px] p-6"
            style={{
              background:
                "linear-gradient(135deg, rgba(216,90,48,0.22) 0%, rgba(66,43,120,0.55) 38%, rgba(123,63,166,0.40) 68%, rgba(97,59,184,0.38) 100%)",
              border: "1px solid",
              borderImage:
                "linear-gradient(135deg, rgba(216,90,48,0.60) 0%, rgba(123,63,166,0.60) 50%, rgba(97,59,184,0.65) 100%) 1",
              boxShadow:
                "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(216,90,48,0.16), inset 0 1px 0 rgba(216,90,48,0.14), 0 0 24px rgba(97,59,184,0.20)",
            }}
          >
            {/* Línea decorativa naranja→morado en la parte superior de la tarjeta */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[2px] rounded-t-[12px]"
              style={{
                background:
                  "linear-gradient(90deg, #D85A30 0%, #7B3FA6 50%, #613BB8 100%)",
                opacity: 0.85,
              }}
            />
            <div className="flex flex-col gap-2">
              <label htmlFor="login-email" className="font-mono text-sm font-semibold text-[#E6E4DA]">
                Correo <span className="text-[#D85A30]">*</span>
              </label>
              <input
                id="login-email"
                type="email"
                inputMode="email"
                autoComplete="username"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                  // Tambien se limpia el error del servidor: si no, un
                  // "Credenciales invalidas" de un intento anterior se queda en
                  // pantalla mientras corriges el correo y parece que el envio
                  // fallo de nuevo.
                  if (error) setError("");
                }}
                onBlur={checkEmail}
                placeholder="tu@correo.com"
                required
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "login-email-error" : undefined}
                className={cn(fieldClass, emailError && "border-[#E24B4A] bg-[#E24B4A]/10")}
              />
              {emailError && (
                <p id="login-email-error" className="m-0 font-mono text-xs text-[#E24B4A]">
                  {emailError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="login-password" className="font-mono text-sm font-semibold text-[#E6E4DA]">
                Contraseña <span className="text-[#D85A30]">*</span>
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="••••••••"
                  required
                  className={cn(fieldClass, "pr-12")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  // `aria-pressed` en vez de cambiar el nombre del botón: así el
                  // lector de pantalla anuncia el estado sin que la etiqueta baile.
                  aria-pressed={showPassword}
                  aria-label="Mostrar contraseña"
                  className="absolute right-0 top-1/2 flex h-11 w-11 min-h-11 min-w-11 -translate-y-1/2 items-center justify-center text-[#B4B2A9] transition-colors hover:text-[#E6E4DA]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Sin alto reservado: con `interaction-only` el widget no ocupa
                lugar salvo que Cloudflare pida el desafío, y reservar 78px
                dejaría un hueco vacío en el formulario de casi todo el mundo. */}
            <div className="flex items-center justify-center">
              {captchaMounted ? (
                <Turnstile
                  ref={captchaRef}
                  siteKey={siteKey}
                  theme="dark"
                  appearance="interaction-only"
                  onVerify={handleCaptchaVerify}
                  onError={handleCaptchaError}
                  onExpire={() => setCaptchaToken("")}
                />
              ) : null}
            </div>

            {error && (
              <p className="m-0 rounded-[6px] border border-[#E24B4A] bg-[#E24B4A]/10 px-4 py-3 font-mono text-sm text-[#E24B4A]">
                {error}
              </p>
            )}

            {siteKey && !captchaToken && !error && (
              // El widget es invisible, asi que sin esta linea el boton
              // apagado no tiene explicacion a la vista.
              <p className="m-0 text-center font-mono text-xs text-[#73726C]">
                {tf("captcha_checking")}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex min-h-11 w-full items-center justify-center rounded-[6px] bg-[#D85A30] px-6 py-3.5 font-mono text-sm font-bold text-white shadow-[0_4px_14px_rgba(216,90,48,0.35)] transition-all hover:bg-[#D85A30]/90 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? "Verificando…" : "Iniciar sesión"}
            </button>
          </form>
        </div>
      </div>

      {/* Cinta al pie */}
      <div className="overflow-hidden border-t border-[#2C2550] bg-[#0E0E1A]" aria-hidden="true">
        <div className="flex w-max items-center" style={{ animation: "marquee 36s linear infinite" }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "dot-matrix whitespace-nowrap px-6 py-2.5 text-base leading-none sm:text-lg",
                i % 2 === 1 ? "bg-[#2C2550] text-[#E6E4DA]" : "text-[#B4B2A9]",
              )}
            >
              {EVENT.city} · {EVENT.year} · acceso
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
