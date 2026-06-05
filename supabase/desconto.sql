-- ============================================================
-- Armazém Machado — Desconto nos produtos (com período de validade)
-- Execute no SQL Editor do Supabase (idempotente, pode rodar de novo).
-- desconto: percentual (0–100), sem alterar o custo original.
-- desconto_inicio / desconto_fim: período em que o desconto vale (opcional).
-- Preço com desconto = custo_unitario * (1 - desconto/100), dentro do período.
-- ============================================================

ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS desconto NUMERIC(5,2) DEFAULT 0;

ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS desconto_inicio DATE;

ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS desconto_fim DATE;
