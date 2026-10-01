-- Issue 6 (abordagem A): RLS + grants + helpers, somente SQL.
--
-- A aplicacao continua autenticando com NextAuth e acessando o banco pelo Pool
-- (role "postgres": dono das tabelas e BYPASSRLS), entao estas policies nao
-- afetam as requests atuais. Elas passam a valer quando as APIs usarem o
-- cliente Supabase com JWT (issues 7, 11 e 6b).
--
-- Sem FORCE ROW LEVEL SECURITY (quebraria o Pool, que e dono das tabelas).
-- Sem INSERT e sem DELETE em "Usuarios" para authenticated: o perfil nasce pela
-- trigger on_auth_user_created e a exclusao e soft delete (UPDATE data_exclusao).

-- =====================================================================
-- Helpers (schema "private": nao exposto pela Data API)
-- =====================================================================
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.current_usuario_id()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select id
  from public."Usuarios"
  where auth_user_id = (select auth.uid())
    and data_exclusao is null
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public."Usuarios"
    where auth_user_id = (select auth.uid())
      and data_exclusao is null
      and tipo_usuario = 'ADMIN'
  )
$$;

revoke all on function private.current_usuario_id() from public, anon;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.current_usuario_id() to authenticated;
grant execute on function private.is_admin() to authenticated;

-- =====================================================================
-- Indices (auth_user_id ja tem indice unico: Usuarios_auth_user_id_key)
-- =====================================================================
create index if not exists lancamentos_usuario_id_idx on public."Lancamentos" (usuario_id);
create index if not exists categorias_usuario_id_idx  on public."Categorias" (usuario_id);

-- =====================================================================
-- Grants: revoke amplo, depois o minimo
-- =====================================================================
revoke all on table public."Usuarios", public."Categorias", public."Lancamentos"
  from anon, authenticated;
revoke all on sequence public."Usuarios_id_seq", public.categorias_id_seq, public."Lancamentos_id_seq"
  from anon, authenticated;

-- Lancamentos / Categorias: CRUD (o RLS limita as linhas)
grant select, insert, update, delete on public."Lancamentos" to authenticated;
grant select, insert, update, delete on public."Categorias"  to authenticated;
grant usage on sequence public."Lancamentos_id_seq" to authenticated;
grant usage on sequence public.categorias_id_seq    to authenticated;

-- Usuarios: nunca expor senha_hash, token_recuperacao, expiracao_token_recuperacao.
-- Sem INSERT, sem DELETE; UPDATE so nas colunas abaixo (nada de email/auth_user_id/senha).
grant select (id, nome, email, tipo_usuario, criado_em, atualizado_em, data_exclusao, auth_user_id)
  on public."Usuarios" to authenticated;
grant update (nome, tipo_usuario, data_exclusao, atualizado_em)
  on public."Usuarios" to authenticated;

-- =====================================================================
-- RLS
-- =====================================================================
alter table public."Usuarios"    enable row level security;
alter table public."Categorias"  enable row level security;
alter table public."Lancamentos" enable row level security;

-- ---- Categorias: so as do perfil ativo ----
create policy categorias_select on public."Categorias"
  for select to authenticated
  using (usuario_id = (select private.current_usuario_id()));

create policy categorias_insert on public."Categorias"
  for insert to authenticated
  with check (usuario_id = (select private.current_usuario_id()));

create policy categorias_update on public."Categorias"
  for update to authenticated
  using (usuario_id = (select private.current_usuario_id()))
  with check (usuario_id = (select private.current_usuario_id()));

create policy categorias_delete on public."Categorias"
  for delete to authenticated
  using (usuario_id = (select private.current_usuario_id()));

-- ---- Lancamentos: so os do perfil ativo; categoria_id so aponta para categoria propria
-- (o EXISTS e filtrado pelo RLS de "Categorias") ----
create policy lancamentos_select on public."Lancamentos"
  for select to authenticated
  using (usuario_id = (select private.current_usuario_id()));

create policy lancamentos_insert on public."Lancamentos"
  for insert to authenticated
  with check (
    usuario_id = (select private.current_usuario_id())
    and (categoria_id is null
         or exists (select 1 from public."Categorias" c where c.id = categoria_id))
  );

create policy lancamentos_update on public."Lancamentos"
  for update to authenticated
  using (usuario_id = (select private.current_usuario_id()))
  with check (
    usuario_id = (select private.current_usuario_id())
    and (categoria_id is null
         or exists (select 1 from public."Categorias" c where c.id = categoria_id))
  );

create policy lancamentos_delete on public."Lancamentos"
  for delete to authenticated
  using (usuario_id = (select private.current_usuario_id()));

-- ---- Usuarios ----
create policy usuarios_select_own on public."Usuarios"
  for select to authenticated
  using (auth_user_id = (select auth.uid()) and data_exclusao is null);

create policy usuarios_select_admin on public."Usuarios"
  for select to authenticated
  using ((select private.is_admin()));

create policy usuarios_update_own on public."Usuarios"
  for update to authenticated
  using      (auth_user_id = (select auth.uid()) and data_exclusao is null)
  with check (auth_user_id = (select auth.uid()) and data_exclusao is null);

create policy usuarios_update_admin on public."Usuarios"
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- =====================================================================
-- Trigger guarda em "Usuarios"
-- Grant por coluna nao distingue ADMIN de COLABORADOR (mesmo role) e WITH CHECK
-- nao enxerga OLD. A trigger fecha: COLABORADOR nao muda tipo_usuario nem
-- data_exclusao; ADMIN nao muda o proprio papel nem se exclui.
-- Sem JWT (Pool, service_role, postgres) auth.uid() e null e a trigger nao barra.
-- =====================================================================
create or replace function private.usuarios_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return new;
  end if;

  if new.tipo_usuario is distinct from old.tipo_usuario
     or new.data_exclusao is distinct from old.data_exclusao then
    if not (select private.is_admin()) then
      raise exception 'somente ADMIN altera tipo_usuario e data_exclusao'
        using errcode = '42501';
    elsif old.auth_user_id = (select auth.uid()) then
      raise exception 'ADMIN nao altera o proprio papel nem se exclui'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.usuarios_guard() from public, anon;

drop trigger if exists usuarios_guard on public."Usuarios";
create trigger usuarios_guard
  before update on public."Usuarios"
  for each row execute function private.usuarios_guard();
