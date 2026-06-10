-- ============================================================
-- Armazém Machado — Cargo DEVELOPER (super-dev, acima do admin)
-- Execute no SQL Editor do Supabase (idempotente — pode rodar de novo).
--
-- O developer tem acesso TOTAL (tratado como admin no RLS) e, no app, uma
-- área exclusiva de Desenvolvedor que o admin não vê.
-- ============================================================

-- 1) Permite o cargo 'developer' na tabela usuarios
ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_cargo_check;
ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_cargo_check
  CHECK (cargo IN ('admin', 'operador', 'visualizador', 'developer'));

-- 2) RLS: o developer é tratado como admin SEM precisar recriar as policies.
--    get_meu_cargo() passa a devolver 'admin' quando o cargo real é 'developer'.
--    (O app continua lendo o cargo real de public.usuarios para mostrar a área de dev.)
CREATE OR REPLACE FUNCTION public.get_meu_cargo()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT CASE WHEN cargo = 'developer' THEN 'admin' ELSE cargo END
  FROM public.usuarios WHERE id = auth.uid();
$$;

-- 3) Promove a conta de dev a 'developer'.
--    O usuário já deve existir em Authentication > Users (o trigger o cadastra
--    como 'operador'). Comparação por LOWER() porque o auth normaliza o email.
UPDATE public.usuarios
   SET cargo = 'developer'
 WHERE lower(email) = lower('tucanoidev@gmail.com');

-- Confirme:
-- SELECT email, cargo FROM public.usuarios ORDER BY cargo;
