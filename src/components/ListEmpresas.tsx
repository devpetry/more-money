"use client";

import { useEffect, useState } from "react";
import ModalEmpresa from "./ModalEmpresa";
import { Edit, Plus, Trash2 } from "lucide-react";

interface Empresa {
  id: number;
  nome: string;
  cnpj: string;
  criado_em: string;
}

const formatarCnpj = (cnpj: string): string => {
  const numeros = cnpj.replace(/\D/g, "");

  if (numeros.length !== 14) {
    return cnpj;
  }

  return numeros.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
};

export default function ListEmpresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [empresaSelecionada, setEmpresaSelecionada] = useState<number | null>(
    null
  );

  async function carregarEmpresas() {
    setLoading(true);

    try {
      const res = await fetch("/api/auth/empresas");

      if (!res.ok) {
        console.error("Erro na requisição:", res.status, await res.text());
        alert("Falha ao carregar lista de empresas.");
        setEmpresas([]);
        return;
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setEmpresas(data);
      } else {
        console.error("Formato inesperado de resposta:", data);
        setEmpresas([]);
      }
    } catch (e) {
      console.error("Erro ao carregar empresas:", e);
      alert("Falha ao carregar lista de empresas.");
      setEmpresas([]);
    } finally {
      setLoading(false);
    }
  }

  async function editarEmpresa(id: number) {
    setEmpresaSelecionada(id);
    setModalMode("edit");
    setIsModalOpen(true);
  }

  async function deletarEmpresa(id: number) {
    if (!confirm("Tem certeza que deseja excluir esta empresa?")) return;

    try {
      const res = await fetch(`/api/auth/empresas/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        console.error("Falha ao deletar empresa. Status:", res.status);
        alert("Não foi possível remover a empresa.");
      } else {
        alert("Empresa removida com sucesso!");
      }

      carregarEmpresas();
    } catch (error) {
      console.error("Erro na requisição DELETE:", error);
      alert("Erro de conexão ao tentar excluir a empresa.");
    }
  }

  useEffect(() => {
    carregarEmpresas();
  }, []);

  if (loading)
    return (
      <p className="flex justify-center text-center py-8 text-[#E0E0E0]">
        Carregando empresas...
      </p>
    );

  return (
    <>
      <div className="bg-[#0D1117] p-6 rounded-2xl shadow-md">
        <button
          onClick={() => {
            setModalMode("create");
            setEmpresaSelecionada(null);
            setIsModalOpen(true);
          }}
          className="flex items-center bg-[#2196F3] hover:bg-[#2196F3]/75 text-[#0D1117] font-bold py-2 px-4 rounded-xl transition duration-200 shadow-md"
        >
          <Plus size={16} />
          Adicionar
        </button>

        {/* Tabela de empresas */}
        <table className="w-full text-center border-collapse mt-6">
          <thead>
            <tr className="border-b border-gray-700 text-[#E0E0E0]">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">CNPJ</th>
              <th className="px-3 py-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {empresas.map((e) => (
              <tr
                key={e.id}
                className="border-b border-gray-800 text-[#9E9E9E] hover:bg-[#161B22] transition"
              >
                <td className="px-3 py-2">{e.id}</td>
                <td className="px-3 py-2">{e.nome}</td>
                <td className="px-3 py-2">{formatarCnpj(e.cnpj)}</td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => editarEmpresa(e.id)}
                    className="bg-[#2196F3] hover:bg-[#2196F3]/75 text-[#0D1117] p-2 rounded-xl mr-2 transition"
                    title="Editar"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => deletarEmpresa(e.id)}
                    className="bg-[#FF5252] hover:bg-[#FF5252]/75 text-[#0D1117] p-2 rounded-xl transition"
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {empresas.length === 0 && (
          <p className="text-center text-gray-400 mt-6">
            Nenhuma empresa encontrada.
          </p>
        )}
      </div>

      <ModalEmpresa
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEmpresaSelecionada(null);
        }}
        onSuccess={carregarEmpresas}
        mode={modalMode}
        empresaId={empresaSelecionada}
      />
    </>
  );
}
