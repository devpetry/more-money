import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isUuid, requireSession } from "@/lib/api-auth";

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
        l.carteira_id, l.usuario_id, l.criado_em, l.atualizado_em
       FROM lancamentos l
       LEFT JOIN categorias c ON c.id = l.categoria_id
       WHERE l.usuario_id = $1
       ORDER BY l.data DESC, l.criado_em DESC, l.id DESC`,
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

    const { descricao, valor, tipo, categoria_id, carteira_id, data } =
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

    if (!isUuid(carteira_id)) {
      return NextResponse.json(
        { error: "O campo 'carteira_id' é obrigatório e deve ser válido." },
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

    const carteira = await query(
      `SELECT 1 FROM carteiras WHERE id = $1 AND usuario_id = $2`,
      [carteira_id, usuarioId]
    );

    if (carteira.length === 0) {
      return NextResponse.json(
        { error: "O campo 'carteira_id' é inválido." },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO lancamentos (descricao, valor, tipo, data, categoria_id, carteira_id, usuario_id, "criado_em", "atualizado_em")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, descricao, valor, tipo, data, categoria_id, carteira_id, usuario_id, "criado_em"`,
      [
        descricao,
        valor,
        tipo,
        data,
        categoria_id || null,
        carteira_id,
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
