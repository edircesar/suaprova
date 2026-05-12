-- Tabela de Gabaritos
CREATE TABLE IF NOT EXISTS public.gabaritos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  questoes_qtd integer NOT NULL,
  respostas jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Configurar RLS (Row Level Security)
ALTER TABLE public.gabaritos ENABLE ROW LEVEL SECURITY;

-- Política de leitura: O usuário só pode ver seus próprios gabaritos, ou admins podem ver todos
CREATE POLICY "Usuários podem ver seus próprios gabaritos"
  ON public.gabaritos FOR SELECT
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Política de inserção: O usuário só pode inserir gabaritos para si mesmo
CREATE POLICY "Usuários podem inserir seus próprios gabaritos"
  ON public.gabaritos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política de atualização: O usuário só pode atualizar seus próprios gabaritos
CREATE POLICY "Usuários podem atualizar seus próprios gabaritos"
  ON public.gabaritos FOR UPDATE
  USING (auth.uid() = user_id);

-- Política de deleção: O usuário só pode deletar seus próprios gabaritos
CREATE POLICY "Usuários podem deletar seus próprios gabaritos"
  ON public.gabaritos FOR DELETE
  USING (auth.uid() = user_id);
