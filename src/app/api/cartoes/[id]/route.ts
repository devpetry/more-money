import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isUuid, requireSession } from "@/lib/api-auth";
import { respostaDeErro } from "@/lib/api-erro";
import { validarCartao } from "@/lib/faturas";

type Contexto = { params: Promise<{ id: string }> };

// GET - Obter um cartão
export async function GET(_req: NextRequest, context: Contexto) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    if (!isUuid(id)) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const result = await query(
      `SELECT id, nome, dia_fechamento, dia_vencimento, criado_em
       FROM cartoes WHERE id = $1 AND usuario_id = $2`,
      [id, auth.usuarioId]
    );
    if (result.length === 0) {
      return NextResponse.json({ error: "Cartão não encontrado." }, { status: 404 });
    }
    return NextResponse.json(result[0]);
  } catch (error) {
    return respostaDeErro(error, "Erro ao buscar cartão");
  }
}

// PUT - Atualizar nome e dias padrão (faturas já criadas mantêm suas datas)
export async function PUT(req: NextRequest, context: Contexto) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    if (!isUuid(id)) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const { nome, diaFechamento, diaVencimento } = validarCartao(await req.json());

    const result = await query(
      `UPDATE cartoes
       SET nome = $1, dia_fechamento = $2, dia_vencimento = $3, atualizado_em = NOW()
       WHERE id = $4 AND usuario_id = $5
       RETURNING id, nome, dia_fechamento, dia_vencimento, criado_em`,
      [nome, diaFechamento, diaVencimento, id, auth.usuarioId]
    );
    if (result.length === 0) {
      return NextResponse.json({ error: "Cartão não encontrado." }, { status: 404 });
    }
    return NextResponse.json(result[0]);
  } catch (error) {
    return respostaDeErro(error, "Erro ao atualizar cartão", {
      "23505": "Já existe um cartão com esse nome.",
    });
  }
}

// DELETE - Remover cartão (bloqueado pela FK se houver faturas/histórico)
export async function DELETE(_req: NextRequest, context: Contexto) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    if (!isUuid(id)) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const result = await query(
      `DELETE FROM cartoes WHERE id = $1 AND usuario_id = $2 RETURNING id`,
      [id, auth.usuarioId]
    );
    if (result.length === 0) {
      return NextResponse.json({ error: "Cartão não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ message: "Cartão removido com sucesso." });
  } catch (error) {
    return respostaDeErro(error, "Erro ao excluir cartão", {
      "23503": "Cartões com histórico de faturas não podem ser excluídos.",
    });
  }
}
