import sharp from 'sharp'
import { getTemplateConfig, getBubblePositions, TemplateConfig } from './template-config'

export interface OMRResult {
  question: number
  answer: string | null
  confidence: number
}

export class OMRProcessor {
  /**
   * Processa uma imagem de prova e retorna as respostas detectadas
   * @param imageBuffer O buffer da imagem (jpeg/png/webp)
   * @param questoesQtd Quantidade de questões no gabarito
   */
  async process(imageBuffer: Buffer, questoesQtd: number): Promise<OMRResult[]> {
    const config = getTemplateConfig(questoesQtd)
    const positions = getBubblePositions(config)
    
    // 1. Pré-processar imagem (escala de cinza + alto contraste)
    const processedImage = await sharp(imageBuffer)
      .grayscale()
      .normalize() // Aumenta o contraste
      .raw()
      .toBuffer({ resolveWithObject: true })

    const { data, info } = processedImage
    const { width, height } = info

    const results: OMRResult[] = []

    // 2. Iterar sobre as questões e bolinhas
    for (let q = 1; q <= questoesQtd; q++) {
      let selectedAlt: string | null = null
      let maxDarkness = -1
      const altConfidence: Record<string, number> = {}

      for (const alt of config.alternativas) {
        const pos = positions[q][alt]
        
        // Converter % para pixels
        const centerX = Math.floor((pos.x / 100) * width)
        const centerY = Math.floor((pos.y / 100) * height)
        
        // Tamanho da área da bolinha em pixels
        const radius = Math.floor((1.5 / 100) * width) // ~1.5% da largura
        
        // Calcular "escuridão" média na área da bolinha
        const darkness = this.calculateDarkness(data, width, centerX, centerY, radius)
        altConfidence[alt] = darkness

        // Se estiver bem escuro (threshold > 40)
        if (darkness > 45 && darkness > maxDarkness) {
          maxDarkness = darkness
          selectedAlt = alt
        }
      }

      // Validar se há múltiplas marcações (evitar erros)
      // Se a segunda bolinha mais escura tiver escuridão próxima da primeira, pode ser rasura
      
      results.push({
        question: q,
        answer: selectedAlt,
        confidence: maxDarkness
      })
    }

    return results
  }

  /**
   * Calcula a média de escuridão em um círculo (bolinha)
   * 0 = branco puro, 255 = preto puro
   */
  private calculateDarkness(
    data: Buffer, 
    width: number, 
    centerX: number, 
    centerY: number, 
    radius: number
  ): number {
    let totalDarkness = 0
    let count = 0

    // Verificar limites da imagem
    const startX = Math.max(0, centerX - radius)
    const endX = Math.min(width - 1, centerX + radius)
    const startY = Math.max(0, centerY - radius)
    const endY = Math.min(data.length / width - 1, centerY + radius)

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        // Distância do centro (círculo)
        const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
        
        if (dist <= radius) {
          const pixelIndex = y * width + x
          const val = data[pixelIndex]
          
          // Inverter: no grayscale 255 é branco. Queremos 255 como preto.
          totalDarkness += (255 - val)
          count++
        }
      }
    }

    return count > 0 ? totalDarkness / count : 0
  }
}
