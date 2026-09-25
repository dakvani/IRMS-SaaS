/**
 * Utility to convert OKLCH color strings into standard RGB/RGBA strings.
 * This resolves html2canvas crash: 'Attempting to parse an unsupported color function "oklch"'
 * which occurs in Tailwind CSS v4 environments.
 */

export function parseOklchToRgb(str: string): string {
  if (!str || !str.includes('oklch')) return str;

  return str.replace(/oklch\(\s*([^()]+)\)/gi, (_match, inner) => {
    try {
      const parts = inner.trim().split(/\s+/);
      if (parts.length < 3) return '#333333';

      let lStr = parts[0];
      let cStr = parts[1];
      let hStr = parts[2];
      let aStr: string | undefined = undefined;

      // Handle slash notation for alpha: e.g. "0.205 0 0 / 0.8" or "0.205 0 0 / 80%"
      if (inner.includes('/')) {
        const slashSplit = inner.split('/');
        const mainParts = slashSplit[0].trim().split(/\s+/);
        lStr = mainParts[0] || '0';
        cStr = mainParts[1] || '0';
        hStr = mainParts[2] || '0';
        aStr = slashSplit[1]?.trim();
      }

      let alpha = 1;
      if (aStr && aStr !== 'none') {
        if (aStr.endsWith('%')) alpha = parseFloat(aStr) / 100;
        else alpha = parseFloat(aStr);
        if (isNaN(alpha)) alpha = 1;
      }

      let L = 0;
      if (lStr && lStr !== 'none') {
        if (lStr.endsWith('%')) L = parseFloat(lStr) / 100;
        else L = parseFloat(lStr);
        if (isNaN(L)) L = 0;
      }

      const C = cStr && cStr !== 'none' ? parseFloat(cStr) || 0 : 0;
      const H = hStr && hStr !== 'none' ? parseFloat(hStr) || 0 : 0;

      const hRad = (H * Math.PI) / 180;
      const aCoord = C * Math.cos(hRad);
      const bCoord = C * Math.sin(hRad);

      const l_ = L + 0.3963377774 * aCoord + 0.2158037573 * bCoord;
      const m_ = L - 0.1055613458 * aCoord - 0.0638541728 * bCoord;
      const s_ = L - 0.0894841775 * aCoord - 1.291485548 * bCoord;

      const l3 = l_ * l_ * l_;
      const m3 = m_ * m_ * m_;
      const s3 = s_ * s_ * s_;

      const rLin = +4.0767434756 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
      const gLin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
      const bLin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

      const toGamma = (x: number) => {
        const clamped = Math.max(0, Math.min(1, x));
        return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
      };

      const R = Math.round(toGamma(rLin) * 255);
      const G = Math.round(toGamma(gLin) * 255);
      const B = Math.round(toGamma(bLin) * 255);

      if (alpha < 1) {
        return `rgba(${R}, ${G}, ${B}, ${alpha})`;
      }
      return `rgb(${R}, ${G}, ${B})`;
    } catch {
      return '#333333';
    }
  });
}

/**
 * Sanitizes an entire document (e.g. clonedDoc in html2canvas onclone)
 * to ensure no element or stylesheet has oklch colors.
 */
export function sanitizeDocumentOklch(doc: Document): void {
  // 1. Sanitize all <style> tags text content
  doc.querySelectorAll('style').forEach((styleTag) => {
    if (styleTag.textContent && styleTag.textContent.includes('oklch')) {
      styleTag.textContent = parseOklchToRgb(styleTag.textContent);
    }
  });

  // 2. Add an explicit reset stylesheet into doc.head to override pseudo-elements (*::before, *::after)
  try {
    const overrideStyle = doc.createElement('style');
    overrideStyle.setAttribute('type', 'text/css');
    overrideStyle.textContent = `
      *, *::before, *::after {
        border-color: #e5e5e5 !important;
        outline-color: transparent !important;
        text-decoration-color: currentColor !important;
        box-shadow: none !important;
      }
    `;
    doc.head?.appendChild(overrideStyle);
  } catch (_e) {
    // ignore
  }

  // 3. Fallback canvas context for browser native conversion
  let canvasCtx: CanvasRenderingContext2D | null = null;
  try {
    const canvas = doc.createElement('canvas');
    canvasCtx = canvas.getContext('2d');
  } catch {
    // ignore
  }

  const convertVal = (val: string): string => {
    if (!val || !val.includes('oklch')) return val;
    if (canvasCtx) {
      try {
        canvasCtx.fillStyle = '#000000';
        canvasCtx.fillStyle = val;
        if (canvasCtx.fillStyle && !canvasCtx.fillStyle.includes('oklch')) {
          return canvasCtx.fillStyle;
        }
      } catch {
        // fallback
      }
    }
    return parseOklchToRgb(val);
  };

  // 4. Walk all elements in the document and sanitize computed styles
  const win = doc.defaultView || window;
  const elements = doc.querySelectorAll('*');
  const colorProps = [
    'color',
    'background-color',
    'border-color',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'outline-color',
    'text-decoration-color',
    'fill',
    'stroke'
  ];

  elements.forEach((el) => {
    const hEl = el as HTMLElement;
    if (!hEl.style) return;

    try {
      const comp = win.getComputedStyle(hEl);
      for (const prop of colorProps) {
        const val = comp.getPropertyValue(prop);
        if (val && val.includes('oklch')) {
          hEl.style.setProperty(prop, convertVal(val), 'important');
        }
      }

      // Box shadow often contains oklch in Tailwind v4
      const shadow = comp.getPropertyValue('box-shadow');
      if (shadow && shadow.includes('oklch')) {
        hEl.style.setProperty('box-shadow', 'none', 'important');
      }
    } catch {
      // ignore
    }
  });
}
