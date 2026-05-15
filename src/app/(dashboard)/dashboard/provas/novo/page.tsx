'use client'

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { FileText, ArrowLeft, Save, Loader2, UploadCloud, Wand2, X } from 'lucide-react'
import Link from 'next/link'
import { createGabarito } from '../actions'
import { extractGabaritoFromImage } from '../extract-gabarito-action'

export default function NovoGabaritoPage() {
  const [questoesQtd, setQuestoesQtd] = useState(10)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [respostas, setRespostas] = useState<Record<number, string>>({})
  
  // Tabs State
  const [activeTab, setActiveTab] = useState<'manual' | 'imagem'>('manual')
  
  // Image Upload State
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionDone, setExtractionDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSelectAnswer = (questao: number, alternativa: string) => {
    setRespostas(prev => ({
      ...prev,
      [questao]: alternativa
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      const formData = new FormData(e.currentTarget)
      const result = await createGabarito(formData)
      
      if (result && 'error' in result) {
        setError(result.error as string)
        setIsSubmitting(false)
      }
      // Se for sucesso, o redirect dentro da action cuidará do resto
    } catch (err: any) {
      // O redirect do Next.js joga uma exception, então ignoramos se for o caso
      if (err.message === 'NEXT_REDIRECT') return
      
      console.error(err)
      setError('Ocorreu um erro ao salvar o gabarito. Verifique sua conexão ou se a tabela no banco existe.')
      setIsSubmitting(false)
    }
  }

  // Lógica de Upload de Imagem
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0])
    }
  }

  const handleFileSelection = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) return
    setFile(selectedFile)
    setExtractionDone(false)
    setRespostas({}) // Reset answers when a new file is uploaded
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const executeExtraction = async () => {
    if (!file) return
    setIsExtracting(true)
    setError(null)
    
    try {
      const base64 = await fileToBase64(file)
      const result = await extractGabaritoFromImage(base64, questoesQtd)
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao processar imagem')
      }
      
      if (result.respostas) {
        setRespostas(result.respostas)
      }
      setExtractionDone(true)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Falha na leitura da imagem. Certifique-se de que os 4 cantos estão visíveis.')
    } finally {
      setIsExtracting(false)
    }
  }

  const alternativas = ['A', 'B', 'C', 'D', 'E']

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
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

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab('manual')}
          className={`pb-4 px-6 text-sm font-medium transition-colors relative ${
            activeTab === 'manual' 
              ? 'text-indigo-600 dark:text-indigo-400' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          Preenchimento Manual
          {activeTab === 'manual' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('imagem')}
          className={`pb-4 px-6 text-sm font-medium transition-colors relative ${
            activeTab === 'imagem' 
              ? 'text-indigo-600 dark:text-indigo-400' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Wand2 size={16} />
            Ler de Imagem (IA)
          </div>
          {activeTab === 'imagem' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full"></span>
          )}
        </button>
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
                  onChange={(e) => {
                    setQuestoesQtd(parseInt(e.target.value));
                    setRespostas({});
                    setExtractionDone(false);
                  }}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950"
                >
                  <option value={10}>10 Questões</option>
                  <option value={20}>20 Questões</option>
                  <option value={30}>30 Questões</option>
                  <option value={40}>40 Questões</option>
                  <option value={50}>50 Questões</option>
                  <option value={60}>60 Questões</option>
                  <option value={70}>70 Questões</option>
                  <option value={80}>80 Questões</option>
                  <option value={90}>90 Questões</option>
                  <option value={100}>100 Questões</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="valor_total" className="text-sm font-medium leading-none">
                  Valor Total da Prova (Pontuação Máxima)
                </label>
                <input
                  id="valor_total"
                  name="valor_total"
                  type="number"
                  step="0.1"
                  defaultValue={10.0}
                  required
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:placeholder:text-slate-400"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bloco de Upload Exclusivo da Aba "Imagem" */}
        {activeTab === 'imagem' && (
          <Card className="border-indigo-100 dark:border-indigo-900 shadow-md">
            <CardHeader className="bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-50 dark:border-indigo-900/50 pb-4">
              <CardTitle className="text-indigo-900 dark:text-indigo-300">Upload do Gabarito Oficial</CardTitle>
              <CardDescription>
                Envie a foto do gabarito modelo preenchido. A IA tentará extrair as marcações.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {!file ? (
                <div 
                  className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                    isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/jpeg,image/png,image/webp" 
                    onChange={handleFileInput}
                  />
                  <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4">
                    <UploadCloud size={32} />
                  </div>
                  <p className="text-lg font-medium text-slate-900 dark:text-white mb-1">
                    Selecione a foto
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Tente enviar uma foto bem iluminada
                  </p>
                  <div className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors">
                    Procurar no computador
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="relative w-40 h-56 rounded-lg overflow-hidden border shadow-sm shrink-0 bg-white dark:bg-slate-950">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt="Gabarito Oficial"
                      className="w-full h-full object-cover"
                    />
                    <button 
                      type="button"
                      onClick={() => { setFile(null); setExtractionDone(false); setRespostas({}); }}
                      className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white rounded-full p-1 backdrop-blur-sm transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center h-full min-h-[14rem]">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">Imagem selecionada</h3>
                    <p className="text-sm text-slate-500 mb-6 break-all line-clamp-2">{file.name}</p>
                    
                    {!extractionDone ? (
                      <div className="w-full">
                        {error && (
                          <div className="mb-4 w-full bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg flex items-center gap-3 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400">
                            <X className="h-5 w-5 shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={executeExtraction}
                          disabled={isExtracting}
                          className="inline-flex w-full sm:w-auto items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-700 h-12 px-6 shadow-md"
                        >
                          {isExtracting ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Analisando imagem...
                            </>
                          ) : (
                            <>
                              <Wand2 className="mr-2 h-5 w-5" />
                              Extrair Respostas Automaticamente
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-4 rounded-lg flex gap-3 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                        <Wand2 className="h-5 w-5 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm">Extração concluída com sucesso!</p>
                          <p className="text-sm mt-1">Role para baixo e revise visualmente as marcações. Você pode corrigir qualquer erro clicando na letra correta antes de salvar.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* O Cartão de Revisão/Preenchimento fica abaixo para ambos os modos */}
        {(!file || extractionDone || activeTab === 'manual') && (
          <Card className={extractionDone ? "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all duration-500" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {activeTab === 'imagem' && extractionDone ? (
                  <>
                    <Wand2 className="text-emerald-500 h-5 w-5" /> 
                    Revisão das Respostas Extraídas
                  </>
                ) : (
                  'Cartão Resposta (Gabarito Oficial)'
                )}
              </CardTitle>
              <CardDescription>
                {activeTab === 'imagem' && extractionDone 
                  ? 'Verifique se a IA leu corretamente. Clique sobre a letra se precisar corrigir.' 
                  : 'Marque a alternativa correta para cada questão. Clique sobre a letra desejada.'}
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
            <CardFooter className="bg-slate-50 dark:bg-slate-900/50 border-t flex flex-col items-end gap-4 py-4 mt-6">
              {error && (
                <div className="w-full bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-1 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400">
                  <X className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting || Object.keys(respostas).length < questoesQtd}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed bg-slate-900 text-slate-50 hover:bg-slate-900/90 h-10 px-8 py-2 shadow-md dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Gabarito Oficial'
                )}
              </button>
            </CardFooter>
          </Card>
        )}
      </form>
    </div>
  )
}
