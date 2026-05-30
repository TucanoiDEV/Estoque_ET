-- ============================================================
-- Armazém Machado — Schema do banco de dados Supabase
-- Execute este arquivo no SQL Editor do seu projeto Supabase
-- ============================================================

-- ─── Tabelas ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.usuarios (
  id        UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  nome      TEXT        NOT NULL,
  email     TEXT        NOT NULL,
  cargo     TEXT        NOT NULL CHECK (cargo IN ('admin', 'operador', 'visualizador')),
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
  produto_id  UUID    REFERENCES public.produtos(id) ON DELETE CASCADE,
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

-- ─── Policies: usuarios ───────────────────────────────────────────────────────

CREATE POLICY "Usuários autenticados leem todos os usuários"
  ON public.usuarios FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Somente admin gerencia usuários"
  ON public.usuarios FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND cargo = 'admin')
  );

-- ─── Policies: produtos ───────────────────────────────────────────────────────

CREATE POLICY "Todos leem produtos"
  ON public.produtos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin e operador inserem produtos"
  ON public.produtos FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND cargo IN ('admin', 'operador'))
  );

CREATE POLICY "Admin e operador editam produtos"
  ON public.produtos FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND cargo IN ('admin', 'operador'))
  );

CREATE POLICY "Somente admin exclui produtos"
  ON public.produtos FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND cargo = 'admin')
  );

-- ─── Policies: estoque ────────────────────────────────────────────────────────

CREATE POLICY "Todos leem estoque"
  ON public.estoque FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin e operador modificam estoque"
  ON public.estoque FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND cargo IN ('admin', 'operador'))
  );

-- ─── Policies: fornecedores ───────────────────────────────────────────────────

CREATE POLICY "Todos leem fornecedores"
  ON public.fornecedores FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin e operador gerenciam fornecedores"
  ON public.fornecedores FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND cargo IN ('admin', 'operador'))
  );

CREATE POLICY "Somente admin edita e exclui fornecedores"
  ON public.fornecedores FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND cargo = 'admin')
  );

CREATE POLICY "Somente admin exclui fornecedores"
  ON public.fornecedores FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND cargo = 'admin')
  );

-- ─── Policies: entradas ───────────────────────────────────────────────────────

CREATE POLICY "Todos leem entradas"
  ON public.entradas FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin e operador inserem entradas"
  ON public.entradas FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND cargo IN ('admin', 'operador'))
  );

CREATE POLICY "Somente admin edita e exclui entradas"
  ON public.entradas FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND cargo = 'admin')
  );

CREATE POLICY "Somente admin exclui entradas"
  ON public.entradas FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND cargo = 'admin')
  );

-- ─── Policies: configuracoes ──────────────────────────────────────────────────

CREATE POLICY "Todos leem configurações"
  ON public.configuracoes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Somente admin altera configurações"
  ON public.configuracoes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND cargo = 'admin')
  );

-- ─── Realtime ─────────────────────────────────────────────────────────────────
-- Habilita publicação nas tabelas para o Supabase Realtime

ALTER PUBLICATION supabase_realtime ADD TABLE public.estoque;
ALTER PUBLICATION supabase_realtime ADD TABLE public.entradas;
