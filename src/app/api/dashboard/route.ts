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
    const mesParam = searchParams.get("mes");

    let startDate: string | null = null;
    let nextMonthStart: string | null = null;

    if (mesParam) {
      const [anoStr, mesStr] = mesParam.split("-");
      const ano = parseInt(anoStr, 10);
      const mes = parseInt(mesStr, 10);

      if (!Number.isNaN(ano) && !Number.isNaN(mes) && mes >= 1 && mes <= 12) {
        const mm = String(mes).padStart(2, "0");
        startDate = `${anoStr}-${mm}-01`;

        const nextMonth = mes === 12 ? 1 : mes + 1;
        const nextYear = mes === 12 ? ano + 1 : ano;
        const nextMm = String(nextMonth).padStart(2, "0");
        nextMonthStart = `${nextYear}-${nextMm}-01`;
      }
    } else {
      const anoAtual = new Date().getFullYear();
      startDate = `${anoAtual}-01-01`;
      nextMonthStart = `${anoAtual + 1}-01-01`;
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
