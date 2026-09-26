/**
 * Enhanced Direct Printing Utility for IRMS SaaS
 * Directly connects document content to the native print subsystem with fallback handling.
 */
export function printElement(element: HTMLElement | null, documentTitle: string = 'IRMS_Document') {
  if (!element) {
    console.warn('printElement: element is null or undefined');
    window.print();
    return;
  }

  try {
    // 1. Ensure or create a dedicated direct-print portal at document.body level
    let portal = document.getElementById('irms-direct-print-portal');
    if (!portal) {
      portal = document.createElement('div');
      portal.id = 'irms-direct-print-portal';
      portal.className = 'print-area';
      document.body.appendChild(portal);
    }

    // 2. Clone the inner HTML into the portal
    portal.innerHTML = element.innerHTML;

    // 3. Mark body as printing active
    document.body.classList.add('irms-printing-active');
    const prevTitle = document.title;
    document.title = documentTitle;

    // 4. Cleanup function after print completes or cancels
    const cleanup = () => {
      document.body.classList.remove('irms-printing-active');
      if (portal) {
        portal.innerHTML = '';
      }
      document.title = prevTitle;
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);

    // 5. Focus and trigger browser printing directly
    window.focus();
    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.warn('Direct window.print() exception, trying iframe fallback:', err);
        fallbackIframePrint(element.innerHTML, documentTitle);
      }
      // Safety auto-cleanup after 4 seconds if afterprint doesn't fire
      setTimeout(cleanup, 4000);
    }, 100);

  } catch (err) {
    console.error('printElement failed, invoking native print fallback:', err);
    window.print();
  }
}

/**
 * Secondary iframe fallback for isolated environments
 */
function fallbackIframePrint(htmlContent: string, documentTitle: string) {
  try {
    let iframe = document.getElementById('irms-isolated-print-frame') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'irms-isolated-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '1000px';
      iframe.style.height = '1000px';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      window.print();
      return;
    }

    const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>${documentTitle}</title>
          ${styleTags}
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            html, body { background: #fff !important; color: #0f172a !important; margin: 0; padding: 0; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            table, tr, td, th { page-break-inside: avoid !important; break-inside: avoid !important; }
          </style>
        </head>
        <body>
          <div style="width: 100%; max-width: 210mm; margin: 0 auto;">
            ${htmlContent}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        window.print();
      }
    }, 300);
  } catch (e) {
    window.print();
  }
}
