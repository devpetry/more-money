"use client";

import { FormEvent } from "react";

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
  // Função para lidar com o envio do formulário de nova empresa
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nome = formData.get("nome");
    const cnpj = formData.get("cnpj");

    try {
      // Requisição POST
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
        console.error("Erro ao salvar empresa:", errorData);
        alert(`Erro ao criar empresa: ${errorData.error || res.statusText}`);
      }
    } catch (error) {
      console.error("Erro na requisição POST:", error);
      alert("Erro de conexão ao criar empresa.");
    }
  };

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
            <label className="block text-sm font-medium mb-1 text-[#E0E0E0]" htmlFor="nome">
              Nome
            </label>
            <input
              name="nome"
              id="nome"
              type="text"
              className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] outline-none rounded-xl 
          ${
            // errors.email
            //   ? "border-2 border-[#FF5252]"
               "focus:ring-2 focus:ring-[#2196F3]"
          }`}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-[#E0E0E0]" htmlFor="cnpj">
              CNPJ
            </label>
            <input
              name="cnpj"
              id="cnpj"
              type="text"
              className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] outline-none rounded-xl 
          ${
            // errors.email
            //   ? "border-2 border-[#FF5252]"
               "focus:ring-2 focus:ring-[#2196F3]"
          }`}
              required
            />
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
