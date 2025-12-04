"use client";

import { useState, useEffect, FormEvent, useCallback } from "react";
import { LancamentoSchema, TLancamentoSchema } from "@/schemas/auth";
import { NumericFormat } from "react-number-format";
import InputData from "./ui/InputData";
import { Plus } from "lucide-react";
import ModalCategoria from "./ModalCategoria";

interface ModalLancamentoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "create" | "edit";
  lancamentoId: number | null;
}

interface Categoria {
  id: number;
  nome: string;
  tipo: string;
}

type FormErrors = Partial<Record<keyof TLancamentoSchema, string>>;

export default function ModalLancamento({
  isOpen,
  onClose,
  onSuccess,
  mode,
  lancamentoId,
}: ModalLancamentoProps) {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState("");
  const [data, setData] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [isModalCategoriaOpen, setIsModalCategoriaOpen] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState<
    "receita" | "despesa" | ""
  >("");

  async function carregarCategorias(tipoFiltro?: "receita" | "despesa") {
    try {
      const res = await fetch("/api/auth/categorias");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data))
          setCategorias(
            tipoFiltro
              ? data.filter((c: Categoria) => c.tipo === tipoFiltro)
              : data
          );
      }
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
    }
  }

  const carregarLancamento = useCallback(async () => {
    if (!lancamentoId) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/auth/lancamentos/${lancamentoId}`);
      if (!res.ok) {
        alert("Falha ao carregar lançamento.");
        return;
      }

      const data = await res.json();

      setDescricao(data.descricao || "");
      setValor(
        Number(data.valor)
          .toFixed(2)
          .replace(".", ",")
          .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
      );
      setTipo(data.tipo || "");
      setData(data.data ? data.data.split("T")[0] : "");
      setCategoriaId(data.categoria_id ? String(data.categoria_id) : "");
    } catch (err) {
      console.error("Erro ao carregar lançamento:", err);
      alert("Erro ao carregar lançamento.");
    } finally {
      setLoading(false);
    }
  }, [lancamentoId]);

  useEffect(() => {
    if (categoriaId) {
      const c = categorias.find((c) => String(c.id) === categoriaId);
      if (c) setTipo(c.tipo);
    } else {
      setTipo("");
    }
  }, [categoriaId, categorias]);

  useEffect(() => {
    if (isOpen) {
      carregarCategorias();

      if (mode === "edit") carregarLancamento();
      if (mode === "edit" && tipo) {
        setTipoSelecionado(tipo as "receita" | "despesa");
        carregarCategorias(tipo as "receita" | "despesa");
      }
      if (mode === "create") {
        setTipoSelecionado("");
      }
    }
  }, [isOpen, mode, lancamentoId, carregarLancamento]);

  useEffect(() => {
    if (!isOpen) {
      setDescricao("");
      setValor("");
      setTipo("");
      setData("");
      setCategoriaId("");
      setErrors({});
      setLoading(false);
      setSalvando(false);
    }
  }, [isOpen]);

  async function handleSubmit(e: FormEvent) {
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
      const errs: FormErrors = {};
      validation.error.issues.forEach((issue) => {
        errs[issue.path[0] as keyof TLancamentoSchema] = issue.message;
      });
      setErrors(errs);
      return;
    }

    setSalvando(true);

    try {
      const url =
        mode === "create"
          ? "/api/auth/lancamentos"
          : `/api/auth/lancamentos/${lancamentoId}`;

      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataForm),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "Erro ao salvar lançamento");
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Erro ao salvar lançamento:", err);
      alert("Erro ao salvar lançamento.");
    } finally {
      setSalvando(false);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
        <div className="bg-[#161B22] p-6 rounded-2xl w-full max-w-md shadow-2xl text-white">
          {/* Cabeçalho */}
          <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
            <h2 className="text-xl font-semibold text-[#E0E0E0]">
              {mode === "create" ? "Novo Lançamento" : "Editar Lançamento"}
            </h2>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              &times;
            </button>
          </div>

          {loading ? (
            <p className="text-center py-6 text-[#E0E0E0]">
              Carregando dados...
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Descrição */}
              <div className="mb-4">
                <label className="block mb-1 text-sm text-[#E0E0E0]">
                  Descrição
                </label>
                <input
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className={`w-full px-4 h-[44px] bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none border transition ${
                    errors.descricao
                      ? "border-[#FF5252] ring-1 ring-[#FF5252]/40"
                      : "border-gray-700 hover:border-[#2196F3]/50 focus:border-[#2196F3]"
                  }`}
                />
                {errors.descricao && (
                  <p className="text-[#FF5252] text-xs mt-1">
                    {errors.descricao}
                  </p>
                )}
              </div>

              {/* Valor */}
              <div className="mb-4">
                <label className="block mb-1 text-sm text-[#E0E0E0]">
                  Valor (R$)
                </label>
                <NumericFormat
                  value={valor}
                  onValueChange={(v) => setValor(v.formattedValue)}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="R$ "
                  decimalScale={2}
                  fixedDecimalScale
                  allowNegative={false}
                  className={`w-full px-4 h-[44px] bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none border transition ${
                    errors.valor
                      ? "border-[#FF5252] ring-1 ring-[#FF5252]/40"
                      : "border-gray-700 hover:border-[#2196F3]/50 focus:border-[#2196F3]"
                  }`}
                />
                {errors.valor && (
                  <p className="text-[#FF5252] text-xs mt-1">{errors.valor}</p>
                )}
              </div>

              {/* Data */}
              <div className="mb-4">
                <InputData
                  label="Data de Pagamento"
                  value={data}
                  onChange={(iso) => setData(iso)}
                  error={errors.data}
                />
              </div>
              
              {/* Tipo */}
              <div className="mb-4">
                <div className="flex items-center space-x-4">
                  <label className="text-sm text-[#E0E0E0] whitespace-nowrap">
                    Tipo
                  </label>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setTipoSelecionado("receita");
                        setTipo("receita");
                        setCategoriaId("");
                        carregarCategorias("receita");
                      }}
                      className={`px-3 py-1 rounded-xl border transition ${
                        tipoSelecionado === "receita"
                          ? "bg-[#00E676] text-[#161B22] border-[#00E676]"
                          : "bg-[#0D1117] text-[#E0E0E0] border-gray-700 hover:border-[#00E676]/50"
                      }`}
                    >
                      Receita
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTipoSelecionado("despesa");
                        setTipo("despesa");
                        setCategoriaId("");
                        carregarCategorias("despesa");
                      }}
                      className={`px-3 py-1 rounded-xl border transition ${
                        tipoSelecionado === "despesa"
                          ? "bg-[#FF5252] text-[#161B22] border-[#FF5252]"
                          : "bg-[#0D1117] text-[#E0E0E0] border-gray-700 hover:border-[#FF5252]/50"
                      }`}
                    >
                      Despesa
                    </button>
                  </div>
                </div>

                {errors.tipo && (
                  <p className="text-[#FF5252] text-xs mt-1">{errors.tipo}</p>
                )}
              </div>

              {/* Categoria */}
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <label className="text-sm text-[#E0E0E0]">Categoria</label>

                  <button
                    type="button"
                    onClick={() => setIsModalCategoriaOpen(true)}
                    className="p-1 rounded-xl border border-gray-700 hover:border-[#2196F3]/60 transition"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className={`w-full px-4 h-[44px] bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none border transition ${
                    errors.categoria_id
                      ? "border-[#FF5252] ring-1 ring-[#FF5252]/40"
                      : "border-gray-700 hover:border-[#2196F3]/50 focus:border-[#2196F3]"
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

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-gray-600 hover:bg-gray-700 text-[#161B22] font-bold px-4 h-[44px] rounded-xl"
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
                  {salvando
                    ? "Salvando..."
                    : mode === "create"
                      ? "Salvar"
                      : "Atualizar"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <ModalCategoria
        isOpen={isModalCategoriaOpen}
        onClose={() => setIsModalCategoriaOpen(false)}
        onSuccess={carregarCategorias}
        mode="create"
      />
    </>
  );
}
