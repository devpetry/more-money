"use client";

import { FormEvent, useEffect, useState } from "react";
import CnpjInput from "./CnpjInput";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmpresaUpdated: () => void;
  empresaId: number | null;
}

export default function EditEmpresaModal({
  isOpen,
  onClose,
  onEmpresaUpdated,
  empresaId,
}: EditUserModalProps) {
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (isOpen && empresaId) {
      setLoading(true);
      const fetchEmpresa = async () => {
        try {
          const res = await fetch(`/api/auth/empresas/${empresaId}`);
          if (res.ok) {
            const data = await res.json();
            setNome(data.nome || "");
            setCnpj(data.cnpj || "");
          } else {
            console.error("Erro ao carregar empresa:", res.statusText);
            alert("Erro ao carregar informações da empresa.");
            onClose();
          }
        } catch (error) {
          console.error("Erro na requisição GET:", error);
          alert("Falha ao carregar empresa.");
          onClose();
        } finally {
          setLoading(false);
        }
      };
      fetchEmpresa();
    }
  }, [isOpen, empresaId, onClose]);

  // Enviar dados atualizados
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!empresaId) return;

    setSalvando(true);
    try {
      const res = await fetch(`/api/auth/empresas/${empresaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, cnpj }),
      });

      if (res.ok) {
        onEmpresaUpdated();
        onClose();
      } else {
        const errorData = await res.json();
        console.error("Erro ao atualizar empresa:", errorData);
        alert(`Erro ao atualizar: ${errorData.error || res.statusText}`);
      }
    } catch (error) {
      console.error("Erro na requisição PUT:", error);
      alert("Erro de conexão ao atualizar empresa.");
    } finally {
      setSalvando(false);
    }
  };

  if (!isOpen || !empresaId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="bg-[#161B22] p-6 rounded-2xl w-full max-w-md shadow-2xl text-white relative">
        {loading ? (
          <p className="text-center text-[#E0E0E0] py-8">
            Carregando dados da empresa...
          </p>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
              <h2 className="text-xl font-semibold text-[#E0E0E0]">
                Editar Empresa
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
                <CnpjInput
                  name="cnpj"
                  label="CNPJ"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  required
                  className="focus:ring-2 focus:ring-[#2196F3]"
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
