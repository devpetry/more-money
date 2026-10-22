"use client";

import { useEffect, useState } from "react";
import ModalUser from "./ModalUser";
import { Plus, Users } from "lucide-react";
import PageHeader from "./layout/PageHeader";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { DataTable, RowActions } from "./ui/data-table";
import { EmptyState, LoadingState, Skeleton } from "./ui/feedback";
import { toast } from "./feedback/toast";
import { useConfirm } from "./feedback/ConfirmProvider";

interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo_usuario: string;
  criado_em: string;
}

export default function ListUsers() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<number | null>(
    null
  );

  const confirm = useConfirm();

  async function carregarUsuarios() {
    try {
      setLoading(true);

      const res = await fetch("/api/auth/usuarios");

      if (!res.ok) {
        console.error("Erro ao carregar usuários:", res.status);
        toast.error("Falha ao carregar usuários.");
        setUsuarios([]);
        return;
      }

      const data = await res.json();

      if (Array.isArray(data)) setUsuarios(data);
      else {
        console.error("Formato inesperado:", data);
        setUsuarios([]);
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast.error("Erro ao carregar lista de usuários.");
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }

  async function editarUsuario(id: number) {
    setUsuarioSelecionado(id);
    setModalMode("edit");
    setIsModalOpen(true);
  }

  async function deletarUsuario(usuario: Usuario) {
    const confirmado = await confirm({
      title: "Excluir usuário",
      description: "Tem certeza que deseja excluir este usuário?",
      confirmLabel: "Excluir",
      destructive: true,
    });
    if (!confirmado) return;

    try {
      const res = await fetch(`/api/auth/usuarios/${usuario.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        console.error("Falha ao deletar usuário:", res.status);
        toast.error("Não foi possível remover o usuário.");
      } else {
        toast.success("Usuário removido com sucesso!");
      }

      carregarUsuarios();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro de conexão ao excluir o usuário.");
    }
  }

  function novoUsuario() {
    setModalMode("create");
    setUsuarioSelecionado(null);
    setIsModalOpen(true);
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Gerencie quem tem acesso à plataforma."
        actions={
          <Button onClick={novoUsuario}>
            <Plus aria-hidden />
            Adicionar
          </Button>
        }
      />

      <Card>
        <CardContent>
          {loading ? (
            <LoadingState label="Carregando usuários...">
              <div className="space-y-3">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            </LoadingState>
          ) : (
            <DataTable
              data={usuarios}
              caption="Usuários cadastrados"
              rowKey={(u) => u.id}
              columns={[
                {
                  key: "id",
                  header: "ID",
                  cell: (u) => (
                    <span className="tabular-nums text-muted-foreground">{u.id}</span>
                  ),
                  className: "w-16",
                },
                {
                  key: "nome",
                  header: "Nome",
                  cell: (u) => <span className="font-medium">{u.nome}</span>,
                  hideOnCard: true,
                },
                {
                  key: "email",
                  header: "E-mail",
                  cell: (u) => u.email,
                },
                {
                  key: "tipo",
                  header: "Tipo",
                  cell: (u) => (
                    <Badge variant={u.tipo_usuario === "ADMIN" ? "primary" : "neutral"}>
                      {u.tipo_usuario?.toLowerCase()}
                    </Badge>
                  ),
                  hideOnCard: true,
                },
              ]}
              cardTitle={(u) => u.nome}
              cardAside={(u) => (
                <Badge variant={u.tipo_usuario === "ADMIN" ? "primary" : "neutral"}>
                  {u.tipo_usuario?.toLowerCase()}
                </Badge>
              )}
              actions={(u, layout) => (
                <RowActions
                  layout={layout}
                  itemLabel={u.nome}
                  onEdit={() => editarUsuario(u.id)}
                  onDelete={() => deletarUsuario(u)}
                />
              )}
              empty={<EmptyState icon={Users} title="Nenhum usuário encontrado." />}
            />
          )}
        </CardContent>
      </Card>

      <ModalUser
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setUsuarioSelecionado(null);
        }}
        onSuccess={carregarUsuarios}
        mode={modalMode}
        userId={usuarioSelecionado}
      />
    </>
  );
}
