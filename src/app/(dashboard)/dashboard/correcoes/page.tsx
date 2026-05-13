'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { UploadCloud, X, CheckCircle, Loader2, AlertCircle, FileText, Sparkles, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { processarProvaOMR, processarProvaComIA, saveCorrecao } from './actions'

type CorrectionMode = 'express' | 'premium'

export default function CorrecoesPage() {
  const [activeMode, setActiveMode] = useState<CorrectionMode>('express')
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [processingIndex, setProcessingIndex] = useState(-1)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [gabaritos, setGabaritos] = useState<any[]>([])
  const [selectedGabaritoId, setSelectedGabaritoId] = useState('')
  const [results, setResults] = useState<any[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Carregar Gabaritos do banco
  useEffect(() => {
    async function fetchGabaritos() {
      const { data } = await supabase.from('gabaritos').select('*').order('created_at', { ascending: false })
      if (data) setGabaritos(data)
    }
    fetchGabaritos()
  }, [])

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
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const handleFiles = (newFiles: File[]) => {
    const imageFiles = newFiles.filter(file => file.type.startsWith('image/'))
    setFiles(prev => [...prev, ...imageFiles])
    setSuccess(false)
    setError(null)
  }

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove))
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async () => {
    if (files.length === 0 || !selectedGabaritoId) return
    
    setIsUploading(true)
    setError(null)
    setResults([])

    const gabarito = gabaritos.find(g => g.id === selectedGabaritoId)
    if (!gabarito) return

    const processingResults = []

    try {
      for (let i = 0; i < files.length; i++) {
        setProcessingIndex(i)
        const file = files[i]
        const base64 = await fileToBase64(file)
        
        let resultado;
        
        if (activeMode === 'express') {
          // Motor OMR Gratuito
          resultado = await processarProvaOMR(base64, selectedGabaritoId)
        } else {
          // Motor IA Premium
          resultado = await processarProvaComIA(base64, selectedGabaritoId)
        }
        
        if (resultado.success) {
          // Acessar aluno_nome de forma segura (existe no Premium IA, não no Express)
          const res = resultado as any
          const alunoNome = res.aluno_nome || file.name.split('.')[0].replace(/[-_]/g, ' ')

          await saveCorrecao({
            gabarito_id: selectedGabaritoId,
            aluno_nome: alunoNome,
            acertos: resultado.acertos,
            total_questoes: resultado.total_questoes,
            nota: resultado.nota,
            respostas_aluno: resultado.respostas_aluno
          })

          processingResults.push({
            fileName: file.name,
            alunoNome,
            acertos: resultado.acertos,
            total: resultado.total_questoes,
            nota: resultado.nota.toFixed(1),
            detalhes: resultado.detalhes
          })
        }
      }

      setResults(processingResults)
      setSuccess(true)
      setFiles([])
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Erro ao processar as imagens.')
    } finally {
      setIsUploading(false)
      setProcessingIndex(-1)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Correção</h1>
          <p className="text-slate-500 mt-1">Escolha o método e envie as imagens para processamento.</p>
        </div>

        {/* Abas de Modo */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-fit">
          <button
            onClick={() => setActiveMode('express')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeMode === 'express' 
                ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Zap size={16} />
            Express (Gratuito)
          </button>
          <button
            onClick={() => setActiveMode('premium')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeMode === 'premium' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles size={16} />
            Premium IA
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {!success ? (
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle>
                  {activeMode === 'express' ? 'Upload para Correção Express' : 'Upload para Correção Premium IA'}
                </CardTitle>
                <CardDescription>
                  {activeMode === 'express' 
                    ? 'Use apenas folhas padrão do SuaProva para 100% de precisão.' 
                    : 'Aceita qualquer tipo de folha de respostas (xerox, fotos tortas, etc).'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                    isDragging 
                      ? activeMode === 'premium' ? 'border-purple-500 bg-purple-50/50' : 'border-indigo-500 bg-indigo-50/50' 
                      : 'border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600'
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
                    multiple 
                    accept="image/jpeg,image/png,image/webp" 
                    onChange={handleFileInput}
                  />
                  
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                    activeMode === 'premium' ? 'bg-purple-100 text-purple-600' : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    <UploadCloud size={32} />
                  </div>
                  <p className="text-lg font-medium text-slate-900 dark:text-white mb-1">
                    Selecione as fotos das provas
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Formatos JPG, PNG ou WEBP
                  </p>
                </div>

                {files.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                      Arquivos selecionados ({files.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {files.map((file, index) => (
                        <div key={index} className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 aspect-[3/4] bg-slate-100 dark:bg-slate-900">
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                          {isUploading && index === processingIndex && (
                            <div className={`absolute inset-0 flex flex-col items-center justify-center ${activeMode === 'premium' ? 'bg-purple-900/60' : 'bg-indigo-900/60'}`}>
                              <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
                              <span className="text-white text-xs font-medium">
                                {activeMode === 'premium' ? 'IA Analisando...' : 'Processando...'}
                              </span>
                            </div>
                          )}
                          {isUploading && index < processingIndex && (
                            <div className="absolute inset-0 bg-emerald-900/60 flex items-center justify-center">
                              <CheckCircle className="h-8 w-8 text-white" />
                            </div>
                          )}
                          {!isUploading && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                className="bg-white/20 hover:bg-red-500 text-white rounded-full p-1 backdrop-blur-sm transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-emerald-200 dark:border-emerald-900 shadow-lg">
              <CardHeader className="bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-emerald-900 dark:text-emerald-300">Correção Concluída!</CardTitle>
                    <CardDescription className="text-emerald-700 dark:text-emerald-500">
                      {results.length} prova(s) processada(s) via modo {activeMode === 'premium' ? 'Premium IA' : 'Express'}.
                    </CardDescription>
                  </div>
                  <button 
                    onClick={() => { setSuccess(false); setResults([]); }}
                    className="text-sm font-bold text-emerald-800 dark:text-emerald-400 hover:underline px-4 py-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm"
                  >
                    Nova Correção
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {results.map((res, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center font-bold text-slate-700">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                            {res.alunoNome || res.fileName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {res.acertos} acertos de {res.total}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-black ${parseFloat(res.nota) >= 6 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {res.nota}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Nota</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Configuração</CardTitle>
              <CardDescription>Configure os detalhes da correção.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Gabarito Oficial
                </label>
                <select 
                  value={selectedGabaritoId}
                  onChange={(e) => setSelectedGabaritoId(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950"
                >
                  <option value="">Selecione um gabarito...</option>
                  {gabaritos.map(gabarito => (
                    <option key={gabarito.id} value={gabarito.id}>
                      {gabarito.nome} ({gabarito.questoes_qtd} questões)
                    </option>
                  ))}
                </select>
              </div>

              {/* Box de Informação Dinâmico */}
              {activeMode === 'express' ? (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-4 border border-emerald-100 dark:border-emerald-800/30">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300">Modo Express (Grátis)</p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                        Ideal para correções em massa usando a folha padrão do SuaProva. Rápido e sem custo de créditos.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 p-4 border border-indigo-100 dark:border-indigo-800/30">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Modo Premium IA</p>
                      <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">
                        Analisa qualquer tipo de folha de respostas. Usa visão computacional avançada. 
                        <strong> Custa 1 crédito por folha.</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 p-4 border border-rose-200 dark:border-rose-800/30 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
                  <p className="text-sm font-medium text-rose-900 dark:text-rose-300">
                    {error}
                  </p>
                </div>
              )}

              {success && (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-4 border border-emerald-200 dark:border-emerald-800/30 flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-300">
                    Finalizado com sucesso!
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <button 
                onClick={handleSubmit}
                disabled={files.length === 0 || isUploading || !selectedGabaritoId}
                className={`w-full inline-flex items-center justify-center rounded-xl text-sm font-bold ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-14 px-4 py-2 shadow-lg ${
                  activeMode === 'premium' 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20' 
                    : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900'
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {activeMode === 'premium' ? 'IA Analisando...' : 'Corrigindo...'}
                  </>
                ) : (
                  <>
                    {activeMode === 'premium' ? <Sparkles className="mr-2 h-5 w-5" /> : <Zap className="mr-2 h-5 w-5" />}
                    Iniciar Correção {activeMode === 'premium' ? 'Premium' : 'Express'}
                  </>
                )}
              </button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
