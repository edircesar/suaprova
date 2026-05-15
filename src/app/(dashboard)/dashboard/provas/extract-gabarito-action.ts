'use server'

import { OMRProcessor } from '@/lib/omr/processor'

/**
 * Extrai as respostas de um gabarito oficial a partir de uma imagem escaneada.
 * Usa OMR (processamento local) - sem IA, sem custo de créditos.
 */
export async function extractGabaritoFromImage(
  formData: FormData
): Promise<{
  success: boolean
  respostas?: Record<number, string>
  detalhes?: Record<number, { answer: string | null; confidence: number; alternatives: Record<string, number> }>
  error?: string
}> {
  try {
    const file = formData.get('image') as File
    const questoesQtd = parseInt(formData.get('questoesQtd') as string)

    if (!file) {
      throw new Error('Nenhuma imagem enviada.')
    }

    // 1. Converter File para buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 2. Processar com OMR
    const processor = new OMRProcessor()
    const results = await processor.process(buffer, questoesQtd)

    // 3. Montar mapa de respostas
    const respostas: Record<number, string> = {}
    const detalhes: Record<number, any> = {}

    for (const result of results) {
      if (result.answer) {
        respostas[result.question] = result.answer
      }
      detalhes[result.question] = {
        answer: result.answer,
        confidence: result.confidence,
        alternatives: result.alternatives,
      }
    }

    const totalDetectadas = Object.keys(respostas).length
    
    return {
      success: true,
      respostas,
      detalhes,
    }
  } catch (err: any) {
    console.error('Erro na extração OMR do gabarito:', err)
    return {
      success: false,
      error: err.message || 'Erro ao processar a imagem. Verifique se os marcadores estão visíveis.',
    }
  }
}
