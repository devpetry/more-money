"use client";

import BarraPesquisa from "./lancamentos/BarraPesquisa";
import Filtros from "./lancamentos/Filtros";
import { useEffect, useState } from "react";
import ModalLancamento from "./ModalLancamento";
import { Plus, ReceiptText } from "lucide-react";
import PaginacaoMes from "./lancamentos/PaginacaoMensal";
import { parseDateOnly, getMonth, getYear } from "@/lib/date";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import PageHeader from "./layout/PageHeader";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { TipoBadge } from "./ui/badge";
import { DataTable, RowActions } from "./ui/data-table";
import { EmptyState, LoadingState, Skeleton } from "./ui/feedback";
import { toast } from "./feedback/toast";
import { useConfirm } from "./feedback/ConfirmProvider";

interface Lancamento {
  id: number;
  descricao: string;
  valor: number;
  tipo: string;
  data: string;
  categoria_nome?: string;
  criado_em: string;
}

function ValorLancamento({ lancamento }: { lancamento: Lancamento }) {
  const despesa = lancamento.tipo === "despesa";
  return (
    <span
      className={cn(
        "whitespace-nowrap font-semibold tabular-nums",
        despesa ? "text-destructive" : "text-success"
      )}
    >
      {despesa ? "- " : "+ "}
      {formatCurrency(lancamento.valor)}
    </span>
  );
}

export default function ListLancamentos() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [lancamentoSelecionado, setLancamentoSelecionado] = useState<
    number | null
  >(null);

  const [termo, setTermo] = useState("");
  const [tipo, setTipo] = useState<string>();
  const [categoria, setCategoria] = useState<string>();

  const [mesAtual, setMesAtual] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  });

  const confirm = useConfirm();

  const lancamentosFiltrados = lancamentos.filter((l) => {
    const [ano, mes] = mesAtual.split("-");

    const lDate = parseDateOnly(l.data);
    if (!lDate) return false;

    const mesmoMes =
      getMonth(lDate) === Number(mes) && getYear(lDate) === Number(ano);

    const busca = termo
      ? l.descricao.toLowerCase().includes(termo.toLowerCase())
      : true;

    const filtraTipo = tipo ? l.tipo === tipo : true;
    const filtraCategoria = categoria ? l.categoria_nome === categoria : true;

    return mesmoMes && busca && filtraTipo && filtraCategoria;
  });

  async function carregarLancamentos() {
    setLoading(true);

    try {
      const res = await fetch("/api/auth/lancamentos");

      if (!res.ok) {
        console.error("Erro na requisição:", res.status, await res.text());
        toast.error("Falha ao carregar lista de lançamentos.");
        setLancamentos([]);
        return;
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        const lancs = data.map((l) => ({
          ...l,
          valor: Number(l.valor),
        }));
        setLancamentos(lancs);
      } else {
        console.error("Formato inesperado de resposta:", data);
        setLancamentos([]);
      }
    } catch (e) {
      console.error("Erro ao carregar lançamentos:", e);
      toast.error("Falha ao carregar lista de lançamentos.");
      setLancamentos([]);
    } finally {
      setLoading(false);
    }
  }

  function editarLancamento(id: number) {
    setLancamentoSelecionado(id);
    setModalMode("edit");
    setIsModalOpen(true);
  }

  async function deletarLancamento(id: number) {
    const confirmado = await confirm({
      title: "Excluir lançamento",
      description: "Tem certeza que deseja excluir este lançamento?",
      confirmLabel: "Excluir",
      destructive: true,
    });
    if (!confirmado) return;

    try {
      const res = await fetch(`/api/auth/lancamentos/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        console.error("Falha ao deletar lançamento. Status:", res.status);
        toast.error("Não foi possível remover o lançamento.");
      } else {
        toast.success("Lançamento removido com sucesso!");
      }

      carregarLancamentos();
    } catch (error) {
      console.error("Erro na requisição DELETE:", error);
      toast.error("Erro de conexão ao tentar excluir o lançamento.");
    }
  }

  function novoLancamento() {
    setModalMode("create");
    setLancamentoSelecionado(null);
    setIsModalOpen(true);
  }

  useEffect(() => {
    carregarLancamentos();
  }, []);

  const filtrando = Boolean(termo || tipo || categoria);

  return (
    <>
      <PageHeader
        title="Lançamentos"
        description="Receitas e despesas do mês selecionado."
        actions={
          <Button onClick={novoLancamento}>
            <Plus aria-hidden />
            Adicionar
          </Button>
        }
      />

      <Card>
        {/* Mobile: busca + filtro, paginação abaixo; lg: tudo em uma linha */}
        <div className="flex flex-wrap items-center gap-3 border-b p-4 sm:p-5">
          <div className="min-w-0 flex-1 basis-40">
            <BarraPesquisa termo={termo} setTermo={setTermo} />
          </div>

          <div className="order-last flex w-full justify-center lg:order-none lg:w-auto">
            <PaginacaoMes mesAtual={mesAtual} onChange={setMesAtual} />
          </div>

          <Filtros
              tipo={tipo}
              categoria={categoria}
              setTipo={setTipo}
              setCategoria={setCategoria}
              aplicarFiltros={() => {}}
              limparFiltros={() => {
                setTipo(undefined);
                setCategoria(undefined);
              }}
            />
        </div>

        <CardContent>
          {loading ? (
            <LoadingState label="Carregando lançamentos...">
              <div className="space-y-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            </LoadingState>
          ) : (
            <DataTable
              data={lancamentosFiltrados}
              caption="Lançamentos do mês selecionado"
              rowKey={(l) => l.id}
              columns={[
                {
                  key: "descricao",
                  header: "Descrição",
                  cell: (l) => <span className="font-medium">{l.descricao}</span>,
                  hideOnCard: true,
                },
                {
                  key: "valor",
                  header: "Valor",
                  cell: (l) => <ValorLancamento lancamento={l} />,
                  align: "right",
                  hideOnCard: true,
                },
                {
                  key: "tipo",
                  header: "Tipo",
                  cell: (l) => <TipoBadge tipo={l.tipo} />,
                },
                {
                  key: "data",
                  header: "Data de Pagamento",
                  cell: (l) => (
                    <span className="whitespace-nowrap tabular-nums">
                      {l.data.slice(0, 10).split("-").reverse().join("/")}
                    </span>
                  ),
                },
                {
                  key: "categoria",
                  header: "Categoria",
                  cell: (l) => l.categoria_nome || "N/A",
                },
              ]}
              cardTitle={(l) => l.descricao}
              cardAside={(l) => <ValorLancamento lancamento={l} />}
              actions={(l, layout) => (
                <RowActions
                  layout={layout}
                  itemLabel={l.descricao}
                  onEdit={() => editarLancamento(l.id)}
                  onDelete={() => deletarLancamento(l.id)}
                />
              )}
              empty={
                <EmptyState
                  icon={ReceiptText}
                  title="Nenhum lançamento encontrado."
                  description={
                    filtrando
                      ? "Ajuste a busca ou os filtros para ver outros lançamentos."
                      : "Não há lançamentos neste mês."
                  }
                />
              }
            />
          )}
        </CardContent>
      </Card>

      <ModalLancamento
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setLancamentoSelecionado(null);
        }}
        onSuccess={carregarLancamentos}
        mode={modalMode}
        lancamentoId={lancamentoSelecionado}
      />
    </>
  );
}
