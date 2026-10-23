import { NextRequest, NextResponse } from "next/server";
import { pool, transaction } from "@/lib/db";
import { isUuid, requireSession } from "@/lib/api-auth";
import { respostaDeErro } from "@/lib/api-erro";
import {
  ajustarDatasFatura,
  cicloDeParametro,
  detalharFatura,
} from "@/lib/faturas";

type Contexto = { params: Promise<{ id: string; ciclo: string }> };

async function parametros(context: Contexto) {
  const { id, ciclo } = await context.params;
  const cicloData = cicloDeParametro(ciclo);
  return isUuid(id) && cicloData ? { id, ciclo: cicloData } : null;
}

// GET - Detalhe da fatura do ciclo (YYYY-MM): lançamentos e pagamentos
export async function GET(_req: NextRequest, context: Contexto) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;
    const p = await parametros(context);
    if (!p) return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });

    return NextResponse.json(await detalharFatura(pool, auth.usuarioId, p.id, p.ciclo));
  } catch (error) {
    return respostaDeErro(error, "Erro ao buscar fatura");
  }
}

// PUT - Ajustar datas de fechamento e vencimento (enquanto não estiver paga)
export async function PUT(req: NextRequest, context: Contexto) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;
    const p = await parametros(context);
    if (!p) return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });

    const { data_fechamento, data_vencimento } = await req.json();
    const fatura = await transaction((db) =>
      ajustarDatasFatura(db, auth.usuarioId, p.id, p.ciclo, {
        fechamento: data_fechamento,
        vencimento: data_vencimento,
      })
    );
    return NextResponse.json(fatura);
  } catch (error) {
    return respostaDeErro(error, "Erro ao ajustar fatura");
  }
}
