-- Schema SQL para o Supabase (PostgreSQL)
-- Execute no SQL Editor do painel do Supabase

-- Habilita a extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ——— Tabela de produtos ———
CREATE TABLE IF NOT EXISTS produtos (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  codigo               TEXT UNIQUE NOT NULL,
  nome                 TEXT NOT NULL,
  categoria            TEXT NOT NULL,
  tipo                 TEXT NOT NULL,
  unidade              TEXT NOT NULL DEFAULT 'm',
  custo_unitario       NUMERIC(12,2) NOT NULL DEFAULT 0,
  estoque_minimo       NUMERIC(12,2) NOT NULL DEFAULT 0,
  quantidade           NUMERIC(12,2) NOT NULL DEFAULT 0,
  local_armazenamento  TEXT,
  cor                  TEXT,
  fornecedor_id        TEXT,
  fornecedor_nome      TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ——— Tabela de entradas ———
CREATE TABLE IF NOT EXISTS entradas (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  produto_id           TEXT NOT NULL REFERENCES produtos(id),
  produto_nome         TEXT,
  fornecedor_id        TEXT NOT NULL,
  fornecedor_nome      TEXT,
  quantidade           NUMERIC(12,2) NOT NULL,
  custo_unitario       NUMERIC(12,2) NOT NULL,
  total                NUMERIC(12,2) NOT NULL,
  nf_numero            TEXT,
  data_recebimento     DATE NOT NULL,
  local_armazenamento  TEXT,
  observacoes          TEXT,
  sincronizado         BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ——— Tabela de fornecedores ———
CREATE TABLE IF NOT EXISTS fornecedores (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nome                 TEXT NOT NULL,
  contato              TEXT,
  email                TEXT,
  prazo_entrega        INTEGER,
  condicoes_pagamento  TEXT,
  ativo                BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ——— Tabela de categorias ———
CREATE TABLE IF NOT EXISTS categorias (
  id    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nome  TEXT NOT NULL UNIQUE,
  cor   TEXT
);

-- ——— Tabela de usuários ———
CREATE TABLE IF NOT EXISTS usuarios (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nome          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  nivel_acesso  TEXT NOT NULL CHECK (nivel_acesso IN ('admin','operador','visualizador')),
  ativo         BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ——— Tabela de configurações ———
CREATE TABLE IF NOT EXISTS configuracoes (
  chave       TEXT PRIMARY KEY,
  valor       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ——— Índices ———
CREATE INDEX IF NOT EXISTS idx_entradas_produto   ON entradas(produto_id);
CREATE INDEX IF NOT EXISTS idx_entradas_data      ON entradas(data_recebimento);
CREATE INDEX IF NOT EXISTS idx_entradas_sync      ON entradas(sincronizado);
CREATE INDEX IF NOT EXISTS idx_produtos_codigo    ON produtos(codigo);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria);

-- ——— Row Level Security (RLS) ———
ALTER TABLE produtos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE entradas     ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias   ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios     ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (anon tem acesso total — ajuste para produção)
CREATE POLICY "acesso_total" ON produtos     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total" ON entradas     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total" ON fornecedores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total" ON categorias   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total" ON usuarios     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total" ON configuracoes FOR ALL USING (true) WITH CHECK (true);

-- ——— Habilitar Realtime ———
-- Execute no painel: Database → Replication → Tabelas → habilitar produtos e entradas
-- Ou via SQL:
ALTER TABLE produtos  REPLICA IDENTITY FULL;
ALTER TABLE entradas  REPLICA IDENTITY FULL;

-- Publicação para Realtime
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE produtos, entradas;
