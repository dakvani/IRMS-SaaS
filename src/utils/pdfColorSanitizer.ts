/**
 * Utility to convert OKLCH color strings into standard RGB/RGBA strings.
 * This resolves html2canvas crash: 'Attempting to parse an unsupported color function "oklch"'
 * which occurs in Tailwind CSS v4 environments.
 */

export function parseOklchToRgb(str: string): string {
  if (!str || (!str.includes('oklch') && !str.includes('oklab'))) return str;

  return str.replace(/oklch\(\s*([^()]+)\)/gi, (_match, inner) => {
    try {
      // Split by whitespace or slash
      const cleanInner = inner.trim();
      let lStr = '0';
      let cStr = '0';
      let hStr = '0';
      let aStr: string | undefined = undefined;

      // Handle slash notation for alpha: e.g. "0.205 0 0 / 0.8" or "0.205 0 0/80%"
      if (cleanInner.includes('/')) {
        const slashSplit = cleanInner.split('/');
        const mainParts = slashSplit[0].trim().split(/\s+/);
        lStr = mainParts[0] || '0';
        cStr = mainParts[1] || '0';
        hStr = mainParts[2] || '0';
        aStr = slashSplit[1]?.trim();
      } else {
        const parts = cleanInner.split(/\s+/);
        lStr = parts[0] || '0';
        cStr = parts[1] || '0';
        hStr = parts[2] || '0';
        aStr = parts[3];
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

      let C = 0;
      if (cStr && cStr !== 'none') {
        if (cStr.endsWith('%')) C = parseFloat(cStr) / 100;
        else C = parseFloat(cStr);
        if (isNaN(C)) C = 0;
      }

      let H = 0;
      if (hStr && hStr !== 'none') {
        if (hStr.endsWith('deg')) H = parseFloat(hStr);
        else if (hStr.endsWith('rad')) H = (parseFloat(hStr) * 180) / Math.PI;
        else if (hStr.endsWith('turn')) H = parseFloat(hStr) * 360;
        else H = parseFloat(hStr);
        if (isNaN(H)) H = 0;
      }

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
 * to ensure no element, stylesheet, or pseudo-element retains oklch colors.
 */
export function sanitizeDocumentOklch(doc: Document): void {
  // 1. Explicitly sanitize document root & body backgrounds
  if (doc.documentElement) {
    doc.documentElement.style.backgroundColor = '#ffffff';
    doc.documentElement.style.color = '#171717';
  }
  if (doc.body) {
    doc.body.style.backgroundColor = '#ffffff';
    doc.body.style.color = '#171717';
  }

  // 2. Sanitize all <style> tags text content
  doc.querySelectorAll('style').forEach((styleTag) => {
    if (styleTag.textContent && styleTag.textContent.includes('oklch')) {
      styleTag.textContent = parseOklchToRgb(styleTag.textContent);
    }
  });

  // 3. Inject a global override stylesheet to remap Tailwind v4 variables and clear pseudo-elements
  try {
    const overrideStyle = doc.createElement('style');
    overrideStyle.setAttribute('type', 'text/css');
    overrideStyle.textContent = `
      :root, * {
        --color-neutral-50: #fafafa !important;
        --color-neutral-100: #f5f5f5 !important;
        --color-neutral-200: #e5e5e5 !important;
        --color-neutral-300: #d4d4d4 !important;
        --color-neutral-400: #a3a3a3 !important;
        --color-neutral-500: #737373 !important;
        --color-neutral-600: #525252 !important;
        --color-neutral-700: #404040 !important;
        --color-neutral-800: #262626 !important;
        --color-neutral-900: #171717 !important;
        --color-neutral-950: #0a0a0a !important;
        --color-blue-500: #3b82f6 !important;
        --color-blue-600: #2563eb !important;
        --color-blue-700: #1d4ed8 !important;
        --color-indigo-500: #6366f1 !important;
        --color-indigo-600: #4f46e5 !important;
        --color-emerald-500: #10b981 !important;
        --color-emerald-600: #059669 !important;
        --color-amber-500: #f59e0b !important;
        --color-rose-500: #f43f5e !important;
        --color-white: #ffffff !important;
        --color-black: #000000 !important;
      }
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

  // 4. Walk all elements in the document and sanitize computed and inline styles
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
    'stroke',
    'caret-color'
  ];

  elements.forEach((el) => {
    const hEl = el as HTMLElement;
    if (!hEl.style) return;

    // Sanitize any existing inline style attribute
    const inlineStyle = hEl.getAttribute('style');
    if (inlineStyle && inlineStyle.includes('oklch')) {
      hEl.setAttribute('style', parseOklchToRgb(inlineStyle));
    }

    try {
      const comp = win.getComputedStyle(hEl);
      for (const prop of colorProps) {
        const val = comp.getPropertyValue(prop);
        if (val && val.includes('oklch')) {
          hEl.style.setProperty(prop, parseOklchToRgb(val), 'important');
        }
      }

      // Box shadow often contains oklch in Tailwind v4
      const shadow = comp.getPropertyValue('box-shadow');
      if (shadow && shadow.includes('oklch')) {
        hEl.style.setProperty('box-shadow', 'none', 'important');
      }

      // For SVG elements, ensure fill and stroke attributes are clean
      if (el instanceof SVGElement) {
        const fill = el.getAttribute('fill');
        if (fill && fill.includes('oklch')) {
          el.setAttribute('fill', parseOklchToRgb(fill));
        }
        const stroke = el.getAttribute('stroke');
        if (stroke && stroke.includes('oklch')) {
          el.setAttribute('stroke', parseOklchToRgb(stroke));
        }
      }
    } catch {
      // ignore
    }
  });
}
