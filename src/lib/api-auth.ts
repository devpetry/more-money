import { getServerSession, type Session } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";

export const isUuid = (valor: unknown): valor is string =>
  z.uuid().safeParse(valor).success;

type AuthSuccess = {
  ok: true;
  session: Session;
  usuarioId: string;
};

type AuthFailure = {
  ok: false;
  response: NextResponse;
};

export type AuthResult = AuthSuccess | AuthFailure;

export async function requireSession(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      ),
    };
  }

  const usuarioId = session.user.id;
  if (!isUuid(usuarioId)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "ID do usuário inválido" },
        { status: 400 }
      ),
    };
  }

  return { ok: true, session, usuarioId };
}

export async function requireAdmin(): Promise<AuthResult> {
  const auth = await requireSession();
  if (!auth.ok) {
    return auth;
  }

  if (auth.session.user.tipo_usuario !== "ADMIN") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      ),
    };
  }

  return auth;
}
