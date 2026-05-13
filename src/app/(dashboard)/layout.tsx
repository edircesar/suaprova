import React from 'react'
import Link from 'next/link'
import { FileText, LayoutDashboard, CreditCard, Settings, Users, CheckCircle, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { signout } from '../(auth)/actions'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  const user = session?.user
  const fullName = user?.user_metadata?.full_name || 'Usuário'
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)

  // Buscar créditos reais
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', user?.id)
    .single()

  return (
    <div className="flex min-h-full flex-1 w-full bg-slate-50 dark:bg-slate-950">
      {/* ... sidebar content ... */}
      <aside className="w-64 border-r bg-white dark:bg-slate-900 hidden md:flex flex-col print:hidden">
        {/* ... existing sidebar ... */}
        <div className="h-16 flex items-center px-6 border-b">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg mr-3">
            S
          </div>
          <span className="font-bold text-lg tracking-tight">SuaProva AI</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 font-medium">
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link href="/dashboard/provas" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 font-medium">
            <FileText size={20} />
            Provas
          </Link>
          <Link href="/dashboard/correcoes" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 font-medium">
            <CheckCircle size={20} />
            Correções
          </Link>
          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Conta</p>
          </div>
          <Link href="/dashboard/financeiro" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 font-medium">
            <CreditCard size={20} />
            Financeiro
          </Link>
          <Link href="/dashboard/configuracoes" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 font-medium">
            <Settings size={20} />
            Configurações
          </Link>
        </nav>
        
        <div className="p-4 border-t">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-lg shadow-indigo-500/20">
            <p className="text-sm font-medium mb-1">Créditos disponíveis</p>
            <p className="text-2xl font-black">{profile?.credits || 0}</p>
            <Link href="/dashboard/financeiro" className="text-xs text-white/80 hover:text-white mt-2 inline-block border-b border-white/20">
              Comprar mais →
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b bg-white dark:bg-slate-900 flex items-center justify-between px-6 print:hidden">
          {/* ... existing mobile header ... */}
          <div className="md:hidden flex items-center">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg mr-3">
            S
            </div>
            <span className="font-bold text-lg tracking-tight">SuaProva AI</span>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{fullName}</p>
                <form action={signout}>
                  <button type="submit" className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                    <LogOut size={12} />
                    Sair
                  </button>
                </form>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
