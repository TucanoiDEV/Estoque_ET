-- ============================================================
-- Armazém Machado — Schema do banco de dados Supabase
-- Execute este arquivo no SQL Editor do seu projeto Supabase.
-- É idempotente: pode ser reexecutado com segurança (IF NOT EXISTS / OR REPLACE).
--
-- Este arquivo é COMPLETO — um banco novo só precisa de:
--   1. schema.sql  (este arquivo)
--   2. seed.sql    (dados de exemplo)
-- Os arquivos migration_*.sql / saidas.sql / perfil.sql / fix_permissoes.sql
-- existem apenas para atualizar bancos antigos criados antes desta consolidação.
-- ============================================================

-- ─── Tabelas ─────────────────────────────────────────────────────────────────
-- Ordem importa: tabelas referenciadas (fornecedores) vêm antes das que apontam
-- para elas (produtos → fornecedores; entradas/saidas → produtos).

CREATE TABLE IF NOT EXISTS public.usuarios (
  id         UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  nome       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  cargo      TEXT        NOT NULL CHECK (cargo IN ('admin', 'operador', 'visualizador')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.fornecedores (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome                 TEXT NOT NULL,
  contato              TEXT,
  prazo_entrega        INTEGER,
  condicoes_pagamento  TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.produtos (
  id                   UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo               TEXT    UNIQUE NOT NULL,
  nome                 TEXT    NOT NULL,
  categoria            TEXT,
  unidade              TEXT    DEFAULT 'un',
  cor                  TEXT,
  custo_unitario       NUMERIC(10,2),
  estoque_minimo       INTEGER DEFAULT 10,
  local_armazenamento  TEXT,
  fornecedor_id        UUID    REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_produtos_fornecedor ON public.produtos(fornecedor_id);

CREATE TABLE IF NOT EXISTS public.estoque (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id  UUID    REFERENCES public.produtos(id) ON DELETE CASCADE UNIQUE,
  quantidade  INTEGER DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.entradas (
  id                   UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id           UUID    REFERENCES public.produtos(id),
  fornecedor_id        UUID    REFERENCES public.fornecedores(id),
  usuario_id           UUID    REFERENCES public.usuarios(id),
  quantidade           INTEGER NOT NULL,
  custo_unitario       NUMERIC(10,2),
  total                NUMERIC(10,2),
  nf_numero            TEXT,
  data_recebimento     DATE    DEFAULT CURRENT_DATE,
  local_armazenamento  TEXT,
  observacoes          TEXT,
  status               TEXT    DEFAULT 'recebido' CHECK (status IN ('recebido', 'aguardando', 'cancelado')),
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de saídas (alimenta os gráficos do dashboard)
CREATE TABLE IF NOT EXISTS public.saidas (
  id             UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id     UUID          REFERENCES public.produtos(id) ON DELETE CASCADE,
  usuario_id     UUID          REFERENCES public.usuarios(id),
  quantidade     INTEGER       NOT NULL,
  custo_unitario NUMERIC(12,2),
  total          NUMERIC(12,2),
  motivo         TEXT,
  observacoes    TEXT,
  data_saida     DATE          DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ   DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.configuracoes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chave      TEXT UNIQUE NOT NULL,
  valor      TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Habilitar RLS ────────────────────────────────────────────────────────────

ALTER TABLE public.usuarios      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entradas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saidas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- ─── Grants para o PostgREST (sem isso o cliente recebe 403) ──────────────────

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.usuarios      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedores  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entradas      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saidas        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes TO authenticated;

-- ─── Função auxiliar para evitar recursão no RLS ──────────────────────────────
-- Usa SECURITY DEFINER para acessar a tabela sem disparar as policies

CREATE OR REPLACE FUNCTION public.get_meu_cargo()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT cargo FROM public.usuarios WHERE id = auth.uid();
$$;

-- ─── Trigger: cria linha em public.usuarios ao cadastrar no Auth ──────────────
-- Garante que todo usuário autenticado tenha um perfil. Cargo padrão: 'operador'
-- (promova a 'admin' manualmente quando necessário).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome, email, cargo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    'operador'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Policies: usuarios ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "usuarios_select"       ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_insert_admin" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update_admin" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_delete_admin" ON public.usuarios;

-- Qualquer usuário autenticado pode ler a lista de usuários
CREATE POLICY "usuarios_select"
  ON public.usuarios FOR SELECT
  TO authenticated
  USING (true);

-- Cada usuário pode atualizar o próprio perfil (nome/avatar); admin atualiza qualquer um.
-- O WITH CHECK impede que um não-admin altere o próprio cargo (escalonamento de
-- privilégio): get_meu_cargo() lê o valor ATUAL (snapshot da query), então a linha só
-- passa se o novo cargo for igual ao atual — exceto para admin, que pode tudo.
CREATE POLICY "usuarios_update_self_or_admin"
  ON public.usuarios FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.get_meu_cargo() = 'admin')
  WITH CHECK (
    public.get_meu_cargo() = 'admin'
    OR (id = auth.uid() AND cargo = public.get_meu_cargo())
  );

-- Somente admin pode inserir/excluir usuários
CREATE POLICY "usuarios_insert_admin"
  ON public.usuarios FOR INSERT
  TO authenticated
  WITH CHECK (public.get_meu_cargo() = 'admin');

CREATE POLICY "usuarios_delete_admin"
  ON public.usuarios FOR DELETE
  TO authenticated
  USING (public.get_meu_cargo() = 'admin');

-- ─── Policies: fornecedores ───────────────────────────────────────────────────

DROP POLICY IF EXISTS "fornecedores_select" ON public.fornecedores;
DROP POLICY IF EXISTS "fornecedores_insert" ON public.fornecedores;
DROP POLICY IF EXISTS "fornecedores_update" ON public.fornecedores;
DROP POLICY IF EXISTS "fornecedores_delete" ON public.fornecedores;

CREATE POLICY "fornecedores_select"
  ON public.fornecedores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "fornecedores_insert"
  ON public.fornecedores FOR INSERT
  TO authenticated
  WITH CHECK (public.get_meu_cargo() IN ('admin', 'operador'));

CREATE POLICY "fornecedores_update"
  ON public.fornecedores FOR UPDATE
  TO authenticated
  USING (public.get_meu_cargo() = 'admin');

CREATE POLICY "fornecedores_delete"
  ON public.fornecedores FOR DELETE
  TO authenticated
  USING (public.get_meu_cargo() = 'admin');

-- ─── Policies: produtos ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "produtos_select" ON public.produtos;
DROP POLICY IF EXISTS "produtos_insert" ON public.produtos;
DROP POLICY IF EXISTS "produtos_update" ON public.produtos;
DROP POLICY IF EXISTS "produtos_delete" ON public.produtos;

CREATE POLICY "produtos_select"
  ON public.produtos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "produtos_insert"
  ON public.produtos FOR INSERT
  TO authenticated
  WITH CHECK (public.get_meu_cargo() IN ('admin', 'operador'));

CREATE POLICY "produtos_update"
  ON public.produtos FOR UPDATE
  TO authenticated
  USING (public.get_meu_cargo() IN ('admin', 'operador'));

CREATE POLICY "produtos_delete"
  ON public.produtos FOR DELETE
  TO authenticated
  USING (public.get_meu_cargo() = 'admin');

-- ─── Policies: estoque ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "estoque_select" ON public.estoque;
DROP POLICY IF EXISTS "estoque_insert" ON public.estoque;
DROP POLICY IF EXISTS "estoque_update" ON public.estoque;
DROP POLICY IF EXISTS "estoque_delete" ON public.estoque;

CREATE POLICY "estoque_select"
  ON public.estoque FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "estoque_insert"
  ON public.estoque FOR INSERT
  TO authenticated
  WITH CHECK (public.get_meu_cargo() IN ('admin', 'operador'));

CREATE POLICY "estoque_update"
  ON public.estoque FOR UPDATE
  TO authenticated
  USING (public.get_meu_cargo() IN ('admin', 'operador'));

CREATE POLICY "estoque_delete"
  ON public.estoque FOR DELETE
  TO authenticated
  USING (public.get_meu_cargo() = 'admin');

-- ─── Policies: entradas ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "entradas_select" ON public.entradas;
DROP POLICY IF EXISTS "entradas_insert" ON public.entradas;
DROP POLICY IF EXISTS "entradas_update" ON public.entradas;
DROP POLICY IF EXISTS "entradas_delete" ON public.entradas;

CREATE POLICY "entradas_select"
  ON public.entradas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "entradas_insert"
  ON public.entradas FOR INSERT
  TO authenticated
  WITH CHECK (public.get_meu_cargo() IN ('admin', 'operador'));

CREATE POLICY "entradas_update"
  ON public.entradas FOR UPDATE
  TO authenticated
  USING (public.get_meu_cargo() = 'admin');

CREATE POLICY "entradas_delete"
  ON public.entradas FOR DELETE
  TO authenticated
  USING (public.get_meu_cargo() = 'admin');

-- ─── Policies: saidas ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "saidas_select" ON public.saidas;
DROP POLICY IF EXISTS "saidas_insert" ON public.saidas;
DROP POLICY IF EXISTS "saidas_update" ON public.saidas;
DROP POLICY IF EXISTS "saidas_delete" ON public.saidas;

CREATE POLICY "saidas_select"
  ON public.saidas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "saidas_insert"
  ON public.saidas FOR INSERT
  TO authenticated
  WITH CHECK (public.get_meu_cargo() IN ('admin', 'operador'));

CREATE POLICY "saidas_update"
  ON public.saidas FOR UPDATE
  TO authenticated
  USING (public.get_meu_cargo() = 'admin');

CREATE POLICY "saidas_delete"
  ON public.saidas FOR DELETE
  TO authenticated
  USING (public.get_meu_cargo() = 'admin');

-- ─── Policies: configuracoes ──────────────────────────────────────────────────

DROP POLICY IF EXISTS "configuracoes_select"    ON public.configuracoes;
DROP POLICY IF EXISTS "configuracoes_all_admin" ON public.configuracoes;

CREATE POLICY "configuracoes_select"
  ON public.configuracoes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "configuracoes_all_admin"
  ON public.configuracoes FOR ALL
  TO authenticated
  USING (public.get_meu_cargo() = 'admin');

-- ─── Storage: bucket "avatars" para fotos de perfil ───────────────────────────
-- As fotos ficam em pastas pelo id do usuário: "<auth.uid()>/avatar.<ext>".
-- Leitura pública; cada usuário só escreve na sua própria pasta.

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "avatars_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_own"   ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_own"   ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_own"   ON storage.objects;

CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── Realtime ─────────────────────────────────────────────────────────────────
-- Adiciona tabelas ao Realtime sem erro se já estiverem na publicação

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.estoque;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.entradas;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.saidas;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;
