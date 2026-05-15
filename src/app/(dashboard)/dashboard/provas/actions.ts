'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createGabarito(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Não autorizado')
  }

  const nome = formData.get('nome') as string
  const questoesQtd = parseInt(formData.get('questoes_qtd') as string, 10)
  const valorTotal = parseFloat(formData.get('valor_total') as string) || 10.0
  
  // Extrair as respostas (esperado vir no formato answer_1, answer_2, etc)
  const respostas: Record<string, string> = {}
  for (let i = 1; i <= questoesQtd; i++) {
    const answer = formData.get(`answer_${i}`) as string
    if (answer) {
      respostas[i.toString()] = answer
    }
  }

  const { error } = await supabase
    .from('gabaritos')
    .insert({
      user_id: session.user.id,
      nome,
      questoes_qtd: questoesQtd,
      valor_total: valorTotal,
      respostas
    })

  if (error) {
    console.error('Erro ao criar gabarito:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/provas')
  revalidatePath('/dashboard/correcoes')
  redirect('/dashboard/provas')
}

export async function deleteGabarito(id: string) {
  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Não autorizado')
  }

  const { error } = await supabase
    .from('gabaritos')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id) // Garantir que só deleta o que é seu

  if (error) {
    console.error('Erro ao deletar gabarito:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/provas')
  return { success: true }
}

export async function renameGabarito(id: string, novoNome: string) {
  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Não autorizado')
  }

  if (!novoNome || novoNome.trim() === '') {
    return { error: 'O nome não pode estar vazio' }
  }

  const { error } = await supabase
    .from('gabaritos')
    .update({ nome: novoNome })
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (error) {
    console.error('Erro ao renomear gabarito:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/provas')
  return { success: true }
}

export async function getGabarito(id: string) {
  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Não autorizado')
  }

  const { data, error } = await supabase
    .from('gabaritos')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single()

  if (error) {
    console.error('Erro ao buscar gabarito:', error)
    return null
  }

  return data
}

export async function updateGabarito(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Não autorizado')
  }

  const nome = formData.get('nome') as string
  const questoesQtd = parseInt(formData.get('questoes_qtd') as string, 10)
  const valorTotal = parseFloat(formData.get('valor_total') as string) || 10.0
  
  const respostas: Record<string, string> = {}
  for (let i = 1; i <= questoesQtd; i++) {
    const answer = formData.get(`answer_${i}`) as string
    if (answer) {
      respostas[i.toString()] = answer
    }
  }

  const { error } = await supabase
    .from('gabaritos')
    .update({
      nome,
      questoes_qtd: questoesQtd,
      valor_total: valorTotal,
      respostas
    })
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (error) {
    console.error('Erro ao atualizar gabarito:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/provas')
  revalidatePath(`/dashboard/provas/${id}/editar`)
  redirect('/dashboard/provas')
}
