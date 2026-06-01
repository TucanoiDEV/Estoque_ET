-- ============================================================
-- Armazém Machado — Perfil do usuário: foto (avatar) no Storage
-- Execute este arquivo no SQL Editor do seu projeto Supabase
-- ============================================================

-- ─── 1. Coluna avatar_url na tabela usuarios ──────────────────────────────────

ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ─── 2. Bucket público "avatars" para as fotos de perfil ──────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ─── 3. Policies do Storage ───────────────────────────────────────────────────
-- As fotos ficam em pastas pelo id do usuário: "<auth.uid()>/avatar.<ext>".
-- Leitura é pública; cada usuário só escreve na sua própria pasta.

DROP POLICY IF EXISTS "avatars_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_own"   ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_own"   ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_own"   ON storage.objects;

CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
