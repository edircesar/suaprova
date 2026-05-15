/**
 * OMR Template Configuration - SuaProva
 * 
 * Define as posições EXATAS (em mm) de cada elemento na folha de respostas.
 * Estas coordenadas DEVEM corresponder ao layout CSS em folha/page.tsx.
 * 
 * Referência da folha A4: 210mm x 297mm
 */

export interface TemplateConfig {
  questoes_qtd: number
  alternativas: string[]
  colunas: number
  questoes_por_coluna: number
}

export const ALTERNATIVAS = ['A', 'B', 'C', 'D', 'E']

// ============================================================
// MARCADORES DE CANTO (posição do CENTRO do quadrado, em mm)
// Corresponde ao CSS: absolute top-[5mm] left-[5mm] w-[7mm] h-[7mm]
// ============================================================
export const MARKER_SIZE_MM = 7

export const MARKER_CENTERS_MM = {
  tl: { x: 8.5, y: 8.5 },      // top=5 + 7/2, left=5 + 7/2
  tr: { x: 201.5, y: 8.5 },     // right=5 → 210-5-3.5
  bl: { x: 8.5, y: 283.5 },     // bottom=10 → 297-10-3.5
  br: { x: 201.5, y: 283.5 },   // bottom=10, right=5
}

// Distância entre centros dos marcadores (para normalização)
export const MARKER_SPAN = {
  x: MARKER_CENTERS_MM.tr.x - MARKER_CENTERS_MM.tl.x, // 193mm
  y: MARKER_CENTERS_MM.bl.y - MARKER_CENTERS_MM.tl.y,  // 275mm
}

// ============================================================
// LAYOUT DA GRADE DE RESPOSTAS (em mm desde a origem da página)
// Corresponde ao CSS da grade em folha/page.tsx
// ============================================================

// A grade começa após: padding(10) + spacer(12) + header(~9) + form(~12) + instrucoes(~13) = ~56mm do topo
// E tem padding esquerdo extra de 10mm: padding(10) + pl(10) = 20mm da esquerda
const GRID_TOP_MM = 57       // Y onde a grade de respostas começa (topo do cabeçalho da coluna)
const GRID_LEFT_MM = 20      // X onde a grade começa (após p-[10mm] + pl-[10mm])
const GRID_RIGHT_MM = 200    // X onde a grade termina (210 - p-[10mm])

// Dimensões da grade
const GRID_WIDTH_MM = GRID_RIGHT_MM - GRID_LEFT_MM // 180mm
const COL_GAP_MM = 6.35      // gap-x-6 = 24px ≈ 6.35mm

// Cada coluna
const NUM_COLS = 3
const COL_WIDTH_MM = (GRID_WIDTH_MM - (NUM_COLS - 1) * COL_GAP_MM) / NUM_COLS // ≈ 55.77mm

// Dentro de cada coluna
const HEADER_HEIGHT_MM = 6.5  // h-[6.5mm] - cabeçalho com A B C D E
const ROW_HEIGHT_MM = 5.8     // h-[5.8mm] - altura de cada linha de questão
export const BUBBLE_DIAMETER_MM = 4.0 // w-[4.0mm] h-[4.0mm]
const BUBBLE_GAP_MM = 1.5     // gap-x-[1.5mm]

// Offset do número da questão dentro da coluna
const QUESTION_NUM_WIDTH_MM = 5.3 // w-4 + mr-1 = 16px + 4px ≈ 5.3mm

// Largura total das 5 bolinhas
const BUBBLES_TOTAL_WIDTH_MM = 5 * BUBBLE_DIAMETER_MM + 4 * BUBBLE_GAP_MM // 26mm

/**
 * Calcula a configuração da grade para uma quantidade de questões
 */
export function getTemplateConfig(questoesQtd: number): TemplateConfig {
  const questoes_por_coluna = 35 // Fixo: 3 colunas x 35 questões max = 105

  return {
    questoes_qtd: questoesQtd,
    alternativas: ALTERNATIVAS,
    colunas: NUM_COLS,
    questoes_por_coluna,
  }
}

/**
 * Calcula a posição (em mm) do CENTRO de cada bolinha na página A4.
 * Retorna um mapa: { questão: { alternativa: { x_mm, y_mm } } }
 */
export function getBubblePositionsMM(questoesQtd: number): Record<number, Record<string, { x: number; y: number }>> {
  const positions: Record<number, Record<string, { x: number; y: number }>> = {}
  const questoes_por_coluna = 35

  for (let q = 1; q <= questoesQtd; q++) {
    const colIndex = Math.floor((q - 1) / questoes_por_coluna)
    const rowIndex = (q - 1) % questoes_por_coluna

    // X de início da coluna
    const colStartX = GRID_LEFT_MM + colIndex * (COL_WIDTH_MM + COL_GAP_MM)

    // X onde as bolinhas começam (após o número da questão)
    const bubblesStartX = colStartX + QUESTION_NUM_WIDTH_MM

    // Espaço disponível para as bolinhas
    const bubblesAreaWidth = COL_WIDTH_MM - QUESTION_NUM_WIDTH_MM
    // Centralizar as bolinhas nesse espaço (justify-center)
    const bubblesOffset = (bubblesAreaWidth - BUBBLES_TOTAL_WIDTH_MM) / 2

    // Y da questão (após cabeçalho da coluna + header gap)
    const questionY = GRID_TOP_MM + HEADER_HEIGHT_MM + 0.5 + rowIndex * ROW_HEIGHT_MM + ROW_HEIGHT_MM / 2

    positions[q] = {}

    for (let a = 0; a < ALTERNATIVAS.length; a++) {
      const alt = ALTERNATIVAS[a]
      // Centro X da bolinha
      const bubbleCenterX = bubblesStartX + bubblesOffset + a * (BUBBLE_DIAMETER_MM + BUBBLE_GAP_MM) + BUBBLE_DIAMETER_MM / 2
      // Centro Y da bolinha (centralizada na linha)
      const bubbleCenterY = questionY

      positions[q][alt] = { x: bubbleCenterX, y: bubbleCenterY }
    }
  }

  return positions
}

/**
 * Converte uma posição em mm para posição relativa entre os marcadores (0-1).
 * Útil para o processador OMR mapear de mm → pixels.
 */
export function mmToMarkerRelative(mmX: number, mmY: number): { u: number; v: number } {
  const u = (mmX - MARKER_CENTERS_MM.tl.x) / MARKER_SPAN.x
  const v = (mmY - MARKER_CENTERS_MM.tl.y) / MARKER_SPAN.y
  return { u, v }
}
