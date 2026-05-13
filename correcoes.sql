-- Tabela de Resultados das Correções
CREATE TABLE IF NOT EXISTS public.correcoes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  gabarito_id uuid REFERENCES public.gabaritos(id) ON DELETE CASCADE NOT NULL,
  aluno_nome text,
  acertos integer NOT NULL,
  total_questoes integer NOT NULL,
  nota numeric(4,2) NOT NULL,
  respostas_aluno jsonb NOT NULL,
  image_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Configurar RLS
ALTER TABLE public.correcoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias correções"
  ON public.correcoes FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Usuários podem inserir suas próprias correções"
  ON public.correcoes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias correções"
  ON public.correcoes FOR DELETE USING (auth.uid() = user_id);
