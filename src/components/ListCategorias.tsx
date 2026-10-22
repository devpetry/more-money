"use client";

import { useEffect, useState } from "react";
import ModalCategoria from "./ModalCategoria";
import { Plus, Tag } from "lucide-react";
import PageHeader from "./layout/PageHeader";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { TipoBadge } from "./ui/badge";
import { DataTable, RowActions } from "./ui/data-table";
import { EmptyState, LoadingState, Skeleton } from "./ui/feedback";
import { toast } from "./feedback/toast";
import { useConfirm } from "./feedback/ConfirmProvider";

interface Categoria {
  id: number;
  nome: string;
  tipo: string;
  criado_em: string;
}

export default function ListCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<
    number | null
  >(null);

  const confirm = useConfirm();

  async function carregarCategorias() {
    setLoading(true);

    try {
      const res = await fetch("/api/auth/categorias");

      if (!res.ok) {
        console.error("Erro na requisição:", res.status, await res.text());
        toast.error("Falha ao carregar lista de categorias.");
        setCategorias([]);
        return;
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setCategorias(data);
      } else {
        console.error("Formato inesperado de resposta:", data);
        setCategorias([]);
      }
    } catch (e) {
      console.error("Erro ao carregar categorias:", e);
      toast.error("Falha ao carregar lista de categorias.");
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  }

  async function editarCategoria(id: number) {
    setCategoriaSelecionada(id);
    setModalMode("edit");
    setIsModalOpen(true);
  }

  async function deletarCategoria(categoria: Categoria) {
    const confirmado = await confirm({
      title: "Excluir categoria",
      description: "Tem certeza que deseja excluir esta categoria?",
      confirmLabel: "Excluir",
      destructive: true,
    });
    if (!confirmado) return;

    try {
      const res = await fetch(`/api/auth/categorias/${categoria.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        console.error("Falha ao deletar categoria. Status:", res.status);
        toast.error("Não foi possível remover a categoria.");
      } else {
        toast.success("Categoria removida com sucesso!");
      }

      carregarCategorias();
    } catch (error) {
      console.error("Erro na requisição DELETE:", error);
      toast.error("Erro de conexão ao tentar excluir a categoria.");
    }
  }

  function novaCategoria() {
    setModalMode("create");
    setCategoriaSelecionada(null);
    setIsModalOpen(true);
  }

  useEffect(() => {
    carregarCategorias();
  }, []);

  return (
    <>
      <PageHeader
        title="Categorias"
        description="Organize receitas e despesas por categoria."
        actions={
          <Button onClick={novaCategoria}>
            <Plus aria-hidden />
            Adicionar
          </Button>
        }
      />

      <Card>
        <CardContent>
          {loading ? (
            <LoadingState label="Carregando categorias...">
              <div className="space-y-3">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            </LoadingState>
          ) : (
            <DataTable
              data={categorias}
              caption="Categorias cadastradas"
              rowKey={(c) => c.id}
              columns={[
                {
                  key: "nome",
                  header: "Nome",
                  cell: (c) => <span className="font-medium">{c.nome}</span>,
                  hideOnCard: true,
                },
                {
                  key: "tipo",
                  header: "Tipo",
                  cell: (c) => <TipoBadge tipo={c.tipo} />,
                  hideOnCard: true,
                },
              ]}
              cardTitle={(c) => c.nome}
              cardAside={(c) => <TipoBadge tipo={c.tipo} />}
              actions={(c, layout) => (
                <RowActions
                  layout={layout}
                  itemLabel={c.nome}
                  onEdit={() => editarCategoria(c.id)}
                  onDelete={() => deletarCategoria(c)}
                />
              )}
              empty={
                <EmptyState
                  icon={Tag}
                  title="Nenhuma categoria encontrada."
                  description="Crie categorias para classificar seus lançamentos."
                />
              }
            />
          )}
        </CardContent>
      </Card>

      <ModalCategoria
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCategoriaSelecionada(null);
        }}
        onSuccess={carregarCategorias}
        mode={modalMode}
        categoriaId={categoriaSelecionada}
      />
    </>
  );
}
