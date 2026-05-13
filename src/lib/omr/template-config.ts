/**
 * OMR Template Configuration
 * Define as posições relativas de cada elemento na folha de respostas.
 * Todas as posições são em PERCENTUAL (0-100) relativas à área entre os marcadores.
 */

export interface TemplateConfig {
  questoes_qtd: number
  alternativas: string[]
  colunas: number
  questoes_por_coluna: number
}

export const ALTERNATIVAS = ['A', 'B', 'C', 'D', 'E']

// Marcadores de canto (posição relativa na página A4 em mm)
export const MARKER_SIZE_MM = 7 // 7mm quadrados
export const MARKER_POSITIONS = {
  topLeft: { x: 8, y: 8 },
  topRight: { x: 202, y: 8 },
  bottomLeft: { x: 8, y: 285 },
  bottomRight: { x: 202, y: 285 },
}

// Área útil da grade (entre os marcadores, em %)
export const GRID_AREA = {
  startX: 14,  // % da largura entre marcadores (deixar espaço para a "escadinha")
  startY: 24,  // % da altura entre marcadores (subiu devido ao cabeçalho compacto)
  endX: 95,
  endY: 95,
}

// Tamanho relativo das bolinhas
export const BUBBLE_RADIUS_PERCENT = 1.2 // % da largura da página
export const BUBBLE_SPACING_X_PERCENT = 4.5 // espaço entre bolinhas (A, B, C, D, E)

/**
 * Calcula a configuração da grade para uma quantidade de questões
 */
export function getTemplateConfig(questoesQtd: number): TemplateConfig {
  // Sempre usar 3 colunas para manter legibilidade
  let colunas = 3

  // Se tiver muitas questões, verificar se cabe em 3 colunas (max ~30 por coluna)
  const questoesPorCol3 = Math.ceil(questoesQtd / 3)
  if (questoesPorCol3 > 30) {
    colunas = 4
  }

  const questoes_por_coluna = Math.ceil(questoesQtd / colunas)

  return {
    questoes_qtd: questoesQtd,
    alternativas: ALTERNATIVAS,
    colunas,
    questoes_por_coluna,
  }
}

/**
 * Calcula a posição (em %) de cada bolinha na grade
 * Retorna um mapa: { questão: { alternativa: { x%, y% } } }
 */
export function getBubblePositions(config: TemplateConfig) {
  const positions: Record<number, Record<string, { x: number; y: number }>> = {}

  const gridWidth = GRID_AREA.endX - GRID_AREA.startX
  const gridHeight = GRID_AREA.endY - GRID_AREA.startY
  const colWidth = gridWidth / config.colunas

  const rowHeight = gridHeight / (config.questoes_por_coluna + 1) // +1 para header de coluna

  for (let q = 1; q <= config.questoes_qtd; q++) {
    const colIndex = Math.floor((q - 1) / config.questoes_por_coluna)
    const rowIndex = ((q - 1) % config.questoes_por_coluna)

    positions[q] = {}

    for (let a = 0; a < config.alternativas.length; a++) {
      const alt = config.alternativas[a]

      // Posição X: início da coluna + offset do número + offset da alternativa
      const colStartX = GRID_AREA.startX + colIndex * colWidth
      const numberWidth = colWidth * 0.2 // 20% para o número da questão
      const bubblesAreaWidth = colWidth * 0.7 // 70% para as bolinhas
      const bubbleSpacing = bubblesAreaWidth / config.alternativas.length

      const x = colStartX + numberWidth + a * bubbleSpacing + bubbleSpacing / 2

      // Posição Y: início da grade + offset da linha (pular header)
      const y = GRID_AREA.startY + (rowIndex + 1.5) * rowHeight

      positions[q][alt] = { x, y }
    }
  }

  return positions
}
