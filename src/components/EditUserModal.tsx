"use client";

import { FormEvent, useEffect, useState } from "react";

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

export default function EditUserModal({
  isOpen,
  onClose,
  onUserUpdated,
  userId,
}: EditUserModalProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [empresaIdSelecionada, setEmpresaIdSelecionada] = useState<
    number | string
  >("");
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
      carregarEmpresas();
      setLoading(true);
      const fetchUser = async () => {
        try {
          const res = await fetch(`/api/auth/usuarios/${userId}`);
          if (res.ok) {
            const data = await res.json();
            setNome(data.nome || "");
            setEmail(data.email || "");
            setEmpresaIdSelecionada(data.empresa_id || "");
            setSenha("");
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
    }
  }, [isOpen, userId, onClose]);

  // Enviar dados atualizados
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return;

    setSalvando(true);
    const empresaIdToUpdate = empresaIdSelecionada || null;

    try {
      const res = await fetch(`/api/auth/usuarios/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          email,
          empresa_id: empresaIdToUpdate,
          senha: senha || undefined,
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
                  className="w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] outline-none rounded-xl focus:ring-2 focus:ring-[#2196F3]"
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
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] outline-none rounded-xl focus:ring-2 focus:ring-[#2196F3]"
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
                  value={empresaIdSelecionada}
                  onChange={(e) => setEmpresaIdSelecionada(e.target.value)}
                  className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] outline-none rounded-xl appearance-none cursor-pointer
${"focus:ring-2 focus:ring-[#2196F3]"}`}
                  required
                  disabled={loadingEmpresas || empresas.length === 0}
                >
                  <option value="" disabled hidden={!!empresaIdSelecionada}>
                    {loadingEmpresas
                      ? "Carregando empresas..."
                      : empresas.length === 0
                        ? "Nenhuma empresa encontrada"
                        : "Selecione uma empresa"}
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
                  htmlFor="senha"
                >
                  Nova Senha (opcional)
                </label>
                <input
                  id="senha"
                  name="senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Deixe em branco para manter a atual"
                  className="w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] outline-none rounded-xl focus:ring-2 focus:ring-[#2196F3]"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-gray-600 hover:bg-gray-700 text-[#161B22] font-bold py-2 px-4 rounded-xl disabled:opacity-50"
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
