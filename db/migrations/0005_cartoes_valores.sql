-- Issue #23 (correção): precisão monetária das compras de cartão e dos
-- pagamentos de fatura. O serviço já normaliza para centavos; estas
-- constraints impedem total e pagamentos divergentes mesmo fora da API.
-- Só valem para compras de cartão (fatura_id) e pagamentos; lançamentos de
-- carteira não mudam de comportamento.
--
-- lancamentos.valor e pagamentos_fatura.valor são numeric sem escala e a 0004
-- não limitava as casas, então a API (antes da correção) pode ter gravado
-- valores como 10.005. Antes das constraints, os dados são normalizados com
-- round(valor, 2) (meio para longe do zero, a mesma regra do serviço) e três
-- condições que não têm correção automática segura interrompem a migration
-- (rollback, nada é alterado):
--   * compra de cartão com valor <= 0 depois do arredondamento;
--   * pagamento com valor <= 0 depois do arredondamento;
--   * fatura que estava quitada e deixaria de estar: o arredondamento é feito
--     por compra, então a soma arredondada pode ser maior que o total antigo
--     arredondado (ex.: 3 x 3.335 = 10.005 -> 10.01, mas 3 x 3.34 = 10.02);
--   * fatura que ficaria com o total pago acima do total dos lançamentos.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.lancamentos
    WHERE fatura_id IS NOT NULL AND round(valor, 2) <= 0
  ) THEN
    RAISE EXCEPTION 'Migração #23 (0005) interrompida: há compra(s) de cartão com valor zero ou negativo. Corrija-as manualmente antes de aplicar (nenhum dado foi alterado).';
  END IF;

  IF EXISTS (SELECT 1 FROM public.pagamentos_fatura WHERE round(valor, 2) <= 0) THEN
    RAISE EXCEPTION 'Migração #23 (0005) interrompida: há pagamento(s) de fatura que arredondam para zero. Corrija-os manualmente antes de aplicar (nenhum dado foi alterado).';
  END IF;

  -- Quitada antes: pago (sem estornos) cobre o total, ambos em centavos, como
  -- no serviço. Depois: pago normalizado menor que o total normalizado.
  IF EXISTS (
    SELECT 1
    FROM public.faturas f
    CROSS JOIN LATERAL (
      SELECT COALESCE(SUM(l.valor), 0) AS bruto, COALESCE(SUM(round(l.valor, 2)), 0) AS normalizado
      FROM public.lancamentos l WHERE l.fatura_id = f.id
    ) t
    CROSS JOIN LATERAL (
      SELECT COALESCE(SUM(p.valor), 0) AS bruto, COALESCE(SUM(round(p.valor, 2)), 0) AS normalizado
      FROM public.pagamentos_fatura p WHERE p.fatura_id = f.id AND p.estornado_em IS NULL
    ) g
    WHERE t.bruto > 0
      AND round(g.bruto, 2) >= round(t.bruto, 2)
      AND g.normalizado < t.normalizado
  ) THEN
    RAISE EXCEPTION 'Migração #23 (0005) interrompida: o arredondamento por compra faria fatura(s) quitada(s) voltarem a ter saldo pendente. Estorne ou corrija os pagamentos manualmente antes de aplicar (nenhum dado foi alterado).';
  END IF;
END $$;

UPDATE public.lancamentos
SET valor = round(valor, 2), atualizado_em = NOW()
WHERE fatura_id IS NOT NULL AND valor <> round(valor, 2);

UPDATE public.pagamentos_fatura
SET valor = round(valor, 2)
WHERE valor <> round(valor, 2);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.faturas f
    WHERE COALESCE((SELECT SUM(p.valor) FROM public.pagamentos_fatura p
                    WHERE p.fatura_id = f.id AND p.estornado_em IS NULL), 0)
        > COALESCE((SELECT SUM(l.valor) FROM public.lancamentos l
                    WHERE l.fatura_id = f.id), 0)
  ) THEN
    RAISE EXCEPTION 'Migração #23 (0005) interrompida: o arredondamento deixaria fatura(s) com total pago acima do total dos lançamentos. Estorne ou corrija os pagamentos manualmente antes de aplicar (nenhum dado foi alterado).';
  END IF;
END $$;

ALTER TABLE public.lancamentos
  ADD CONSTRAINT lancamentos_fatura_valor_check
  CHECK (fatura_id IS NULL OR (valor > 0 AND valor = round(valor, 2)));

ALTER TABLE public.pagamentos_fatura
  ADD CONSTRAINT pagamentos_fatura_valor_centavos_check
  CHECK (valor = round(valor, 2));
