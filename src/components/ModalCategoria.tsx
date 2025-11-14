"use client";

import { FormEvent, useEffect, useState } from "react";
import { CategoriaSchema, TCategoriaSchema } from "@/schemas/auth";

type FormErrors = Partial<TCategoriaSchema>;

interface ModalCategoriaProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "create" | "edit";
  categoriaId?: number | null;
}

export default function ModalCategoria({
  isOpen,
  onClose,
  onSuccess,
  mode,
  categoriaId,
}: ModalCategoriaProps) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"receita" | "despesa" | "">("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Carrega dados se for edição
  useEffect(() => {
    if (mode === "edit" && isOpen && categoriaId) {
      setLoading(true);
      fetch(`/api/auth/categorias/${categoriaId}`)
        .then((res) => res.json())
        .then((data) => {
          setNome(data.nome || "");
          setTipo(data.tipo || "");
        })
        .catch(() => alert("Erro ao carregar categoria."))
        .finally(() => setLoading(false));
    } else if (!isOpen) {
      setNome("");
      setTipo("");
      setErrors({});
    }
  }, [isOpen, categoriaId, mode]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const data = { nome, tipo };
    const validation = CategoriaSchema.safeParse(data);
    if (!validation.success) {
      const fieldErrors: FormErrors = {};
      validation.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as keyof FormErrors] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSalvando(true);

    try {
      const res = await fetch(
        mode === "create"
          ? "/api/auth/categorias"
          : `/api/auth/categorias/${categoriaId}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await res.json();
        alert(`Erro: ${errorData.error || res.statusText}`);
      }
    } catch {
      alert("Erro de conexão.");
    } finally {
      setSalvando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="bg-[#161B22] p-6 rounded-2xl w-full max-w-md shadow-2xl text-white relative">
        {loading ? (
          <p className="text-center text-[#E0E0E0] py-8">
            Carregando dados da categoria...
          </p>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
              <h2 className="text-xl font-semibold text-[#E0E0E0]">
                {mode === "create" ? "Nova Categoria" : "Editar Categoria"}
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
                  htmlFor="nome"
                  className="block text-sm font-medium mb-1 text-[#E0E0E0]"
                >
                  Nome
                </label>
                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className={`modal-input w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none border transition-all duration-200 ${
                    errors.nome
                      ? "border-[#FF5252] ring-1 ring-[#FF5252]/40"
                      : "border-gray-700 hover:border-[#2196F3]/50 focus:border-[#2196F3]/60 focus:ring-1 focus:ring-[#2196F3]/30"
                  }`}
                />
                {errors.nome && (
                  <p className="text-[#FF5252] text-xs mt-1">{errors.nome}</p>
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
                  onChange={(e) =>
                    setTipo(e.target.value as "receita" | "despesa" | "")
                  }
                  className={`modal-input w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none border transition-all duration-200 ${
                    errors.tipo
                      ? "border-[#FF5252] ring-1 ring-[#FF5252]/40"
                      : "border-gray-700 hover:border-[#2196F3]/50 focus:border-[#2196F3]/60 focus:ring-1 focus:ring-[#2196F3]/30"
                  }`}
                >
                  <option value="" disabled>
                    Selecione o tipo de categoria
                  </option>
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                </select>
                {errors.tipo && (
                  <p className="text-[#FF5252] text-xs mt-1">{errors.tipo}</p>
                )}
              </div>

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
                  {salvando
                    ? "Salvando..."
                    : mode === "create"
                      ? "Salvar"
                      : "Atualizar"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
