import { NextRequest, NextResponse } from "next/server";
import { transaction } from "@/lib/db";
import { isUuid, requireSession } from "@/lib/api-auth";
import { respostaDeErro } from "@/lib/api-erro";
import { cicloDeParametro, registrarPagamento } from "@/lib/faturas";

// POST - Registrar pagamento (total ou parcial) de fatura fechada
export async function POST(
  req: NextRequest,
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

    const { valor, data, carteira_id } = await req.json();
    if (!isUuid(carteira_id)) {
      return NextResponse.json(
        { error: "O campo 'carteira_id' é obrigatório e deve ser válido." },
        { status: 400 }
      );
    }

    const fatura = await transaction((db) =>
      registrarPagamento(db, auth.usuarioId, id, cicloData, {
        valor,
        data,
        carteiraId: carteira_id,
      })
    );
    return NextResponse.json(fatura, { status: 201 });
  } catch (error) {
    return respostaDeErro(error, "Erro ao registrar pagamento");
  }
}
