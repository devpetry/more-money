const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const brlCompact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number | string): string {
  return brl.format(Number(value) || 0);
}

// Para eixos de gráfico, onde o espaço é curto (ex.: "R$ 8,5 mil")
export function formatCurrencyCompact(value: number | string): string {
  return brlCompact.format(Number(value) || 0);
}
