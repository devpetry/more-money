"use client";

import { FormEvent, useEffect, useState } from "react";
import CnpjInput from "./CnpjInput";
import { EmpresaSchema, TEmpresaSchema } from "@/schemas/auth";

type FormErrors = Partial<TEmpresaSchema>;

interface AddEmpresaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmpresaAdded: () => void;
}

export default function AddEmpresaModal({
  isOpen,
  onClose,
  onEmpresaAdded,
}: AddEmpresaModalProps) {
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome"),
      cnpj: formData.get("cnpj"),
    };

    const validation = EmpresaSchema.safeParse(data);

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
      const res = await fetch("/api/auth/empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, cnpj }),
      });

      if (res.ok) {
        onEmpresaAdded();
        onClose();
      } else {
        const errorData = await res.json();
        alert(`Erro ao criar empresa: ${errorData.error || res.statusText}`);
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão ao criar empresa.");
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="bg-[#161B22] p-6 rounded-2xl w-full max-w-md shadow-2xl text-white">
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
          <h2 className="text-xl font-semibold text-[#E0E0E0]">Nova Empresa</h2>
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
            <CnpjInput
              name="cnpj"
              label="CNPJ"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none border transition-all duration-200 ${
                errors.cnpj
                  ? "border-[#FF5252] ring-1 ring-[#FF5252]/40"
                  : "border-gray-700 hover:border-[#2196F3]/50 focus:border-[#2196F3]/60 focus:ring-1 focus:ring-[#2196F3]/30"
              }`}
            />
            {errors.cnpj && (
              <p className="text-[#FF5252] text-xs mt-1">{errors.cnpj}</p>
            )}
          </div>

          {/* Botões de Ação */}
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
