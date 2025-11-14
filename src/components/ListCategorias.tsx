"use client";

import { useEffect, useState } from "react";
import ModalCategoria from "./ModalCategoria";
import { Edit, Plus, Trash2 } from "lucide-react";

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

  async function carregarCategorias() {
    setLoading(true);

    try {
      const res = await fetch("/api/auth/categorias");

      if (!res.ok) {
        console.error("Erro na requisição:", res.status, await res.text());
        alert("Falha ao carregar lista de categorias.");
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
      alert("Falha ao carregar lista de categorias.");
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

  async function deletarCategoria(id: number) {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;

    try {
      const res = await fetch(`/api/auth/categorias/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        console.error("Falha ao deletar categoria. Status:", res.status);
        alert("Não foi possível remover a categoria.");
      } else {
        alert("Categoria removida com sucesso!");
      }

      carregarCategorias();
    } catch (error) {
      console.error("Erro na requisição DELETE:", error);
      alert("Erro de conexão ao tentar excluir a categoria.");
    }
  }

  useEffect(() => {
    carregarCategorias();
  }, []);

  if (loading)
    return (
      <p className="flex justify-center text-center py-8 text-[#E0E0E0]">
        Carregando categorias...
      </p>
    );

  return (
    <>
      <div className="bg-[#0D1117] p-6 rounded-2xl shadow-md">
        <button
          onClick={() => {
            setModalMode("create");
            setCategoriaSelecionada(null);
            setIsModalOpen(true);
          }}
          className="flex items-center bg-[#2196F3] hover:bg-[#2196F3]/75 text-[#0D1117] font-bold py-2 px-4 rounded-xl transition duration-200 shadow-md"
        >
          <Plus size={16} />
          Adicionar
        </button>

        {/* Tabela de categorias */}
        <table className="w-full text-center border-collapse mt-6">
          <thead>
            <tr className="border-b border-gray-700 text-[#E0E0E0]">
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((c) => (
              <tr
                key={c.id}
                className="border-b border-gray-800 text-[#9E9E9E] hover:bg-[#161B22] transition"
              >
                <td className="px-3 py-2">{c.nome}</td>
                <td className="px-3 py-2 capitalize">{c.tipo}</td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => editarCategoria(c.id)}
                    className="bg-[#2196F3] hover:bg-[#2196F3]/75 text-[#0D1117] p-2 rounded-xl mr-2 transition"
                    title="Editar"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => deletarCategoria(c.id)}
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

        {categorias.length === 0 && (
          <p className="text-center text-gray-400 mt-6">
            Nenhuma categoria encontrada.
          </p>
        )}
      </div>

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
