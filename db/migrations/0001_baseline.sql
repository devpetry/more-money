
CREATE TYPE public.tipo_usuario_enum AS ENUM (
    'ADMIN',
    'COLABORADOR'
);

CREATE TABLE public."Categorias" (
    id integer NOT NULL,
    nome character varying NOT NULL,
    tipo character varying NOT NULL,
    usuario_id integer,
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone DEFAULT now()
);

CREATE TABLE public."Lancamentos" (
    id integer NOT NULL,
    descricao text NOT NULL,
    valor numeric NOT NULL,
    tipo character varying NOT NULL,
    data date NOT NULL,
    categoria_id integer,
    usuario_id integer,
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone DEFAULT now()
);

CREATE SEQUENCE public."Lancamentos_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."Lancamentos_id_seq" OWNED BY public."Lancamentos".id;

CREATE TABLE public."Usuarios" (
    id integer NOT NULL,
    nome character varying NOT NULL,
    email character varying NOT NULL,
    senha_hash character varying,
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone DEFAULT now(),
    token_recuperacao character varying,
    expiracao_token_recuperacao timestamp with time zone,
    tipo_usuario public.tipo_usuario_enum NOT NULL,
    data_exclusao timestamp with time zone,
    auth_user_id uuid
);

CREATE SEQUENCE public."Usuarios_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."Usuarios_id_seq" OWNED BY public."Usuarios".id;

CREATE SEQUENCE public.categorias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.categorias_id_seq OWNED BY public."Categorias".id;

ALTER TABLE ONLY public."Categorias" ALTER COLUMN id SET DEFAULT nextval('public.categorias_id_seq'::regclass);

ALTER TABLE ONLY public."Lancamentos" ALTER COLUMN id SET DEFAULT nextval('public."Lancamentos_id_seq"'::regclass);

ALTER TABLE ONLY public."Usuarios" ALTER COLUMN id SET DEFAULT nextval('public."Usuarios_id_seq"'::regclass);

ALTER TABLE ONLY public."Lancamentos"
    ADD CONSTRAINT "Lancamentos_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY public."Usuarios"
    ADD CONSTRAINT "Usuarios_auth_user_id_key" UNIQUE (auth_user_id);

ALTER TABLE ONLY public."Usuarios"
    ADD CONSTRAINT "Usuarios_email_key" UNIQUE (email);

ALTER TABLE ONLY public."Usuarios"
    ADD CONSTRAINT "Usuarios_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY public."Categorias"
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);

CREATE INDEX categorias_usuario_id_idx ON public."Categorias" USING btree (usuario_id);

CREATE INDEX lancamentos_usuario_id_idx ON public."Lancamentos" USING btree (usuario_id);

ALTER TABLE ONLY public."Lancamentos"
    ADD CONSTRAINT "Lancamentos_categoria_id_fkey" FOREIGN KEY (categoria_id) REFERENCES public."Categorias"(id);

ALTER TABLE ONLY public."Lancamentos"
    ADD CONSTRAINT "Lancamentos_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES public."Usuarios"(id);

ALTER TABLE ONLY public."Categorias"
    ADD CONSTRAINT categorias_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public."Usuarios"(id);

