"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { mailtoOf } from "@/components/ui/obfuscated-email";
import { localePath } from "@/lib/utils";

export default function CreatePasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-surface-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-aws-orange border-t-transparent" />
      </div>
    }>
      <CreatePasswordContent />
    </Suspense>
  );
}

const REASONS: Record<string, { title: string; message: string; cta: string; href: string }> = {
  not_found: {
    title: "Enlace no válido",
    message: "Este enlace no es válido. Verifica que copiaste correctamente el enlace del email.",
    cta: "Contactar soporte",
    href: mailtoOf("contacto"),
  },
  expired: {
    title: "Enlace expirado",
    message: "Este enlace ha expirado — los enlaces son válidos por 24 horas. Contacta al administrador para que te envíe uno nuevo.",
    cta: "Contactar administrador",
    href: mailtoOf("contacto"),
  },
  used: {
    title: "Enlace ya utilizado",
    message: "Este enlace ya fue usado para crear una contraseña. Si ya tienes acceso, inicia sesión normalmente.",
    cta: "Ir al login",
    href: "/admin/login",
  },
};

function CreatePasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "es";

  const [tokenStatus, setTokenStatus] = useState<"checking" | "valid" | "invalid">("checking");
  const [invalidReason, setInvalidReason] = useState<string>("not_found");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setInvalidReason("not_found");
      setTokenStatus("invalid");
      return;
    }

    fetch(`/api/auth/validate-token?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setTokenStatus("valid");
        } else {
          setInvalidReason(data.reason ?? "not_found");
          setTokenStatus("invalid");
        }
      })
      .catch(() => {
        setInvalidReason("not_found");
        setTokenStatus("invalid");
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/create-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
      setTimeout(() => router.replace(localePath(locale, "/admin/login")), 2000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (tokenStatus === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-aws-orange border-t-transparent" />
      </div>
    );
  }

  if (tokenStatus === "invalid") {
    const info = REASONS[invalidReason] ?? REASONS.not_found;
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-900 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-red-500/30 bg-red-500/10">
            <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h1 className="dot-matrix m-0 text-2xl leading-none text-surface-50 sm:text-3xl">
            {info.title}
          </h1>
          <p className="mt-2 font-mono text-sm leading-relaxed text-surface-400">{info.message}</p>
          <a
            href={info.href}
            className="mt-6 inline-flex items-center bg-aws-orange px-6 py-2.5 font-mono text-sm font-bold text-surface-900 transition-all hover:shadow-[0_0_20px_rgba(242,166,240,0.4)]"
          >
            {info.cta}
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-900 px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center bg-emerald/10 text-emerald">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="dot-matrix m-0 text-2xl leading-none text-surface-50 sm:text-3xl">
            contraseña creada
          </h1>
          <p className="mt-2 font-mono text-sm text-surface-400">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <Image
            src="/images/logos/aws-logo.svg"
            alt="AWS"
            width={80}
            height={48}
          />
          <h1 className="dot-matrix m-0 text-2xl leading-none text-surface-50 sm:text-3xl">
            student community day
          </h1>
          <p className="mt-3 font-mono text-sm text-surface-400">
            Configura tu contraseña para acceder al panel
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 border-2 border-surface-600 bg-surface-800 p-6">
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            required
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repite la contraseña"
            required
          />
          {error && (
            <div className="border border-red-500/30 bg-red-500/10 px-4 py-2 font-mono text-sm text-red-400">
              {error}
            </div>
          )}
          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? "Creando..." : "Crear Contraseña"}
          </Button>
        </form>
      </div>
    </div>
  );
}
