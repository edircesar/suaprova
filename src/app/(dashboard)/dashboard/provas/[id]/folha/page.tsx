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
            padding: 0 !important; 
            background: white !important;
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
      <div className="max-w-[210mm] mx-auto mb-6 flex items-center justify-between px-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gerador de Gabarito</h1>
          <p className="text-slate-500">Modelo Profissional SuaProva AI</p>
        </div>
        <PrintSheetButton />
      </div>

      {/* Folha A4 Profissional */}
      <div className="w-[210mm] h-[297mm] bg-white shadow-2xl print:shadow-none relative box-border overflow-hidden p-[10mm] font-sans text-black border print:border-0 print-container">
        
        {/* MARCADORES DE CANTO - Limite de segurança aumentado */}
        <div className="absolute top-[8mm] left-[8mm] w-[7mm] h-[7mm] bg-black border-[1px] border-black" id="marker-tl"></div>
        <div className="absolute top-[8mm] right-[8mm] w-[7mm] h-[7mm] bg-black border-[1px] border-black" id="marker-tr"></div>
        <div className="absolute bottom-[15mm] left-[8mm] w-[7mm] h-[7mm] bg-black border-[1px] border-black" id="marker-bl"></div>
        <div className="absolute bottom-[15mm] right-[8mm] w-[7mm] h-[7mm] bg-black border-[1px] border-black" id="marker-br"></div>

        {/* MARCADORES LATERAIS MÉDIOS */}
        <div className="absolute top-[50%] left-[8mm] translate-y-[-50%] w-[7mm] h-[4mm] bg-black"></div>
        <div className="absolute top-[50%] right-[8mm] translate-y-[-50%] w-[7mm] h-[4mm] bg-black"></div>

        {/* Cabeçalho Superior Compacto */}
        <div className="px-8 mt-4">
          <div className="flex justify-between items-end mb-2">
            <div className="text-xl font-black uppercase tracking-tighter italic text-slate-400">SuaProva AI</div>
            <div className="text-right">
              <span className="text-[8px] font-bold block">ID: {gabarito.id.slice(0,18).toUpperCase()}</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-2">
            <div className="col-span-2 border-2 border-black p-0.5 px-2">
              <span className="text-[7px] font-bold block uppercase">Nome do Aluno</span>
              <div className="h-4"></div>
            </div>
            <div className="border-2 border-black p-0.5 px-2">
              <span className="text-[7px] font-bold block uppercase">Turma</span>
              <div className="h-4"></div>
            </div>
            <div className="border-2 border-black p-0.5 px-2">
              <span className="text-[7px] font-bold block uppercase">Prova</span>
              <div className="h-4 text-[9px] font-bold flex items-center leading-none">{gabarito.nome.substring(0, 20)}</div>
            </div>
          </div>
        </div>

        {/* Bloco de Instruções Compacto */}
        <div className="px-8 grid grid-cols-2 gap-4 mb-2">
          <div className="border-2 border-black p-1.5 px-3 text-[8.5px] leading-tight font-medium">
            <div className="grid grid-cols-2 gap-x-2">
              <ol className="list-decimal list-inside space-y-0">
                <li>Uma única correta;</li>
                <li>Caneta preta ou azul;</li>
              </ol>
              <ul className="list-disc list-inside space-y-0">
                <li>Não rasure ou dobre;</li>
                <li>Preencha totalmente.</li>
              </ul>
            </div>
          </div>
          <div className="border-2 border-black p-1 px-3 flex items-center justify-between">
            <span className="text-[8px] font-bold uppercase">Exemplo:</span>
            <div className="flex gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-black"></div>
                <span className="text-[7px] font-bold">CERTO</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full border border-black flex items-center justify-center text-[7px] font-bold">✕</div>
                <span className="text-[7px] font-bold">ERRO</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grade de Respostas Compacta */}
        <div className="px-8 flex gap-4">
          {/* Escadinha lateral */}
          <div className="flex flex-col gap-[1.8mm] pt-6">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className={`w-3 h-1.5 bg-black ${i % 2 === 0 ? 'opacity-100' : 'opacity-20'}`}></div>
            ))}
          </div>

          <div className="flex-1 grid grid-cols-3 gap-x-6">
            {Array.from({ length: 3 }).map((_, colIdx) => (
              <div key={colIdx} className="space-y-0">
                <div className="flex items-center h-[7mm] border-b-2 border-black mb-0.5">
                  <div className="w-3 h-1.5 bg-black mr-2"></div>
                  <div className="flex-1 flex justify-around text-[9px] font-black">
                    {['A', 'B', 'C', 'D', 'E'].map(a => <div key={a} className="w-4 text-center">{a}</div>)}
                  </div>
                </div>

                {Array.from({ length: 30 }).map((_, rowIdx) => {
                  const qNum = colIdx * 30 + rowIdx + 1
                  if (qNum > gabarito.questoes_qtd) return null

                  return (
                    <div key={qNum} className="flex items-center h-[6.3mm] border-b border-slate-100">
                      <div className="w-5 mr-1 text-[10px] font-black text-slate-800">
                        {qNum.toString().padStart(2, '0')}
                      </div>
                      <div className="flex-1 flex justify-around">
                        {['A', 'B', 'C', 'D', 'E'].map(alt => (
                          <div 
                            key={alt} 
                            className="w-[4.4mm] h-[4.4mm] rounded-full border-[1.2px] border-black flex items-center justify-center text-[7px] font-bold"
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
            ))}
          </div>
        </div>

        {/* Rodapé da Folha */}
        <div className="absolute bottom-10 left-0 right-0 text-center opacity-20">
          <p className="text-[8px] font-bold text-slate-500">
            SUAPROVA AI - GABARITO OFICIAL
          </p>
        </div>

      </div>

    </div>
  )
}
