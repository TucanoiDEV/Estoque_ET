-- ============================================================
-- Armazém Machado — Schema do banco de dados Supabase
-- Execute este arquivo no SQL Editor do seu projeto Supabase
-- ============================================================

-- ─── Tabelas ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.usuarios (
  id         UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  nome       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  cargo      TEXT        NOT NULL CHECK (cargo IN ('admin', 'operador', 'visualizador')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.produtos (
  id                   UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo               TEXT    UNIQUE NOT NULL,
  nome                 TEXT    NOT NULL,
  categoria            TEXT,
  unidade              TEXT    DEFAULT 'un',
  custo_unitario       NUMERIC(10,2),
  estoque_minimo       INTEGER DEFAULT 10,
  local_armazenamento  TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.estoque (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id  UUID    REFERENCES public.produtos(id) ON DELETE CASCADE UNIQUE,
  quantidade  INTEGER DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.fornecedores (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome                 TEXT NOT NULL,
  contato              TEXT,
  prazo_entrega        INTEGER,
  condicoes_pagamento  TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
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

CREATE TABLE IF NOT EXISTS public.configuracoes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chave      TEXT UNIQUE NOT NULL,
  valor      TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Habilitar RLS ────────────────────────────────────────────────────────────

ALTER TABLE public.usuarios      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entradas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

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

-- ─── Policies: usuarios ───────────────────────────────────────────────────────

-- Qualquer usuário autenticado pode ler a lista de usuários
CREATE POLICY "usuarios_select"
  ON public.usuarios FOR SELECT
  TO authenticated
  USING (true);

-- Somente admin pode inserir/atualizar/excluir usuários
CREATE POLICY "usuarios_insert_admin"
  ON public.usuarios FOR INSERT
  TO authenticated
  WITH CHECK (public.get_meu_cargo() = 'admin');

CREATE POLICY "usuarios_update_admin"
  ON public.usuarios FOR UPDATE
  TO authenticated
  USING (public.get_meu_cargo() = 'admin');

CREATE POLICY "usuarios_delete_admin"
  ON public.usuarios FOR DELETE
  TO authenticated
  USING (public.get_meu_cargo() = 'admin');

-- ─── Policies: produtos ───────────────────────────────────────────────────────

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

-- ─── Policies: fornecedores ───────────────────────────────────────────────────

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

-- ─── Policies: entradas ───────────────────────────────────────────────────────

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

-- ─── Policies: configuracoes ──────────────────────────────────────────────────

CREATE POLICY "configuracoes_select"
  ON public.configuracoes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "configuracoes_all_admin"
  ON public.configuracoes FOR ALL
  TO authenticated
  USING (public.get_meu_cargo() = 'admin');

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
