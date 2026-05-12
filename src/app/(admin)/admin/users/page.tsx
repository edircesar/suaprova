import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { redirect } from 'next/navigation'
import { updateCredits } from './actions'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  // Verificar sessão
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  // Buscar todos os perfis. 
  // Pela regra de RLS que criamos, isso só retornará todos os registros se o usuário atual for 'admin'.
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // Se deu erro ou voltou vazio, e o cara não é admin, vai ser barrado (veremos isso no middleware ou layout também).
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
        <p className="text-slate-500">Gerencie os usuários e os créditos disponíveis.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-red-500">Erro ao carregar usuários (Você é um admin?)</p>
          ) : profiles && profiles.length > 0 ? (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">ID / Email</th>
                    <th scope="col" className="px-6 py-3">Papel (Role)</th>
                    <th scope="col" className="px-6 py-3">Créditos</th>
                    <th scope="col" className="px-6 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile) => (
                    <tr key={profile.id} className="bg-white border-b dark:bg-slate-950 dark:border-slate-800">
                      <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap dark:text-white">
                        <div className="flex flex-col">
                          <span>{profile.email}</span>
                          <span className="text-xs text-slate-500">{profile.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          profile.role === 'admin' 
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                        }`}>
                          {profile.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {profile.credits}
                      </td>
                      <td className="px-6 py-4">
                        <form action={updateCredits} className="flex items-center gap-2">
                          <input type="hidden" name="userId" value={profile.id} />
                          <input 
                            type="number" 
                            name="amount" 
                            defaultValue={10} 
                            className="w-16 px-2 py-1 text-sm border rounded dark:bg-slate-900 dark:border-slate-700" 
                          />
                          <button 
                            type="submit"
                            className="px-3 py-1 text-xs font-medium text-white bg-slate-800 rounded hover:bg-slate-700"
                          >
                            Adicionar
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500">Nenhum usuário encontrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
