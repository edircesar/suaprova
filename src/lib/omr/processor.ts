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

    // 4. Alinhamento Dinâmico da Grade (Grid Search)
    // Encontrar o offset exato em pixels para corrigir distorções de escala ou margens do HTML
    const searchQuestions = Math.min(15, questoesQtd)
    let bestScore = -1
    let gridOffset = { dx: 0, dy: 0 }

    for (let dy = -25; dy <= 25; dy += 4) {
      for (let dx = -8; dx <= 8; dx += 3) {
        let score = 0
        for (let q = 1; q <= searchQuestions; q++) {
          let maxDarkness = 0
          for (const alt of ALTERNATIVAS) {
            const mmPos = bubblesMM[q][alt]
            const rel = mmToMarkerRelative(mmPos.x, mmPos.y)
            const pixelPos = this.relativeToPixel(markers, rel.u, rel.v)
            
            // Busca estrita apenas para alinhamento
            const darkness = this.sampleBubbleDarkness(data, width, height, pixelPos.x + dx, pixelPos.y + dy, bubbleRadiusPx, true)
            if (darkness > maxDarkness) maxDarkness = darkness
          }
          score += maxDarkness
        }
        if (score > bestScore) {
          bestScore = score
          gridOffset = { dx, dy }
        }
      }
    }

    console.log(`Grid Offset Encontrado: dx=${gridOffset.dx}, dy=${gridOffset.dy} | Score: ${bestScore}`)

    // 5. Para cada questão, amostrar cada bolinha com o offset corrigido
    for (let q = 1; q <= questoesQtd; q++) {
      const altDarkness: Record<string, number> = {}
      let selectedAlt: string | null = null
      let maxDarkness = 0

      for (const alt of ALTERNATIVAS) {
        const mmPos = bubblesMM[q][alt]
        const rel = mmToMarkerRelative(mmPos.x, mmPos.y)
        const pixelPos = this.relativeToPixel(markers, rel.u, rel.v)

        // Calcular a escuridão média na região da bolinha + offset da grade
        const darkness = this.sampleBubbleDarkness(data, width, height, pixelPos.x + gridOffset.dx, pixelPos.y + gridOffset.dy, bubbleRadiusPx, false)
        altDarkness[alt] = Math.round(darkness)
      }

      // Determinar a alternativa marcada
      const sorted = Object.entries(altDarkness).sort((a, b) => b[1] - a[1])
      const darkest = sorted[0]
      const secondDarkest = sorted[1]

      const FILL_THRESHOLD = 50  // Mínimo reduzido levemente para ser mais tolerante
      const RATIO_THRESHOLD = 1.3 

      if (darkest[1] >= FILL_THRESHOLD) {
        if (secondDarkest[1] < FILL_THRESHOLD || darkest[1] / secondDarkest[1] >= RATIO_THRESHOLD) {
          selectedAlt = darkest[0]
          maxDarkness = darkest[1]
        }
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
   * Amostra a escuridão da região da bolinha.
   * Para ser resiliente a pequenos erros de alinhamento físico (1-3mm), 
   * procuramos em uma janela maior e tiramos a média apenas dos pixels mais escuros
   * correspondentes à área esperada de uma bolinha preenchida.
   */
  private sampleBubbleDarkness(
    data: Buffer, 
    width: number,
    height: number,
    centerX: number, 
    centerY: number, 
    bubbleRadiusPx: number,
    strict: boolean = false
  ): number {
    // Se strict, busca exatamente no raio da bolinha. 
    // Se não, dá uma pequena margem (mas sem encostar na do lado!)
    // gap é de 1.5mm. Raio é 2.0mm. Margem segura = 0.5mm = ~25% do raio.
    const searchRadius = strict ? bubbleRadiusPx : Math.floor(bubbleRadiusPx * 1.2)
    const x0 = Math.max(0, Math.floor(centerX - searchRadius))
    const x1 = Math.min(width - 1, Math.floor(centerX + searchRadius))
    const y0 = Math.max(0, Math.floor(centerY - searchRadius))
    const y1 = Math.min(height - 1, Math.floor(centerY + searchRadius))

    const darknessValues: number[] = []

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const idx = y * width + x
        if (idx >= 0 && idx < data.length) {
          // Inverter: 255 (branco) → 0, 0 (preto) → 255
          darknessValues.push(255 - data[idx])
        }
      }
    }

    if (darknessValues.length === 0) return 0

    // Ordenar do mais escuro (maior valor) para o mais claro
    darknessValues.sort((a, b) => b - a)

    const expectedBubbleArea = Math.PI * Math.pow(bubbleRadiusPx, 2)
    const numPixelsToSample = Math.max(5, Math.floor(expectedBubbleArea * 0.6))
    
    // Pegar apenas o top N pixels mais escuros
    const topDarkPixels = darknessValues.slice(0, numPixelsToSample)
    
    const totalDarkness = topDarkPixels.reduce((sum, val) => sum + val, 0)
    return totalDarkness / topDarkPixels.length
  }
}
