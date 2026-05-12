'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { FileText, ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createGabarito } from '../actions'

export default function NovoGabaritoPage() {
  const [questoesQtd, setQuestoesQtd] = useState(10)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [respostas, setRespostas] = useState<Record<number, string>>({})

  const handleSelectAnswer = (questao: number, alternativa: string) => {
    setRespostas(prev => ({
      ...prev,
      [questao]: alternativa
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      await createGabarito(formData)
    } catch (error) {
      console.error(error)
      setIsSubmitting(false)
    }
  }

  const alternativas = ['A', 'B', 'C', 'D', 'E']

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-2">
        <Link 
          href="/dashboard/provas"
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 text-slate-500 transition-colors dark:hover:bg-slate-800"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Criar Gabarito</h1>
          <p className="text-slate-500">Defina o nome e as respostas oficiais da prova.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Prova</CardTitle>
            <CardDescription>Informações básicas para identificar este gabarito futuramente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="nome" className="text-sm font-medium leading-none">
                  Nome da Prova / Gabarito
                </label>
                <input
                  id="nome"
                  name="nome"
                  required
                  placeholder="Ex: Simulado ENEM 2026 - Caderno Azul"
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:placeholder:text-slate-400"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="questoes_qtd" className="text-sm font-medium leading-none">
                  Quantidade de Questões
                </label>
                <select
                  id="questoes_qtd"
                  name="questoes_qtd"
                  value={questoesQtd}
                  onChange={(e) => setQuestoesQtd(parseInt(e.target.value))}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950"
                >
                  <option value={5}>5 Questões</option>
                  <option value={10}>10 Questões</option>
                  <option value={15}>15 Questões</option>
                  <option value={20}>20 Questões</option>
                  <option value={30}>30 Questões</option>
                  <option value={50}>50 Questões</option>
                  <option value={90}>90 Questões</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cartão Resposta (Gabarito Oficial)</CardTitle>
            <CardDescription>
              Marque a alternativa correta para cada questão. Clique sobre a letra desejada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: questoesQtd }).map((_, idx) => {
                const num = idx + 1
                return (
                  <div key={num} className="flex flex-col gap-2 p-3 rounded-lg border border-slate-100 bg-slate-50 dark:bg-slate-900 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Questão {num}</span>
                      {respostas[num] && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          Marcada
                        </span>
                      )}
                    </div>
                    
                    {/* Campo oculto para ser enviado no FormData */}
                    <input type="hidden" name={`answer_${num}`} value={respostas[num] || ''} required />
                    
                    <div className="flex items-center gap-1 justify-between">
                      {alternativas.map(alt => {
                        const isSelected = respostas[num] === alt
                        return (
                          <button
                            key={alt}
                            type="button"
                            onClick={() => handleSelectAnswer(num, alt)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                              isSelected 
                                ? 'bg-indigo-600 text-white shadow-md transform scale-110' 
                                : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-indigo-900/30 dark:hover:border-indigo-800'
                            }`}
                          >
                            {alt}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 dark:bg-slate-900/50 border-t flex justify-end py-4">
            <button
              type="submit"
              disabled={isSubmitting || Object.keys(respostas).length < questoesQtd}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-8 py-2 shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Salvar Gabarito Oficial
                </>
              )}
            </button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
