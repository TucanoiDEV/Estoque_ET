-- ============================================================
-- Armazém Machado — Correção de permissões + auto-cadastro
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- ─── 1. Grants para o PostgREST (corrige o 403) ──────────────────────────────

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT                                    ON public.usuarios      TO authenticated;
GRANT INSERT, UPDATE, DELETE                    ON public.usuarios      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE            ON public.produtos      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE            ON public.estoque       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE            ON public.fornecedores  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE            ON public.entradas      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE            ON public.configuracoes TO authenticated;

-- ─── 2. Trigger: cria linha em public.usuarios ao cadastrar no Auth ───────────
-- Assim qualquer novo usuário autenticado já tem perfil na tabela.
-- Cargo padrão: 'operador'. Mude para 'admin' manualmente se precisar.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome, email, cargo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    'operador'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 3. Insere o admin existente (se já criou no Auth mas falta na tabela) ────
-- Troque o cargo de 'operador' para 'admin' logo após inserir.

INSERT INTO public.usuarios (id, nome, email, cargo)
SELECT
  id,
  split_part(email, '@', 1) AS nome,
  email,
  'admin' AS cargo
FROM auth.users
WHERE email = 'admin@armazemmachado.demo'
ON CONFLICT (id) DO UPDATE SET cargo = 'admin';

-- ─── 4. Confirma ──────────────────────────────────────────────────────────────

SELECT id, nome, email, cargo FROM public.usuarios;
