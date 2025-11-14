"use client";

import { useEffect, useState } from "react";
import ModalUser from "./ModalUser";
import { Edit, Plus, Trash2 } from "lucide-react";

interface Usuario {
  id: number;
  nome: string;
  email: string;
  empresa_id: number | null;
  tipo_usuario: string;
  criado_em: string;
}

interface Empresa {
  id: number;
  nome: string;
}

export default function ListUsers() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<number | null>(
    null
  );

  async function carregarEmpresas() {
    try {
      const res = await fetch("/api/auth/empresas");

      if (!res.ok) {
        console.error("Erro ao carregar empresas:", res.status);
        alert("Falha ao carregar lista de empresas.");
        setEmpresas([]);
        return;
      }

      const data = await res.json();

      if (Array.isArray(data)) setEmpresas(data);
      else {
        console.error("Formato inesperado:", data);
        setEmpresas([]);
      }
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
      alert("Erro ao carregar empresas.");
      setEmpresas([]);
    }
  }

  async function carregarUsuarios() {
    try {
      setLoading(true);

      const res = await fetch("/api/auth/usuarios");

      if (!res.ok) {
        console.error("Erro ao carregar usuários:", res.status);
        alert("Falha ao carregar usuários.");
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
      alert("Erro ao carregar lista de usuários.");
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

  async function deletarUsuario(id: number) {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
      const res = await fetch(`/api/auth/usuarios/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        console.error("Falha ao deletar usuário:", res.status);
        alert("Não foi possível remover o usuário.");
      } else {
        alert("Usuário removido com sucesso!");
      }

      carregarUsuarios();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Erro de conexão ao excluir o usuário.");
    }
  }

  useEffect(() => {
    carregarUsuarios();
    carregarEmpresas();
  }, []);

  if (loading)
    return (
      <p className="flex justify-center text-center py-8 text-[#E0E0E0]">
        Carregando usuários...
      </p>
    );

  return (
    <>
      <div className="bg-[#0D1117] p-6 rounded-2xl shadow-md">
        <button
          onClick={() => {
            setModalMode("create");
            setUsuarioSelecionado(null);
            setIsModalOpen(true);
          }}
          className="h-10 flex items-center bg-[#2196F3] hover:bg-[#2196F3]/75 text-[#0D1117] font-bold py-2 px-4 rounded-xl transition duration-200 shadow-md"
        >
          <Plus size={16} />
          Adicionar
        </button>

        {/* Tabela */}
        <table className="w-full text-center border-collapse mt-6">
          <thead>
            <tr className="border-b border-gray-700 text-[#E0E0E0]">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">E-mail</th>
              <th className="px-3 py-2">Empresa</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => {
              const empresa = empresas.find((e) => e.id === u.empresa_id);

              return (
                <tr
                  key={u.id}
                  className="border-b border-gray-800 text-[#9E9E9E] hover:bg-[#161B22] transition"
                >
                  <td className="px-3 py-2">{u.id}</td>
                  <td className="px-3 py-2">{u.nome}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">
                    {empresa ? empresa.nome : "N/A"}
                  </td>
                  <td className="px-3 py-2 capitalize">{u.tipo_usuario}</td>

                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => editarUsuario(u.id)}
                      className="bg-[#2196F3] hover:bg-[#2196F3]/75 text-[#0D1117] p-2 rounded-xl mr-2 transition"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>

                    <button
                      onClick={() => deletarUsuario(u.id)}
                      className="bg-[#FF5252] hover:bg-[#FF5252]/75 text-[#0D1117] p-2 rounded-xl transition"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {usuarios.length === 0 && (
          <p className="text-center text-gray-400 mt-6">
            Nenhum usuário encontrado.
          </p>
        )}
      </div>

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
