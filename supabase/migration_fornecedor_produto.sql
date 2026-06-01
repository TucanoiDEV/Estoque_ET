-- ============================================================
-- Armazém Machado — Migração: Fornecedor por produto
-- Adiciona produtos.fornecedor_id e atribui um fornecedor
-- aleatório (dentre os já cadastrados) a cada produto existente.
-- Execute no SQL Editor do seu projeto Supabase.
-- ============================================================

-- 1) Coluna de fornecedor na tabela de produtos (FK + índice)
ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_produtos_fornecedor ON public.produtos(fornecedor_id);

-- 2) Atribui um fornecedor aleatório (dentre os existentes) a cada produto
--    que ainda não tenha fornecedor. A subconsulta é correlacionada por p.id,
--    então é reavaliada por linha — cada produto recebe o seu próprio sorteio.
UPDATE public.produtos AS p
SET fornecedor_id = (
  SELECT f.id
  FROM public.fornecedores f
  ORDER BY md5(p.id::text || random()::text)
  LIMIT 1
)
WHERE p.fornecedor_id IS NULL
  AND EXISTS (SELECT 1 FROM public.fornecedores);
