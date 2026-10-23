-- Issue #22: carteiras por usuário (Física e Digital) e lancamentos.carteira_id.
--
-- Migração em duas etapas, porque o código antigo continua no ar durante o
-- build e insere lançamentos sem carteira_id:
--   Etapa 1 (esta migration): cria carteiras, associa os lançamentos existentes
--     à Digital e deixa carteira_id NULLABLE. Um trigger temporário preenche a
--     carteira Digital quando o código antigo insere sem carteira_id.
--   Etapa 2 (migration SEPARADA, só depois que o código novo estiver em
--     produção): remove o trigger, repete o preenchimento (idempotente) e
--     aplica NOT NULL. Veja "Migrations do banco" no README.

-- Lançamento sem usuário não tem a quem pertencer: não é excluído nem atribuído.
DO $$
DECLARE n bigint;
BEGIN
  SELECT count(*) INTO n FROM public.lancamentos WHERE usuario_id IS NULL;
  IF n > 0 THEN
    RAISE EXCEPTION 'Migração #22 interrompida: % lançamento(s) com usuario_id NULL. Resolva-os manualmente antes de aplicar (nenhum dado foi alterado).', n;
  END IF;
END $$;

CREATE TEMP TABLE _antes ON COMMIT DROP AS
SELECT (SELECT count(*) FROM public.lancamentos) AS l,
       (SELECT count(*) FROM public.usuarios) AS u;

CREATE TABLE public.carteiras (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nome character varying NOT NULL,
    usuario_id uuid NOT NULL,
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone DEFAULT now(),
    CONSTRAINT carteiras_pkey PRIMARY KEY (id),
    CONSTRAINT carteiras_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id),
    CONSTRAINT carteiras_usuario_id_nome_key UNIQUE (usuario_id, nome)
);

-- Todos os usuários, inclusive os excluídos (seus lançamentos também precisam de carteira)
INSERT INTO public.carteiras (usuario_id, nome)
SELECT u.id, n.nome
FROM public.usuarios u
CROSS JOIN (VALUES ('Física'), ('Digital')) AS n(nome)
ON CONFLICT (usuario_id, nome) DO NOTHING;

ALTER TABLE public.lancamentos ADD COLUMN carteira_id uuid;
ALTER TABLE public.lancamentos
  ADD CONSTRAINT lancamentos_carteira_id_fkey FOREIGN KEY (carteira_id) REFERENCES public.carteiras(id);
CREATE INDEX lancamentos_carteira_id_idx ON public.lancamentos USING btree (carteira_id);

-- Junção por usuario_id: nenhum lançamento recebe carteira de outro usuário
UPDATE public.lancamentos l
SET carteira_id = c.id
FROM public.carteiras c
WHERE c.usuario_id = l.usuario_id
  AND c.nome = 'Digital';

-- Compatibilidade com o código antigo (removido na etapa 2): insere sem
-- carteira_id e, se o usuário nasceu depois desta migration, sem carteiras.
CREATE FUNCTION public.lancamentos_carteira_padrao() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.carteira_id IS NULL AND NEW.usuario_id IS NOT NULL THEN
    INSERT INTO public.carteiras (usuario_id, nome)
    VALUES (NEW.usuario_id, 'Digital')
    ON CONFLICT (usuario_id, nome) DO NOTHING;

    SELECT id INTO NEW.carteira_id
    FROM public.carteiras
    WHERE usuario_id = NEW.usuario_id AND nome = 'Digital';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER lancamentos_carteira_padrao
BEFORE INSERT ON public.lancamentos
FOR EACH ROW EXECUTE FUNCTION public.lancamentos_carteira_padrao();

DO $$
DECLARE a record;
BEGIN
  SELECT * INTO a FROM _antes;
  IF (SELECT count(*) FROM public.lancamentos) <> a.l THEN
    RAISE EXCEPTION 'Migração #22: contagem de lançamentos divergiu';
  END IF;
  IF EXISTS (SELECT 1 FROM public.lancamentos WHERE carteira_id IS NULL) THEN
    RAISE EXCEPTION 'Migração #22: lançamento sem carteira após o preenchimento';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.lancamentos l
    JOIN public.carteiras c ON c.id = l.carteira_id
    WHERE c.usuario_id <> l.usuario_id OR c.nome <> 'Digital'
  ) THEN
    RAISE EXCEPTION 'Migração #22: lançamento associado à carteira errada';
  END IF;
  IF (SELECT count(*) FROM public.carteiras) <> a.u * 2 THEN
    RAISE EXCEPTION 'Migração #22: esperadas 2 carteiras por usuário';
  END IF;
END $$;
