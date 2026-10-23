"use client";

import { useState, useEffect, FormEvent, useCallback } from "react";
import { LancamentoSchema, TLancamentoSchema } from "@/schemas/auth";
import { NumericFormat } from "react-number-format";
import InputData from "./ui/InputData";
import { Plus } from "lucide-react";
import ModalCategoria from "./ModalCategoria";
import { Button } from "./ui/button";
import { Dialog, DialogFooter } from "./ui/dialog";
import { Field } from "./ui/field";
import { Input, fieldClasses } from "./ui/input";
import { NativeSelect } from "./ui/select";
import { InlineAlert, LoadingState, Skeleton } from "./ui/feedback";
import { useFocoAposFalha } from "@/lib/foco";
import { TipoBadge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "./feedback/toast";

interface ModalLancamentoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "create" | "edit";
  lancamentoId: string | null;
}

interface Categoria {
  id: string;
  nome: string;
  tipo: string;
}

interface Carteira {
  id: string;
  nome: string;
}

interface Cartao {
  id: string;
  nome: string;
}

type FormErrors = Partial<Record<keyof TLancamentoSchema, string>>;

export default function ModalLancamento({
  isOpen,
  onClose,
  onSuccess,
  mode,
  lancamentoId,
}: ModalLancamentoProps) {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState("");
  const [data, setData] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carteiraId, setCarteiraId] = useState("");
  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [cartaoId, setCartaoId] = useState("");
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [pagarComCartao, setPagarComCartao] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const envioRef = useFocoAposFalha<HTMLButtonElement>(salvando, erroEnvio !== null);
  const [isModalCategoriaOpen, setIsModalCategoriaOpen] = useState(false);

  async function carregarCategorias() {
    try {
      const res = await fetch("/api/categorias");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setCategorias(data);
      }
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
    }
  }

  async function carregarCarteiras() {
    try {
      const res = await fetch("/api/carteiras");
      if (!res.ok) {
        setErroEnvio("Falha ao carregar carteiras.");
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) setCarteiras(data);
    } catch (err) {
      console.error("Erro ao carregar carteiras:", err);
      setErroEnvio("Erro ao carregar carteiras.");
    }
  }

  async function carregarCartoes() {
    try {
      const res = await fetch("/api/cartoes");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setCartoes(data);
      }
    } catch (err) {
      console.error("Erro ao carregar cartões:", err);
    }
  }

  const carregarLancamento = useCallback(async () => {
    if (!lancamentoId) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/lancamentos/${lancamentoId}`);
      if (!res.ok) {
        setErroEnvio("Falha ao carregar lançamento.");
        return;
      }

      const data = await res.json();

      setDescricao(data.descricao || "");
      setValor(
        Number(data.valor)
          .toFixed(2)
          .replace(".", ",")
          .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
      );
      setTipo(data.tipo || "");
      setData(data.data ? data.data.split("T")[0] : "");
      setCategoriaId(data.categoria_id ? String(data.categoria_id) : "");
      setCarteiraId(data.carteira_id ? String(data.carteira_id) : "");
      setCartaoId(data.cartao_id ? String(data.cartao_id) : "");
      setPagarComCartao(Boolean(data.cartao_id));
    } catch (err) {
      console.error("Erro ao carregar lançamento:", err);
      setErroEnvio("Erro ao carregar lançamento.");
    } finally {
      setLoading(false);
    }
  }, [lancamentoId]);

  useEffect(() => {
    if (isOpen) {
      carregarCategorias();
      carregarCarteiras();
      carregarCartoes();

      if (mode === "edit") carregarLancamento();
    }
  }, [isOpen, mode, lancamentoId, carregarLancamento]);

  useEffect(() => {
    if (!isOpen) {
      setDescricao("");
      setValor("");
      setTipo("");
      setData("");
      setCategoriaId("");
      setCarteiraId("");
      setCartaoId("");
      setPagarComCartao(false);
      setErrors({});
      setErroEnvio(null);
      setLoading(false);
      setSalvando(false);
    }
  }, [isOpen]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setErroEnvio(null);

    const valorNumerico = Number(
      valor.replace(/[^\d,-]/g, "").replace(",", ".")
    );

    const usaCartao = tipo === "despesa" && pagarComCartao;

    const dataForm = {
      descricao,
      valor: valorNumerico,
      tipo,
      data,
      categoria_id: categoriaId || null,
      carteira_id: usaCartao ? null : carteiraId,
      cartao_id: usaCartao ? cartaoId : null,
    };

    const validation = LancamentoSchema.safeParse(dataForm);

    if (!validation.success || (usaCartao && !cartaoId)) {
      const errs: FormErrors = {};
      if (usaCartao && !cartaoId) errs.cartao_id = "O cartão é obrigatório.";
      if (!validation.success) {
        validation.error.issues.forEach((issue) => {
          if (usaCartao && issue.path[0] === "carteira_id") return;
          errs[issue.path[0] as keyof TLancamentoSchema] = issue.message;
        });
      }
      setErrors(errs);
      return;
    }

    setSalvando(true);

    try {
      const url =
        mode === "create"
          ? "/api/lancamentos"
          : `/api/lancamentos/${lancamentoId}`;

      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataForm),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setErroEnvio(errorData.error || "Erro ao salvar lançamento");
        return;
      }

      const salvo = await res.json();
      if (salvo.aviso) toast.warning(`Lançamento salvo. ${salvo.aviso}`);

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Erro ao salvar lançamento:", err);
      setErroEnvio("Erro ao salvar lançamento.");
    } finally {
      setSalvando(false);
    }
  }

  function escolherTipo(novoTipo: string) {
    setTipo(novoTipo);
    setCategoriaId("");
    if (novoTipo !== "despesa") setPagarComCartao(false);
  }

  if (!isOpen) return null;

  const escolhendoTipo = mode === "create" && !tipo;
  const usaCartaoNaTela = tipo === "despesa" && pagarComCartao;
  const tipoCategoria =
    tipo === "receita" || tipo === "despesa" ? tipo : undefined;

  return (
    <>
      <Dialog
        open
        onClose={onClose}
        dismissible={!salvando}
        title={mode === "create" ? "Novo Lançamento" : "Editar Lançamento"}
      >
        {loading ? (
          <LoadingState label="Carregando dados...">
            <div className="space-y-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          </LoadingState>
        ) : escolhendoTipo ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Qual o tipo do lançamento?
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => escolherTipo("despesa")}
              >
                Despesa
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => escolherTipo("receita")}
              >
                Receita
              </Button>
            </div>
            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" size="lg" onClick={onClose}>
                Cancelar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {erroEnvio && <InlineAlert tone="error">{erroEnvio}</InlineAlert>}

            {tipo && (
              <div className="flex items-center justify-between gap-3">
                <TipoBadge tipo={tipo} />
                {mode === "create" && (
                  <button
                    type="button"
                    onClick={() => escolherTipo("")}
                    className="touch-target rounded-md px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    Alterar tipo
                  </button>
                )}
              </div>
            )}

            <Field
              id="lancamento-descricao"
              label="Descrição"
              error={errors.descricao}
            >
              <Input
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </Field>

            <Field id="lancamento-valor" label="Valor (R$)" error={errors.valor}>
              <NumericFormat
                value={valor}
                onValueChange={(v) => setValor(v.formattedValue)}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                inputMode="decimal"
                className={cn(fieldClasses, "h-11 px-3.5 tabular-nums")}
              />
            </Field>

            <Field
              id="lancamento-data"
              label={usaCartaoNaTela ? "Data da Compra" : "Data de Pagamento"}
              error={errors.data}
            >
              <InputData value={data} onChange={(iso) => setData(iso)} />
            </Field>

            <Field
              id="lancamento-categoria"
              label="Categoria"
              error={errors.categoria_id}
              action={
                <button
                  type="button"
                  onClick={() => setIsModalCategoriaOpen(true)}
                  className="touch-target -my-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Plus aria-hidden className="size-3.5" />
                  Nova categoria
                </button>
              }
            >
              <NativeSelect
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
              >
                <option value="" disabled>
                  Selecione uma categoria
                </option>

                {categorias
                  .filter((c) => c.tipo === tipo)
                  .map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.nome}
                    </option>
                  ))}
              </NativeSelect>
            </Field>

            {tipo === "despesa" && (
              <Field id="lancamento-forma" label="Pagar com">
                <NativeSelect
                  value={pagarComCartao ? "cartao" : "carteira"}
                  onChange={(e) => setPagarComCartao(e.target.value === "cartao")}
                >
                  <option value="carteira">Carteira</option>
                  <option value="cartao">Cartão de crédito</option>
                </NativeSelect>
              </Field>
            )}

            {usaCartaoNaTela ? (
              <Field
                id="lancamento-cartao"
                label="Cartão"
                error={errors.cartao_id}
                hint="O valor só sai da carteira quando a fatura for paga."
              >
                <NativeSelect
                  value={cartaoId}
                  onChange={(e) => setCartaoId(e.target.value)}
                >
                  <option value="" disabled>
                    Selecione um cartão
                  </option>

                  {cartoes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            ) : (
              <Field
                id="lancamento-carteira"
                label="Carteira"
                error={errors.carteira_id}
              >
                <NativeSelect
                  value={carteiraId}
                  onChange={(e) => setCarteiraId(e.target.value)}
                >
                  <option value="" disabled>
                    Selecione uma carteira
                  </option>

                  {carteiras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            )}

            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={onClose}
                disabled={salvando}
              >
                Cancelar
              </Button>

              <Button ref={envioRef} type="submit" size="lg" disabled={salvando}>
                {salvando
                  ? "Salvando..."
                  : mode === "create"
                    ? "Salvar"
                    : "Atualizar"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </Dialog>

      <ModalCategoria
        isOpen={isModalCategoriaOpen}
        onClose={() => setIsModalCategoriaOpen(false)}
        onSuccess={carregarCategorias}
        mode="create"
        tipoFixo={tipoCategoria}
      />
    </>
  );
}
