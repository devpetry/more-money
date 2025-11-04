import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Obter detalhes de um lançamento específico
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const usuarioId = parseInt(session.user.id, 10);
    const lancamentoId = parseInt(id, 10);

    if (isNaN(usuarioId) || isNaN(lancamentoId)) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const result = await query(
      `SELECT l.id, l.descricao, l.valor, l.tipo, l.data,
              l.categoria_id, c.nome AS categoria_nome,
              l.empresa_id, l.usuario_id, l.criado_em, l.atualizado_em
       FROM "Lancamentos" l
       LEFT JOIN "Categorias" c ON c.id = l.categoria_id
       WHERE l.id = $1 AND l.usuario_id = $2
       LIMIT 1`,
      [lancamentoId, usuarioId]
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

// PUT - Atualizar um lançamento existente
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const usuarioId = parseInt(session.user.id, 10);
    const lancamentoId = parseInt(id, 10);

    if (isNaN(usuarioId) || isNaN(lancamentoId)) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const { descricao, valor, tipo, categoria_id, data } = await req.json();

    if (!descricao || !valor || !tipo || !data) {
      return NextResponse.json(
        {
          error:
            "Campos 'descricao', 'valor', 'tipo' e 'data' são obrigatórios.",
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

    const empresaResult = await query(
      `SELECT empresa_id FROM "Usuarios" WHERE id = $1 LIMIT 1`,
      [usuarioId]
    );

    if (empresaResult.length === 0) {
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    const empresa_id = empresaResult[0].empresa_id || null;

    const result = await query(
      `UPDATE "Lancamentos"
       SET descricao = $1,
           valor = $2,
           tipo = $3,
           data = $4,
           categoria_id = $5,
           empresa_id = $6,
           "atualizado_em" = NOW()
       WHERE id = $7 AND usuario_id = $8
       RETURNING id, descricao, valor, tipo, data, categoria_id, empresa_id, usuario_id, "atualizado_em"`,
      [
        descricao,
        valor,
        tipo,
        data,
        categoria_id || null,
        empresa_id,
        lancamentoId,
        usuarioId,
      ]
    );

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Lançamento não encontrado ou não pertence ao usuário." },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Erro ao atualizar lançamento:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar lançamento." },
      { status: 500 }
    );
  }
}

// DELETE - Remover lançamento
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const usuarioId = parseInt(session.user.id, 10);
    const lancamentoId = parseInt(id, 10);

    if (isNaN(usuarioId) || isNaN(lancamentoId)) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const result = await query(
      `DELETE FROM "Lancamentos"
       WHERE id = $1 AND usuario_id = $2
       RETURNING id`,
      [lancamentoId, usuarioId]
    );

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Lançamento não encontrado ou não pertence ao usuário." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Lançamento removido com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir lançamento:", error);
    return NextResponse.json(
      { error: "Erro ao excluir lançamento." },
      { status: 500 }
    );
  }
}
