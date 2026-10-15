-- Imita o que existe em PRODUÇÃO e não no repositório (levantado a 15/10/2026),
-- para os testes provarem que a migração de segurança também fecha estas portas.
CREATE OR REPLACE FUNCTION public.auth_role() RETURNS TEXT
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT role::TEXT FROM profiles WHERE id = auth.uid() $$;
CREATE OR REPLACE FUNCTION public.my_aluno_id() RETURNS UUID
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM alunos WHERE email = (SELECT email FROM profiles WHERE id = auth.uid()) $$;
CREATE POLICY "Aluno regista presença própria" ON presencas FOR INSERT WITH CHECK (aluno_id = my_aluno_id());
CREATE POLICY "Aluno atualiza próprio registo" ON alunos FOR UPDATE TO authenticated
  USING (email = (SELECT email FROM profiles WHERE id = auth.uid()))
  WITH CHECK (email = (SELECT email FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Aluno atualiza próprio perfil" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Utilizador cria próprio perfil" ON profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Staff gere pagamentos" ON pagamentos FOR ALL TO authenticated
  USING (auth_role() = ANY (ARRAY['superadmin','admin','atendimento']))
  WITH CHECK (auth_role() = ANY (ARRAY['superadmin','admin','atendimento']));
