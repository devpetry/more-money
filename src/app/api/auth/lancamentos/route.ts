import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";

// GET - Listar todos os lançamentos do usuário autenticados
export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;
    const { usuarioId } = auth;

    const result = await query(
      `SELECT l.id, l.descricao, l.valor, l.tipo,
        TO_CHAR(l.data, 'YYYY-MM-DD') AS data, 
        l.categoria_id, c.nome AS categoria_nome, 
        l.usuario_id, l.criado_em, l.atualizado_em
       FROM "Lancamentos" l
       LEFT JOIN "Categorias" c ON c.id = l.categoria_id
       WHERE l.usuario_id = $1
       ORDER BY l.data DESC, l.id DESC`,
      [usuarioId]
    );

    return NextResponse.json(result ?? []);
  } catch (error) {
    console.error("Erro ao buscar lançamentos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar lançamentos" },
      { status: 500 }
    );
  }
}

// POST - Criar novo lançamento
export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;
    const { usuarioId } = auth;

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

    const result = await query(
      `INSERT INTO "Lancamentos" (descricao, valor, tipo, data, categoria_id, usuario_id, "criado_em", "atualizado_em")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, descricao, valor, tipo, data, categoria_id, usuario_id, "criado_em"`,
      [
        descricao,
        valor,
        tipo,
        data,
        categoria_id || null,
        usuarioId,
      ]
    );

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Erro ao criar lançamento:", error);
    return NextResponse.json(
      { error: "Erro ao criar lançamento" },
      { status: 500 }
    );
  }
}
