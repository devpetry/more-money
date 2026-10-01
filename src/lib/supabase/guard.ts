import type { SessionState } from "@/lib/session";

export type GuardDecision =
  | { action: "allow" }
  | {
      action: "block";
      reason: "unconfirmed" | "no_profile";
      kind: "page" | "api";
    };

const PUBLIC_PAGES = new Set([
  "/",
  "/login",
  "/recuperar-senha",
  "/alterar-senha",
]);

// Rotas /api/auth/* que não são de negócio: NextAuth e fluxo de senha.
// Precisam passar para quem ainda vai entrar pelo NextAuth.
const PUBLIC_API_SEGMENTS = new Set([
  "session",
  "csrf",
  "providers",
  "signin",
  "signout",
  "callback",
  "error",
  "_log",
  "recuperar-senha",
  "alterar-senha",
]);

function isApi(pathname: string) {
  return pathname === "/api" || pathname.startsWith("/api/");
}

function isExempt(pathname: string) {
  if (isApi(pathname)) {
    if (!pathname.startsWith("/api/auth/")) return false;
    const segment = pathname.slice("/api/auth/".length).split("/")[0];
    return PUBLIC_API_SEGMENTS.has(segment);
  }
  return PUBLIC_PAGES.has(pathname) || pathname.startsWith("/auth/");
}

/**
 * Decide o que o middleware faz com um usuário Supabase.
 * anon e active passam: anon continua no NextAuth e as páginas decidem.
 */
export function resolveGuard(
  state: SessionState["state"],
  pathname: string
): GuardDecision {
  if (state !== "unconfirmed" && state !== "no_profile") {
    return { action: "allow" };
  }
  if (isExempt(pathname)) {
    return { action: "allow" };
  }
  return {
    action: "block",
    reason: state,
    kind: isApi(pathname) ? "api" : "page",
  };
}
