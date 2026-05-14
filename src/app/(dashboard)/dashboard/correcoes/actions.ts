'use server'

import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { revalidatePath } from 'next/cache'
import { OMRProcessor } from '@/lib/omr/processor'

export async function saveCorrecao(data: {
  gabarito_id: string;
  aluno_nome: string;
  acertos: number;
  total_questoes: number;
  nota: number;
  respostas_aluno: any;
  image_url?: string;
}) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Não autorizado')
  }

  const { error } = await supabase
    .from('correcoes')
    .insert({
      user_id: session.user.id,
      gabarito_id: data.gabarito_id,
      aluno_nome: data.aluno_nome,
      acertos: data.acertos,
      total_questoes: data.total_questoes,
      nota: data.nota,
      respostas_aluno: data.respostas_aluno,
      image_url: data.image_url
    })

  if (error) {
    console.error('Erro ao salvar correcao:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Processar imagem de prova usando OMR (Optical Mark Recognition) - GRATUITO
 */
export async function processarProvaOMR(imageBase64: string, gabaritoId: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) throw new Error('Não autorizado')

  // 1. Buscar o gabarito
  const { data: gabarito } = await supabase
    .from('gabaritos')
    .select('*')
    .eq('id', gabaritoId)
    .single()

  if (!gabarito) throw new Error('Gabarito não encontrado.')

  try {
    // 2. Preparar buffer da imagem
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // 3. Processar com OMR (Sharp)
    const processor = new OMRProcessor()
    const detection = await processor.process(buffer, gabarito.questoes_qtd)

    // 4. Comparar com gabarito oficial
    let acertos = 0
    const respostasDetectadas: Record<string, string> = {}
    const detalhes: Record<string, any> = {}

    for (const res of detection) {
      const qNum = res.question.toString()
      const correta = gabarito.respostas[qNum]
      const isCorrect = res.answer === correta
      
      if (isCorrect) acertos++
      
      respostasDetectadas[qNum] = res.answer || ''
      detalhes[qNum] = {
        resposta_aluno: res.answer,
        resposta_correta: correta,
        correto: isCorrect,
        confidence: res.confidence
      }
    }

    const valorPorQuestao = (gabarito.valor_total || 10.0) / gabarito.questoes_qtd
    const nota = acertos * valorPorQuestao

    return {
      success: true,
      acertos,
      total_questoes: gabarito.questoes_qtd,
      nota: parseFloat(nota.toFixed(2)),
      respostas_aluno: respostasDetectadas,
      detalhes
    }
  } catch (err: any) {
    console.error('Erro OMR:', err)
    return { 
      success: false, 
      error: 'Falha no processamento de imagem. Verifique a qualidade da foto.' 
    }
  }
}

/**
 * Processar imagem de prova usando Google Gemini Vision (BACKUP / INTELIGÊNCIA)
 * Recebe a imagem em base64 e o gabarito_id, retorna as respostas detectadas
 */
export async function processarProvaComIA(imageBase64: string, gabaritoId: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Não autorizado')
  }

  // 1. Verificar créditos do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', session.user.id)
    .single()

  if (!profile || (profile.credits || 0) < 1) {
    return { 
      success: false, 
      error: 'Créditos insuficientes para correção Premium IA. Por favor, recarregue sua conta no menu Financeiro.' 
    }
  }

  // 2. Buscar a chave da API do Gemini nas configurações do sistema
  const { data: settings } = await supabase
    .from('system_settings')
    .select('gemini_api_key')
    .eq('id', 1)
    .single()

  const apiKey = settings?.gemini_api_key || process.env.GEMINI_API_KEY

  if (!apiKey) {
    return { 
      success: false, 
      error: 'Chave da API Gemini não configurada. Peça ao administrador para configurá-la em Admin > Configurações.' 
    }
  }

  // 3. Buscar o gabarito
  const { data: gabarito } = await supabase
    .from('gabaritos')
    .select('*')
    .eq('id', gabaritoId)
    .single()

  if (!gabarito) {
    throw new Error('Gabarito não encontrado.')
  }

  // 3. Enviar para o Google Gemini
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  // Remover o prefixo data:image/...;base64, se existir
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')

  const prompt = `Você é um sistema de correção de provas objetivas. Analise esta imagem de um gabarito/folha de respostas preenchida por um aluno.

INSTRUÇÕES:
1. Identifique TODAS as questões marcadas na folha de respostas.
2. Para cada questão, identifique qual alternativa foi marcada (A, B, C, D ou E).
3. Se uma questão não foi marcada ou está ilegível, use null.
4. A prova tem ${gabarito.questoes_qtd} questões.

RESPONDA EXATAMENTE neste formato JSON (sem markdown, sem explicação, APENAS o JSON):
{
  "respostas": {
    "1": "A",
    "2": "B",
    "3": "C"
  },
  "aluno_nome": "nome se conseguir ler, ou null"
}

Analise a imagem agora:`

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data
        }
      }
    ])

    const responseText = result.response.text()
    
    // Limpar a resposta (remover possíveis markdown wrappers e texto extra)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Gemini não retornou JSON válido:', responseText);
      throw new Error('A IA não conseguiu formatar os dados corretamente. Tente novamente.');
    }

    const cleanedResponse = jsonMatch[0];
    const parsed = JSON.parse(cleanedResponse)
    
    if (!parsed.respostas) {
      throw new Error('A IA não identificou as respostas na imagem.');
    }

    const respostasAluno = parsed.respostas || {}
    const alunoNome = parsed.aluno_nome || null

    // 4. Comparar com o gabarito oficial
    let acertos = 0
    const detalhes: Record<string, { resposta_aluno: string | null; resposta_correta: string; correto: boolean }> = {}

    for (let i = 1; i <= gabarito.questoes_qtd; i++) {
      const key = i.toString()
      const respostaAluno = respostasAluno[key] || null
      const respostaCorreta = gabarito.respostas[key]
      const correto = respostaAluno === respostaCorreta

      if (correto) acertos++
      
      detalhes[key] = {
        resposta_aluno: respostaAluno,
        resposta_correta: respostaCorreta,
        correto
      }
    }

    // 5. Calcular nota
    const valorPorQuestao = (gabarito.valor_total || 10.0) / gabarito.questoes_qtd
    const nota = acertos * valorPorQuestao

    // 6. Deduzir 1 crédito após sucesso
    await supabase
      .from('profiles')
      .update({ credits: (profile?.credits || 1) - 1 })
      .eq('id', session.user.id)

    return {
      success: true,
      acertos,
      total_questoes: gabarito.questoes_qtd,
      nota: parseFloat(nota.toFixed(2)),
      respostas_aluno: respostasAluno,
      aluno_nome: alunoNome,
      detalhes
    }
  } catch (err: any) {
    console.error('Erro ao processar com Gemini:', err)
    
    let errorMsg = `Erro na análise: ${err.message}`
    if (err.message?.includes('API key')) {
      errorMsg = 'Chave da API Gemini inválida. Verifique em Admin > Configurações.'
    }
    if (err.message?.includes('JSON')) {
      errorMsg = 'A IA não conseguiu ler a folha de respostas claramente. Tente enviar uma foto com melhor qualidade.'
    }
    
    return { success: false, error: errorMsg }
  }
}
