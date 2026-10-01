import type { SupabaseClient } from "@supabase/supabase-js";
import type { TipoUsuario } from "@/lib/auth";

export type AppSession = {
  /** Usuarios.id (inteiro). */
  usuarioId: number;
  /** auth.users.id (uuid). */
  authUserId: string;
  user: {
    /** String(Usuarios.id): mesmo formato do NextAuth, para o parseInt das rotas. */
    id: string;
    name: string;
    email: string;
    tipo_usuario: TipoUsuario;
  };
};

export type SessionState =
  | { state: "anon" }
  | { state: "unconfirmed" }
  | { state: "no_profile" }
  | { state: "active"; session: AppSession };

/**
 * Classifica a sessão Supabase do request.
 *
 * - anon: sem usuário Supabase válido (inclui quem só tem NextAuth).
 * - unconfirmed: existe em auth.users, mas email_confirmed_at é nulo.
 * - no_profile: confirmado, mas sem "Usuarios" ativo ligado por auth_user_id.
 * - active: "Usuarios" ativo ligado. A policy usuarios_select_own já exige
 *   data_exclusao is null, então excluído e não vinculado caem em no_profile.
 *
 * Usa auth.getUser() (valida o token no Auth), nunca getSession(). Papel e nome
 * vêm do banco a cada chamada. Falha de consulta lança erro: não vira
 * no_profile para não derrubar sessão por erro transitório.
 */
export async function getAppSessionState(
  supabase: SupabaseClient
): Promise<SessionState> {
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user;

  if (error || !user) {
    return { state: "anon" };
  }

  if (!user.email_confirmed_at) {
    return { state: "unconfirmed" };
  }

  const { data: perfil, error: perfilError } = await supabase
    .from("Usuarios")
    .select("id, nome, email, tipo_usuario")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (perfilError) {
    throw new Error(`Falha ao carregar perfil do usuário: ${perfilError.code}`);
  }

  if (!perfil) {
    return { state: "no_profile" };
  }

  return {
    state: "active",
    session: {
      usuarioId: perfil.id,
      authUserId: user.id,
      user: {
        id: String(perfil.id),
        name: perfil.nome,
        email: perfil.email,
        tipo_usuario: perfil.tipo_usuario as TipoUsuario,
      },
    },
  };
}

/** Sessão ativa do request atual (Server Components e Route Handlers) ou null. */
export async function getAppSession(): Promise<AppSession | null> {
  // Import dinâmico: mantém session.ts sem next/headers para o middleware e o teste.
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const result = await getAppSessionState(supabase);
  return result.state === "active" ? result.session : null;
}
