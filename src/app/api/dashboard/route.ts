import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { pool } from "@/lib/db";
import { consultarDashboard } from "@/lib/dashboard";

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;
    const { usuarioId } = auth;

    const { searchParams } = new URL(req.url);
    // inicio/fim (YYYY-MM-DD, inclusivos); "tudo=1" = sem limite de datas.
    // Sem parâmetros: mês corrente.
    const dataISO = /^\d{4}-\d{2}-\d{2}$/;
    const inicioParam = searchParams.get("inicio");
    const fimParam = searchParams.get("fim");

    let startDate: string | null = null;
    let nextMonthStart: string | null = null;

    if (searchParams.get("tudo") === "1") {
      // sem filtro
    } else if (inicioParam || fimParam) {
      if (
        (inicioParam && !dataISO.test(inicioParam)) ||
        (fimParam && !dataISO.test(fimParam))
      ) {
        return NextResponse.json({ error: "Período inválido" }, { status: 400 });
      }
      startDate = inicioParam;
      if (fimParam) {
        const dia = new Date(`${fimParam}T00:00:00Z`);
        if (Number.isNaN(dia.getTime())) {
          return NextResponse.json({ error: "Período inválido" }, { status: 400 });
        }
        dia.setUTCDate(dia.getUTCDate() + 1);
        nextMonthStart = dia.toISOString().slice(0, 10);
      }
    } else {
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = hoje.getMonth() + 1;
      startDate = `${ano}-${String(mes).padStart(2, "0")}-01`;
      nextMonthStart =
        mes === 12
          ? `${ano + 1}-01-01`
          : `${ano}-${String(mes + 1).padStart(2, "0")}-01`;
    }

    const data = await consultarDashboard(pool, usuarioId, startDate, nextMonthStart);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);
    return NextResponse.json(
      {
        error: "Erro ao carregar dashboard",
        saldo: 0,
        carteiras: [],
        totalReceitas: 0,
        totalDespesas: 0,
        evolucaoMensal: [],
        despesasPorCategoria: [],
        ultimosLancamentos: [],
      },
      { status: 500 }
    );
  }
}
