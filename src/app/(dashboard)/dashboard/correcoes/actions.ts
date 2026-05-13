'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveCorrecao(data: {
  gabarito_id: string;
  aluno_nome: string;
  acertos: number;
  total_questoes: number;
  nota: number;
  respostas_aluno: any;
  image_url?: string;
}) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Não autorizado')
  }

  const { error } = await supabase
    .from('correcoes')
    .insert({
      user_id: session.user.id,
      gabarito_id: data.gabarito_id,
      aluno_nome: data.aluno_nome,
      acertos: data.acertos,
      total_questoes: data.total_questoes,
      nota: data.nota,
      respostas_aluno: data.respostas_aluno,
      image_url: data.image_url
    })

  if (error) {
    console.error('Erro ao salvar correcao:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
