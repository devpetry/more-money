import { NextResponse } from "next/server";
import { ErroNegocio } from "@/lib/faturas";

// Regra de negócio violada -> status e mensagem próprios; o resto vira 500.
// `porCodigoPg` traduz erros do Postgres (ex.: 23505 unique, 23503 FK).
export function respostaDeErro(
  error: unknown,
  mensagemPadrao: string,
  porCodigoPg: Record<string, string> = {}
) {
  if (error instanceof ErroNegocio) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  const codigo = (error as { code?: string } | null)?.code;
  if (codigo && porCodigoPg[codigo]) {
    return NextResponse.json({ error: porCodigoPg[codigo] }, { status: 409 });
  }
  console.error(mensagemPadrao, error);
  return NextResponse.json({ error: mensagemPadrao }, { status: 500 });
}
