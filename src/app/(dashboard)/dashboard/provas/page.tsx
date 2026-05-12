import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProvasPage() {
  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  // Buscar gabaritos do usuário logado
  const { data: gabaritos, error } = await supabase
    .from('gabaritos')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Provas (Gabaritos)</h1>
          <p className="text-slate-500">Gerencie os gabaritos oficiais para correção.</p>
        </div>
        
        <Link 
          href="/dashboard/provas/novo" 
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-700 h-10 py-2 px-4 shadow-sm"
        >
          <Plus size={16} className="mr-2" />
          Novo Gabarito
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Seus Gabaritos</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Buscar gabarito..." 
                className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 pl-9 dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-500 text-sm">A tabela 'gabaritos' ainda não foi criada no banco de dados.</p>
              <p className="text-slate-500 text-xs mt-1">Execute o script SQL fornecido.</p>
            </div>
          ) : !gabaritos || gabaritos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">Nenhum gabarito cadastrado</h3>
              <p className="text-sm text-slate-500 max-w-sm mt-1 mb-4">
                Você ainda não possui nenhum gabarito oficial. Crie um novo para começar a corrigir provas.
              </p>
              <Link 
                href="/dashboard/provas/novo" 
                className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
              >
                <Plus size={16} className="mr-1" />
                Criar meu primeiro gabarito
              </Link>
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th scope="col" className="px-6 py-3 rounded-tl-lg">Nome da Prova</th>
                    <th scope="col" className="px-6 py-3">Questões</th>
                    <th scope="col" className="px-6 py-3">Data de Criação</th>
                    <th scope="col" className="px-6 py-3 rounded-tr-lg">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {gabaritos.map((gabarito) => (
                    <tr key={gabarito.id} className="bg-white border-b last:border-0 dark:bg-slate-950 dark:border-slate-800">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <FileText size={16} />
                          </div>
                          {gabarito.nome}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                          {gabarito.questoes_qtd} questões
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(gabarito.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium">
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
