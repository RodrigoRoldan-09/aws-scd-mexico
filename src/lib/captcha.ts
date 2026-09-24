// Tokens ya usados: un token de captcha solo se acepta una vez.
// Los de Turnstile duran ~5 min, por eso el TTL de 5 min alcanza.
const usedTokens = new Map<string, number>();
const TOKEN_TTL_MS = 5 * 60 * 1000;

function purgeExpired() {
  const now = Date.now();
  for (const [token, expiry] of usedTokens) {
    if (expiry <= now) usedTokens.delete(token);
  }
}

function markUsed(token: string) {
  if (usedTokens.size > 1000) purgeExpired();
  usedTokens.set(token, Date.now() + TOKEN_TTL_MS);
}

// Verifica un token de Turnstile. Devuelve false si falta, ya se usó o lo rechaza
// Turnstile. En dev (sin TURNSTILE_SECRET_KEY) no verifica de verdad, pero igual
// marca el token como usado para que no se pueda reusar.
export async function verifyCaptcha(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const hasSecret = !!secret && secret !== "xxx";

  // Un solo uso (siempre)
  if (token) {
    if (usedTokens.has(token)) return false;
  }

  if (!hasSecret) {
    // Dev sin secret: acepta pero consume el token
    if (token) markUsed(token);
    return true;
  }

  if (!token) return false;

  // Si falla la red, devuelve false (no lanza, para no generar un 500)
  let data: { success: boolean };
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }).toString(),
    });
    data = await res.json() as { success: boolean };
  } catch {
    return false;
  }

  if (data.success === true) {
    markUsed(token);
    return true;
  }
  return false;
}
