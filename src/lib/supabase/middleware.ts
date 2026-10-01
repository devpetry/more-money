import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getAppSessionState } from "@/lib/session";
import { resolveGuard } from "@/lib/supabase/guard";

function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    throw new Error(
      "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no ambiente."
    );
  }
  return { url, anonKey };
}

const BLOCK_MESSAGES = {
  unconfirmed: {
    error: "email_nao_confirmado",
    api: "E-mail não confirmado",
  },
  no_profile: {
    error: "sem_perfil",
    api: "Perfil não encontrado ou inativo",
  },
} as const;

// Repassa cookies (refresh/signOut) e cache-control da resposta do Supabase.
function carryOver(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
  const cacheControl = from.headers.get("cache-control");
  if (cacheControl) to.headers.set("cache-control", cacheControl);
  return to;
}

export async function updateSession(request: NextRequest) {
  const { url, anonKey } = getSupabasePublicEnv();

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  // getUser() faz o refresh do token e alimenta a classificação.
  // Sem cookie Supabase não há chamada de rede e o estado é "anon".
  let sessionState;
  try {
    sessionState = await getAppSessionState(supabase);
  } catch (error) {
    console.error("Erro ao classificar sessão Supabase:", error);
    return carryOver(
      supabaseResponse,
      NextResponse.json({ error: "Serviço indisponível" }, { status: 503 })
    );
  }

  const { pathname } = request.nextUrl;
  const decision = resolveGuard(sessionState.state, pathname);

  if (decision.action === "allow") {
    return supabaseResponse;
  }

  // Só no_profile limpa o cookie; unconfirmed mantém.
  if (decision.reason === "no_profile") {
    await supabase.auth.signOut({ scope: "local" });
  }

  const message = BLOCK_MESSAGES[decision.reason];

  if (decision.kind === "api") {
    return carryOver(
      supabaseResponse,
      NextResponse.json({ error: message.api }, { status: 403 })
    );
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/login";
  redirectUrl.search = "";
  redirectUrl.searchParams.set("error", message.error);

  return carryOver(supabaseResponse, NextResponse.redirect(redirectUrl));
}
