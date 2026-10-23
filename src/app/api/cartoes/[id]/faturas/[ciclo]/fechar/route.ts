import { NextRequest, NextResponse } from "next/server";
import { transaction } from "@/lib/db";
import { isUuid, requireSession } from "@/lib/api-auth";
import { respostaDeErro } from "@/lib/api-erro";
import { cicloDeParametro, fecharFatura } from "@/lib/faturas";

// POST - Fechamento manual (sem pagar): a fatura fica com pagamento pendente
export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string; ciclo: string }> }
) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;
    const { id, ciclo } = await context.params;
    const cicloData = cicloDeParametro(ciclo);
    if (!isUuid(id) || !cicloData) {
      return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
    }

    const fatura = await transaction((db) =>
      fecharFatura(db, auth.usuarioId, id, cicloData)
    );
    return NextResponse.json(fatura);
  } catch (error) {
    return respostaDeErro(error, "Erro ao fechar fatura");
  }
}
