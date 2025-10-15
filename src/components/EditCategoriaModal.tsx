"use client";

import { FormEvent, useEffect, useState } from "react";
import { CategoriaSchema, TCategoriaSchema } from "@/schemas/auth";

type FormErrors = Partial<TCategoriaSchema>;

interface EditCategoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriaUpdated: () => void;
  categoriaId: number | null;
}

export default function EditCategoriaModal({
  isOpen,
  onClose,
  onCategoriaUpdated,
  categoriaId,
}: EditCategoriaModalProps) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"receita" | "despesa" | "">("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (isOpen && categoriaId) {
      setLoading(true);
      const fetchCategoria = async () => {
        try {
          const res = await fetch(`/api/auth/categorias/${categoriaId}`);
          if (res.ok) {
            const data = await res.json();
            setNome(data.nome || "");
            setTipo(data.tipo || "");
          } else {
            console.error("Erro ao carregar categoria:", res.statusText);
            alert("Erro ao carregar informações da categoria.");
            onClose();
          }
        } catch (error) {
          console.error("Erro na requisição GET:", error);
          alert("Falha ao carregar categoria.");
          onClose();
        } finally {
          setLoading(false);
        }
      };
      fetchCategoria();
    } else if (!isOpen) {
      setErrors({});
    }
  }, [isOpen, categoriaId, onClose]);

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

    if (!categoriaId) return;

    setSalvando(true);
    try {
      const res = await fetch(`/api/auth/categorias/${categoriaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, tipo }),
      });

      if (res.ok) {
        onCategoriaUpdated();
        onClose();
      } else {
        const errorData = await res.json();
        console.error("Erro ao atualizar categoria:", errorData);
        alert(`Erro ao atualizar: ${errorData.error || res.statusText}`);
      }
    } catch (error) {
      console.error("Erro na requisição PUT:", error);
      alert("Erro de conexão ao atualizar categoria.");
    } finally {
      setSalvando(false);
    }
  };

  if (!isOpen || !categoriaId) return null;

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
                Editar Categoria
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
              {/* Nome */}
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
                  className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] outline-none rounded-xl 
                  ${
                    errors.nome
                      ? "border-2 border-[#FF5252]"
                      : "focus:ring-2 focus:ring-[#2196F3]"
                  }`}
                />
                {errors.nome && (
                  <p className="text-[#FF5252] text-xs mt-1">{errors.nome}</p>
                )}
              </div>

              {/* Tipo */}
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-1 text-[#E0E0E0]"
                  htmlFor="tipo"
                >
                  Tipo
                </label>
                <select
                  id="tipo"
                  name="tipo"
                  value={tipo}
                  onChange={(e) =>
                    setTipo(e.target.value as "receita" | "despesa" | "")
                  }
                  className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] rounded-xl outline-none
                  ${
                    errors.tipo
                      ? "border-2 border-[#FF5252]"
                      : "focus:ring-2 focus:ring-[#2196F3]"
                  }`}
                >
                  <option value="">Selecione...</option>
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                </select>
                {errors.tipo && (
                  <p className="text-[#FF5252] text-xs mt-1">{errors.tipo}</p>
                )}
              </div>

              {/* Botões */}
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
