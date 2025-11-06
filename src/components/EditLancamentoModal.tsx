"use client";

import { FormEvent, useEffect, useState, useCallback } from "react";
import { LancamentoSchema, TLancamentoSchema } from "@/schemas/auth";
import { NumericFormat } from "react-number-format";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";

type FormErrors = Partial<Record<keyof TLancamentoSchema, string>>;

interface EditLancamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLancamentoUpdated: () => void;
  lancamentoId: number | null;
}

interface Categoria {
  id: number;
  nome: string;
  tipo: string;
}

export default function EditLancamentoModal({
  isOpen,
  onClose,
  onLancamentoUpdated,
  lancamentoId,
}: EditLancamentoModalProps) {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState<string>(""); // guardamos string aqui
  const [tipo, setTipo] = useState("despesa");
  const [data, setData] = useState("");
  const [categoriaId, setCategoriaId] = useState<string>("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const carregarCategorias = useCallback(async () => {
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
  }, []);

  const carregarLancamento = useCallback(async () => {
    if (!lancamentoId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/lancamentos/${lancamentoId}`);
      if (res.ok) {
        const data = await res.json();
        setDescricao(data.descricao || "");
        const valorNumerico = Number(data.valor);
        setValor(
          !isNaN(valorNumerico)
            ? valorNumerico
                .toFixed(2)
                .replace(".", ",")
                .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
            : ""
        );

        setTipo(data.tipo || "despesa");
        setData(data.data ? data.data.split("T")[0] : "");
        setCategoriaId(data.categoria_id ? String(data.categoria_id) : "");
      } else {
        console.error("Erro ao carregar lançamento:", res.statusText);
        alert("Erro ao carregar informações do lançamento.");
        onClose();
      }
    } catch (error) {
      console.error("Erro ao buscar lançamento:", error);
      alert("Falha ao carregar lançamento.");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [lancamentoId, onClose]);

  useEffect(() => {
    if (isOpen && lancamentoId) {
      carregarCategorias();
      carregarLancamento();
    }
  }, [isOpen, lancamentoId, carregarCategorias, carregarLancamento]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const valorNumerico = Number(
      valor.replace(/[^\d,-]/g, "").replace(",", ".")
    );

    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      setErrors({ valor: "Informe um valor válido" });
      return;
    }

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
        alert(`Erro ao atualizar: ${errorData.error || res.statusText}`);
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão ao atualizar lançamento.");
    } finally {
      setSalvando(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setDescricao("");
      setValor("");
      setTipo("despesa");
      setData("");
      setCategoriaId("");
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen || !lancamentoId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="bg-[#161B22] p-6 rounded-2xl w-full max-w-md shadow-2xl text-white">
        {/* Cabeçalho */}
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

        {loading ? (
          <p className="text-center text-[#E0E0E0] py-8">Carregando dados...</p>
        ) : (
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
                <p className="text-[#FF5252] text-xs mt-1">
                  {errors.descricao}
                </p>
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
              <label
                htmlFor="tipo"
                className="block text-sm font-medium mb-1 text-[#E0E0E0]"
              >
                Tipo
              </label>
              <select
                id="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none border transition-all duration-200 ${
                  errors.tipo
                    ? "border-[#FF5252] ring-1 ring-[#FF5252]/40"
                    : "border-gray-700 hover:border-[#2196F3]/50 focus:border-[#2196F3]/60 focus:ring-1 focus:ring-[#2196F3]/30"
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
                htmlFor="data"
                className="block text-sm font-medium mb-1 text-[#E0E0E0]"
              >
                Data
              </label>

              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none border transition-all duration-200 flex justify-between items-center
                      ${
                        errors.data
                          ? "border-[#FF5252] ring-1 ring-[#FF5252]/40"
                          : "border-gray-700 hover:border-[#2196F3]/50 focus:border-[#2196F3]/60 focus:ring-1 focus:ring-[#2196F3]/30"
                      }`}
                  >
                    {data
                      ? new Date(data).toLocaleDateString("pt-BR")
                      : "Selecione uma data"}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10m-12 8h14a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </PopoverTrigger>

                <PopoverContent
                  className="bg-[#161B22] border border-gray-800 shadow-lg shadow-black/30 text-[#E0E0E0] rounded-2xl p-4 w-auto"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={data ? new Date(data) : undefined}
                    onSelect={(selectedDate) => {
                      if (selectedDate) {
                        const formatted = selectedDate
                          .toISOString()
                          .split("T")[0];
                        setData(formatted);
                      }
                    }}
                    disabled={(date) => date > new Date()}
                    className="rounded-lg border border-gray-800 bg-[#0D1117] text-white"
                  />
                </PopoverContent>
              </Popover>

              {errors.data && (
                <p className="text-[#FF5252] text-xs mt-1">{errors.data}</p>
              )}
            </div>

            <div className="mb-6">
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
                <option value="">Selecione uma categoria</option>
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
        )}
      </div>
    </div>
  );
}
