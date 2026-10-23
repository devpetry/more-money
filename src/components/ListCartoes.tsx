"use client";

import { useEffect, useState } from "react";
import { CreditCard, FileText, Plus } from "lucide-react";
import ModalCartao from "./ModalCartao";
import FaturasCartao from "./FaturasCartao";
import PageHeader from "./layout/PageHeader";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { DataTable, RowActions } from "./ui/data-table";
import { EmptyState, LoadingState, Skeleton } from "./ui/feedback";
import { toast } from "./feedback/toast";
import { useConfirm } from "./feedback/ConfirmProvider";

interface Cartao {
  id: string;
  nome: string;
  dia_fechamento: number;
  dia_vencimento: number;
}

export default function ListCartoes() {
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [cartaoSelecionado, setCartaoSelecionado] = useState<string | null>(null);
  const [cartaoFaturas, setCartaoFaturas] = useState<Cartao | null>(null);

  const confirm = useConfirm();

  async function carregarCartoes() {
    setLoading(true);

    try {
      const res = await fetch("/api/cartoes");

      if (!res.ok) {
        console.error("Erro na requisição:", res.status, await res.text());
        toast.error("Falha ao carregar lista de cartões.");
        setCartoes([]);
        return;
      }

      const data = await res.json();
      setCartoes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Erro ao carregar cartões:", e);
      toast.error("Falha ao carregar lista de cartões.");
      setCartoes([]);
    } finally {
      setLoading(false);
    }
  }

  function editarCartao(id: string) {
    setCartaoSelecionado(id);
    setModalMode("edit");
    setIsModalOpen(true);
  }

  function novoCartao() {
    setModalMode("create");
    setCartaoSelecionado(null);
    setIsModalOpen(true);
  }

  async function deletarCartao(cartao: Cartao) {
    const confirmado = await confirm({
      title: "Excluir cartão",
      description: "Tem certeza que deseja excluir este cartão?",
      confirmLabel: "Excluir",
      destructive: true,
    });
    if (!confirmado) return;

    try {
      const res = await fetch(`/api/cartoes/${cartao.id}`, { method: "DELETE" });

      if (!res.ok) {
        const corpo = await res.json().catch(() => null);
        toast.error(corpo?.error || "Não foi possível remover o cartão.");
      } else {
        toast.success("Cartão removido com sucesso!");
      }

      carregarCartoes();
    } catch (error) {
      console.error("Erro na requisição DELETE:", error);
      toast.error("Erro de conexão ao tentar excluir o cartão.");
    }
  }

  useEffect(() => {
    carregarCartoes();
  }, []);

  return (
    <>
      <PageHeader
        title="Cartões"
        description="Cartões de crédito e suas faturas."
        actions={
          <Button onClick={novoCartao}>
            <Plus aria-hidden />
            Adicionar
          </Button>
        }
      />

      <Card>
        <CardContent>
          {loading ? (
            <LoadingState label="Carregando cartões...">
              <div className="space-y-3">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            </LoadingState>
          ) : (
            <DataTable
              data={cartoes}
              caption="Cartões cadastrados"
              rowKey={(c) => c.id}
              columns={[
                {
                  key: "nome",
                  header: "Nome",
                  cell: (c) => <span className="font-medium">{c.nome}</span>,
                  hideOnCard: true,
                },
                {
                  key: "fechamento",
                  header: "Fechamento",
                  cell: (c) => `Dia ${c.dia_fechamento}`,
                },
                {
                  key: "vencimento",
                  header: "Vencimento",
                  cell: (c) => `Dia ${c.dia_vencimento}`,
                },
              ]}
              cardTitle={(c) => c.nome}
              actions={(c, layout) => {
                const acoes = (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className={layout === "card" ? "flex-1" : undefined}
                      onClick={() => setCartaoFaturas(c)}
                      aria-label={`Faturas de ${c.nome}`}
                    >
                      <FileText aria-hidden />
                      Faturas
                    </Button>
                    <RowActions
                      layout={layout}
                      itemLabel={c.nome}
                      onEdit={() => editarCartao(c.id)}
                      onDelete={() => deletarCartao(c)}
                    />
                  </>
                );
                return layout === "table" ? (
                  <div className="inline-flex items-center gap-1">{acoes}</div>
                ) : (
                  acoes
                );
              }}
              empty={
                <EmptyState
                  icon={CreditCard}
                  title="Nenhum cartão encontrado."
                  description="Cadastre um cartão para lançar compras e acompanhar as faturas."
                />
              }
            />
          )}
        </CardContent>
      </Card>

      <ModalCartao
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCartaoSelecionado(null);
        }}
        onSuccess={carregarCartoes}
        mode={modalMode}
        cartaoId={cartaoSelecionado}
      />

      {cartaoFaturas && (
        <FaturasCartao
          cartao={cartaoFaturas}
          onClose={() => setCartaoFaturas(null)}
        />
      )}
    </>
  );
}
