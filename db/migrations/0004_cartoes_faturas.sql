-- Issue #23: cartões de crédito, faturas e pagamentos de fatura.
--
-- Migration aditiva (compatível com o código antigo durante o build):
--   * cartoes: dias padrão de fechamento e vencimento.
--   * faturas: um ciclo (mês) por cartão. As datas de fechamento/vencimento são
--     gravadas na fatura e podem ser ajustadas individualmente. O estado
--     (aberta / fechada pendente / parcialmente paga / paga) é DERIVADO do
--     fechamento, do total dos lançamentos e dos pagamentos; não há coluna de
--     estado. fechada_em registra só o fechamento manual; o fechamento
--     automático é data_fechamento <= hoje (America/Sao_Paulo).
--   * pagamentos_fatura: um registro por pagamento (parciais permitidos).
--     Estorno preserva a linha original (estornado_em).
--   * lancamentos.fatura_id: despesa de cartão fica sem carteira_id, portanto
--     não entra no saldo das carteiras até o pagamento da fatura.

CREATE TABLE public.cartoes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nome character varying NOT NULL,
    usuario_id uuid NOT NULL,
    dia_fechamento smallint NOT NULL,
    dia_vencimento smallint NOT NULL,
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone DEFAULT now(),
    CONSTRAINT cartoes_pkey PRIMARY KEY (id),
    CONSTRAINT cartoes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id),
    CONSTRAINT cartoes_usuario_id_nome_key UNIQUE (usuario_id, nome),
    CONSTRAINT cartoes_dia_fechamento_check CHECK (dia_fechamento BETWEEN 1 AND 31),
    CONSTRAINT cartoes_dia_vencimento_check CHECK (dia_vencimento BETWEEN 1 AND 31)
);

CREATE TABLE public.faturas (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    cartao_id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    ciclo date NOT NULL,
    data_fechamento date NOT NULL,
    data_vencimento date NOT NULL,
    fechada_em timestamp with time zone,
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone DEFAULT now(),
    CONSTRAINT faturas_pkey PRIMARY KEY (id),
    -- Sem ON DELETE CASCADE: cartão com fatura (histórico) não pode ser excluído
    CONSTRAINT faturas_cartao_id_fkey FOREIGN KEY (cartao_id) REFERENCES public.cartoes(id),
    CONSTRAINT faturas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id),
    CONSTRAINT faturas_cartao_id_ciclo_key UNIQUE (cartao_id, ciclo),
    CONSTRAINT faturas_ciclo_primeiro_dia_check CHECK (EXTRACT(DAY FROM ciclo) = 1)
);

CREATE TABLE public.pagamentos_fatura (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    fatura_id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    carteira_id uuid NOT NULL,
    valor numeric NOT NULL,
    data date NOT NULL,
    estornado_em timestamp with time zone,
    criado_em timestamp with time zone DEFAULT now(),
    CONSTRAINT pagamentos_fatura_pkey PRIMARY KEY (id),
    CONSTRAINT pagamentos_fatura_fatura_id_fkey FOREIGN KEY (fatura_id) REFERENCES public.faturas(id),
    CONSTRAINT pagamentos_fatura_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id),
    CONSTRAINT pagamentos_fatura_carteira_id_fkey FOREIGN KEY (carteira_id) REFERENCES public.carteiras(id),
    CONSTRAINT pagamentos_fatura_valor_check CHECK (valor > 0)
);

CREATE INDEX cartoes_usuario_id_idx ON public.cartoes USING btree (usuario_id);
CREATE INDEX faturas_usuario_id_idx ON public.faturas USING btree (usuario_id);
CREATE INDEX pagamentos_fatura_fatura_id_idx ON public.pagamentos_fatura USING btree (fatura_id);
CREATE INDEX pagamentos_fatura_carteira_id_idx ON public.pagamentos_fatura USING btree (carteira_id);

ALTER TABLE public.lancamentos ADD COLUMN fatura_id uuid;
ALTER TABLE public.lancamentos
  ADD CONSTRAINT lancamentos_fatura_id_fkey FOREIGN KEY (fatura_id) REFERENCES public.faturas(id);
CREATE INDEX lancamentos_fatura_id_idx ON public.lancamentos USING btree (fatura_id);

-- Compra no cartão: sempre despesa e nunca em carteira (só o pagamento da
-- fatura movimenta a carteira).
ALTER TABLE public.lancamentos
  ADD CONSTRAINT lancamentos_fatura_despesa_sem_carteira_check
  CHECK (fatura_id IS NULL OR (tipo = 'despesa' AND carteira_id IS NULL));

-- Único ajuste no trigger da #22: não atribuir a carteira Digital a despesas
-- de cartão. Os demais lançamentos mantêm o comportamento anterior.
CREATE OR REPLACE FUNCTION public.lancamentos_carteira_padrao() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.carteira_id IS NULL AND NEW.fatura_id IS NULL AND NEW.usuario_id IS NOT NULL THEN
    INSERT INTO public.carteiras (usuario_id, nome)
    VALUES (NEW.usuario_id, 'Digital')
    ON CONFLICT (usuario_id, nome) DO NOTHING;

    SELECT id INTO NEW.carteira_id
    FROM public.carteiras
    WHERE usuario_id = NEW.usuario_id AND nome = 'Digital';
  END IF;
  RETURN NEW;
END $$;
