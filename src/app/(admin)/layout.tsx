import { LayoutDashboard, Users, Settings, ShieldAlert, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signout } from '../(auth)/actions'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  const user = session.user
  const fullName = user?.user_metadata?.full_name || 'Admin'
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)

  return (
    <div className="flex min-h-full flex-1 w-full bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-slate-900 text-slate-300 hidden md:flex flex-col">
        {/* ... sidebar ... */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-lg mr-3">
            <ShieldAlert size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">Admin Panel</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white font-medium">
            <LayoutDashboard size={20} />
            Visão Geral
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white font-medium">
            <Users size={20} />
            Usuários
          </Link>
          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sistema</p>
          </div>
          <Link href="/admin/config" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white font-medium">
            <Settings size={20} />
            Configurações
          </Link>
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white flex justify-center w-full bg-slate-800 py-2 rounded-lg">
            Voltar ao App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950">
        {/* Header */}
        <header className="h-16 border-b bg-white dark:bg-slate-900 flex items-center justify-between px-6 shadow-sm">
          {/* ... mobile header ... */}
          <div className="md:hidden flex items-center">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-lg mr-3">
              <ShieldAlert size={18} />
            </div>
            <span className="font-bold text-lg tracking-tight">Admin</span>
          </div>
          
          <div className="hidden md:flex items-center">
            <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200">Painel de Controle</h2>
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
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-bold">
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
