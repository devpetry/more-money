import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Listar todas as empresas
export async function GET() {
  try {
    const result = await query(
      `SELECT id, nome, cnpj, "criado_em"
       FROM "Empresas"
       WHERE data_exclusao IS NULL
       ORDER BY id ASC`,
      []
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao buscar empresas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar empresas" },
      { status: 500 }
    );
  }
}

// POST - Criar nova empresas
export async function POST(req: Request) {
  try {
    const { nome, cnpj } = await req.json();


    if (!nome || !cnpj) {
      return NextResponse.json(
        { error: "Campos 'nome' e 'cnpj' são obrigatórios." },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO "Empresas" (nome, cnpj, "criado_em", "atualizado_em")
       VALUES ($1, $2, NOW(), NOW())
       RETURNING id, nome, cnpj, "criado_em"`,
      [nome, cnpj]
    );

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Erro ao criar empresa:", error);
    return NextResponse.json(
      { error: "Erro ao criar empresa" },
      { status: 500 }
    );
  }
}
