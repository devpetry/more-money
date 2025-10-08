"use client";

import { FormEvent, useEffect, useState } from "react";

interface Empresa {
  id: number;
  nome: string;
}
interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

const TIPOS_USUARIO = [
  { id: 1, nome: "ADMIN" },
  { id: 2, nome: "GERENTE" },
  { id: 3, nome: "COLABORADOR" },
];

export default function AddUserModal({
  isOpen,
  onClose,
  onUserAdded,
}: AddUserModalProps) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);

  // Função para buscar a lista de empresas
  const carregarEmpresas = async () => {
    setLoadingEmpresas(true);
    try {
      const res = await fetch("/api/auth/empresas");
      const data = await res.json();
      setEmpresas(data);
    } catch (e) {
      console.error("Erro ao carregar lista de empresas para a combo:", e);
    }
    setLoadingEmpresas(false);
  };

  useEffect(() => {
    if (isOpen) {
      carregarEmpresas();
    }
  }, [isOpen]);

  // Função para lidar com o envio do formulário de novo usuário
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nome = formData.get("nome");
    const email = formData.get("email");
    const empresa_id = formData.get("empresa_id");
    const tipo_usuario = formData.get("tipo_usuario");
    const senha = formData.get("senha");

    try {
      // Requisição POST
      const res = await fetch("/api/auth/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, empresa_id, tipo_usuario, senha }),
      });

      if (res.ok) {
        onUserAdded();
        onClose();
      } else {
        const errorData = await res.json();
        console.error("Erro ao salvar usuário:", errorData);
        alert(`Erro ao criar usuário: ${errorData.error || res.statusText}`);
      }
    } catch (error) {
      console.error("Erro na requisição POST:", error);
      alert("Erro de conexão ao criar usuário.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="bg-[#161B22] p-6 rounded-2xl w-full max-w-md shadow-2xl text-white">
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
          <h2 className="text-xl font-semibold text-[#E0E0E0]">Novo Usuário</h2>
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
            <label
              className="block text-sm font-medium mb-1 text-[#E0E0E0]"
              htmlFor="email"
            >
              E-mail
            </label>
            <input
              name="email"
              id="email"
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
            <label
              className="block text-sm font-medium mb-1 text-[#E0E0E0]"
              htmlFor="empresa_id"
            >
              Empresa
            </label>
            <select
              name="empresa_id"
              id="empresa_id"
              className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] outline-none rounded-xl appearance-none cursor-pointer
${"focus:ring-2 focus:ring-[#2196F3]"}`}
              required
              disabled={loadingEmpresas || empresas.length === 0}
              defaultValue=""
            >
              <option value="" disabled>
                {loadingEmpresas
                  ? "Carregando empresas..."
                  : empresas.length === 0
                    ? "Nenhuma empresa encontrada"
                    : "Selecione a empresa"}
              </option>

              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label
              className="block text-sm font-medium mb-1 text-[#E0E0E0]"
              htmlFor="tipo_usuario"
            >
              Tipo de Usuário
            </label>
            <select
              name="tipo_usuario"
              id="tipo_usuario"
              className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] outline-none rounded-xl appearance-none cursor-pointer
${"focus:ring-2 focus:ring-[#2196F3]"}`}
              required
              defaultValue=""
            >
              <option value="" disabled>
                Selecione o tipo de usuário
              </option>
              {TIPOS_USUARIO.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label
              className="block text-sm font-medium mb-1 text-[#E0E0E0]"
              htmlFor="senha"
            >
              Senha
            </label>
            <input
              name="senha"
              id="senha"
              type="password"
              className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] outline-none rounded-xl 
          ${
            // errors.email
            //   ? "border-2 border-[#FF5252]"
            "focus:ring-2 focus:ring-[#2196F3]"
          }`}
              required
            />
            <label className="text-xs text-[#9E9E9E] mt-1">
              * Recomendamos o novo usuário alterar a senha no primeiro login
            </label>
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
