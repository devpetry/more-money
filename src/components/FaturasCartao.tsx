"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { NumericFormat } from "react-number-format";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogFooter } from "./ui/dialog";
import { Field } from "./ui/field";
import { fieldClasses } from "./ui/input";
import InputData from "./ui/InputData";
import { NativeSelect } from "./ui/select";
import { InlineAlert, LoadingState, Skeleton } from "./ui/feedback";
import { toast } from "./feedback/toast";
import { useConfirm } from "./feedback/ConfirmProvider";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/date";
import { useFocoAposFalha } from "@/lib/foco";
import {
  avisarFaturaFechadaNaoPaga,
  descreverStatusFatura,
  type StatusFatura as Status,
} from "@/lib/faturas-ui";
import { AjusteDatasFaturaSchema, PagamentoFaturaSchema } from "@/schemas/auth";
import { cn } from "@/lib/utils";

interface Fatura {
  id: string | null;
  ciclo: string;
  data_fechamento: string;
  data_vencimento: string;
  fechada: boolean;
  total: number;
  pago: number;
  restante: number;
  status: Status;
}

interface LancamentoFatura {
  id: string;
  descricao: string;
  valor: string;
  data: string;
  categoria_nome: string | null;
}

interface Pagamento {
  id: string;
  valor: string;
  data: string;
  carteira_nome: string;
  estornado_em: string | null;
}

interface Detalhe {
  fatura: Fatura;
  lancamentos: LancamentoFatura[];
  pagamentos: Pagamento[];
}

interface Carteira {
  id: string;
  nome: string;
}

const rotuloCiclo = (ciclo: string) => `${ciclo.slice(5, 7)}/${ciclo.slice(0, 4)}`;
const paraParametro = (ciclo: string) => ciclo.slice(0, 7);
const hojeSaoPaulo = () =>
  new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

function StatusBadge({ fatura }: { fatura: Pick<Fatura, "status" | "fechada" | "total"> }) {
  const { rotulo, variante } = descreverStatusFatura(fatura);
  return <Badge variant={variante}>{rotulo}</Badge>;
}

// Erros do schema por campo (primeira mensagem de cada um), como no ModalLancamento
function errosPorCampo(issues: { path: PropertyKey[]; message: string }[]) {
  const erros: Record<string, string> = {};
  issues.forEach((issue) => {
    const campo = String(issue.path[0]);
    if (!erros[campo]) erros[campo] = issue.message;
  });
  return erros;
}

async function erroDaResposta(res: Response, padrao: string) {
  const corpo = await res.json().catch(() => null);
  return corpo?.error || padrao;
}

export default function FaturasCartao({
  cartao,
  onClose,
}: {
  cartao: { id: string; nome: string };
  onClose: () => void;
}) {
  const base = `/api/cartoes/${cartao.id}/faturas`;
  const confirm = useConfirm();

  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [cicloAberto, setCicloAberto] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<Detalhe | null>(null);
  const [modo, setModo] = useState<"ver" | "pagar" | "datas">("ver");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  // erro de envio dos formulários (pagamento/datas) e erros por campo
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});
  const envioRef = useFocoAposFalha<HTMLButtonElement>(salvando, erroForm !== null);

  // formulário de pagamento
  const [valorPagamento, setValorPagamento] = useState<number | undefined>();
  const [dataPagamento, setDataPagamento] = useState(hojeSaoPaulo());
  const [carteiraId, setCarteiraId] = useState("");
  const [carteiras, setCarteiras] = useState<Carteira[]>([]);

  // formulário de datas
  const [fechamento, setFechamento] = useState("");
  const [vencimento, setVencimento] = useState("");

  const carregarFaturas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(base);
      if (!res.ok) {
        setErro(await erroDaResposta(res, "Falha ao carregar faturas."));
        return;
      }
      setFaturas(await res.json());
    } catch {
      setErro("Erro de conexão ao carregar faturas.");
    } finally {
      setLoading(false);
    }
  }, [base]);

  const carregarDetalhe = useCallback(
    async (ciclo: string) => {
      setLoading(true);
      try {
        const res = await fetch(`${base}/${paraParametro(ciclo)}`);
        if (!res.ok) {
          setErro(await erroDaResposta(res, "Falha ao carregar a fatura."));
          return;
        }
        setDetalhe(await res.json());
      } catch {
        setErro("Erro de conexão ao carregar a fatura.");
      } finally {
        setLoading(false);
      }
    },
    [base]
  );

  useEffect(() => {
    carregarFaturas();
  }, [carregarFaturas]);

  useEffect(() => {
    if (cicloAberto) carregarDetalhe(cicloAberto);
  }, [cicloAberto, carregarDetalhe]);

  function abrir(ciclo: string) {
    setErro(null);
    setModo("ver");
    setDetalhe(null);
    setCicloAberto(ciclo);
  }

  function voltar() {
    setErro(null);
    setModo("ver");
    setCicloAberto(null);
    setDetalhe(null);
    carregarFaturas();
  }

  async function executar(
    url: string,
    init: RequestInit,
    sucesso: string,
    falha: string,
    aoFalhar: (mensagem: string) => void = setErro
  ) {
    setSalvando(true);
    setErro(null);
    setErroForm(null);
    try {
      const res = await fetch(url, init);
      if (!res.ok) {
        aoFalhar(await erroDaResposta(res, falha));
        return false;
      }
      const corpo = await res.json().catch(() => null);
      toast.success(sucesso);
      if (corpo?.aviso) toast.warning(corpo.aviso);
      setModo("ver");
      if (cicloAberto) await carregarDetalhe(cicloAberto);
      return true;
    } catch {
      aoFalhar("Erro de conexão.");
      return false;
    } finally {
      setSalvando(false);
    }
  }

  const post = (corpo?: unknown): RequestInit => ({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });

  async function fechar(f: Fatura) {
    const ok = await confirm({
      title: "Fechar fatura",
      description: `Fechar a fatura ${rotuloCiclo(f.ciclo)} sem pagá-la? O pagamento ficará pendente.`,
      confirmLabel: "Fechar fatura",
    });
    if (!ok) return;
    await executar(
      `${base}/${paraParametro(f.ciclo)}/fechar`,
      post(),
      "Fatura fechada.",
      "Não foi possível fechar a fatura."
    );
  }

  async function estornar(f: Fatura, p: Pagamento) {
    const ok = await confirm({
      title: "Estornar pagamento",
      description: `Estornar o pagamento de ${formatCurrency(p.valor)}? O valor volta para a carteira ${p.carteira_nome} e o registro original é mantido.`,
      confirmLabel: "Estornar",
      destructive: true,
    });
    if (!ok) return;
    await executar(
      `${base}/${paraParametro(f.ciclo)}/pagamentos/${p.id}/estorno`,
      post(),
      "Pagamento estornado.",
      "Não foi possível estornar o pagamento."
    );
  }

  async function abrirPagamento(f: Fatura) {
    setErro(null);
    setErroForm(null);
    setErrosCampos({});
    setValorPagamento(f.restante);
    setDataPagamento(hojeSaoPaulo());
    setCarteiraId("");
    setModo("pagar");
    try {
      const res = await fetch("/api/carteiras");
      if (res.ok) setCarteiras(await res.json());
    } catch {
      setErro("Erro ao carregar carteiras.");
    }
  }

  function abrirDatas(f: Fatura) {
    setErro(null);
    setErroForm(null);
    setErrosCampos({});
    setFechamento(f.data_fechamento);
    setVencimento(f.data_vencimento);
    setModo("datas");
  }

  async function enviarPagamento(e: FormEvent, f: Fatura) {
    e.preventDefault();
    setErrosCampos({});
    setErroForm(null);
    const validation = PagamentoFaturaSchema.safeParse({
      valor: valorPagamento,
      data: dataPagamento,
      carteira_id: carteiraId,
    });
    if (!validation.success) {
      setErrosCampos(errosPorCampo(validation.error.issues));
      return;
    }
    await executar(
      `${base}/${paraParametro(f.ciclo)}/pagamentos`,
      post(validation.data),
      "Pagamento registrado.",
      "Não foi possível registrar o pagamento.",
      setErroForm
    );
  }

  async function enviarDatas(e: FormEvent, f: Fatura) {
    e.preventDefault();
    setErrosCampos({});
    setErroForm(null);
    const validation = AjusteDatasFaturaSchema.safeParse({
      data_fechamento: fechamento,
      data_vencimento: vencimento,
    });
    if (!validation.success) {
      setErrosCampos(errosPorCampo(validation.error.issues));
      return;
    }
    await executar(
      `${base}/${paraParametro(f.ciclo)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      },
      "Datas da fatura atualizadas.",
      "Não foi possível ajustar as datas.",
      setErroForm
    );
  }

  const f = detalhe?.fatura;

  return (
    <Dialog
      open
      onClose={onClose}
      dismissible={!salvando}
      className="max-w-2xl"
      title={f ? `${cartao.nome} · Fatura ${rotuloCiclo(f.ciclo)}` : `Faturas · ${cartao.nome}`}
    >
      <div className="flex flex-col gap-4">
        {erro && <InlineAlert tone="error">{erro}</InlineAlert>}

        {!cicloAberto ? (
          loading ? (
            <LoadingState label="Carregando faturas...">
              <div className="space-y-3">
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            </LoadingState>
          ) : (
            <ul className="divide-y rounded-xl border">
              {faturas.map((fat) => (
                <li key={fat.ciclo}>
                  <button
                    type="button"
                    onClick={() => abrir(fat.ciclo)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{rotuloCiclo(fat.ciclo)}</span>
                      <span className="block text-xs text-muted-foreground">
                        Fecha em {formatDate(fat.data_fechamento)} · vence em{" "}
                        {formatDate(fat.data_vencimento)}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block font-semibold tabular-nums">
                        {formatCurrency(fat.total)}
                      </span>
                      <StatusBadge fatura={fat} />
                    </span>
                    <ChevronRight aria-hidden className="size-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : loading || !detalhe || !f ? (
          <LoadingState label="Carregando fatura...">
            <div className="space-y-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-32" />
            </div>
          </LoadingState>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="ghost" onClick={voltar} disabled={salvando}>
                <ArrowLeft aria-hidden />
                Faturas
              </Button>
              <StatusBadge fatura={f} />
            </div>

            <dl className="grid grid-cols-2 gap-3 rounded-xl border p-4 text-sm sm:grid-cols-3">
              <Info rotulo="Fechamento" valor={formatDate(f.data_fechamento)} />
              <Info rotulo="Vencimento" valor={formatDate(f.data_vencimento)} />
              <Info rotulo="Total" valor={formatCurrency(f.total)} />
              <Info rotulo="Pago" valor={formatCurrency(f.pago)} />
              <Info rotulo="Pendente" valor={formatCurrency(f.restante)} />
            </dl>

            {f.status === "paga" && f.total > 0 && (
              <InlineAlert tone="success">
                Fatura paga: lançamentos e datas só podem ser alterados após estornar o pagamento.
              </InlineAlert>
            )}
            {avisarFaturaFechadaNaoPaga(f) && (
              <InlineAlert tone="warning">
                Fatura fechada e não paga: alterações nos lançamentos recalculam o valor pendente.
              </InlineAlert>
            )}

            {modo === "ver" && (
              <div className="flex flex-wrap gap-2">
                {!f.fechada && f.total > 0 && (
                  <Button type="button" variant="outline" onClick={() => fechar(f)} disabled={salvando}>
                    Fechar fatura
                  </Button>
                )}
                {f.fechada && f.restante > 0 && (
                  <Button type="button" onClick={() => abrirPagamento(f)} disabled={salvando}>
                    Pagar fatura
                  </Button>
                )}
                {(f.status !== "paga" || f.total === 0) && (
                  <Button type="button" variant="outline" onClick={() => abrirDatas(f)} disabled={salvando}>
                    Ajustar datas
                  </Button>
                )}
              </div>
            )}

            {modo === "pagar" && (
              <form onSubmit={(e) => enviarPagamento(e, f)} className="flex flex-col gap-4 rounded-xl border p-4">
                {erroForm && <InlineAlert tone="error">{erroForm}</InlineAlert>}
                <Field
                  id="pagamento-valor"
                  label="Valor (R$)"
                  error={errosCampos.valor}
                  hint="Pode ser parcial, até o valor pendente."
                >
                  <NumericFormat
                    value={valorPagamento ?? ""}
                    onValueChange={(v) => setValorPagamento(v.floatValue)}
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="R$ "
                    decimalScale={2}
                    fixedDecimalScale
                    allowNegative={false}
                    inputMode="decimal"
                    className={cn(fieldClasses, "h-11 px-3.5 tabular-nums")}
                  />
                </Field>
                <Field id="pagamento-data" label="Data efetiva do pagamento" error={errosCampos.data}>
                  <InputData value={dataPagamento} onChange={setDataPagamento} />
                </Field>
                <Field id="pagamento-carteira" label="Carteira" error={errosCampos.carteira_id}>
                  <NativeSelect value={carteiraId} onChange={(e) => setCarteiraId(e.target.value)}>
                    <option value="" disabled>
                      Selecione uma carteira
                    </option>
                    {carteiras.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <DialogFooter className="mt-0">
                  <Button type="button" variant="outline" onClick={() => setModo("ver")} disabled={salvando}>
                    Cancelar
                  </Button>
                  <Button ref={envioRef} type="submit" disabled={salvando}>
                    {salvando ? "Salvando..." : "Registrar pagamento"}
                  </Button>
                </DialogFooter>
              </form>
            )}

            {modo === "datas" && (
              <form onSubmit={(e) => enviarDatas(e, f)} className="flex flex-col gap-4 rounded-xl border p-4">
                {erroForm && <InlineAlert tone="error">{erroForm}</InlineAlert>}
                <Field id="fatura-fechamento" label="Data de fechamento" error={errosCampos.data_fechamento}>
                  <InputData value={fechamento} onChange={setFechamento} />
                </Field>
                <Field id="fatura-vencimento" label="Data de vencimento" error={errosCampos.data_vencimento}>
                  <InputData value={vencimento} onChange={setVencimento} />
                </Field>
                <DialogFooter className="mt-0">
                  <Button type="button" variant="outline" onClick={() => setModo("ver")} disabled={salvando}>
                    Cancelar
                  </Button>
                  <Button ref={envioRef} type="submit" disabled={salvando}>
                    {salvando ? "Salvando..." : "Salvar datas"}
                  </Button>
                </DialogFooter>
              </form>
            )}

            <section aria-label="Lançamentos da fatura">
              <h3 className="mb-2 text-sm font-semibold">Compras</h3>
              {detalhe.lancamentos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma compra nesta fatura.</p>
              ) : (
                <ul className="divide-y rounded-xl border text-sm">
                  {detalhe.lancamentos.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{l.descricao}</span>
                        <span className="block text-xs text-muted-foreground">
                          {formatDate(l.data)} · {l.categoria_nome || "N/A"}
                        </span>
                      </span>
                      <span className="whitespace-nowrap font-semibold tabular-nums text-destructive">
                        {formatCurrency(l.valor)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-label="Pagamentos da fatura">
              <h3 className="mb-2 text-sm font-semibold">Pagamentos</h3>
              {detalhe.pagamentos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p>
              ) : (
                <ul className="divide-y rounded-xl border text-sm">
                  {detalhe.pagamentos.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <span className="min-w-0">
                        <span
                          className={cn(
                            "block font-medium tabular-nums",
                            p.estornado_em && "text-muted-foreground line-through"
                          )}
                        >
                          {formatCurrency(p.valor)}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {formatDate(p.data)} · {p.carteira_nome}
                          {p.estornado_em && " · estornado"}
                        </span>
                      </span>
                      {!p.estornado_em && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => estornar(f, p)}
                          disabled={salvando}
                        >
                          Estornar
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </Dialog>
  );
}

function Info({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{rotulo}</dt>
      <dd className="font-semibold tabular-nums">{valor}</dd>
    </div>
  );
}
