"use client";

import { useState, useEffect, FormEvent, useCallback } from "react";
import {
  UsuarioSchema,
  UsuarioEditSchema,
  TUsuarioSchema,
  TUsuarioEditSchema,
} from "@/schemas/auth";
import { Plus } from "lucide-react";
import ModalEmpresa from "./ModalEmpresa";

interface ModalUserProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "create" | "edit";
  userId: number | null;
}

interface Empresa {
  id: number;
  nome: string;
}

type FormErrors = Partial<Record<string, string>>;

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

export default function ModalUser({
  isOpen,
  onClose,
  onSuccess,
  mode,
  userId,
}: ModalUserProps) {
  const isEdit = mode === "edit";

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [empresaId, setEmpresaId] = useState<string>("");
  const [tipoUsuario, setTipoUsuario] = useState<string>("");

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [isModalEmpresaOpen, setIsModalEmpresaOpen] = useState(false);

  async function carregarEmpresas() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/empresas");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setEmpresas(data);
      } else {
        console.error("Erro ao carregar empresas:", res.statusText);
      }
    } catch (err) {
      console.error("Erro ao carregar empresas:", err);
    } finally {
      setLoading(false);
    }
  }

  const carregarUsuario = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/auth/usuarios/${userId}`);
      if (!res.ok) {
        alert("Falha ao carregar usuário.");
        return;
      }
      const data = await res.json();
      setNome(data.nome || "");
      setEmail(data.email || "");
      setEmpresaId(data.empresa_id != null ? String(data.empresa_id) : "");
      setTipoUsuario(getTipoIdByNome(data.tipo_usuario ?? null));
    } catch (err) {
      console.error("Erro ao carregar usuário:", err);
      alert("Erro ao carregar usuário.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen) {
      carregarEmpresas();
      if (isEdit) carregarUsuario();
    }
  }, [isOpen, isEdit, carregarUsuario]);

  useEffect(() => {
    if (!isOpen) {
      setNome("");
      setEmail("");
      setSenha("");
      setEmpresaId("");
      setTipoUsuario("");
      setErrors({});
      setLoading(false);
      setSalvando(false);
    }
  }, [isOpen]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    const dataToSend = {
      nome,
      email,
      tipo_usuario: tipoUsuario,
      empresa_id: empresaId !== "" ? Number(empresaId) : null,
      ...(isEdit ? {} : { senha }),
    } as unknown as TUsuarioSchema & Partial<TUsuarioEditSchema>;

    if (!isEdit) {
      dataToSend.senha = senha;
    }

    const schema = isEdit ? UsuarioEditSchema : UsuarioSchema;
    const validation = schema.safeParse(dataToSend);

    if (!validation.success) {
      const fieldErrors: FormErrors = {};
      validation.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof (TUsuarioSchema &
          TUsuarioEditSchema);
        fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSalvando(true);

    try {
      const url = isEdit
        ? `/api/auth/usuarios/${userId}`
        : "/api/auth/usuarios";
      const method = isEdit ? "PUT" : "POST";
      const body = isEdit
        ? JSON.stringify(dataToSend)
        : JSON.stringify({ data: dataToSend });

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || "Erro ao salvar usuário");
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Erro ao salvar usuário:", err);
      alert("Erro de conexão ao salvar usuário.");
    } finally {
      setSalvando(false);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
        <div className="bg-[#161B22] p-6 rounded-2xl w-full max-w-md shadow-2xl text-white">
          <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
            <h2 className="text-xl font-semibold text-[#E0E0E0]">
              {isEdit ? "Editar Usuário" : "Novo Usuário"}
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
            <p className="text-center py-6 text-[#E0E0E0]">
              Carregando dados...
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="nome"
                  className="block mb-1 text-sm text-[#E0E0E0]"
                >
                  Nome
                </label>
                <input
                  id="nome"
                  name="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className={`w-full px-4 h-[44px] bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none border transition ${
                    errors.nome
                      ? "border-[#FF5252] ring-1 ring-[#FF5252]/40"
                      : "border-gray-700 hover:border-[#2196F3]/50 focus:border-[#2196F3]"
                  }`}
                />
                {errors.nome && (
                  <p className="text-[#FF5252] text-xs mt-1">{errors.nome}</p>
                )}
              </div>

              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block mb-1 text-sm text-[#E0E0E0]"
                >
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 h-[44px] bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none border transition ${
                    errors.email
                      ? "border-[#FF5252] ring-1 ring-[#FF5252]/40"
                      : "border-gray-700 hover:border-[#2196F3]/50 focus:border-[#2196F3]"
                  }`}
                />
                {errors.email && (
                  <p className="text-[#FF5252] text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {!isEdit && (
                <div className="mb-4">
                  <label
                    htmlFor="senha"
                    className="block mb-1 text-sm text-[#E0E0E0]"
                  >
                    Senha
                  </label>
                  <input
                    id="senha"
                    name="senha"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className={`w-full px-4 h-[44px] bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none border transition ${
                      errors.senha
                        ? "border-[#FF5252] ring-1 ring-[#FF5252]/40"
                        : "border-gray-700 hover:border-[#2196F3]/50 focus:border-[#2196F3]"
                    }`}
                  />
                  {errors.senha && (
                    <p className="text-[#FF5252] text-xs mt-1">
                      {errors.senha}
                    </p>
                  )}
                  <label className="text-xs text-[#9E9E9E] mt-1 block">
                    * Recomendamos que o novo usuário altere a senha no primeiro
                    login
                  </label>
                </div>
              )}

              <div className="mb-4">
                <label
                  htmlFor="tipo_usuario"
                  className="block mb-1 text-sm text-[#E0E0E0]"
                >
                  Tipo de Usuário
                </label>
                <select
                  id="tipo_usuario"
                  name="tipo_usuario"
                  value={tipoUsuario}
                  onChange={(e) => setTipoUsuario(e.target.value)}
                  className={`w-full px-4 h-[44px] bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none border transition ${
                    errors.tipo_usuario
                      ? "border-[#FF5252] ring-1 ring-[#FF5252]/40"
                      : "border-gray-700 hover:border-[#2196F3]/50 focus:border-[#2196F3]"
                  }`}
                >
                  <option value="" disabled>
                    Selecione o tipo de usuário
                  </option>
                  {TIPOS_USUARIO.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.nome}
                    </option>
                  ))}
                </select>
                {errors.tipo_usuario && (
                  <p className="text-[#FF5252] text-xs mt-1">
                    {errors.tipo_usuario}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="empresa_id"
                    className="text-sm text-[#E0E0E0]"
                  >
                    Empresa
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsModalEmpresaOpen(true)}
                    className="p-1 rounded-xl border border-gray-700 text-[#E0E0E0] transition-all duration-200 hover:border-[#2196F3]/50 hover:ring-1 hover:ring-[#2196F3]/30 focus:border-[#2196F3]/60 focus:ring-1 focus:ring-[#2196F3]/30"
                    aria-label="Adicionar empresa"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <select
                  id="empresa_id"
                  name="empresa_id"
                  value={empresaId}
                  onChange={(e) => setEmpresaId(e.target.value)}
                  disabled={loading || empresas.length === 0}
                  className={`w-full px-4 h-[44px] bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none border transition ${
                    errors.empresa_id
                      ? "border-[#FF5252] ring-1 ring-[#FF5252]/40"
                      : loading || empresas.length === 0
                        ? "border-gray-800 opacity-60 cursor-not-allowed"
                        : "border-gray-700 hover:border-[#2196F3]/50 focus:border-[#2196F3]"
                  }`}
                >
                  <option value="" disabled>
                    {loading
                      ? "Carregando empresas..."
                      : empresas.length === 0
                        ? "Nenhuma empresa encontrada"
                        : "Selecione a empresa"}
                  </option>
                  {empresas.map((emp) => (
                    <option key={emp.id} value={String(emp.id)}>
                      {emp.nome}
                    </option>
                  ))}
                </select>
                {errors.empresa_id && (
                  <p className="text-[#FF5252] text-xs mt-1">
                    {errors.empresa_id}
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

      <ModalEmpresa
        isOpen={isModalEmpresaOpen}
        onClose={() => setIsModalEmpresaOpen(false)}
        onSuccess={carregarEmpresas}
        mode="create"
      />
    </>
  );
}
