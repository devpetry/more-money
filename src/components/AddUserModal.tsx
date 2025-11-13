"use client";

import { FormEvent, useEffect, useState } from "react";
import { UsuarioSchema, TUsuarioSchema } from "@/schemas/auth";
import { Eye, EyeOff, Plus } from "lucide-react";
import AddEmpresaModal from "./AddEmpresaModal";

type FormErrors = Partial<Record<keyof TUsuarioSchema, string>>;

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
  const [errors, setErrors] = useState<FormErrors>({});
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [tipoUsuario, setTipoUsuario] = useState<string>("");
  const [empresaId, setEmpresaId] = useState("");

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
    } else if (!isOpen) {
      setErrors({});
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const nome = String(formData.get("nome") || "");
    const email = String(formData.get("email") || "");
    const empresa_id = String(formData.get("empresa_id") || "");
    const tipo_usuario = String(formData.get("tipo_usuario") || "");
    const senha = String(formData.get("senha") || "");

    const data = { nome, email, empresa_id, tipo_usuario, senha };

    const validation = UsuarioSchema.safeParse(data);

    if (!validation.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of validation.error.issues) {
        const key = issue.path[0] as keyof FormErrors;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSalvando(true);

    try {
      const res = await fetch("/api/auth/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
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
    } finally {
      setSalvando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
        <div className="bg-[#161B22] p-6 rounded-2xl w-full max-w-md shadow-2xl text-white">
          <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
            <h2 className="text-xl font-semibold text-[#E0E0E0]">
              Novo Usuário
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
                htmlFor="nome"
                className="block text-sm font-medium mb-1 text-[#E0E0E0]"
              >
                Nome
              </label>
              <input
                name="nome"
                id="nome"
                type="text"
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
                htmlFor="email"
                className="block text-sm font-medium mb-1 text-[#E0E0E0]"
              >
                E-mail
              </label>
              <input
                name="email"
                id="email"
                type="email"
                className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none border transition-all duration-200 ${
                  errors.email
                    ? "border-[#FF5252] ring-1 ring-[#FF5252]/40"
                    : "border-gray-700 hover:border-[#2196F3]/50 focus:border-[#2196F3]/60 focus:ring-1 focus:ring-[#2196F3]/30"
                }`}
              />
              {errors.email && (
                <p className="text-[#FF5252] text-xs mt-1">{errors.email}</p>
              )}
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="empresa_id"
                  className="block text-sm font-medium text-[#E0E0E0]"
                >
                  Empresa
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="p-1 rounded-xl border border-gray-700 text-[#E0E0E0] transition-all duration-200
                    hover:border-[#2196F3]/50 hover:ring-1 hover:ring-[#2196F3]/30
                    focus:border-[#2196F3]/60 focus:ring-1 focus:ring-[#2196F3]/30"
                >
                  <Plus size={12} />
                </button>
              </div>

              <select
                id="empresa_id"
                value={empresaId}
                onChange={(e) => setEmpresaId(e.target.value)}
                disabled={loadingEmpresas || empresas.length === 0}
                className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] rounded-xl border transition-all duration-200 outline-none cursor-pointer
                    ${
                      loadingEmpresas || empresas.length === 0
                        ? "opacity-60 cursor-not-allowed border-gray-800"
                        : "border-gray-700 hover:border-[#2196F3]/50 focus:border-[#2196F3]/60 focus:ring-1 focus:ring-[#2196F3]/30"
                    }`}
              >
                <option value="" disabled>
                  {loadingEmpresas
                    ? "Carregando empresas..."
                    : empresas.length === 0
                      ? "Nenhuma empresa encontrada"
                      : "Selecione a empresa"}
                </option>

                {empresas.map((empresa) => (
                  <option key={empresa.id} value={String(empresa.id)}>
                    {empresa.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label
                htmlFor="tipo_usuario"
                className="block text-sm font-medium mb-1 text-[#E0E0E0]"
              >
                Tipo de Usuário
              </label>
              <select
                name="tipo_usuario"
                id="tipo_usuario"
                value={tipoUsuario}
                onChange={(e) => setTipoUsuario(e.target.value)}
                className="w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] rounded-xl border border-gray-700 transition-all duration-200 outline-none cursor-pointer hover:border-[#2196F3]/50 focus:border-[#2196F3]/60 focus:ring-1 focus:ring-[#2196F3]/30"
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
            <div className="mb-4 relative">
              <label
                htmlFor="senha"
                className="block text-sm font-medium mb-1 text-[#E0E0E0]"
              >
                Senha
              </label>

              <div className="relative">
                <input
                  name="senha"
                  id="senha"
                  type={showPassword ? "text" : "password"}
                  className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none border transition-all duration-200 ${
                    errors.senha
                      ? "border-[#FF5252] ring-1 ring-[#FF5252]/40"
                      : "border-gray-700 hover:border-[#2196F3]/50 focus:border-[#2196F3]/60 focus:ring-1 focus:ring-[#2196F3]/30"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#E0E0E0] hover:text-[#E0E0E0]/60"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.senha && (
                <p className="text-[#FF5252] text-xs mt-1">{errors.senha}</p>
              )}
              <label className="text-xs text-[#9E9E9E] mt-1 block">
                * Recomendamos o novo usuário alterar a senha no primeiro login
              </label>
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
        </div>
      </div>

      {/* MODAL DE ADIÇÃO DE EMPRESA */}
      <AddEmpresaModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onEmpresaAdded={carregarEmpresas}
      />
    </>
  );
}
