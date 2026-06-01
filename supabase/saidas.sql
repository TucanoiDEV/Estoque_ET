-- ============================================================
-- Armazém Machado — Tabela de SAÍDAS de estoque
-- Execute no SQL Editor do Supabase (depois do schema.sql)
-- Registra o histórico de saídas para os gráficos do dashboard.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.saidas (
  id           UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id   UUID    REFERENCES public.produtos(id) ON DELETE CASCADE,
  usuario_id   UUID    REFERENCES public.usuarios(id),
  quantidade   INTEGER NOT NULL,
  motivo       TEXT,
  observacoes  TEXT,
  data_saida   DATE    DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.saidas ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saidas TO authenticated;

CREATE POLICY "saidas_select"
  ON public.saidas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "saidas_insert"
  ON public.saidas FOR INSERT
  TO authenticated
  WITH CHECK (public.get_meu_cargo() IN ('admin', 'operador'));

CREATE POLICY "saidas_update"
  ON public.saidas FOR UPDATE
  TO authenticated
  USING (public.get_meu_cargo() = 'admin');

CREATE POLICY "saidas_delete"
  ON public.saidas FOR DELETE
  TO authenticated
  USING (public.get_meu_cargo() = 'admin');

-- ─── Realtime ─────────────────────────────────────────────────────────────────
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.saidas;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;
