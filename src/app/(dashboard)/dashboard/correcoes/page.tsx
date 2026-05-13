'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { UploadCloud, X, CheckCircle, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { processarProvaComIA, saveCorrecao } from './actions'

export default function CorrecoesPage() {
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

  // Converter File para base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Processar as provas com Gemini IA
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
        
        // Converter imagem para base64
        const base64 = await fileToBase64(file)
        
        // Enviar para o servidor (Gemini Vision)
        const resultado = await processarProvaComIA(base64, selectedGabaritoId)
        
        if (resultado.success) {
          // Tentar usar nome detectado pela IA, senão usar nome do arquivo
          const alunoNome = resultado.aluno_nome || file.name.split('.')[0].replace(/[-_]/g, ' ')

          // Salvar no banco
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova Correção</h1>
        <p className="text-slate-500">Envie as imagens dos gabaritos preenchidos pelos alunos para processamento.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {!success ? (
            <Card>
              <CardHeader>
                <CardTitle>Upload de Imagens</CardTitle>
                <CardDescription>Arraste e solte as imagens ou clique para selecionar.</CardDescription>
              </CardHeader>
              <CardContent>
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
                    multiple 
                    accept="image/jpeg,image/png,image/webp" 
                    onChange={handleFileInput}
                  />
                  
                  <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4">
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
                            <div className="absolute inset-0 bg-indigo-900/60 flex flex-col items-center justify-center">
                              <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
                              <span className="text-white text-xs font-medium">Analisando...</span>
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
                      {results.length} prova(s) processada(s) com sucesso.
                    </CardDescription>
                  </div>
                  <button 
                    onClick={() => { setSuccess(false); setResults([]); }}
                    className="text-sm font-medium text-emerald-800 hover:underline"
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
          <Card>
            <CardHeader>
              <CardTitle>Configuração</CardTitle>
              <CardDescription>Selecione o gabarito oficial.</CardDescription>
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

              {/* Info: Powered by Gemini */}
              <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 p-3 border border-indigo-100 dark:border-indigo-800/30 flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
                <p className="text-xs text-indigo-700 dark:text-indigo-300">
                  Correção automática com <strong>IA Gemini</strong>. A IA analisa as marcações dos alunos e compara com o gabarito oficial.
                </p>
              </div>

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
                    Processamento finalizado!
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <button 
                onClick={handleSubmit}
                disabled={files.length === 0 || isUploading || !selectedGabaritoId}
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-slate-50 hover:bg-slate-900/90 h-12 px-4 py-2 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90 shadow-lg"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analisando prova {processingIndex + 1} de {files.length}...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Iniciar Correção com IA
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
