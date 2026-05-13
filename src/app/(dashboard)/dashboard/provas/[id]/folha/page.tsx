import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getTemplateConfig, getBubblePositions } from '@/lib/omr/template-config'
import PrintSheetButton from './PrintSheetButton'
import { notFound } from 'next/navigation'

export default async function FolhaRespostasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: gabarito } = await supabase
    .from('gabaritos')
    .select('*')
    .eq('id', id)
    .single()

  if (!gabarito) notFound()

  const config = getTemplateConfig(gabarito.questoes_qtd)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 print:p-0 print:bg-white flex flex-col items-center">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 0; }
          body { 
            margin: 0 !important; 
            @apply bg-background text-foreground;
            display: flex !important;
            justify-content: center !important;
            align-items: flex-start !important;
          }
          .print-container {
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}} />
      {/* Menu Superior (Não imprime) */}
      <div className="w-full max-w-[210mm] mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-4 print:hidden">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gerador de Gabarito</h1>
          <p className="text-slate-500">Modelo Profissional SuaProva AI</p>
        </div>
        <div className="shrink-0">
          <PrintSheetButton />
        </div>
      </div>

      {/* Folha A4 Profissional */}
      <div className="w-[210mm] h-[297mm] bg-white shadow-2xl print:shadow-none relative box-border overflow-hidden p-[10mm] font-sans text-black border print:border-0 print-container">
        
        {/* MARCADORES DE CANTO - Posicionamento fixo de 8mm */}
        <div className="absolute top-[8mm] left-[8mm] w-[7mm] h-[7mm] bg-black border-[1px] border-black" id="marker-tl"></div>
        <div className="absolute top-[8mm] right-[8mm] w-[7mm] h-[7mm] bg-black border-[1px] border-black" id="marker-tr"></div>
        <div className="absolute bottom-[15mm] left-[8mm] w-[7mm] h-[7mm] bg-black border-[1px] border-black" id="marker-bl"></div>
        <div className="absolute bottom-[15mm] right-[8mm] w-[7mm] h-[7mm] bg-black border-[1px] border-black" id="marker-br"></div>

        {/* MARCADORES LATERAIS MÉDIOS - Ajustados para não sobrepor questões */}
        <div className="absolute top-[135mm] left-[8mm] w-[7mm] h-[4mm] bg-black"></div>
        <div className="absolute top-[135mm] right-[8mm] w-[7mm] h-[4mm] bg-black"></div>

        {/* Container Principal de Conteúdo - Alinhado com os marcadores (8mm) */}
        <div className="mx-[8mm] h-full flex flex-col">
          {/* Espaçamento inicial para não colidir com marcadores do topo */}
          <div className="h-[12mm]"></div>

          {/* Cabeçalho Superior Compacto */}
          <div className="flex justify-between items-end mb-2">
            <div className="text-xl font-black uppercase tracking-tighter italic text-slate-400">SuaProva AI</div>
            <div className="text-right">
              <span className="text-[8px] font-bold block leading-none">GABARITO OFICIAL</span>
              <span className="text-[7px] font-mono opacity-50">{gabarito.id.slice(0,18).toUpperCase()}</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-2">
            <div className="col-span-2 border-2 border-black p-0.5 px-2">
              <span className="text-[7px] font-bold block uppercase">Nome do Aluno</span>
              <div className="h-4"></div>
            </div>
              <span className="text-[8pt] font-bold block uppercase">Nome do Aluno</span>
              <div className="h-4"></div>
            </div>
            <div className="border-2 border-black p-0.5 px-2">
              <span className="text-[8pt] font-bold block uppercase">Turma</span>
              <div className="h-4"></div>
            </div>
            <div className="border-2 border-black p-0.5 px-2">
              <span className="text-[8pt] font-bold block uppercase">Prova</span>
              <div className="h-4 text-[10pt] font-bold flex items-center leading-none truncate">{gabarito.nome}</div>
            </div>
          </div>

          {/* Bloco de Instruções Compacto */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="border-2 border-black p-1.5 px-3 text-[9.5pt] leading-tight font-medium">
              <div className="grid grid-cols-2 gap-x-2">
                <ol className="list-decimal list-inside space-y-0 text-[8.5pt]">
                  <li>Uma única correta;</li>
                  <li>Caneta preta ou azul;</li>
                </ol>
                <ul className="list-disc list-inside space-y-0 text-[8.5pt]">
                  <li>Não rasure ou dobre;</li>
                  <li>Preencha totalmente.</li>
                </ul>
              </div>
            </div>
            <div className="border-2 border-black p-1 px-3 flex items-center justify-between">
              <span className="text-[9pt] font-bold uppercase">Exemplo:</span>
              <div className="flex gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-black"></div>
                  <span className="text-[8pt] font-bold">CERTO</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full border border-black flex items-center justify-center text-[8pt] font-bold">✕</div>
                  <span className="text-[8pt] font-bold">ERRO</span>
                </div>
              </div>
            </div>
          </div>

          {/* Grade de Respostas Compacta */}
          <div className="flex gap-4 flex-1">
            {/* Escadinha lateral expandida para 35 linhas */}
            <div className="flex flex-col gap-[1.5mm] pt-6">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className={`w-3 h-1.5 bg-black ${i % 2 === 0 ? 'opacity-100' : 'opacity-20'}`}></div>
              ))}
            </div>

            <div className="flex-1 grid grid-cols-3 gap-x-6">
              {Array.from({ length: 3 }).map((_, colIdx) => {
                const rowsPerCol = 35 // Definido conforme solicitado para 1-35, 36-70, 71-90
                const startNum = colIdx * rowsPerCol + 1
                
                // Se a coluna começar além do total de questões, não renderiza nada
                if (startNum > gabarito.questoes_qtd) return <div key={colIdx}></div>

                return (
                  <div key={colIdx} className="space-y-0 flex flex-col">
                    <div className="flex items-center h-[6.5mm] border-b-2 border-black mb-0.5">
                      <div className="w-3 h-1.5 bg-black mr-2"></div>
                      <div className="flex-1 flex justify-center gap-x-[1.5mm] pr-[1.5mm]">
                        {['A', 'B', 'C', 'D', 'E'].map(a => <div key={a} className="w-[4.0mm] text-center text-[9.5pt] font-black">{a}</div>)}
                      </div>
                    </div>

                    {Array.from({ length: rowsPerCol }).map((_, rowIdx) => {
                      const qNum = startNum + rowIdx
                      if (qNum > gabarito.questoes_qtd) return null

                      return (
                        <div key={qNum} className="flex items-center h-[5.8mm] border-b border-slate-50">
                          <div className="w-4 mr-1 text-[10pt] font-black text-slate-800">
                            {qNum.toString().padStart(2, '0')}
                          </div>
                          <div className="flex-1 flex justify-center gap-x-[1.5mm] pr-[1.5mm]">
                            {['A', 'B', 'C', 'D', 'E'].map(alt => (
                              <div 
                                key={alt} 
                                className="w-[4.0mm] h-[4.0mm] rounded-full border-[1.2px] border-black flex items-center justify-center text-[7.5pt] font-bold"
                              >
                                {alt}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}

                    {/* Marcador de fundo de coluna */}
                    <div className="flex justify-center mt-1">
                      <div className="w-5 h-1.5 bg-black"></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Rodapé Interno Alinhado */}
          <div className="mt-auto pt-4 pb-2 text-center opacity-20 border-t border-slate-100">
            <p className="text-[9pt] font-bold text-slate-500 uppercase tracking-widest">
              SuaProva AI - Tecnologia em Avaliação
            </p>
          </div>
        </div>

      </div>

    </div>
  )
}
