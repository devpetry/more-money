import { NextRequest, NextResponse } from "next/server";
import { query, transaction } from "@/lib/db";
import { isUuid, requireSession } from "@/lib/api-auth";
import { respostaDeErro } from "@/lib/api-erro";
import { atualizarLancamento, excluirLancamento } from "@/lib/faturas";

// GET - Obter detalhes de um lançamento específico
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const auth = await requireSession();
    if (!auth.ok) return auth.response;
    const { usuarioId } = auth;

    if (!isUuid(id)) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const result = await query(
      `SELECT l.id, l.descricao, l.valor, l.tipo, l.data,
              l.categoria_id, c.nome AS categoria_nome,
              l.carteira_id, l.fatura_id, f.cartao_id,
              l.usuario_id, l.criado_em, l.atualizado_em
       FROM lancamentos l
       LEFT JOIN categorias c ON c.id = l.categoria_id
       LEFT JOIN faturas f ON f.id = l.fatura_id
       WHERE l.id = $1 AND l.usuario_id = $2
       LIMIT 1`,
      [id, usuarioId]
    );

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Lançamento não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Erro ao buscar lançamento:", error);
    return NextResponse.json(
      { error: "Erro ao buscar lançamento." },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um lançamento existente (pode alternar entre carteira e cartão)
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const auth = await requireSession();
    if (!auth.ok) return auth.response;
    const { usuarioId } = auth;

    if (!isUuid(id)) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const { descricao, valor, tipo, categoria_id, carteira_id, cartao_id, data } =
      await req.json();

    if (!descricao || !valor || !tipo || !data) {
      return NextResponse.json(
        {
          error:
            "Campos 'descricao', 'valor', 'tipo' e 'data' são obrigatórios.",
        },
        { status: 400 }
      );
    }

    if (categoria_id && !isUuid(categoria_id)) {
      return NextResponse.json(
        { error: "O campo 'categoria_id' é inválido." },
        { status: 400 }
      );
    }

    if (cartao_id ? !isUuid(cartao_id) : !isUuid(carteira_id)) {
      return NextResponse.json(
        {
          error: cartao_id
            ? "O campo 'cartao_id' é inválido."
            : "O campo 'carteira_id' é obrigatório e deve ser válido.",
        },
        { status: 400 }
      );
    }

    if (isNaN(parseFloat(valor))) {
      return NextResponse.json(
        { error: "O campo 'valor' deve ser numérico." },
        { status: 400 }
      );
    }

    if (!["receita", "despesa"].includes(tipo)) {
      return NextResponse.json(
        { error: "O campo 'tipo' deve ser 'receita' ou 'despesa'." },
        { status: 400 }
      );
    }

    const { lancamento, aviso } = await transaction((db) =>
      atualizarLancamento(db, usuarioId, id, {
        descricao,
        valor,
        tipo,
        data,
        categoriaId: categoria_id || null,
        carteiraId: cartao_id ? null : carteira_id,
        cartaoId: cartao_id || null,
      })
    );

    return NextResponse.json({ ...lancamento, aviso });
  } catch (error) {
    return respostaDeErro(error, "Erro ao atualizar lançamento.");
  }
}

// DELETE - Remover lançamento
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const auth = await requireSession();
    if (!auth.ok) return auth.response;
    const { usuarioId } = auth;

    if (!isUuid(id)) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const { aviso } = await transaction((db) =>
      excluirLancamento(db, usuarioId, id)
    );

    return NextResponse.json({ message: "Lançamento removido com sucesso.", aviso });
  } catch (error) {
    return respostaDeErro(error, "Erro ao excluir lançamento.");
  }
}
