import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAppSessionState } from "./session.ts";
import { resolveGuard } from "./supabase/guard.ts";

type FakeUser = { id: string; email_confirmed_at?: string | null };
type FakePerfil = {
  id: number;
  nome: string;
  email: string;
  tipo_usuario: string;
};

function fakeClient(opts: {
  user?: FakeUser | null;
  authError?: boolean;
  perfil?: FakePerfil | null;
  perfilError?: { code: string };
}) {
  const calls: { column?: string; value?: unknown } = {};
  const client = {
    auth: {
      getUser: async () => ({
        data: { user: opts.user ?? null },
        error: opts.authError ? new Error("auth") : null,
      }),
    },
    from: () => ({
      select: () => ({
        eq: (column: string, value: unknown) => {
          calls.column = column;
          calls.value = value;
          return {
            maybeSingle: async () => ({
              data: opts.perfil ?? null,
              error: opts.perfilError ?? null,
            }),
          };
        },
      }),
    }),
  } as unknown as SupabaseClient;
  return { client, calls };
}

const confirmado = { id: "uuid-1", email_confirmed_at: "2026-01-01T00:00:00Z" };
const perfil = {
  id: 7,
  nome: "Maria Silva",
  email: "maria@example.com",
  tipo_usuario: "ADMIN",
};

describe("getAppSessionState", () => {
  it("anon quando não há usuário", async () => {
    const { client } = fakeClient({ user: null });
    assert.deepEqual(await getAppSessionState(client), { state: "anon" });
  });

  it("anon quando getUser retorna erro", async () => {
    const { client } = fakeClient({ user: confirmado, authError: true });
    assert.deepEqual(await getAppSessionState(client), { state: "anon" });
  });

  it("unconfirmed quando email_confirmed_at é nulo", async () => {
    const { client } = fakeClient({
      user: { id: "uuid-1", email_confirmed_at: null },
      perfil,
    });
    assert.deepEqual(await getAppSessionState(client), {
      state: "unconfirmed",
    });
  });

  it("no_profile quando não há Usuarios ativo ligado", async () => {
    const { client } = fakeClient({ user: confirmado, perfil: null });
    assert.deepEqual(await getAppSessionState(client), {
      state: "no_profile",
    });
  });

  it("active devolve id inteiro, user.id string, nome, e-mail e papel", async () => {
    const { client, calls } = fakeClient({ user: confirmado, perfil });
    const result = await getAppSessionState(client);

    assert.deepEqual(result, {
      state: "active",
      session: {
        usuarioId: 7,
        authUserId: "uuid-1",
        user: {
          id: "7",
          name: "Maria Silva",
          email: "maria@example.com",
          tipo_usuario: "ADMIN",
        },
      },
    });
    assert.equal(calls.column, "auth_user_id");
    assert.equal(calls.value, "uuid-1");
  });

  it("erro na consulta do perfil lança (não vira no_profile)", async () => {
    const { client } = fakeClient({
      user: confirmado,
      perfilError: { code: "XX000" },
    });
    await assert.rejects(() => getAppSessionState(client), /perfil/);
  });
});

describe("resolveGuard", () => {
  it("anon e active passam em qualquer rota", () => {
    for (const state of ["anon", "active"] as const) {
      assert.deepEqual(resolveGuard(state, "/dashboard"), { action: "allow" });
      assert.deepEqual(resolveGuard(state, "/api/auth/lancamentos"), {
        action: "allow",
      });
    }
  });

  it("unconfirmed e no_profile: páginas protegidas bloqueiam como page", () => {
    assert.deepEqual(resolveGuard("unconfirmed", "/dashboard"), {
      action: "block",
      reason: "unconfirmed",
      kind: "page",
    });
    assert.deepEqual(resolveGuard("no_profile", "/lista-usuarios"), {
      action: "block",
      reason: "no_profile",
      kind: "page",
    });
  });

  it("unconfirmed e no_profile: APIs de negócio bloqueiam como api", () => {
    for (const path of [
      "/api/auth/lancamentos",
      "/api/auth/lancamentos/3",
      "/api/auth/categorias",
      "/api/auth/dashboard",
      "/api/auth/usuarios",
      "/api/outra",
    ]) {
      const decision = resolveGuard("no_profile", path);
      assert.equal(decision.action, "block", path);
      assert.equal(decision.action === "block" && decision.kind, "api", path);
    }
  });

  it("páginas públicas e callback passam (sem loop em /login)", () => {
    for (const path of [
      "/",
      "/login",
      "/recuperar-senha",
      "/alterar-senha",
      "/auth/callback",
    ]) {
      assert.deepEqual(resolveGuard("no_profile", path), { action: "allow" });
      assert.deepEqual(resolveGuard("unconfirmed", path), { action: "allow" });
    }
  });

  it("endpoints do NextAuth e do fluxo de senha passam", () => {
    for (const path of [
      "/api/auth/session",
      "/api/auth/csrf",
      "/api/auth/providers",
      "/api/auth/callback/credentials",
      "/api/auth/signout",
      "/api/auth/recuperar-senha",
      "/api/auth/alterar-senha",
    ]) {
      assert.deepEqual(resolveGuard("no_profile", path), { action: "allow" });
    }
  });
});
