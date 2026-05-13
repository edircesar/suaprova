import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { getTemplateConfig, getBubblePositions, MARKER_SIZE_MM } from '@/lib/omr/template-config'
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
  const positions = getBubblePositions(config)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 print:p-0 print:bg-white">
      {/* Header fixo para instrução (não sai na impressão se quisermos, mas aqui ajuda o usuário) */}
      <div className="max-w-[210mm] mx-auto mb-6 flex items-center justify-between px-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Folha de Respostas</h1>
          <p className="text-slate-500">Imprima esta folha em papel A4 para os alunos.</p>
        </div>
        <PrintSheetButton />
      </div>

      {/* Folha A4 */}
      <div className="w-[210mm] h-[297mm] mx-auto bg-white shadow-2xl print:shadow-none relative box-border overflow-hidden p-[15mm]">
        
        {/* Marcadores de Canto - Limite máximo de segurança */}
        <div className="absolute top-[8mm] left-[8mm] w-[7mm] h-[7mm] bg-black" id="marker-tl"></div>
        <div className="absolute top-[8mm] right-[8mm] w-[7mm] h-[7mm] bg-black" id="marker-tr"></div>
        <div className="absolute bottom-[8mm] left-[8mm] w-[7mm] h-[7mm] bg-black" id="marker-bl"></div>
        <div className="absolute bottom-[8mm] right-[8mm] w-[7mm] h-[7mm] bg-black" id="marker-br"></div>

        {/* Cabeçalho da Prova */}
        <div className="mt-2 mb-4 border-b-2 border-black pb-2 px-4">
          <h2 className="text-xl font-black text-center mb-4 uppercase tracking-tight">{gabarito.nome}</h2>
          
          <div className="space-y-3">
            <div className="flex gap-4">
              <div className="flex-1 border-b border-black pb-1">
                <span className="text-[9px] font-bold uppercase block mb-0.5">Nome do Aluno</span>
                <div className="h-5"></div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-48 border-b border-black pb-1">
                <span className="text-[9px] font-bold uppercase block mb-0.5">Turma / Período</span>
                <div className="h-5"></div>
              </div>
              <div className="w-40 border-b border-black pb-1">
                <span className="text-[9px] font-bold uppercase block mb-0.5">Data</span>
                <div className="h-5"></div>
              </div>
              <div className="flex-1 border-b border-black pb-1 text-right">
                <span className="text-[9px] font-bold uppercase block mb-0.5">Total de Questões</span>
                <div className="h-5 font-bold text-base">{gabarito.questoes_qtd}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Instruções de preenchimento - Movido para cima da grade */}
        <div className="px-4 mb-4 flex justify-between items-center text-[9px] font-bold uppercase border border-slate-200 p-2 rounded">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span>Correto:</span>
              <div className="w-3 h-3 rounded-full bg-black"></div>
            </div>
            <div className="flex items-center gap-1">
              <span>Incorreto:</span>
              <div className="w-3 h-3 rounded-full border border-black flex items-center justify-center text-[7px]">✕</div>
              <div className="w-3 h-3 rounded-full border border-black flex items-center justify-center text-[7px]">✓</div>
            </div>
          </div>
          <div className="text-[8px] text-slate-500 normal-case">
            Use caneta preta ou azul escura. Preencha a bolinha completamente.
          </div>
        </div>

        {/* Grade de Respostas - Otimizada para caber tudo */}
        <div className="relative px-2">
          <div className="grid grid-cols-3 gap-x-6">
            {Array.from({ length: config.colunas }).map((_, colIdx) => (
              <div key={colIdx} className="border border-slate-100 rounded p-1">
                <div className="flex items-center text-[8px] font-bold text-slate-400 mb-1 px-1">
                  <div className="w-5 mr-2">Nº</div>
                  <div className="flex-1 flex justify-around">
                    {config.alternativas.map(a => <div key={a} className="w-4 text-center">{a}</div>)}
                  </div>
                </div>
                
                {Array.from({ length: config.questoes_por_coluna }).map((_, rowIdx) => {
                  const qNum = colIdx * config.questoes_por_coluna + rowIdx + 1
                  if (qNum > gabarito.questoes_qtd) return null

                  return (
                    <div key={qNum} className="flex items-center h-[6.2mm] border-b border-slate-50 last:border-0">
                      <div className="w-5 mr-2 text-[10px] font-bold text-slate-700">
                        {qNum.toString().padStart(2, '0')}
                      </div>
                      <div className="flex-1 flex justify-around">
                        {config.alternativas.map(alt => (
                          <div 
                            key={alt} 
                            className="w-[4.2mm] h-[4.2mm] rounded-full border border-black flex items-center justify-center text-[7px] font-bold"
                          >
                            {alt}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé da folha - Movido para área segura */}
        <div className="absolute bottom-[20mm] left-0 right-0 text-center opacity-30">
          <p className="text-[7px] font-bold uppercase tracking-widest">
            Folha de Respostas Oficial - Gerada por SuaProva AI
          </p>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { margin: 0; padding: 0; background: white; }
          .print\\:hidden { display: none !important; }
          @page { size: A4; margin: 0; }
        }
      `}} />
    </div>
  )
}
