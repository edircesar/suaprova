'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { UploadCloud, Image as ImageIcon, X, CheckCircle, Loader2, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function CorrecoesPage() {
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [gabaritos, setGabaritos] = useState<any[]>([])
  const [selectedGabarito, setSelectedGabarito] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const supabase = createClient()

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
    // Filtrar apenas imagens
    const imageFiles = newFiles.filter(file => file.type.startsWith('image/'))
    setFiles(prev => [...prev, ...imageFiles])
  }

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove))
  }

  const handleSubmit = async () => {
    if (files.length === 0) return
    
    setIsUploading(true)
    
    // Simular o tempo de envio e processamento
    await new Promise(resolve => setTimeout(resolve, 2500))
    
    setIsUploading(false)
    setSuccess(true)
    setFiles([])
    
    // Reset success message after 5 seconds
    setTimeout(() => {
      setSuccess(false)
    }, 5000)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova Correção</h1>
        <p className="text-slate-500">Envie as imagens dos gabaritos preenchidos pelos alunos para processamento.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
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
                  Selecione as imagens
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  PNG, JPG ou WEBP de até 10MB
                </p>
                <div className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-md shadow-sm">
                  Procurar arquivos
                </div>
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
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                            className="bg-white/20 hover:bg-red-500 text-white rounded-full p-1 backdrop-blur-sm transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <p className="text-xs text-white truncate" title={file.name}>
                            {file.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração</CardTitle>
              <CardDescription>Defina os parâmetros para a correção.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Gabarito Oficial
                </label>
                <select 
                  value={selectedGabarito}
                  onChange={(e) => setSelectedGabarito(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300"
                >
                  <option value="">Selecione um gabarito...</option>
                  {gabaritos.map(gabarito => (
                    <option key={gabarito.id} value={gabarito.id}>
                      {gabarito.nome} ({gabarito.questoes_qtd} questões)
                    </option>
                  ))}
                </select>
                <p className="text-[0.8rem] text-slate-500">
                  O gabarito que será usado como base para corrigir estas provas.
                </p>
              </div>

              <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 p-4 border border-indigo-100 dark:border-indigo-800/30">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-indigo-900 dark:text-indigo-300">Custo estimado</h4>
                    <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-1">
                      {files.length} créditos serão deduzidos do seu saldo (1 crédito por prova).
                    </p>
                  </div>
                </div>
              </div>

              {success && (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-4 border border-emerald-200 dark:border-emerald-800/30 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-300">
                    Provas enviadas com sucesso! A correção está em andamento.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <button 
                onClick={handleSubmit}
                disabled={files.length === 0 || isUploading}
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-slate-50 hover:bg-slate-900/90 h-10 px-4 py-2 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Iniciar Correção'
                )}
              </button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
