import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { isUuid, requireSession } from "@/lib/api-auth";
import { respostaDeErro } from "@/lib/api-erro";
import { listarFaturas } from "@/lib/faturas";

// GET - Faturas do cartão (inclui o ciclo corrente, mesmo sem lançamentos)
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    if (!isUuid(id)) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    return NextResponse.json(await listarFaturas(pool, auth.usuarioId, id));
  } catch (error) {
    return respostaDeErro(error, "Erro ao buscar faturas");
  }
}
