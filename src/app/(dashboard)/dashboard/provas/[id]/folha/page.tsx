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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 print:p-0 print:bg-white">
      {/* Menu Superior (Não imprime) */}
      <div className="max-w-[210mm] mx-auto mb-6 flex items-center justify-between px-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gerador de Gabarito</h1>
          <p className="text-slate-500">Modelo Profissional SuaProva AI</p>
        </div>
        <PrintSheetButton />
      </div>

      {/* Folha A4 Profissional */}
      <div className="w-[210mm] h-[297mm] mx-auto bg-white shadow-2xl print:shadow-none relative box-border overflow-hidden p-[10mm] font-sans text-black border print:border-0">
        
        {/* MARCADORES DE CANTO (Usando borda para garantir impressão) */}
        <div className="absolute top-[8mm] left-[8mm] w-[7mm] h-[7mm] bg-black border-[1px] border-black" id="marker-tl"></div>
        <div className="absolute top-[8mm] right-[8mm] w-[7mm] h-[7mm] bg-black border-[1px] border-black" id="marker-tr"></div>
        <div className="absolute bottom-[8mm] left-[8mm] w-[7mm] h-[7mm] bg-black border-[1px] border-black" id="marker-bl"></div>
        <div className="absolute bottom-[8mm] right-[8mm] w-[7mm] h-[7mm] bg-black border-[1px] border-black" id="marker-br"></div>

        {/* MARCADORES LATERAIS (Estilo CEBAMA) */}
        <div className="absolute top-[50%] left-[8mm] translate-y-[-50%] w-[7mm] h-[5mm] bg-black"></div>
        <div className="absolute top-[50%] right-[8mm] translate-y-[-50%] w-[7mm] h-[5mm] bg-black"></div>

        {/* Cabeçalho Superior */}
        <div className="px-8 mt-6">
          <div className="flex justify-between items-start mb-4">
            <div className="text-2xl font-black uppercase tracking-tighter italic text-slate-400">SuaProva AI</div>
            <div className="text-right">
              <span className="text-[9px] font-bold block">ID DO GABARITO</span>
              <span className="text-xs font-mono">{gabarito.id.slice(0,18).toUpperCase()}</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="col-span-2 border-2 border-black p-1 px-2">
              <span className="text-[8px] font-bold block uppercase">Nome do Aluno</span>
              <div className="h-6"></div>
            </div>
            <div className="border-2 border-black p-1 px-2">
              <span className="text-[8px] font-bold block uppercase">Turma</span>
              <div className="h-6"></div>
            </div>
            <div className="border-2 border-black p-1 px-2">
              <span className="text-[8px] font-bold block uppercase">Prova</span>
              <div className="h-6 text-[10px] font-bold flex items-center">{gabarito.nome.substring(0, 20)}</div>
            </div>
          </div>
        </div>

        {/* Bloco de Instruções e Exemplo (Lado a Lado) */}
        <div className="px-8 grid grid-cols-2 gap-4 mb-4">
          <div className="border-2 border-black p-3 text-[9px] leading-tight font-medium">
            <ol className="list-decimal list-inside space-y-1">
              <li>Cada questão tem uma única alternativa correta;</li>
              <li>Utilize caneta de tinta <strong>preta</strong> ou <strong>azul escura</strong>;</li>
              <li>Preencha a bolinha completamente como no exemplo;</li>
              <li>Não rasure, não amasse e não dobre esta folha;</li>
              <li>A folha de respostas não poderá ser substituída.</li>
            </ol>
          </div>
          <div className="border-2 border-black p-3 flex flex-col items-center justify-center">
            <span className="text-[9px] font-bold uppercase mb-2">Exemplo de preenchimento</span>
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-black mb-1"></div>
                <span className="text-[8px] font-bold">CERTO</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full border-2 border-black flex items-center justify-center text-[8px] font-bold mb-1">✕</div>
                <span className="text-[8px] font-bold">ERRADO</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full border-2 border-black flex items-center justify-center text-[10px] font-bold mb-1">·</div>
                <span className="text-[8px] font-bold">ERRADO</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Alinhamento Lateral (Ladder) e Grade de Respostas */}
        <div className="px-8 flex gap-4">
          {/* Escadinha lateral de alinhamento */}
          <div className="flex flex-col gap-[2.2mm] pt-8">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className={`w-4 h-2 bg-black ${i % 2 === 0 ? 'opacity-100' : 'opacity-20'}`}></div>
            ))}
          </div>

          {/* Grade de Questões (3 Colunas) */}
          <div className="flex-1 grid grid-cols-3 gap-x-6">
            {Array.from({ length: 3 }).map((_, colIdx) => (
              <div key={colIdx} className="space-y-0">
                {/* Header de Coluna */}
                <div className="flex items-center h-[8mm] border-b-2 border-black mb-1">
                   {/* Marcador de Topo de Coluna */}
                  <div className="w-4 h-2 bg-black mr-2"></div>
                  <div className="flex-1 flex justify-around text-[10px] font-black">
                    {['A', 'B', 'C', 'D', 'E'].map(a => <div key={a} className="w-5 text-center">{a}</div>)}
                  </div>
                </div>

                {Array.from({ length: 30 }).map((_, rowIdx) => {
                  const qNum = colIdx * 30 + rowIdx + 1
                  if (qNum > gabarito.questoes_qtd) return null

                  return (
                    <div key={qNum} className="flex items-center h-[6.8mm] border-b border-slate-100">
                      <div className="w-6 mr-1 text-[11px] font-black text-slate-800">
                        {qNum.toString().padStart(2, '0')}
                      </div>
                      <div className="flex-1 flex justify-around">
                        {['A', 'B', 'C', 'D', 'E'].map(alt => (
                          <div 
                            key={alt} 
                            className="w-[4.8mm] h-[4.8mm] rounded-full border-[1.5px] border-black flex items-center justify-center text-[8px] font-bold"
                          >
                            {alt}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
                
                {/* Rodapé de Coluna (Marcador) */}
                <div className="flex justify-center mt-1">
                  <div className="w-6 h-2 bg-black"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé da Folha */}
        <div className="absolute bottom-16 left-0 right-0 text-center border-t border-slate-100 pt-4">
          <p className="text-[10px] font-bold text-slate-400">
            PLATAFORMA SUAPROVA AI - TECNOLOGIA EM AVALIAÇÃO ESCOLAR
          </p>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { margin: 0; padding: 0; background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4; margin: 0; }
        }
      `}} />
    </div>
  )
}
