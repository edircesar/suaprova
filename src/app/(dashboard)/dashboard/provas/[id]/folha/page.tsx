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
      <div className="w-[210mm] h-[297mm] mx-auto bg-white shadow-2xl print:shadow-none relative box-border overflow-hidden p-[10mm]">
        
        {/* Marcadores de Canto (Preto absoluto para detecção) */}
        <div className="absolute top-[10mm] left-[10mm] w-[8mm] h-[8mm] bg-black" id="marker-tl"></div>
        <div className="absolute top-[10mm] right-[10mm] w-[8mm] h-[8mm] bg-black" id="marker-tr"></div>
        <div className="absolute bottom-[10mm] left-[10mm] w-[8mm] h-[8mm] bg-black" id="marker-bl"></div>
        <div className="absolute bottom-[10mm] right-[10mm] w-[8mm] h-[8mm] bg-black" id="marker-br"></div>

        {/* Cabeçalho da Prova */}
        <div className="mt-12 mb-8 border-b-2 border-black pb-4 px-8">
          <div className="flex justify-between items-end mb-6">
            <div className="text-2xl font-black uppercase tracking-tighter italic text-indigo-600">SuaProva AI</div>
            <div className="text-right text-xs font-bold text-slate-400">ID: {gabarito.id.slice(0,8)}</div>
          </div>
          
          <h2 className="text-xl font-bold text-center mb-6">{gabarito.nome}</h2>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 border-b border-black pb-1">
                <span className="text-[10px] font-bold uppercase block mb-1">Nome do Aluno</span>
                <div className="h-6"></div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-32 border-b border-black pb-1">
                <span className="text-[10px] font-bold uppercase block mb-1">Turma</span>
                <div className="h-6"></div>
              </div>
              <div className="w-32 border-b border-black pb-1">
                <span className="text-[10px] font-bold uppercase block mb-1">Data</span>
                <div className="h-6"></div>
              </div>
              <div className="flex-1 border-b border-black pb-1 text-right">
                <span className="text-[10px] font-bold uppercase block mb-1">Questões</span>
                <div className="h-6 font-bold">{gabarito.questoes_qtd}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Instruções de preenchimento */}
        <div className="px-8 mb-8 flex justify-center gap-8 text-[10px] font-bold uppercase">
          <div className="flex items-center gap-2">
            <span>Correto:</span>
            <div className="w-3 h-3 rounded-full bg-black"></div>
          </div>
          <div className="flex items-center gap-2">
            <span>Incorreto:</span>
            <div className="w-3 h-3 rounded-full border border-black flex items-center justify-center text-[8px]">✕</div>
            <div className="w-3 h-3 rounded-full border border-black flex items-center justify-center text-[8px]">✓</div>
            <div className="w-3 h-3 rounded-full border border-black flex items-center justify-center text-[8px]">·</div>
          </div>
        </div>

        {/* Grade de Respostas */}
        <div className="relative flex-1 px-4" style={{ height: 'calc(100% - 180mm)' }}>
          <div className="grid grid-cols-3 gap-x-8 h-full">
            {Array.from({ length: config.colunas }).map((_, colIdx) => (
              <div key={colIdx} className="space-y-1">
                <div className="flex items-center text-[9px] font-bold text-slate-400 mb-1 px-1">
                  <div className="w-6 mr-2">Nº</div>
                  <div className="flex-1 flex justify-around">
                    {config.alternativas.map(a => <div key={a} className="w-4 text-center">{a}</div>)}
                  </div>
                </div>
                
                {Array.from({ length: config.questoes_por_coluna }).map((_, rowIdx) => {
                  const qNum = colIdx * config.questoes_por_coluna + rowIdx + 1
                  if (qNum > gabarito.questoes_qtd) return null

                  return (
                    <div key={qNum} className="flex items-center h-[7mm] border-b border-slate-100 last:border-0">
                      <div className="w-6 mr-2 text-xs font-bold text-slate-600">
                        {qNum.toString().padStart(2, '0')}
                      </div>
                      <div className="flex-1 flex justify-around">
                        {config.alternativas.map(alt => (
                          <div 
                            key={alt} 
                            className="w-[5mm] h-[5mm] rounded-full border-[1.5px] border-black flex items-center justify-center text-[8px] font-bold"
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

        {/* Rodapé da folha */}
        <div className="absolute bottom-16 left-0 right-0 text-center">
          <p className="text-[8px] text-slate-400 font-medium">
            Mantenha a folha limpa e não amasse. Use caneta preta ou azul escura. Preencha a bolinha completamente.
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
