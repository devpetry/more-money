import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import jwt from "jsonwebtoken";

// GET - Listar todas as categorias
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: number;
    };

    const usuarioId = decoded.id;

    const result = await query(
      `SELECT id, nome, tipo, empresa_id, usuario_id, "criado_em"
       FROM "Categorias"
       WHERE usuario_id = $1
       ORDER BY id ASC`,
      [usuarioId]
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return NextResponse.json(
      { error: "Erro ao buscar categorias" },
      { status: 500 }
    );
  }
}

// POST - Criar nova categoria
export async function POST(req: Request) {
  try {
    const { nome, tipo, empresa_id, usuario_id } = await req.json();

    if (!nome || !tipo) {
      return NextResponse.json(
        { error: "Campos 'nome' e 'tipo' são obrigatórios." },
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
      `INSERT INTO "Categorias" (nome, tipo, empresa_id, usuario_id, "criado_em", "atualizado_em")
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, nome, tipo, empresa_id, usuario_id, "criado_em"`,
      [nome, tipo, empresa_id || null, usuario_id || null]
    );

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    return NextResponse.json(
      { error: "Erro ao criar categoria" },
      { status: 500 }
    );
  }
}
