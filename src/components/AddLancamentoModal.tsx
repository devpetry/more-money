"use client";

import { FormEvent, useEffect, useState } from "react";
import { LancamentoSchema, TLancamentoSchema } from "@/schemas/auth";
import { NumericFormat } from "react-number-format";

type FormErrors = Partial<Record<keyof TLancamentoSchema, string>>;

interface AddLancamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLancamentoAdded: () => void;
}

interface Categoria {
  id: number;
  nome: string;
  tipo: string;
}

export default function AddLancamentoModal({
  isOpen,
  onClose,
  onLancamentoAdded,
}: AddLancamentoModalProps) {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState("despesa");
  const [data, setData] = useState("");
  const [categoriaId, setCategoriaId] = useState<number | "">("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  async function carregarCategorias() {
    try {
      const res = await fetch("/api/auth/categorias");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCategorias(data);
        }
      } else {
        console.error("Erro ao carregar categorias:", res.status);
      }
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  }

  useEffect(() => {
    if (isOpen) {
      carregarCategorias();
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const dataForm = {
      descricao: formData.get("descricao"),
      valor: Number(formData.get("valor")),
      tipo: formData.get("tipo"),
      data: formData.get("data"),
      categoria_id: formData.get("categoria_id"),
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

    try {
      const res = await fetch("/api/auth/lancamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao,
          valor: Number(valor),
          tipo,
          data,
          categoria_id: categoriaId || null,
        }),
      });

      if (res.ok) {
        onLancamentoAdded();
        onClose();
      } else {
        const errorData = await res.json();
        alert(`Erro ao criar lançamento: ${errorData.error || res.statusText}`);
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão ao criar lançamento.");
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setDescricao("");
      setValor("");
      setTipo("despesa");
      setData("");
      setCategoriaId("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="bg-[#161B22] p-6 rounded-2xl w-full max-w-md shadow-2xl text-white">
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
          <h2 className="text-xl font-semibold text-[#E0E0E0]">
            Novo Lançamento
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
            aria-label="Fechar Modal"
          >
            &times;
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              className="block text-sm font-medium mb-1 text-[#E0E0E0]"
              htmlFor="descricao"
            >
              Descrição
            </label>
            <input
              name="descricao"
              id="descricao"
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
              <p className="text-[#FF5252] text-xs mt-1">{errors.descricao}</p>
            )}
          </div>
          {/* <div className="mb-4">
            <label
              className="block text-sm font-medium mb-1 text-[#E0E0E0]"
              htmlFor="valor"
            >
              Valor (R$)
            </label>
            <input
              name="valor"
              id="valor"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] outline-none rounded-xl 
              ${
                errors.valor
                  ? "border-2 border-[#FF5252]"
                  : "focus:ring-2 focus:ring-[#2196F3]"
              }`}
            />
            {errors.valor && (
              <p className="text-[#FF5252] text-xs mt-1">{errors.valor}</p>
            )}
          </div> */}
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
              onValueChange={(value) => setValor((value.floatValue ?? 0).toString())}
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
              name="tipo"
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none 
              ${
                errors.tipo
                  ? "border-2 border-[#FF5252]"
                  : "focus:ring-2 focus:ring-[#2196F3]"
              }`}
            >
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>
            {errors.tipo && (
              <p className="text-[#FF5252] text-xs mt-1">{errors.tipo}</p>
            )}
          </div>
          <div className="mb-4">
            <label
              className="block text-sm font-medium mb-1 text-[#E0E0E0]"
              htmlFor="data"
            >
              Data
            </label>
            <input
              name="data"
              id="data"
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
          <div className="mb-6">
            <label
              className="block text-sm font-medium mb-1 text-[#E0E0E0]"
              htmlFor="categoria_id"
            >
              Categoria
            </label>
            <select
              name="categoria_id"
              id="categoria_id"
              value={categoriaId}
              onChange={(e) =>
                setCategoriaId(e.target.value ? Number(e.target.value) : "")
              }
              className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none 
              ${
                errors.categoria_id
                  ? "border-2 border-[#FF5252]"
                  : "focus:ring-2 focus:ring-[#2196F3]"
              }`}
            >
              <option value="">Selecione uma categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} ({c.tipo})
                </option>
              ))}
            </select>
            {errors.categoria_id && (
              <p className="text-[#FF5252] text-xs mt-1">
                {errors.categoria_id}
              </p>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-[#161B22] font-bold py-2 px-4 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-[#2196F3] hover:bg-[#2196F3]/75 text-[#161B22] font-bold py-2 px-4 rounded-xl"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
