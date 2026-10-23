import { NextResponse } from "next/server";
import { query, transaction } from "@/lib/db";
import { isUuid, requireSession } from "@/lib/api-auth";
import { respostaDeErro } from "@/lib/api-erro";
import { criarLancamento } from "@/lib/faturas";

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
        l.carteira_id, l.fatura_id, f.cartao_id, ct.nome AS cartao_nome,
        l.usuario_id, l.criado_em, l.atualizado_em
       FROM lancamentos l
       LEFT JOIN categorias c ON c.id = l.categoria_id
       LEFT JOIN faturas f ON f.id = l.fatura_id
       LEFT JOIN cartoes ct ON ct.id = f.cartao_id
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

// POST - Criar novo lançamento (em carteira ou, para despesas, em cartão)
export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;
    const { usuarioId } = auth;

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
      criarLancamento(db, usuarioId, {
        descricao,
        valor,
        tipo,
        data,
        categoriaId: categoria_id || null,
        carteiraId: cartao_id ? null : carteira_id,
        cartaoId: cartao_id || null,
      })
    );

    return NextResponse.json({ ...lancamento, aviso }, { status: 201 });
  } catch (error) {
    return respostaDeErro(error, "Erro ao criar lançamento");
  }
}
