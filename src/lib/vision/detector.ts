/**
 * Vision Detector for SuaProva
 * Responsible for:
 * 1. Rectifying the image based on corner markers
 * 2. Detecting bubbles in specific coordinates
 * 3. Returning the marked alternatives
 */

export interface BubbleResult {
  question: number;
  answer: string | null;
}

export class ExamDetector {
  private cv: any;

  constructor(cv: any) {
    this.cv = cv;
  }

  /**
   * Main processing function
   */
  async processImage(imageSource: HTMLImageElement | HTMLCanvasElement): Promise<BubbleResult[]> {
    const cv = this.cv;
    let src = cv.imread(imageSource);
    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    
    // 1. Encontrar os marcadores (quadrados pretos nos cantos)
    // Usaremos threshold e busca de contornos para achar os 4 cantos
    let binary = new cv.Mat();
    cv.threshold(gray, binary, 100, 255, cv.THRESH_BINARY_INV);
    
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    
    let cornerPoints: any[] = [];
    
    for (let i = 0; i < contours.size(); ++i) {
      let cnt = contours.get(i);
      let peri = cv.arcLength(cnt, true);
      let approx = new cv.Mat();
      cv.approxPolyDP(cnt, approx, 0.02 * peri, true);
      
      // Se for um quadrado/retângulo pequeno (marcador)
      if (approx.rows === 4) {
        let rect = cv.boundingRect(approx);
        let aspectRatio = rect.width / rect.height;
        if (aspectRatio >= 0.8 && aspectRatio <= 1.2 && rect.width > 20) {
          cornerPoints.push({
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
            size: rect.width
          });
        }
      }
      approx.delete();
    }
    
    // Limpar memória
    gray.delete(); binary.delete(); contours.delete(); hierarchy.delete();
    
    // Precisamos de exatamente 4 cantos para retificar
    if (cornerPoints.length < 4) {
      src.delete();
      throw new Error(`Marcadores não encontrados (detectados: ${cornerPoints.length}). Certifique-se de que os 4 quadrados nos cantos estão visíveis.`);
    }

    // Ordenar os pontos: top-left, top-right, bottom-right, bottom-left
    const sortedCorners = this.sortCorners(cornerPoints);
    
    // 2. Retificar a imagem (Warp Perspective)
    const width = 1000;
    const height = 1414; // Proporção A4 (1 : sqrt(2))
    
    let dstCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0, 0,
      width, 0,
      width, height,
      0, height
    ]);
    
    let srcCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [
      sortedCorners.tl.x, sortedCorners.tl.y,
      sortedCorners.tr.x, sortedCorners.tr.y,
      sortedCorners.br.x, sortedCorners.br.y,
      sortedCorners.bl.x, sortedCorners.bl.y
    ]);
    
    let M = cv.getPerspectiveTransform(srcCoords, dstCoords);
    let rectified = new cv.Mat();
    cv.warpPerspective(src, rectified, M, new cv.Size(width, height));
    
    // 3. Analisar bolinhas baseadas no modelo CEBAMA
    const results = this.analyzeBubbles(rectified);
    
    // Limpeza final
    src.delete(); rectified.delete(); M.delete(); srcCoords.delete(); dstCoords.delete();
    
    return results;
  }

  private sortCorners(points: any[]) {
    // Ordenar por Y para separar topo de fundo
    points.sort((a, b) => a.y - b.y);
    
    // Pegar os 2 mais ao topo e os 2 mais ao fundo, ignorando marcadores intermediários se existirem
    let top = points.slice(0, 2).sort((a, b) => a.x - b.x);
    let bottom = points.slice(points.length - 2).sort((a, b) => a.x - b.x);
    
    return {
      tl: top[0],
      tr: top[1],
      bl: bottom[0],
      br: bottom[1]
    };
  }

  private analyzeBubbles(img: any): BubbleResult[] {
    const cv = this.cv;
    const results: BubbleResult[] = [];
    
    // Converter para gray e threshold para detectar preenchimento
    let gray = new cv.Mat();
    cv.cvtColor(img, gray, cv.COLOR_RGBA2GRAY);
    let binary = new cv.Mat();
    cv.adaptiveThreshold(gray, binary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);
    
    // Definição das regiões das colunas baseadas no modelo enviado
    // Estes valores são percentuais ou coordenadas fixas após retificação para 1000x1414
    const columns = [
      { start: 1, end: 20, x: 50, y: 800, stepY: 28 },   // Coluna 1
      { start: 21, end: 40, x: 300, y: 800, stepY: 28 }, // Coluna 2
      { start: 41, end: 50, x: 600, y: 150, stepY: 28 }, // Coluna 3 (Superior)
      { start: 51, end: 70, x: 600, y: 800, stepY: 28 }, // Coluna 4
    ];
    
    const alternatives = ['A', 'B', 'C', 'D', 'E'];
    const bubbleSpacingX = 22;

    for (const col of columns) {
      for (let q = col.start; q <= col.end; q++) {
        let rowY = col.y + (q - col.start) * col.stepY;
        let bestAlt: string | null = null;
        let maxDarkness = 0;
        
        for (let i = 0; i < alternatives.length; i++) {
          let bubbleX = col.x + (i * bubbleSpacingX);
          
          // Criar um ROI (Region of Interest) para cada bolinha
          let rect = new cv.Rect(bubbleX - 8, rowY - 8, 16, 16);
          let roi = binary.roi(rect);
          
          // Contar pixels brancos no binário invertido (que significa preenchimento preto na imagem original)
          let whitePixels = cv.countNonZero(roi);
          let totalPixels = rect.width * rect.height;
          let fillRatio = whitePixels / totalPixels;
          
          if (fillRatio > 0.4 && fillRatio > maxDarkness) {
            maxDarkness = fillRatio;
            bestAlt = alternatives[i];
          }
          roi.delete();
        }
        
        results.push({ question: q, answer: bestAlt });
      }
    }
    
    gray.delete(); binary.delete();
    return results;
  }
}
