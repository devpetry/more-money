// Texto e avisos da fatura na interface. Puro (sem alias) para ser testado com
// `node --test`; o estado financeiro vem sempre da API.

import type { StatusFatura } from "./faturas";

export type { StatusFatura };
export type VarianteStatus = "primary" | "destructive" | "neutral" | "success";

export interface FaturaUi {
  status: StatusFatura;
  fechada: boolean;
  total: number;
}

const ROTULOS: Record<StatusFatura, { rotulo: string; variante: VarianteStatus }> = {
  aberta: { rotulo: "Aberta", variante: "primary" },
  pendente: { rotulo: "Fechada · pagamento pendente", variante: "destructive" },
  parcial: { rotulo: "Parcialmente paga", variante: "neutral" },
  paga: { rotulo: "Paga", variante: "success" },
};

// Fechada manualmente e zerada antes da data de fechamento: o estado continua
// "pendente" (só vira paga na data), mas não há nada a pagar
export const semValorAPagar = (f: FaturaUi) =>
  f.fechada && f.status === "pendente" && f.total === 0;

export function descreverStatusFatura(f: FaturaUi): {
  rotulo: string;
  variante: VarianteStatus;
} {
  if (semValorAPagar(f)) {
    return { rotulo: "Fechada · sem valor a pagar", variante: "neutral" };
  }
  return ROTULOS[f.status];
}

// Aviso de que alterar lançamentos recalcula o valor pendente
export const avisarFaturaFechadaNaoPaga = (f: FaturaUi) =>
  f.fechada && f.status !== "paga" && !semValorAPagar(f);
