import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";
import { respostaDeErro } from "@/lib/api-erro";
import { validarCartao } from "@/lib/faturas";

// GET - Listar os cartões do usuário autenticado
export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    const result = await query(
      `SELECT id, nome, dia_fechamento, dia_vencimento, criado_em
       FROM cartoes
       WHERE usuario_id = $1
       ORDER BY nome ASC`,
      [auth.usuarioId]
    );

    return NextResponse.json(result ?? []);
  } catch (error) {
    return respostaDeErro(error, "Erro ao buscar cartões");
  }
}

// POST - Criar cartão
export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    const { nome, diaFechamento, diaVencimento } = validarCartao(await req.json());

    const result = await query(
      `INSERT INTO cartoes (nome, dia_fechamento, dia_vencimento, usuario_id, criado_em, atualizado_em)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, nome, dia_fechamento, dia_vencimento, criado_em`,
      [nome, diaFechamento, diaVencimento, auth.usuarioId]
    );

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    return respostaDeErro(error, "Erro ao criar cartão", {
      "23505": "Já existe um cartão com esse nome.",
    });
  }
}
