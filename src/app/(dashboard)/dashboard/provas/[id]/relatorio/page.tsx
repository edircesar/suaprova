import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, FileText, Users, CheckCircle, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import PrintButton from './PrintButton'

export default async function RelatorioProvaPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  // 1. Buscar dados do gabarito
  const { data: gabarito } = await supabase
    .from('gabaritos')
    .select('*')
    .eq('id', id)
    .single()

  // 2. Buscar todas as correções vinculadas
  const { data: correcoes } = await supabase
    .from('correcoes')
    .select('*')
    .eq('gabarito_id', id)
    .order('aluno_nome', { ascending: true })

  if (!gabarito) {
    return <div className="p-10 text-center">Gabarito não encontrado.</div>
  }

  const totalAlunos = correcoes?.length || 0
  const mediaTurma = totalAlunos > 0 
    ? (correcoes!.reduce((acc, curr) => acc + curr.nota, 0) / totalAlunos).toFixed(2)
    : 0

  const maiorNota = totalAlunos > 0 
    ? Math.max(...correcoes!.map(c => c.nota)).toFixed(2)
    : 0

  return (
    <div className="space-y-6 pb-20">
      {/* Header - Hidden on Print */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/provas"
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 text-slate-500 transition-colors dark:hover:bg-slate-800"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Relatório de Desempenho</h1>
            <p className="text-slate-500">{gabarito.nome}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <PrintButton />
        </div>
      </div>

      {/* Stats Cards - Custom styling for Print */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="print:border-slate-300 print:shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users size={14} /> Total de Alunos
            </CardDescription>
            <CardTitle className="text-2xl">{totalAlunos}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="print:border-slate-300 print:shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp size={14} /> Média da Turma
            </CardDescription>
            <CardTitle className="text-2xl text-indigo-600">{mediaTurma}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="print:border-slate-300 print:shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle size={14} /> Valor da Prova
            </CardDescription>
            <CardTitle className="text-2xl">{gabarito.valor_total.toFixed(1)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="print:border-slate-300 print:shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <FileText size={14} /> Questões
            </CardDescription>
            <CardTitle className="text-2xl">{gabarito.questoes_qtd}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="print:border-slate-300 print:shadow-none overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-b print:bg-white">
          <h3 className="font-bold text-slate-900 dark:text-white">Listagem de Resultados</h3>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-900/50 border-b print:bg-white">
                <tr>
                  <th className="px-6 py-4 font-bold">Posição</th>
                  <th className="px-6 py-4 font-bold">Nome do Aluno</th>
                  <th className="px-6 py-4 font-bold text-center">Acertos</th>
                  <th className="px-6 py-4 font-bold text-center">Erros</th>
                  <th className="px-6 py-4 font-bold text-right">Nota Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {correcoes && correcoes.length > 0 ? (
                  correcoes.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors print:hover:bg-transparent">
                      <td className="px-6 py-4 text-slate-500">{idx + 1}º</td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white uppercase">
                        {c.aluno_nome || 'Não identificado'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md font-bold">
                          {c.acertos}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-rose-500">
                        {c.total_questoes - c.acertos}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-lg">
                        <span className={c.nota >= (gabarito.valor_total * 0.6) ? 'text-emerald-600' : 'text-rose-600'}>
                          {c.nota.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                      Nenhuma prova corrigida para este gabarito ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Print Footer - Only visible on Print */}
      <div className="hidden print:block mt-20 border-t pt-8 text-center text-slate-400 text-xs">
        <p>Relatório gerado automaticamente por <strong>SuaProva AI</strong></p>
        <p className="mt-1">{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; }
          .Card { border: 1px solid #e2e8f0 !important; box-shadow: none !important; }
        }
      `}} />
    </div>
  )
}
