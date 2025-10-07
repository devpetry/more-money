"use client";

import { useEffect, useState } from "react";
import AddUserModal from "./AddUserModal";
import EditUserModal from "./EditUserModal";
import { Edit, Plus, Trash2 } from "lucide-react";

interface Usuario {
  id: number;
  nome: string;
  email: string;
  empresa_id: number | null;
  criado_em: string;
}
interface Empresa {
  id: number;
  nome: string;
}

export default function UserList() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<number | null>(
    null
  );

  async function carregarEmpresas() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/empresas");
      const text = await res.text();
      const data = JSON.parse(text);
      setEmpresas(data);
    } catch (e) {
      console.error("Erro ao carregar empresas:", e);
      alert("Falha ao carregar lista de empresas.");
    }
    setLoading(false);
  }

  async function carregarUsuarios() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/usuarios");
      const text = await res.text();
      const data = JSON.parse(text);
      setUsuarios(data);
    } catch (e) {
      console.error("Erro ao carregar usuários:", e);
      alert("Falha ao carregar lista de usuários.");
    }
    setLoading(false);
  }

  async function editarUsuario(id: number) {
    setUsuarioSelecionado(id);
    setIsEditModalOpen(true);
  }

  async function deletarUsuario(id: number) {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
      const res = await fetch(`/api/auth/usuarios/${id}`, { method: "DELETE" });

      if (!res.ok) {
        console.error("Falha ao deletar usuário. Status:", res.status);
        alert("Não foi possível remover o usuário.");
      } else {
        alert("Usuário removido com sucesso!");
      }

      carregarUsuarios();
    } catch (error) {
      console.error("Erro na requisição DELETE:", error);
      alert("Erro de conexão ao tentar excluir o usuário.");
    }
  }
  // Carregar usuários ao montar o componente
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
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center bg-[#2196F3] hover:bg-[#2196F3]/75 text-[#0D1117] font-bold py-2 px-4 rounded-xl transition duration-200 shadow-md"
        >
          <Plus size={16} />
          Adicionar
        </button>

        {/* Tabela de usuários */}
        <table className="w-full text-left border-collapse mt-6">
          <thead>
            <tr className="border-b border-gray-700 text-[#E0E0E0]">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">E-mail</th>
              <th className="px-3 py-2">Empresa</th>
              <th className="px-3 py-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => {
              const empresa = empresas.find((e) => e.id === u.empresa_id);
              const nomeDaEmpresa = empresa ? empresa.nome : "N/A";

              return (
                <tr
                  key={u.id}
                  className="border-b border-gray-800 text-[#9E9E9E] hover:bg-[#161B22] transition"
                >
                  <td className="px-3 py-2">{u.id}</td>
                  <td className="px-3 py-2">{u.nome}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{nomeDaEmpresa}</td>
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

        {/* Caso não haja usuários */}
        {usuarios.length === 0 && (
          <p className="text-center text-gray-400 mt-6">
            Nenhum usuário encontrado.
          </p>
        )}
      </div>

      {/* MODAL DE ADIÇÃO */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUserAdded={carregarUsuarios}
      />

      {/* MODAL DE EDIÇÃO */}
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setUsuarioSelecionado(null);
        }}
        onUserUpdated={carregarUsuarios}
        userId={usuarioSelecionado}
      />
    </>
  );
}
