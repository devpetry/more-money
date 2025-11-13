"use client";

import { FormEvent, useEffect, useState } from "react";
import { UsuarioEditSchema, TUsuarioEditSchema } from "@/schemas/auth";

type FormErrors = Partial<Record<keyof TUsuarioEditSchema, string>>;

interface Empresa {
  id: number;
  nome: string;
}
interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
  userId: number | null;
}

const TIPOS_USUARIO = [
  { id: 1, nome: "ADMIN" },
  { id: 2, nome: "GERENTE" },
  { id: 3, nome: "COLABORADOR" },
];

const getTipoIdByNome = (nome?: string | null): string => {
  if (!nome) return "";
  const tipo = TIPOS_USUARIO.find((t) => t.nome === nome.toUpperCase());
  return tipo ? String(tipo.id) : "";
};

export default function EditUserModal({
  isOpen,
  onClose,
  onUserUpdated,
  userId,
}: EditUserModalProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const [empresaIdSelecionada, setEmpresaIdSelecionada] = useState<string>("");
  const [tipoUsuarioSelecionado, setTipoUsuarioSelecionado] =
    useState<string>("");

  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);

  const carregarEmpresas = async () => {
    setLoadingEmpresas(true);
    try {
      const res = await fetch("/api/auth/empresas");
      const data = await res.json();
      setEmpresas(data);
    } catch (e) {
      console.error("Erro ao carregar lista de empresas para a combo:", e);
    } finally {
      setLoadingEmpresas(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      setNome("");
      setEmail("");
      setEmpresaIdSelecionada("");
      setTipoUsuarioSelecionado("");

      carregarEmpresas();
      setLoading(true);
      const fetchUser = async () => {
        try {
          const res = await fetch(`/api/auth/usuarios/${userId}`);
          if (res.ok) {
            const data = await res.json();
            setNome(data.nome || "");
            setEmail(data.email || "");
            setEmpresaIdSelecionada(
              data.empresa_id != null ? String(data.empresa_id) : ""
            );
            const tipoId = getTipoIdByNome(data.tipo_usuario);
            setTipoUsuarioSelecionado(tipoId);
          } else {
            console.error("Erro ao carregar usuário:", res.statusText);
            alert("Erro ao carregar informações do usuário.");
            onClose();
          }
        } catch (error) {
          console.error("Erro na requisição GET:", error);
          alert("Falha ao carregar usuário.");
          onClose();
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    } else if (!isOpen) {
      setErrors({});
    }
  }, [isOpen, userId, onClose]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const nome = formData.get("nome");
    const email = formData.get("email");
    const empresa_id = formData.get("empresa_id");
    const tipo_usuario = formData.get("tipo_usuario");
    const senha = formData.get("senha");

    const data = {
      nome,
      email,
      empresa_id,
      tipo_usuario,
      senha,
    };

    const validation = UsuarioEditSchema.safeParse(data);

    if (!validation.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of validation.error.issues) {
        const key = issue.path[0] as keyof FormErrors;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    if (!userId) return;

    setSalvando(true);

    const empresaIdToUpdate =
      empresaIdSelecionada !== "" ? Number(empresaIdSelecionada) : null;
    const tipoUsuarioToUpdate =
      tipoUsuarioSelecionado !== "" ? tipoUsuarioSelecionado : "";

    try {
      const res = await fetch(`/api/auth/usuarios/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          email,
          empresa_id: empresaIdToUpdate,
          tipo_usuario: tipoUsuarioToUpdate,
        }),
      });

      if (res.ok) {
        onUserUpdated();
        onClose();
      } else {
        const errorData = await res.json();
        console.error("Erro ao atualizar usuário:", errorData);
        alert(`Erro ao atualizar: ${errorData.error || res.statusText}`);
      }
    } catch (error) {
      console.error("Erro na requisição PUT:", error);
      alert("Erro de conexão ao atualizar usuário.");
    } finally {
      setSalvando(false);
    }
  };

  if (!isOpen || !userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="bg-[#161B22] p-6 rounded-2xl w-full max-w-md shadow-2xl text-white relative">
        {loading ? (
          <p className="text-center text-[#E0E0E0] py-8">
            Carregando dados do usuário...
          </p>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
              <h2 className="text-xl font-semibold text-[#E0E0E0]">
                Editar Usuário
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
                  className="block text-sm font-medium mb-1 text-[#E0E0E0]"
                  htmlFor="nome"
                >
                  Nome
                </label>
                <input
                  id="nome"
                  name="nome"
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
                  htmlFor="email"
                >
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                <label
                  htmlFor="empresa_id"
                  className="block text-sm font-medium mb-1 text-[#E0E0E0]"
                >
                  Empresa
                </label>
                <select
                  name="empresa_id"
                  id="empresa_id"
                  value={empresaIdSelecionada}
                  onChange={(e) => setEmpresaIdSelecionada(e.target.value)}
                  disabled={loadingEmpresas || empresas.length === 0}
                  className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] rounded-xl border transition-all duration-200 outline-none appearance-none cursor-pointer
      ${
        loadingEmpresas || empresas.length === 0
          ? "opacity-60 cursor-not-allowed border-gray-800"
          : "border-gray-700 hover:border-[#2196F3]/50 focus:border-[#2196F3]/60 focus:ring-1 focus:ring-[#2196F3]/30"
      }`}
                >
                  <option value="" disabled hidden={!!empresaIdSelecionada}>
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
                  value={tipoUsuarioSelecionado}
                  onChange={(e) => setTipoUsuarioSelecionado(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] rounded-xl border border-gray-700 transition-all duration-200 outline-none appearance-none cursor-pointer hover:border-[#2196F3]/50 focus:border-[#2196F3]/60 focus:ring-1 focus:ring-[#2196F3]/30"
                >
                  <option value="" disabled>
                    Selecione o tipo de usuário
                  </option>
                  {TIPOS_USUARIO.map((tipo) => (
                    <option key={tipo.id} value={String(tipo.id)}>
                      {tipo.nome}
                    </option>
                  ))}
                </select>
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
          </>
        )}
      </div>
    </div>
  );
}
