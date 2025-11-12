"use client";

import BarraPesquisa from "./lancamentos/BarraPesquisa";
import Filtros from "./lancamentos/Filtros";
import { useEffect, useState } from "react";
import AddLancamentoModal from "./AddLancamentoModal";
import EditLancamentoModal from "./EditLancamentoModal";
import { Edit, Plus, Trash2 } from "lucide-react";

interface Lancamento {
  id: number;
  descricao: string;
  valor: number;
  tipo: string;
  data: string;
  categoria_nome?: string;
  criado_em: string;
}

export default function ListLancamentos() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [lancamentoSelecionado, setLancamentoSelecionado] = useState<
    number | null
  >(null);
  const [termo, setTermo] = useState("");
  const [tipo, setTipo] = useState<string>();
  const [categoria, setCategoria] = useState<string>();

  const lancamentosFiltrados = lancamentos.filter((l) => {
    const busca = termo
      ? l.descricao.toLowerCase().includes(termo.toLowerCase())
      : true;
    const filtraTipo = tipo ? l.tipo === tipo : true;
    const filtraCategoria = categoria ? l.categoria_nome === categoria : true;
    return busca && filtraTipo && filtraCategoria;
  });

  async function carregarLancamentos() {
    setLoading(true);

    try {
      const res = await fetch("/api/auth/lancamentos");

      if (!res.ok) {
        console.error("Erro na requisição:", res.status, await res.text());
        alert("Falha ao carregar lista de lançamentos.");
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
      alert("Falha ao carregar lista de lançamentos.");
      setLancamentos([]);
    } finally {
      setLoading(false);
    }
  }

  async function editarLancamento(id: number) {
    setLancamentoSelecionado(id);
    setIsEditModalOpen(true);
  }

  async function deletarLancamento(id: number) {
    if (!confirm("Tem certeza que deseja excluir este lançamento?")) return;

    try {
      const res = await fetch(`/api/auth/lancamentos/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        console.error("Falha ao deletar lançamento. Status:", res.status);
        alert("Não foi possível remover o lançamento.");
      } else {
        alert("Lançamento removido com sucesso!");
      }

      carregarLancamentos();
    } catch (error) {
      console.error("Erro na requisição DELETE:", error);
      alert("Erro de conexão ao tentar excluir o lançamento.");
    }
  }

  useEffect(() => {
    carregarLancamentos();
  }, []);

  if (loading)
    return (
      <p className="flex justify-center text-center py-8 text-[#E0E0E0]">
        Carregando lançamentos...
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

        <div className="flex flex-wrap gap-3 justify-between items-center mb-4 mt-4">
          <BarraPesquisa termo={termo} setTermo={setTermo} />

          <Filtros
            tipo={tipo}
            categoria={categoria}
            setTipo={setTipo}
            setCategoria={setCategoria}
            aplicarFiltros={() => console.log("Filtros aplicados")}
            limparFiltros={() => {
              setTipo(undefined);
              setCategoria(undefined);
            }}
          />
        </div>

        {/* Tabela de lançamentos */}
        <table className="w-full text-center border-collapse mt-6">
          <thead>
            <tr className="border-b border-gray-700 text-[#E0E0E0]">
              <th className="px-3 py-2">Descrição</th>
              <th className="px-3 py-2">Valor</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Data de Pagamento</th>
              <th className="px-3 py-2">Categoria</th>
              <th className="px-3 py-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {lancamentosFiltrados.map((l) => (
              <tr
                key={l.id}
                className="border-b border-gray-800 text-[#9E9E9E] hover:bg-[#161B22] transition"
              >
                <td className="px-3 py-2">{l.descricao}</td>
                <td className="px-3 py-2">
                  {l.tipo === "despesa" ? (
                    <span className="text-[#FF5252]">
                      - R$ {Number(l.valor ?? 0).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-[#00E676]">
                      + R$ {Number(l.valor ?? 0).toFixed(2)}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 capitalize">{l.tipo}</td>
                <td className="px-3 py-2">
                  {l.data.slice(0, 10).split("-").reverse().join("/")}
                </td>
                <td className="px-3 py-2">{l.categoria_nome || "N/A"}</td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => editarLancamento(l.id)}
                    className="bg-[#2196F3] hover:bg-[#2196F3]/75 text-[#0D1117] p-2 rounded-xl mr-2 transition"
                    title="Editar"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => deletarLancamento(l.id)}
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

        {lancamentos.length === 0 && (
          <p className="text-center text-gray-400 mt-6">
            Nenhum lançamento encontrado.
          </p>
        )}
      </div>

      {/* MODAL DE ADIÇÃO */}
      <AddLancamentoModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onLancamentoAdded={carregarLancamentos}
      />

      {/* MODAL DE EDIÇÃO */}
      <EditLancamentoModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setLancamentoSelecionado(null);
        }}
        onLancamentoUpdated={carregarLancamentos}
        lancamentoId={lancamentoSelecionado}
      />
    </>
  );
}
