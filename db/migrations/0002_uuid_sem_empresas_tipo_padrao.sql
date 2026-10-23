-- Issue #29: reconstrói usuarios/categorias/lancamentos (nomes em minúsculas,
-- id uuid na primeira coluna), remove resíduos de empresas e do Supabase e
-- renomeia COLABORADOR -> PADRAO.
-- As tabelas antigas ("Usuarios", "Categorias", "Lancamentos") são apagadas só
-- depois da cópia, sem CASCADE: dependência desconhecida faz a migration falhar
-- (e dar rollback). Policies, trigger e RLS saem junto com as tabelas antigas.

CREATE TEMP TABLE _antes ON COMMIT DROP AS
SELECT (SELECT count(*) FROM public."Usuarios") AS u,
       (SELECT count(*) FROM public."Categorias") AS c,
       (SELECT count(*) FROM public."Lancamentos") AS l,
       (SELECT count(*) FROM public."Categorias" WHERE usuario_id IS NOT NULL) AS c_u,
       (SELECT count(*) FROM public."Lancamentos" WHERE usuario_id IS NOT NULL) AS l_u,
       (SELECT count(*) FROM public."Lancamentos" WHERE categoria_id IS NOT NULL) AS l_c;

ALTER TYPE public.tipo_usuario_enum RENAME VALUE 'COLABORADOR' TO 'PADRAO';

-- Mapa ID antigo -> UUID novo (descartado no COMMIT)
CREATE TEMP TABLE _map_usuarios ON COMMIT DROP AS
SELECT id AS antigo, gen_random_uuid() AS novo FROM public."Usuarios";
CREATE TEMP TABLE _map_categorias ON COMMIT DROP AS
SELECT id AS antigo, gen_random_uuid() AS novo FROM public."Categorias";

-- Tabelas novas (restrições e índices vêm depois, quando os nomes antigos saírem)
CREATE TABLE public.usuarios (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nome character varying NOT NULL,
    email character varying NOT NULL,
    senha_hash character varying,
    tipo_usuario public.tipo_usuario_enum NOT NULL,
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone DEFAULT now(),
    token_recuperacao character varying,
    expiracao_token_recuperacao timestamp with time zone,
    data_exclusao timestamp with time zone
);

CREATE TABLE public.categorias (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nome character varying NOT NULL,
    tipo character varying NOT NULL,
    usuario_id uuid,
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone DEFAULT now()
);

CREATE TABLE public.lancamentos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    descricao text NOT NULL,
    valor numeric NOT NULL,
    tipo character varying NOT NULL,
    data date NOT NULL,
    categoria_id uuid,
    usuario_id uuid,
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone DEFAULT now()
);

INSERT INTO public.usuarios
    (id, nome, email, senha_hash, tipo_usuario, criado_em, atualizado_em,
     token_recuperacao, expiracao_token_recuperacao, data_exclusao)
SELECT m.novo, u.nome, u.email, u.senha_hash, u.tipo_usuario, u.criado_em, u.atualizado_em,
       u.token_recuperacao, u.expiracao_token_recuperacao, u.data_exclusao
FROM public."Usuarios" u
JOIN _map_usuarios m ON m.antigo = u.id;

INSERT INTO public.categorias (id, nome, tipo, usuario_id, criado_em, atualizado_em)
SELECT m.novo, c.nome, c.tipo, mu.novo, c.criado_em, c.atualizado_em
FROM public."Categorias" c
JOIN _map_categorias m ON m.antigo = c.id
LEFT JOIN _map_usuarios mu ON mu.antigo = c.usuario_id;

INSERT INTO public.lancamentos
    (id, descricao, valor, tipo, data, categoria_id, usuario_id, criado_em, atualizado_em)
SELECT gen_random_uuid(), l.descricao, l.valor, l.tipo, l.data, mc.novo, mu.novo,
       l.criado_em, l.atualizado_em
FROM public."Lancamentos" l
LEFT JOIN _map_categorias mc ON mc.antigo = l.categoria_id
LEFT JOIN _map_usuarios mu ON mu.antigo = l.usuario_id;

-- Trava: nenhuma FK não nula pode ter ficado sem tradução
DO $$
BEGIN
  IF (SELECT count(*) FROM public."Lancamentos" WHERE usuario_id IS NOT NULL)
        <> (SELECT count(*) FROM public.lancamentos WHERE usuario_id IS NOT NULL)
     OR (SELECT count(*) FROM public."Lancamentos" WHERE categoria_id IS NOT NULL)
        <> (SELECT count(*) FROM public.lancamentos WHERE categoria_id IS NOT NULL)
     OR (SELECT count(*) FROM public."Categorias" WHERE usuario_id IS NOT NULL)
        <> (SELECT count(*) FROM public.categorias WHERE usuario_id IS NOT NULL)
  THEN
    RAISE EXCEPTION 'Migração de IDs: FK sem correspondência';
  END IF;
END $$;

-- Tabelas antigas (sequences, índices, FKs, policies, trigger e RLS saem junto)
DROP TABLE public."Lancamentos";
DROP TABLE public."Categorias";
DROP TABLE public."Usuarios";

-- Funções do Supabase que dependiam de auth_user_id (nenhuma policy as usa mais)
DROP FUNCTION IF EXISTS private.usuarios_guard();
DROP FUNCTION IF EXISTS private.current_usuario_id();
DROP FUNCTION IF EXISTS private.is_admin();

-- Empresas (as FKs saíram com as tabelas antigas)
DROP TABLE IF EXISTS public."Empresas";

ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);
ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_email_key UNIQUE (email);
ALTER TABLE public.categorias ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);
ALTER TABLE public.lancamentos ADD CONSTRAINT lancamentos_pkey PRIMARY KEY (id);

ALTER TABLE public.categorias
  ADD CONSTRAINT categorias_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);
ALTER TABLE public.lancamentos
  ADD CONSTRAINT lancamentos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);
ALTER TABLE public.lancamentos
  ADD CONSTRAINT lancamentos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id);

CREATE INDEX categorias_usuario_id_idx ON public.categorias USING btree (usuario_id);
CREATE INDEX lancamentos_usuario_id_idx ON public.lancamentos USING btree (usuario_id);

DO $$
DECLARE a record;
BEGIN
  SELECT * INTO a FROM _antes;
  IF (SELECT count(*) FROM public.usuarios) <> a.u
     OR (SELECT count(*) FROM public.categorias) <> a.c
     OR (SELECT count(*) FROM public.lancamentos) <> a.l
     OR (SELECT count(*) FROM public.categorias WHERE usuario_id IS NOT NULL) <> a.c_u
     OR (SELECT count(*) FROM public.lancamentos WHERE usuario_id IS NOT NULL) <> a.l_u
     OR (SELECT count(*) FROM public.lancamentos WHERE categoria_id IS NOT NULL) <> a.l_c
  THEN
    RAISE EXCEPTION 'Migração de IDs: contagens divergem das de antes';
  END IF;
END $$;
