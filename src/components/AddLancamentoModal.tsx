"use client";

import { FormEvent, useEffect, useState } from "react";
import { LancamentoSchema, TLancamentoSchema } from "@/schemas/auth";
import { NumericFormat } from "react-number-format";
import InputData from "./ui/InputData";

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
  const [valor, setValor] = useState<string>("");
  const [tipo, setTipo] = useState("");
  const [data, setData] = useState("");
  const [categoriaId, setCategoriaId] = useState<string>("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  async function carregarCategorias() {
    try {
      const res = await fetch("/api/auth/categorias");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setCategorias(data);
      } else {
        console.error("Erro ao carregar categorias:", res.status);
      }
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  }

  useEffect(() => {
    if (isOpen) carregarCategorias();
  }, [isOpen]);

  useEffect(() => {
    if (categoriaId) {
      const categoriaSelecionada = categorias.find(
        (c) => String(c.id) === categoriaId
      );
      if (categoriaSelecionada) {
        setTipo(categoriaSelecionada.tipo);
      }
    } else {
      setTipo("");
    }
  }, [categoriaId, categorias]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const valorNumerico = Number(
      valor.replace(/[^\d,-]/g, "").replace(",", ".")
    );

    const dataForm = {
      descricao,
      valor: valorNumerico,
      tipo,
      data,
      categoria_id: categoriaId || null,
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
        body: JSON.stringify(dataForm),
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
      setTipo("");
      setData("");
      setCategoriaId("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="bg-[#161B22] p-6 rounded-2xl w-full max-w-md shadow-2xl text-white">
        {/* Cabeçalho */}
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
              htmlFor="descricao"
              className="block text-sm font-medium mb-1 text-[#E0E0E0]"
            >
              Descrição
            </label>
            <input
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none border transition-all duration-200 ${
                errors.descricao
                  ? "border-[#FF5252] ring-1 ring-[#FF5252]/40"
                  : "border-gray-700 hover:border-[#2196F3]/50 focus:border-[#2196F3]/60 focus:ring-1 focus:ring-[#2196F3]/30"
              }`}
            />
            {errors.descricao && (
              <p className="text-[#FF5252] text-xs mt-1">{errors.descricao}</p>
            )}
          </div>
          <div className="mb-4">
            <label
              htmlFor="valor"
              className="block text-sm font-medium mb-1 text-[#E0E0E0]"
            >
              Valor (R$)
            </label>
            <NumericFormat
              id="valor"
              value={valor}
              onValueChange={(values) => setValor(values.formattedValue)}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              allowNegative={false}
              className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none border transition-all duration-200 ${
                errors.valor
                  ? "border-[#FF5252] ring-1 ring-[#FF5252]/40"
                  : "border-gray-700 hover:border-[#2196F3]/50 focus:border-[#2196F3]/60 focus:ring-1 focus:ring-[#2196F3]/30"
              }`}
            />
            {errors.valor && (
              <p className="text-[#FF5252] text-xs mt-1">{errors.valor}</p>
            )}
          </div>
          <div className="mb-4">
            <InputData
              label="Data de Pagamento"
              value={data}
              onChange={(iso) => setData(iso)}
              error={errors.data}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-[#E0E0E0]">
              Categoria
            </label>
            <select
              id="categoria_id"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none border transition-all duration-200 ${
                errors.categoria_id
                  ? "border-[#FF5252] ring-1 ring-[#FF5252]/40"
                  : "border-gray-700 hover:border-[#2196F3]/50 focus:border-[#2196F3]/60 focus:ring-1 focus:ring-[#2196F3]/30"
              }`}
            >
              <option value="" disabled>
                Selecione uma categoria
              </option>
              {categorias.map((c) => (
                <option key={c.id} value={String(c.id)}>
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
