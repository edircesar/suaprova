'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Não autorizado')
  }

  const fullName = formData.get('fullName') as string

  if (!fullName || fullName.trim() === '') {
    return { error: 'O nome não pode estar vazio' }
  }

  const { error } = await supabase.auth.updateUser({
    data: { full_name: fullName }
  })

  if (error) {
    console.error('Erro ao atualizar perfil:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/configuracoes')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function changePassword(formData: FormData) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Não autorizado')
  }

  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return { error: 'As senhas não conferem' }
  }

  if (password.length < 6) {
    return { error: 'A senha deve ter pelo menos 6 caracteres' }
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    console.error('Erro ao atualizar senha:', error)
    return { error: error.message }
  }

  return { success: true }
}
