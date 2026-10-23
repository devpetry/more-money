import { NextRequest, NextResponse } from "next/server";
import { transaction } from "@/lib/db";
import { isUuid, requireSession } from "@/lib/api-auth";
import { respostaDeErro } from "@/lib/api-erro";
import { cicloDeParametro, estornarPagamento } from "@/lib/faturas";

// POST - Estornar pagamento (o registro original é preservado)
export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string; ciclo: string; pagamentoId: string }> }
) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;
    const { id, ciclo, pagamentoId } = await context.params;
    const cicloData = cicloDeParametro(ciclo);
    if (!isUuid(id) || !isUuid(pagamentoId) || !cicloData) {
      return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
    }

    const fatura = await transaction((db) =>
      estornarPagamento(db, auth.usuarioId, id, cicloData, pagamentoId)
    );
    return NextResponse.json(fatura);
  } catch (error) {
    return respostaDeErro(error, "Erro ao estornar pagamento");
  }
}
