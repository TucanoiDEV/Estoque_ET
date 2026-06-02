-- ============================================================
-- Armazém Machado — Endurece as permissões para "somente admin escreve"
-- Operador e Visualizador passam a ser somente-leitura.
-- Execute no SQL Editor do Supabase (recria as policies de escrita).
-- As policies de SELECT continuam abertas (todos autenticados leem).
-- ============================================================

-- ─── produtos ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "produtos_insert" ON public.produtos;
CREATE POLICY "produtos_insert" ON public.produtos FOR INSERT TO authenticated
  WITH CHECK (public.get_meu_cargo() = 'admin');

DROP POLICY IF EXISTS "produtos_update" ON public.produtos;
CREATE POLICY "produtos_update" ON public.produtos FOR UPDATE TO authenticated
  USING (public.get_meu_cargo() = 'admin');

-- ─── estoque ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "estoque_insert" ON public.estoque;
CREATE POLICY "estoque_insert" ON public.estoque FOR INSERT TO authenticated
  WITH CHECK (public.get_meu_cargo() = 'admin');

DROP POLICY IF EXISTS "estoque_update" ON public.estoque;
CREATE POLICY "estoque_update" ON public.estoque FOR UPDATE TO authenticated
  USING (public.get_meu_cargo() = 'admin');

-- ─── fornecedores ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "fornecedores_insert" ON public.fornecedores;
CREATE POLICY "fornecedores_insert" ON public.fornecedores FOR INSERT TO authenticated
  WITH CHECK (public.get_meu_cargo() = 'admin');

-- ─── entradas ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "entradas_insert" ON public.entradas;
CREATE POLICY "entradas_insert" ON public.entradas FOR INSERT TO authenticated
  WITH CHECK (public.get_meu_cargo() = 'admin');

-- ─── saidas ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "saidas_insert" ON public.saidas;
CREATE POLICY "saidas_insert" ON public.saidas FOR INSERT TO authenticated
  WITH CHECK (public.get_meu_cargo() = 'admin');
