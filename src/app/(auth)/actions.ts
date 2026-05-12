'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm-password') as string
  const fullName = formData.get('name') as string

  if (password !== confirmPassword) {
    // Em um cenário real, retornaríamos um erro para a UI. 
    // Para simplificar agora, vamos apenas dar um log ou redirect com erro.
    console.error('Senhas não conferem')
    return
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    console.error('Erro no cadastro:', error.message)
    return
  }

  // Redireciona após o cadastro
  // Nota: Se a confirmação de e-mail estiver ativada no Supabase, 
  // o usuário precisará confirmar antes de conseguir logar em alguns fluxos.
  redirect('/dashboard')
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('ERRO NO LOGIN DETALHADO:', {
      message: error.message,
      status: error.status,
      code: error.code
    })
    throw new Error(error.message)
  }

  redirect('/dashboard')
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/nova-senha`,
  })

  if (error) {
    throw new Error(error.message)
  }

  // Redireciona para uma tela de aviso "Verifique seu e-mail"
  redirect('/login?message=Verifique seu e-mail para redefinir a senha')
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    throw new Error(error.message)
  }

  redirect('/dashboard')
}
