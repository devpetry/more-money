export type Visualizacao =
  | { modo: "mes"; mes: string }
  | { modo: "ano"; ano: number }
  | { modo: "tudo" }
  | { modo: "periodo"; inicio: string; fim: string };

export type ModoVisualizacao = Visualizacao["modo"];

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function mesAtualISO(hoje = new Date()): string {
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

export function visualizacaoPadrao(hoje = new Date()): Visualizacao {
  return { modo: "mes", mes: mesAtualISO(hoje) };
}

// Troca de modo partindo do contexto atual (ex.: mês -> ano usa o ano do mês).
export function trocarModo(
  atual: Visualizacao,
  modo: ModoVisualizacao,
  hoje = new Date()
): Visualizacao {
  if (atual.modo === modo) return atual;
  const anoAtual =
    atual.modo === "mes"
      ? Number(atual.mes.slice(0, 4))
      : atual.modo === "ano"
        ? atual.ano
        : hoje.getFullYear();

  switch (modo) {
    case "mes":
      return visualizacaoPadrao(hoje);
    case "ano":
      return { modo: "ano", ano: anoAtual };
    case "tudo":
      return { modo: "tudo" };
    case "periodo":
      return atual.modo === "ano"
        ? { modo, inicio: `${atual.ano}-01-01`, fim: `${atual.ano}-12-31` }
        : { modo, inicio: "", fim: "" };
  }
}

export function dataNoPeriodo(data: string, v: Visualizacao): boolean {
  const d = data.slice(0, 10);
  switch (v.modo) {
    case "tudo":
      return true;
    case "mes":
      return d.slice(0, 7) === v.mes;
    case "ano":
      return d.slice(0, 4) === String(v.ano);
    case "periodo":
      return (!v.inicio || d >= v.inicio) && (!v.fim || d <= v.fim);
  }
}

function formatarDataBR(iso: string): string {
  return iso.split("-").reverse().join("/");
}

// Complemento de frase: "Receitas e despesas {descreverVisualizacao(v)}."
export function descreverVisualizacao(v: Visualizacao): string {
  switch (v.modo) {
    case "tudo":
      return "de todo o período";
    case "ano":
      return `de ${v.ano}`;
    case "mes": {
      const [ano, mes] = v.mes.split("-");
      return `de ${MESES[Number(mes) - 1]} de ${ano}`;
    }
    case "periodo":
      if (v.inicio && v.fim)
        return `de ${formatarDataBR(v.inicio)} a ${formatarDataBR(v.fim)}`;
      if (v.inicio) return `a partir de ${formatarDataBR(v.inicio)}`;
      if (v.fim) return `até ${formatarDataBR(v.fim)}`;
      return "de todo o período";
  }
}

export function visualizacaoAnoAtual(hoje = new Date()): Visualizacao {
  return { modo: "ano", ano: hoje.getFullYear() };
}

// Intervalo inclusivo em YYYY-MM-DD; null = sem limite naquele lado.
export function intervaloDaVisualizacao(v: Visualizacao): {
  inicio: string | null;
  fim: string | null;
} {
  switch (v.modo) {
    case "tudo":
      return { inicio: null, fim: null };
    case "ano":
      return { inicio: `${v.ano}-01-01`, fim: `${v.ano}-12-31` };
    case "mes": {
      const [ano, mes] = v.mes.split("-").map(Number);
      const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
      return {
        inicio: `${v.mes}-01`,
        fim: `${v.mes}-${String(ultimo).padStart(2, "0")}`,
      };
    }
    case "periodo":
      return { inicio: v.inicio || null, fim: v.fim || null };
  }
}
