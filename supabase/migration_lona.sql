-- ============================================================
-- Armazém Machado — Migração: Coluna 'cor' + Produtos de Lona
-- Execute no SQL Editor do seu projeto Supabase
-- ============================================================

-- Adiciona coluna 'cor' à tabela produtos (sem quebrar registros existentes)
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS cor TEXT;

-- ─── Produtos de Lona ─────────────────────────────────────────────────────────
-- ON CONFLICT (codigo) garante idempotência sem depender de constraint em id

INSERT INTO public.produtos (id, codigo, nome, categoria, unidade, custo_unitario, estoque_minimo, local_armazenamento, cor) VALUES
  -- Lona PE (Polietileno) — econômica, uso externo
  ('33333333-0000-0000-0000-000000000001', 'LON-PE-AZ', 'Lona PE Azul 150 Microns',    'Lona', 'M',   8.50, 50, 'Estoque A',    'Azul'),
  ('33333333-0000-0000-0000-000000000002', 'LON-PE-VD', 'Lona PE Verde 150 Microns',   'Lona', 'M',   8.50, 50, 'Estoque A',    'Verde'),
  ('33333333-0000-0000-0000-000000000003', 'LON-PE-PT', 'Lona PE Preta 150 Microns',   'Lona', 'M',   8.50, 50, 'Estoque A',    'Preta'),
  ('33333333-0000-0000-0000-000000000004', 'LON-PE-PR', 'Lona PE Prata 150 Microns',   'Lona', 'M',   9.00, 30, 'Estoque A',    'Prata'),
  ('33333333-0000-0000-0000-000000000005', 'LON-PE-LJ', 'Lona PE Laranja 150 Microns', 'Lona', 'M',   8.50, 30, 'Estoque A',    'Laranja'),
  -- Lona PVC — reforçada, industrial
  ('33333333-0000-0000-0000-000000000006', 'LON-PVC-AZ', 'Lona PVC Azul 500g/m²',     'Lona', 'M',  24.90, 20, 'Estoque B',    'Azul'),
  ('33333333-0000-0000-0000-000000000007', 'LON-PVC-BC', 'Lona PVC Branca 500g/m²',   'Lona', 'M',  24.90, 20, 'Estoque B',    'Branca'),
  ('33333333-0000-0000-0000-000000000008', 'LON-PVC-PT', 'Lona PVC Preta 500g/m²',    'Lona', 'M',  24.90, 20, 'Estoque B',    'Preta'),
  ('33333333-0000-0000-0000-000000000009', 'LON-PVC-VD', 'Lona PVC Verde 500g/m²',    'Lona', 'M',  24.90, 15, 'Estoque B',    'Verde'),
  ('33333333-0000-0000-0000-000000000010', 'LON-PVC-VM', 'Lona PVC Vermelha 500g/m²', 'Lona', 'M',  24.90, 15, 'Estoque B',    'Vermelha'),
  -- Lona Canvas / Encerado — acabamento rústico
  ('33333333-0000-0000-0000-000000000011', 'LON-CVS-BG', 'Lona Canvas Natural Bege',  'Lona', 'M',  38.00, 20, 'Depósito',     'Bege'),
  ('33333333-0000-0000-0000-000000000012', 'LON-CVS-VD', 'Lona Canvas Verde',         'Lona', 'M',  38.00, 15, 'Depósito',     'Verde'),
  -- Lona Sombrite — sombreamento agrícola/residencial
  ('33333333-0000-0000-0000-000000000013', 'LON-SMB-PT', 'Lona Sombrite Preta 50%',   'Lona', 'M',  12.00, 30, 'Área Externa', 'Preta'),
  ('33333333-0000-0000-0000-000000000014', 'LON-SMB-VD', 'Lona Sombrite Verde 50%',   'Lona', 'M',  12.00, 20, 'Área Externa', 'Verde'),
  -- Lona de Caminhão — sob medida, resistente
  ('33333333-0000-0000-0000-000000000015', 'LON-CAM-PT', 'Lona Fundo Caminhão Preta', 'Lona', 'UN', 350.00,  5, 'Depósito',    'Preta'),
  ('33333333-0000-0000-0000-000000000016', 'LON-CAM-AZ', 'Lona Fundo Caminhão Azul',  'Lona', 'UN', 350.00,  5, 'Depósito',    'Azul')
ON CONFLICT (codigo) DO UPDATE SET
  cor       = EXCLUDED.cor,
  categoria = EXCLUDED.categoria;

-- ─── Estoque inicial para as lonas ────────────────────────────────────────────
-- Usa WHERE NOT EXISTS para não depender de constraint UNIQUE em produto_id

INSERT INTO public.estoque (produto_id, quantidade)
SELECT p.id, v.qty
FROM (VALUES
  ('LON-PE-AZ',  200),
  ('LON-PE-VD',  150),
  ('LON-PE-PT',  180),
  ('LON-PE-PR',  120),
  ('LON-PE-LJ',   80),
  ('LON-PVC-AZ', 100),
  ('LON-PVC-BC',  75),
  ('LON-PVC-PT',  90),
  ('LON-PVC-VD',  60),
  ('LON-PVC-VM',  45),
  ('LON-CVS-BG',  80),
  ('LON-CVS-VD',  50),
  ('LON-SMB-PT', 250),
  ('LON-SMB-VD', 180),
  ('LON-CAM-PT',  12),
  ('LON-CAM-AZ',   8)
) AS v(cod, qty)
JOIN public.produtos p ON p.codigo = v.cod
WHERE NOT EXISTS (
  SELECT 1 FROM public.estoque e WHERE e.produto_id = p.id
);
