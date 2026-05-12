'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveSystemSettings(formData: FormData) {
  const supabase = await createClient()

  // Verificação de segurança: apenas admin
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Não autorizado.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw new Error('Permissão negada.')
  }

  const geminiKey = formData.get('gemini_key') as string
  const freeCredits = parseInt(formData.get('free_credits') as string, 10)
  const creditPrice = parseFloat((formData.get('credit_price') as string).replace(',', '.'))

  // Como teremos apenas 1 registro de configuração geral, podemos usar um ID fixo ou UPSERT
  const { error } = await supabase
    .from('system_settings')
    .upsert({
      id: 1, 
      gemini_api_key: geminiKey,
      free_credits_new_user: isNaN(freeCredits) ? 10 : freeCredits,
      credit_package_price: isNaN(creditPrice) ? 29.90 : creditPrice,
      updated_at: new Date().toISOString()
    })

  if (error) {
    console.error('Erro ao salvar configurações:', error.message)
    throw new Error('Falha ao salvar as configurações no banco de dados.')
  }

  revalidatePath('/admin/config')
}
