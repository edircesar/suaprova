'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateCredits(formData: FormData) {
  const supabase = await createClient()
  
  const userId = formData.get('userId') as string
  const amount = parseInt(formData.get('amount') as string, 10)

  if (!userId || isNaN(amount)) return { error: 'Valores inválidos.' }

  // Verificar se o usuário atual é admin
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Não autorizado.' }

  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!currentUserProfile || currentUserProfile.role !== 'admin') {
    return { error: 'Permissão negada.' }
  }

  // Buscar os créditos atuais do usuário
  const { data: targetProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single()

  if (fetchError || !targetProfile) {
    return { error: 'Usuário não encontrado.' }
  }

  // Atualizar os créditos
  const newCredits = targetProfile.credits + amount

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ credits: newCredits })
    .eq('id', userId)

  if (updateError) {
    return { error: 'Erro ao atualizar créditos.' }
  }

  revalidatePath('/admin/users')
  return { success: true }
}
