-- Adicionar campo de valor total da prova
ALTER TABLE public.gabaritos 
ADD COLUMN IF NOT EXISTS valor_total numeric(10,2) DEFAULT 10.0;
