/**
 * 브라우저 Canvas API를 이용한 이미지 최적화 및 세로 스크롤 긴 캡처 분할
 * - 가로 최대 720px, JPEG 65% 품질로 안정적인 용량 유지 (3장 6조각이어도 총 500KB 내외)
 * - 세로 > 가로 * 2.5 인 경우 상/하단 2조각 자동 분할
 * - 무한 대기 방지를 위한 타임아웃(7초) 및 예외 처리
 */

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`이미지 로딩 시간이 초과되었습니다: ${file.name}`));
    }, 7000);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        clearTimeout(timer);
        resolve(img);
      };
      img.onerror = (err) => {
        clearTimeout(timer);
        reject(new Error(`이미지 파일 디코딩에 실패했습니다: ${file.name}`));
      };
      img.src = e.target.result;
    };
    reader.onerror = (err) => {
      clearTimeout(timer);
      reject(new Error(`파일을 읽을 수 없습니다: ${file.name}`));
    };
    reader.readAsDataURL(file);
  });
}

function canvasToDataUrl(canvas, quality = 0.65) {
  return canvas.toDataURL('image/jpeg', quality);
}

export async function processImageFile(file) {
  try {
    const img = await loadImage(file);
    const origW = img.width || 720;
    const origH = img.height || 1280;

    // 가로 최대 720px 리사이즈 비율 계산 (AI 분석에 충분하며 페이로드 급감)
    const targetW = Math.min(origW, 720);
    const scale = targetW / origW;
    const targetH = Math.round(origH * scale);

    // 긴 스크롤 캡처 판단: 세로 길이가 가로의 2.5배를 넘는 경우
    const isTallScroll = origH > origW * 2.5;

    if (!isTallScroll) {
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, targetW, targetH);
      return [canvasToDataUrl(canvas, 0.65)];
    }

    // 상/하단 2조각으로 자동 분할 (글자 잘림 방지 5% 오버랩)
    const halfH = Math.floor(origH / 2);
    const overlapH = Math.floor(origH * 0.05);

    // 1. 상단 조각
    const topH = halfH + overlapH;
    const topTargetH = Math.round(topH * scale);
    const canvasTop = document.createElement('canvas');
    canvasTop.width = targetW;
    canvasTop.height = topTargetH;
    const ctxTop = canvasTop.getContext('2d');
    ctxTop.drawImage(img, 0, 0, origW, topH, 0, 0, targetW, topTargetH);

    // 2. 하단 조각
    const bottomStartY = halfH - overlapH;
    const bottomH = origH - bottomStartY;
    const bottomTargetH = Math.round(bottomH * scale);
    const canvasBottom = document.createElement('canvas');
    canvasBottom.width = targetW;
    canvasBottom.height = bottomTargetH;
    const ctxBottom = canvasBottom.getContext('2d');
    ctxBottom.drawImage(img, 0, bottomStartY, origW, bottomH, 0, 0, targetW, bottomTargetH);

    return [canvasToDataUrl(canvasTop, 0.65), canvasToDataUrl(canvasBottom, 0.65)];
  } catch (err) {
    console.warn(`processImageFile error for ${file.name}:`, err);
    // 캔버스 실패 시 최소한 원본을 FileReader로 읽어서 반환
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve([e.target.result]);
      reader.onerror = () => resolve([]);
      reader.readAsDataURL(file);
    });
  }
}

/**
 * 텍스트 파일 (.txt) 최신 80줄 자동 추출
 */
export async function extractRecentChatLines(file, maxLines = 80) {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= maxLines) {
    return lines.join('\n');
  }
  return lines.slice(-maxLines).join('\n');
}
