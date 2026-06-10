-- ============================================================
-- Armazém Machado — Preço de venda por produto
-- Execute no SQL Editor do Supabase (idempotente — pode rodar de novo).
--
-- Adiciona o preço de venda por unidade. No cadastro, o usuário informa o
-- valor diretamente OU uma margem (%) sobre o custo — o app calcula e grava
-- sempre o valor final aqui.
-- ============================================================

ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS preco_venda NUMERIC(12, 2);

-- Confirme:
-- SELECT codigo, nome, custo_unitario, preco_venda FROM public.produtos ORDER BY nome;
