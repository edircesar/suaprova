import sharp from 'sharp'
import {
  getBubblePositionsMM,
  mmToMarkerRelative,
  MARKER_SIZE_MM,
  MARKER_CENTERS_MM,
  MARKER_SPAN,
  BUBBLE_DIAMETER_MM,
  ALTERNATIVAS,
} from './template-config'

export interface OMRResult {
  question: number
  answer: string | null
  confidence: number
  alternatives: Record<string, number> // darkness de cada alternativa
}

interface Point {
  x: number
  y: number
}

interface MarkerCorners {
  tl: Point
  tr: Point
  bl: Point
  br: Point
}

export class OMRProcessor {
  /**
   * Processa uma imagem de folha de respostas e retorna as alternativas detectadas.
   * Funciona para gabarito oficial E prova de aluno.
   */
  async process(imageBuffer: Buffer, questoesQtd: number): Promise<OMRResult[]> {
    // Configurar sharp para economizar memória (evitar erro 503 / OOM no Hostinger)
    sharp.cache(false)
    sharp.concurrency(1)

    // 1. Pré-processar: converter para grayscale e obter dados raw
    // O resize para 1200px evita que fotos de 12MP-50MP estourem a memória RAM
    const processedImage = await sharp(imageBuffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .grayscale()
      .normalize()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const { data, info } = processedImage
    const { width, height } = info

    // 2. Detectar os 4 marcadores de canto
    const markers = this.findMarkers(data, width, height)
    if (!markers) {
      throw new Error(
        'Não foi possível detectar os 4 marcadores de canto. ' +
        'Certifique-se de que a folha está completamente visível e os quadrados pretos nos cantos estão nítidos.'
      )
    }

    // 3. Obter posições das bolinhas em mm
    const bubblesMM = getBubblePositionsMM(questoesQtd)

    // 4. Para cada questão, amostrar cada bolinha e determinar a marcação
    const results: OMRResult[] = []
    
    // Calcular o raio de amostragem em pixels (baseado no tamanho do marcador detectado)
    const markerPixelSize = this.estimateMarkerPixelSize(markers)
    const mmPerPixel = MARKER_SIZE_MM / markerPixelSize
    const bubbleRadiusPx = Math.max(3, Math.floor((BUBBLE_DIAMETER_MM / 2) / mmPerPixel * 0.7))

    for (let q = 1; q <= questoesQtd; q++) {
      const altDarkness: Record<string, number> = {}
      let selectedAlt: string | null = null
      let maxDarkness = 0

      for (const alt of ALTERNATIVAS) {
        const mmPos = bubblesMM[q][alt]
        // Converter mm → posição relativa entre marcadores
        const rel = mmToMarkerRelative(mmPos.x, mmPos.y)
        // Converter posição relativa → pixels usando interpolação bilinear
        const pixelPos = this.relativeToPixel(markers, rel.u, rel.v)

        // Calcular a escuridão média na região da bolinha
        const darkness = this.sampleCircle(data, width, height, pixelPos.x, pixelPos.y, bubbleRadiusPx)
        altDarkness[alt] = Math.round(darkness)
      }

      // Determinar a alternativa marcada
      // Estratégia: encontrar a mais escura e verificar se está acima do threshold
      const sorted = Object.entries(altDarkness).sort((a, b) => b[1] - a[1])
      const darkest = sorted[0]
      const secondDarkest = sorted[1]

      // Threshold dinâmico: a bolinha marcada deve ter pelo menos 35% de escuridão
      // E deve ser significativamente mais escura que a segunda (pelo menos 1.5x)
      const FILL_THRESHOLD = 60  // Mínimo de escuridão para considerar marcado
      const RATIO_THRESHOLD = 1.4 // A marcada deve ser 1.4x mais escura que a próxima

      if (darkest[1] >= FILL_THRESHOLD) {
        if (secondDarkest[1] < FILL_THRESHOLD || darkest[1] / secondDarkest[1] >= RATIO_THRESHOLD) {
          selectedAlt = darkest[0]
          maxDarkness = darkest[1]
        }
        // Se duas estão muito próximas, pode ser rasura → não marca nenhuma
      }

      results.push({
        question: q,
        answer: selectedAlt,
        confidence: maxDarkness,
        alternatives: altDarkness,
      })
    }

    return results
  }

  /**
   * Detecta os 4 marcadores de canto na imagem.
   * Busca por regiões de alta densidade de pixels escuros nos 4 cantos.
   */
  private findMarkers(data: Buffer, width: number, height: number): MarkerCorners | null {
    const searchFraction = 0.18 // Buscar nos 18% de cada canto
    const searchW = Math.floor(width * searchFraction)
    const searchH = Math.floor(height * searchFraction)

    // Threshold para considerar um pixel como "escuro" (preto)
    const DARK_THRESHOLD = 100

    const regions = [
      { name: 'tl', x0: 0, y0: 0, x1: searchW, y1: searchH },
      { name: 'tr', x0: width - searchW, y0: 0, x1: width, y1: searchH },
      { name: 'bl', x0: 0, y0: height - searchH, x1: searchW, y1: height },
      { name: 'br', x0: width - searchW, y0: height - searchH, x1: width, y1: height },
    ]

    const corners: Record<string, Point> = {}

    for (const region of regions) {
      const center = this.findDarkSquareCenter(
        data, width, height,
        region.x0, region.y0, region.x1, region.y1,
        DARK_THRESHOLD
      )
      if (!center) return null
      corners[region.name] = center
    }

    return corners as unknown as MarkerCorners
  }

  /**
   * Encontra o centro de um quadrado escuro (marcador) numa região da imagem.
   * Usa janela deslizante para encontrar a área com maior densidade de pixels escuros.
   */
  private findDarkSquareCenter(
    data: Buffer, imgWidth: number, imgHeight: number,
    x0: number, y0: number, x1: number, y1: number,
    darkThreshold: number
  ): Point | null {
    // Estimar tamanho do marcador em pixels (proporção da imagem)
    // Marcador = 7mm em página de 210mm. Se imagem tem 'imgWidth' pixels:
    const estimatedMarkerPx = Math.max(15, Math.floor(imgWidth * 7 / 210))
    const windowSize = Math.floor(estimatedMarkerPx * 0.8)
    const step = Math.max(1, Math.floor(windowSize / 4))

    let bestX = 0, bestY = 0, bestDensity = 0

    for (let wy = y0; wy + windowSize <= y1; wy += step) {
      for (let wx = x0; wx + windowSize <= x1; wx += step) {
        let darkPixels = 0
        let totalPixels = 0

        for (let py = wy; py < wy + windowSize; py++) {
          for (let px = wx; px < wx + windowSize; px++) {
            const idx = py * imgWidth + px
            if (idx < data.length) {
              totalPixels++
              if (data[idx] < darkThreshold) {
                darkPixels++
              }
            }
          }
        }

        const density = totalPixels > 0 ? darkPixels / totalPixels : 0

        if (density > bestDensity) {
          bestDensity = density
          bestX = wx + windowSize / 2
          bestY = wy + windowSize / 2
        }
      }
    }

    // O marcador deve ter alta densidade (pelo menos 60% escuro)
    if (bestDensity < 0.5) {
      return null
    }

    // Refinar: encontrar o centróide dos pixels escuros ao redor do melhor ponto
    const refineRadius = Math.floor(estimatedMarkerPx * 0.75)
    let sumX = 0, sumY = 0, count = 0

    const rx0 = Math.max(0, Math.floor(bestX - refineRadius))
    const rx1 = Math.min(imgWidth - 1, Math.floor(bestX + refineRadius))
    const ry0 = Math.max(0, Math.floor(bestY - refineRadius))
    const ry1 = Math.min(imgHeight - 1, Math.floor(bestY + refineRadius))

    for (let py = ry0; py <= ry1; py++) {
      for (let px = rx0; px <= rx1; px++) {
        const idx = py * imgWidth + px
        if (idx < data.length && data[idx] < darkThreshold) {
          sumX += px
          sumY += py
          count++
        }
      }
    }

    if (count === 0) return null

    return {
      x: Math.round(sumX / count),
      y: Math.round(sumY / count),
    }
  }

  /**
   * Estima o tamanho em pixels de um marcador, baseado na distância entre marcadores.
   */
  private estimateMarkerPixelSize(markers: MarkerCorners): number {
    // Distância horizontal entre TL e TR em pixels
    const hDist = Math.sqrt(
      Math.pow(markers.tr.x - markers.tl.x, 2) + 
      Math.pow(markers.tr.y - markers.tl.y, 2)
    )
    // Essa distância corresponde a MARKER_SPAN.x mm (193mm)
    // O marcador tem MARKER_SIZE_MM mm (7mm)
    return (MARKER_SIZE_MM / MARKER_SPAN.x) * hDist
  }

  /**
   * Converte coordenada relativa (0-1) entre marcadores para pixels.
   * Usa interpolação bilinear para lidar com distorção leve.
   */
  private relativeToPixel(markers: MarkerCorners, u: number, v: number): Point {
    // Interpolar no eixo X
    const topX = markers.tl.x + u * (markers.tr.x - markers.tl.x)
    const topY = markers.tl.y + u * (markers.tr.y - markers.tl.y)
    const bottomX = markers.bl.x + u * (markers.br.x - markers.bl.x)
    const bottomY = markers.bl.y + u * (markers.br.y - markers.bl.y)

    // Interpolar no eixo Y
    return {
      x: Math.round(topX + v * (bottomX - topX)),
      y: Math.round(topY + v * (bottomY - topY)),
    }
  }

  /**
   * Amostra a escuridão média num círculo (bolinha).
   * Retorna 0-255, onde 0 = branco puro e 255 = preto puro.
   */
  private sampleCircle(
    data: Buffer, 
    width: number,
    height: number,
    centerX: number, 
    centerY: number, 
    radius: number
  ): number {
    let totalDarkness = 0
    let count = 0

    const x0 = Math.max(0, centerX - radius)
    const x1 = Math.min(width - 1, centerX + radius)
    const y0 = Math.max(0, centerY - radius)
    const y1 = Math.min(height - 1, centerY + radius)

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
        if (dist <= radius) {
          const idx = y * width + x
          if (idx >= 0 && idx < data.length) {
            // Inverter: 255 (branco) → 0, 0 (preto) → 255
            totalDarkness += (255 - data[idx])
            count++
          }
        }
      }
    }

    return count > 0 ? totalDarkness / count : 0
  }
}
