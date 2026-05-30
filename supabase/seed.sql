-- ============================================================
-- Armazém Machado — Dados de exemplo (seed)
-- Execute APÓS o schema.sql
-- ATENÇÃO: Substitua os UUIDs pelos IDs reais dos usuários
--          criados no Supabase Authentication antes de executar.
-- ============================================================

-- ─── Fornecedores ─────────────────────────────────────────────────────────────

INSERT INTO public.fornecedores (id, nome, contato, prazo_entrega, condicoes_pagamento) VALUES
  ('11111111-0000-0000-0000-000000000001', 'TechParts Brasil',       'contato@techparts.com.br',   7,  '30/60/90 dias'),
  ('11111111-0000-0000-0000-000000000002', 'DistribuidoraPro Ltda.', 'vendas@distribuidorapro.br', 3,  'À vista 5% desconto'),
  ('11111111-0000-0000-0000-000000000003', 'Importadora Global',     'import@globaltrade.com',     15, '60 dias');

-- ─── Produtos ─────────────────────────────────────────────────────────────────

INSERT INTO public.produtos (id, codigo, nome, categoria, unidade, custo_unitario, estoque_minimo, local_armazenamento) VALUES
  ('22222222-0000-0000-0000-000000000001', 'ELE-001', 'Cabo USB-C 2m',           'Eletrônicos',    'un',  25.90,  20, 'Estoque A'),
  ('22222222-0000-0000-0000-000000000002', 'ELE-002', 'Carregador 65W GaN',      'Eletrônicos',    'un',  89.90,  15, 'Estoque A'),
  ('22222222-0000-0000-0000-000000000003', 'INF-001', 'Mouse Sem Fio',           'Informática',    'un', 149.90,  10, 'Estoque B'),
  ('22222222-0000-0000-0000-000000000004', 'INF-002', 'Teclado Mecânico',        'Informática',    'un', 349.00,   5, 'Estoque B'),
  ('22222222-0000-0000-0000-000000000005', 'LIM-001', 'Álcool Isopropílico 1L',  'Limpeza',        'lt',  18.50,  30, 'Depósito'),
  ('22222222-0000-0000-0000-000000000006', 'LIM-002', 'Papel Toalha (fardo)',    'Limpeza',        'fd',  45.00,  20, 'Depósito'),
  ('22222222-0000-0000-0000-000000000007', 'EMP-001', 'Caixa Papelão P',        'Embalagem',      'un',   3.20, 100, 'Depósito'),
  ('22222222-0000-0000-0000-000000000008', 'EMP-002', 'Fita Adesiva 45mm',      'Embalagem',      'rl',   8.90,  50, 'Depósito'),
  ('22222222-0000-0000-0000-000000000009', 'ELE-003', 'SSD 500GB NVMe',         'Eletrônicos',    'un', 289.00,   8, 'Estoque A'),
  ('22222222-0000-0000-0000-000000000010', 'INF-003', 'Webcam Full HD 1080p',   'Informática',    'un', 199.90,   5, 'Estoque B');

-- ─── Estoque inicial ──────────────────────────────────────────────────────────

INSERT INTO public.estoque (produto_id, quantidade) VALUES
  ('22222222-0000-0000-0000-000000000001', 45),   -- Cabo USB-C: normal
  ('22222222-0000-0000-0000-000000000002', 18),   -- Carregador: normal
  ('22222222-0000-0000-0000-000000000003',  9),   -- Mouse: baixo (< 1.5x mínimo)
  ('22222222-0000-0000-0000-000000000004',  4),   -- Teclado: crítico
  ('22222222-0000-0000-0000-000000000005', 62),   -- Álcool: normal
  ('22222222-0000-0000-0000-000000000006', 24),   -- Papel: normal
  ('22222222-0000-0000-0000-000000000007', 85),   -- Caixa: baixo
  ('22222222-0000-0000-0000-000000000008', 38),   -- Fita: baixo
  ('22222222-0000-0000-0000-000000000009',  5),   -- SSD: baixo
  ('22222222-0000-0000-0000-000000000010',  3);   -- Webcam: crítico

-- ─── Configurações padrão ─────────────────────────────────────────────────────

INSERT INTO public.configuracoes (chave, valor) VALUES
  ('empresa_nome',            'Minha Empresa Ltda.'),
  ('empresa_cnpj',            '00.000.000/0001-00'),
  ('empresa_moeda',           'BRL'),
  ('empresa_fuso',            'America/Sao_Paulo'),
  ('estoque_minimo_padrao',   '10'),
  ('categorias',              '["Eletrônicos","Informática","Limpeza","Embalagem","Outros"]'),
  ('alertas_ia',              'false'),
  ('claude_api_key',          '')
ON CONFLICT (chave) DO NOTHING;

-- ─── NOTA IMPORTANTE ─────────────────────────────────────────────────────────
-- Para criar os usuários de demonstração:
--
-- 1. No painel do Supabase, vá em Authentication > Users
-- 2. Crie 3 usuários:
--    - admin@armazemmachado.demo   / Senha: Admin@123
--    - operador@armazemmachado.demo / Senha: Oper@123
--    - viewer@armazemmachado.demo  / Senha: View@123
--
-- 3. Copie os UUIDs gerados e execute:
--
-- INSERT INTO public.usuarios (id, nome, email, cargo) VALUES
--   ('<UUID_DO_ADMIN>',     'Administrador', 'admin@armazemmachado.demo',    'admin'),
--   ('<UUID_DO_OPERADOR>',  'Operador',      'operador@armazemmachado.demo', 'operador'),
--   ('<UUID_DO_VIEWER>',    'Visualizador',  'viewer@armazemmachado.demo',   'visualizador');
--
-- ─────────────────────────────────────────────────────────────────────────────
