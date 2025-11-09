"use client";

import { FormEvent, useEffect, useState } from "react";
import { CategoriaSchema, TCategoriaSchema } from "@/schemas/auth";

type FormErrors = Partial<TCategoriaSchema>;

interface AddCategoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriaAdded: () => void;
}

export default function AddCategoriaModal({
  isOpen,
  onClose,
  onCategoriaAdded,
}: AddCategoriaModalProps) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome"),
      tipo: formData.get("tipo"),
    };

    const validation = CategoriaSchema.safeParse(data);

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
      const res = await fetch("/api/auth/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, tipo }),
      });

      if (res.ok) {
        onCategoriaAdded();
        onClose();
      } else {
        const errorData = await res.json();
        alert(`Erro ao criar categoria: ${errorData.error || res.statusText}`);
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão ao criar categoria.");
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setNome("");
      setTipo("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="bg-[#161B22] p-6 rounded-2xl w-full max-w-md shadow-2xl text-white">
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
          <h2 className="text-xl font-semibold text-[#E0E0E0]">
            Nova Categoria
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
              htmlFor="nome"
            >
              Nome
            </label>
            <input
              name="nome"
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none border transition-all duration-200 ${
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
              className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none border transition-all duration-200 ${
                errors.tipo
                  ? "border-[#FF5252] ring-1 ring-[#FF5252]/40"
                  : "border-gray-700 hover:border-[#2196F3]/50 focus:border-[#2196F3]/60 focus:ring-1 focus:ring-[#2196F3]/30"
              }`}
            >
              <option value="" disabled>
                Selecione o tipo de categoria
              </option>
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>
            {errors.tipo && (
              <p className="text-[#FF5252] text-xs mt-1">{errors.tipo}</p>
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
