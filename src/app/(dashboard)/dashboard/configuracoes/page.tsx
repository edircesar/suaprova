import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from './settings-form'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Buscar dados reais do perfil para créditos
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  const userData = {
    email: session.user.email,
    fullName: session.user.user_metadata?.full_name || profile?.full_name || 'Usuário',
    credits: profile?.credits || 0
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-slate-500">Gerencie sua conta, segurança e preferências.</p>
      </div>

      <SettingsForm user={userData} />
    </div>
  )
}
