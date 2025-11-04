"use client";

import { FormEvent, useEffect, useState } from "react";
import { LancamentoSchema, TLancamentoSchema } from "@/schemas/auth";
import { NumericFormat } from "react-number-format";

type FormErrors = {
  [K in keyof TLancamentoSchema]?: string;
};

interface EditLancamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLancamentoUpdated: () => void;
  lancamentoId: number | null;
}

export default function EditLancamentoModal({
  isOpen,
  onClose,
  onLancamentoUpdated,
  lancamentoId,
}: EditLancamentoModalProps) {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState<number>(0);
  const [tipo, setTipo] = useState<"receita" | "despesa" | "">("");
  const [categoriaId, setCategoriaId] = useState<number | "">("");
  const [data, setData] = useState("");
  const [categorias, setCategorias] = useState<{ id: number; nome: string }[]>(
    []
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (isOpen && lancamentoId) {
      setLoading(true);
      const fetchLancamento = async () => {
        try {
          const res = await fetch(`/api/auth/lancamentos/${lancamentoId}`);
          if (res.ok) {
            const data = await res.json();
            setDescricao(data.descricao || "");
            setValor(data.valor?.toString() || "");
            setTipo(data.tipo || "");
            setCategoriaId(data.categoria_id || "");
            setData(data.data || "");
          } else {
            console.error("Erro ao carregar lançamento:", res.statusText);
            alert("Erro ao carregar informações do lançamento.");
            onClose();
          }
        } catch (error) {
          console.error("Erro na requisição GET:", error);
          alert("Falha ao carregar lançamento.");
          onClose();
        } finally {
          setLoading(false);
        }
      };

      const fetchCategorias = async () => {
        try {
          const res = await fetch(`/api/auth/categorias`);
          if (res.ok) {
            const data = await res.json();
            setCategorias(data);
          } else {
            console.error("Erro ao carregar categorias:", res.statusText);
          }
        } catch (error) {
          console.error("Erro na requisição de categorias:", error);
        }
      };

      fetchCategorias();
      fetchLancamento();
    } else if (!isOpen) {
      setErrors({});
    }
  }, [isOpen, lancamentoId, onClose]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const dataForm = {
      descricao: formData.get("descricao"),
      valor: parseFloat(formData.get("valor") as string),
      tipo: formData.get("tipo"),
      categoria_id: parseInt(formData.get("categoria_id") as string),
      data: formData.get("data"),
    };

    const validation = LancamentoSchema.safeParse(dataForm);

    if (!validation.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of validation.error.issues) {
        const key = issue.path[0] as keyof FormErrors;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    if (!lancamentoId) return;

    setSalvando(true);
    try {
      const res = await fetch(`/api/auth/lancamentos/${lancamentoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataForm),
      });

      if (res.ok) {
        onLancamentoUpdated();
        onClose();
      } else {
        const errorData = await res.json();
        console.error("Erro ao atualizar lançamento:", errorData);
        alert(`Erro ao atualizar: ${errorData.error || res.statusText}`);
      }
    } catch (error) {
      console.error("Erro na requisição PUT:", error);
      alert("Erro de conexão ao atualizar lançamento.");
    } finally {
      setSalvando(false);
    }
  };

  if (!isOpen || !lancamentoId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="bg-[#161B22] p-6 rounded-2xl w-full max-w-md shadow-2xl text-white relative">
        {loading ? (
          <p className="text-center text-[#E0E0E0] py-8">
            Carregando dados do lançamento...
          </p>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
              <h2 className="text-xl font-semibold text-[#E0E0E0]">
                Editar Lançamento
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-2xl"
                aria-label="Fechar Modal"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-1 text-[#E0E0E0]"
                  htmlFor="descricao"
                >
                  Descrição
                </label>
                <input
                  id="descricao"
                  name="descricao"
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] outline-none rounded-xl 
                  ${
                    errors.descricao
                      ? "border-2 border-[#FF5252]"
                      : "focus:ring-2 focus:ring-[#2196F3]"
                  }`}
                />
                {errors.descricao && (
                  <p className="text-[#FF5252] text-xs mt-1">
                    {errors.descricao}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-1 text-[#E0E0E0]"
                  htmlFor="valor"
                >
                  Valor (R$)
                </label>
                <NumericFormat
                  id="valor"
                  name="valor"
                  value={valor}
                  onValueChange={(values) => setValor(values.floatValue || 0)}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="R$ "
                  decimalScale={2}
                  fixedDecimalScale
                  allowNegative={false}
                  className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] outline-none rounded-xl ${
                    errors.valor
                      ? "border-2 border-[#FF5252]"
                      : "focus:ring-2 focus:ring-[#2196F3]"
                  }`}
                />
                {errors.valor && (
                  <p className="text-[#FF5252] text-xs mt-1">{errors.valor}</p>
                )}
              </div>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-1 text-[#E0E0E0]"
                  htmlFor="tipo"
                >
                  Tipo
                </label>
                <select
                  id="tipo"
                  name="tipo"
                  value={tipo}
                  onChange={(e) =>
                    setTipo(e.target.value as "receita" | "despesa" | "")
                  }
                  className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none
                  ${
                    errors.tipo
                      ? "border-2 border-[#FF5252]"
                      : "focus:ring-2 focus:ring-[#2196F3]"
                  }`}
                >
                  <option value="">Selecione...</option>
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                </select>
                {errors.tipo && (
                  <p className="text-[#FF5252] text-xs mt-1">{errors.tipo}</p>
                )}
              </div>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-1 text-[#E0E0E0]"
                  htmlFor="categoria_id"
                >
                  Categoria
                </label>
                <select
                  id="categoria_id"
                  name="categoria_id"
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(parseInt(e.target.value))}
                  className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none
                  ${
                    errors.categoria_id
                      ? "border-2 border-[#FF5252]"
                      : "focus:ring-2 focus:ring-[#2196F3]"
                  }`}
                >
                  <option value="">Selecione...</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome}
                    </option>
                  ))}
                </select>
                {errors.categoria_id && (
                  <p className="text-[#FF5252] text-xs mt-1">
                    {errors.categoria_id}
                  </p>
                )}
              </div>
              <div className="mb-6">
                <label
                  className="block text-sm font-medium mb-1 text-[#E0E0E0]"
                  htmlFor="data"
                >
                  Data
                </label>
                <input
                  id="data"
                  name="data"
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none
                  ${
                    errors.data
                      ? "border-2 border-[#FF5252]"
                      : "focus:ring-2 focus:ring-[#2196F3]"
                  }`}
                />
                {errors.data && (
                  <p className="text-[#FF5252] text-xs mt-1">{errors.data}</p>
                )}
              </div>

              {/* Botões de ação*/}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-gray-600 hover:bg-gray-700 text-[#161B22] font-bold py-2 px-4 rounded-xl disabled:opacity-50"
                  disabled={salvando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className={`${
                    salvando
                      ? "bg-[#2196F3]/50 cursor-not-allowed"
                      : "bg-[#2196F3] hover:bg-[#2196F3]/75"
                  } text-[#161B22] font-bold py-2 px-4 rounded-xl transition`}
                >
                  {salvando ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
