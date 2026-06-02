-- ============================================================
-- Armazém Machado — Migração: usuário edita o próprio perfil
-- ------------------------------------------------------------
-- ANTES: só admin podia dar UPDATE em public.usuarios
--        (policy "usuarios_update_admin"), o que fazia a troca de
--        foto de perfil falhar para operador/visualizador.
-- DEPOIS: cada usuário atualiza a PRÓPRIA linha (nome/avatar), e o
--        WITH CHECK impede mudar o próprio cargo (escalonamento).
--        Admin continua podendo atualizar qualquer usuário.
--
-- Seguro para produção: não toca em dados, mexe só na policy de UPDATE
-- de usuarios. Idempotente — pode rodar mais de uma vez.
-- ============================================================

-- get_meu_cargo() já existe na sua base; recriada por segurança (sem efeito se igual).
CREATE OR REPLACE FUNCTION public.get_meu_cargo()
RETURNS TEXT LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT cargo FROM public.usuarios WHERE id = auth.uid();
$$;

-- Remove a policy antiga (admin-only) e qualquer versão anterior da nova.
DROP POLICY IF EXISTS "usuarios_update_admin"         ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update_self_or_admin" ON public.usuarios;

-- Cria a nova policy: dono OU admin pode atualizar; não-admin não muda o próprio cargo.
CREATE POLICY "usuarios_update_self_or_admin"
  ON public.usuarios FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.get_meu_cargo() = 'admin')
  WITH CHECK (
    public.get_meu_cargo() = 'admin'
    OR (id = auth.uid() AND cargo = public.get_meu_cargo())
  );
