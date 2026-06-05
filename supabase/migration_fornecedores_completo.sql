-- ============================================================
-- Armazém Machado — Migração: Módulo de Fornecedores completo
-- Adiciona os campos de cadastro completo em `fornecedores` e cria a
-- tabela de relacionamento `fornecedor_produtos` (produtos fornecidos).
-- Execute no SQL Editor do seu projeto Supabase.
-- É idempotente (IF NOT EXISTS / OR REPLACE) — pode reexecutar com segurança.
--
-- Para banco NOVO não é preciso rodar este arquivo: tudo já está no schema.sql.
-- ============================================================

-- ─── 1) Novos campos em fornecedores ──────────────────────────────────────────
-- Todos opcionais (nullable). `ativo` controla o status Ativo/Inativo do módulo.

ALTER TABLE public.fornecedores
  ADD COLUMN IF NOT EXISTS representante         TEXT,
  ADD COLUMN IF NOT EXISTS cnpj                  TEXT,
  ADD COLUMN IF NOT EXISTS inscricao_estadual    TEXT,
  ADD COLUMN IF NOT EXISTS telefone              TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp              TEXT,
  ADD COLUMN IF NOT EXISTS email                 TEXT,
  ADD COLUMN IF NOT EXISTS site                  TEXT,
  ADD COLUMN IF NOT EXISTS ativo                 BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS cep                   TEXT,
  ADD COLUMN IF NOT EXISTS endereco              TEXT,
  ADD COLUMN IF NOT EXISTS numero                TEXT,
  ADD COLUMN IF NOT EXISTS complemento           TEXT,
  ADD COLUMN IF NOT EXISTS bairro                TEXT,
  ADD COLUMN IF NOT EXISTS cidade                TEXT,
  ADD COLUMN IF NOT EXISTS estado                TEXT,
  ADD COLUMN IF NOT EXISTS pedido_minimo         NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS valor_minimo_compra   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS desconto_padrao       NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS tipo_frete            TEXT,
  ADD COLUMN IF NOT EXISTS frete_gratis_acima    NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS observacoes           TEXT;

-- Fornecedores antigos sem status definido entram como Ativos
UPDATE public.fornecedores SET ativo = TRUE WHERE ativo IS NULL;

-- ─── 2) Tabela fornecedor_produtos (produtos fornecidos) ──────────────────────
-- Relaciona produtos a fornecedores (N:N). O "fornecedor principal" continua
-- sendo produtos.fornecedor_id; aqui registram-se os demais vínculos. A flag
-- `principal` permite marcar o vínculo preferencial.

CREATE TABLE IF NOT EXISTS public.fornecedor_produtos (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fornecedor_id  UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  produto_id     UUID NOT NULL REFERENCES public.produtos(id)     ON DELETE CASCADE,
  principal      BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (fornecedor_id, produto_id)
);

CREATE INDEX IF NOT EXISTS idx_fornecedor_produtos_fornecedor ON public.fornecedor_produtos(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_fornecedor_produtos_produto    ON public.fornecedor_produtos(produto_id);

ALTER TABLE public.fornecedor_produtos ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedor_produtos TO authenticated;

DROP POLICY IF EXISTS "fornecedor_produtos_select" ON public.fornecedor_produtos;
DROP POLICY IF EXISTS "fornecedor_produtos_insert" ON public.fornecedor_produtos;
DROP POLICY IF EXISTS "fornecedor_produtos_update" ON public.fornecedor_produtos;
DROP POLICY IF EXISTS "fornecedor_produtos_delete" ON public.fornecedor_produtos;

CREATE POLICY "fornecedor_produtos_select"
  ON public.fornecedor_produtos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "fornecedor_produtos_insert"
  ON public.fornecedor_produtos FOR INSERT
  TO authenticated
  WITH CHECK (public.get_meu_cargo() = 'admin');

CREATE POLICY "fornecedor_produtos_update"
  ON public.fornecedor_produtos FOR UPDATE
  TO authenticated
  USING (public.get_meu_cargo() = 'admin');

CREATE POLICY "fornecedor_produtos_delete"
  ON public.fornecedor_produtos FOR DELETE
  TO authenticated
  USING (public.get_meu_cargo() = 'admin');
