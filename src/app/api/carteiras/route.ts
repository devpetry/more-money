import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";

// GET - Listar as carteiras do usuário autenticado
export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;
    const { usuarioId } = auth;

    const result = await query(
      `SELECT id, nome
       FROM carteiras
       WHERE usuario_id = $1
       ORDER BY nome ASC`,
      [usuarioId]
    );

    return NextResponse.json(result ?? []);
  } catch (error) {
    console.error("Erro ao buscar carteiras:", error);
    return NextResponse.json(
      { error: "Erro ao buscar carteiras" },
      { status: 500 }
    );
  }
}
