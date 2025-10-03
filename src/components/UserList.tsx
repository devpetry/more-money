"use client";

import { useEffect, useState } from "react";
import AddUserModal from "./AddUserModal";

interface Usuario {
  id: number;
  nome: string;
  email: string;
  criadoEm: string;
}

export default function UserList() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function carregarUsuarios() {
    setLoading(true);
    const res = await fetch("/api/auth/usuarios");
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      setUsuarios(data);
    } catch (e) {
      console.error("Erro ao parsear JSON:", e);
    }
    setLoading(false);
  }

  async function deletarUsuario(id: number) {
    await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
    carregarUsuarios();
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  if (loading)
    return (
      <p className="flex justify-center text-center">Carregando usuários...</p>
    );

  return (
    <>
      <div className="bg-[#0D1117] p-6 rounded-2xl shadow-md">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#2196F3] hover:bg-[#2196F3]/75 text-[#0D1117] font-bold py-2 px-4 rounded-xl transition duration-200 shadow-md"
        >
          Adicionar
        </button>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-700 text-[#E0E0E0]">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">E-mail</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr
                key={u.id}
                className="border-b border-gray-800 text-[#9E9E9E]"
              >
                <td className="px-3 py-2">{u.id}</td>
                <td className="px-3 py-2">{u.nome}</td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => deletarUsuario(u.id)}
                    className="bg-[#FF5252] hover:bg-[#FF5252]/75 text-[#0D1117] px-3 py-1 rounded-xl text-sm"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUserAdded={carregarUsuarios}
      />
    </>
  );
}
