import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Universal Print & PDF Engine
 * 
 * Works 100% reliably in embedded sandbox iframes, browsers with blocked print dialogs,
 * mobile devices, and desktop environments.
 */

/**
 * Opens a dedicated, beautifully formatted clean print window and immediately triggers the print dialog.
 */
export function openPrintWindow(elementId: string, documentTitle: string = 'Document'): boolean {
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) {
    window.print();
    return false;
  }

  // Clone node and clean screen-only controls
  const clone = sourceEl.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.print\\:hidden, button, select, input').forEach((el) => el.remove());

  // Open a clean dedicated pop-up print window
  const printWindow = window.open('', '_blank', 'width=920,height=850,top=40,left=60,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes');
  
  if (!printWindow) {
    // If pop-ups are blocked, fallback to iframe print / inline print
    window.print();
    return false;
  }

  const printStyles = `
    @page {
      size: letter portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #111827;
      background: #f8fafc;
      padding: 20px;
      margin: 0;
    }
    .print-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: #0f172a;
      color: #f8fafc;
      padding: 12px 18px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 20px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.18);
    }
    .print-btn {
      background: #10b981;
      color: #022c22;
      font-weight: 700;
      font-size: 13px;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;
    }
    .print-btn:hover {
      background: #34d399;
      transform: scale(1.02);
    }
    .close-btn {
      background: #334155;
      color: #f8fafc;
      font-weight: 600;
      font-size: 13px;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
    }
    .close-btn:hover {
      background: #475569;
    }
    .sheet-wrapper {
      background: #ffffff;
      padding: 24px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    h1 {
      font-size: 20px;
      font-weight: 800;
      color: #000000;
      letter-spacing: -0.02em;
      margin: 0 0 4px 0;
    }
    h2 {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1.5px solid #111827;
      padding-bottom: 4px;
      margin-top: 16px;
      margin-bottom: 8px;
      color: #000000;
    }
    h3 {
      font-size: 13px;
      font-weight: 700;
      color: #000000;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 16px 0;
      font-size: 10.5px;
      page-break-inside: avoid;
    }
    th {
      background-color: #f1f5f9 !important;
      color: #0f172a !important;
      font-weight: 700 !important;
      text-align: left;
      padding: 6px 8px;
      border-bottom: 1.5px solid #94a3b8;
      border-top: 1px solid #e2e8f0;
    }
    td {
      padding: 5px 8px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
    }
    .text-right { text-align: right !important; }
    .text-left { text-align: left !important; }
    .text-center { text-align: center !important; }
    .grid { display: grid !important; }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
    .gap-2 { gap: 8px !important; }
    .gap-3 { gap: 12px !important; }
    .gap-4 { gap: 16px !important; }
    .p-3 { padding: 10px !important; }
    .p-4 { padding: 12px !important; }
    .p-5 { padding: 16px !important; }
    .p-6 { padding: 18px !important; }
    .rounded-xl, .rounded-2xl, .rounded-lg, .rounded { border-radius: 6px !important; }
    .border { border: 1px solid #cbd5e1 !important; }
    .border-b { border-bottom: 1px solid #e2e8f0 !important; }
    .border-t { border-top: 1px solid #e2e8f0 !important; }
    
    .bg-white, .bg-\\[\\#10141C\\], .bg-\\[\\#0E121A\\], .bg-\\[\\#11141B\\], .bg-\\[\\#141822\\], .bg-\\[\\#161A23\\] {
      background-color: #f8fafc !important;
      border: 1px solid #e2e8f0 !important;
    }
    .bg-emerald-500\\/10 {
      background-color: #ecfdf5 !important;
      border: 1px solid #a7f3d0 !important;
    }
    .text-emerald-400, .text-emerald-500, .text-emerald-700 { color: #065f46 !important; font-weight: 700; }
    .text-rose-400, .text-rose-500, .text-rose-700 { color: #991b1b !important; font-weight: 700; }
    .text-blue-400, .text-blue-500, .text-blue-700 { color: #1e40af !important; font-weight: 700; }
    .text-slate-200, .text-slate-300, .text-slate-400, .text-white { color: #0f172a !important; }
    .text-slate-500, .text-slate-600 { color: #475569 !important; }
    
    @media print {
      .print-toolbar { display: none !important; }
      body { padding: 0 !important; background: #ffffff !important; }
      .sheet-wrapper { border: none !important; box-shadow: none !important; padding: 0 !important; }
    }
  `;

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>${documentTitle}</title>
      <style>${printStyles}</style>
    </head>
    <body>
      <div class="print-toolbar">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: 700; font-size: 14px;">🖨️ Print Preview</span>
          <span style="font-size: 12px; color: #94a3b8;">${documentTitle}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button class="print-btn" onclick="window.print()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Print / Save as PDF
          </button>
          <button class="close-btn" onclick="window.close()">Close</button>
        </div>
      </div>
      <div class="sheet-wrapper" id="print-content">
        ${clone.innerHTML}
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.focus();
            window.print();
          }, 350);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
  return true;
}

/**
 * Generates and downloads a real, crisp .pdf file directly using html2canvas & jsPDF.
 */
export async function downloadPdfDocument(
  elementId: string,
  filename: string = 'document.pdf',
  documentTitle: string = 'Statement'
): Promise<boolean> {
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) {
    console.error(`Element #${elementId} not found for PDF export.`);
    return false;
  }

  // Create an offscreen, pristine print-styled container to capture
  const clone = sourceEl.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.print\\:hidden, button, select, input').forEach((el) => el.remove());

  const captureContainer = document.createElement('div');
  captureContainer.style.position = 'fixed';
  captureContainer.style.left = '-9999px';
  captureContainer.style.top = '0';
  captureContainer.style.width = '800px';
  captureContainer.style.padding = '24px';
  captureContainer.style.background = '#ffffff';
  captureContainer.style.color = '#111827';
  captureContainer.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  captureContainer.style.fontSize = '12px';
  captureContainer.style.lineHeight = '1.4';

  clone.style.background = '#ffffff';
  clone.style.color = '#111827';
  clone.style.border = 'none';
  clone.style.boxShadow = 'none';

  const allNodes = clone.querySelectorAll('*');
  allNodes.forEach((node) => {
    const el = node as HTMLElement;
    const computed = window.getComputedStyle(el);

    if (
      computed.color.includes('255, 255, 255') ||
      computed.color.includes('226, 232, 240') ||
      computed.color.includes('203, 213, 225') ||
      computed.color.includes('148, 163, 184')
    ) {
      el.style.color = '#1f2937';
    }

    if (
      computed.backgroundColor.includes('16, 20, 28') ||
      computed.backgroundColor.includes('14, 18, 26') ||
      computed.backgroundColor.includes('17, 20, 27') ||
      computed.backgroundColor.includes('20, 24, 34') ||
      computed.backgroundColor.includes('22, 26, 35')
    ) {
      el.style.backgroundColor = '#f9fafb';
      el.style.borderColor = '#e5e7eb';
    }
  });

  captureContainer.appendChild(clone);
  document.body.appendChild(captureContainer);

  try {
    const canvas = await html2canvas(captureContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 800,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 20;

    pdf.addImage(imgData, 'JPEG', 20, position, imgWidth, imgHeight);
    heightLeft -= (pdfHeight - 40);

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 20;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 20, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 40);
    }

    const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(safeFilename);
    return true;
  } catch (error) {
    console.error('Failed to generate PDF via html2canvas:', error);
    downloadHtmlDocument(elementId, filename.replace('.pdf', '.html'), documentTitle);
    return false;
  } finally {
    if (document.body.contains(captureContainer)) {
      document.body.removeChild(captureContainer);
    }
  }
}

/**
 * Downloads a standalone printable HTML file.
 */
export function downloadHtmlDocument(
  elementId: string,
  filename: string = 'document.html',
  documentTitle: string = 'Statement'
): void {
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) return;

  const clone = sourceEl.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.print\\:hidden, button, select, input').forEach((el) => el.remove());

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${documentTitle}</title>
  <style>
    @page { size: letter portrait; margin: 15mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; line-height: 1.5; color: #111827; background: #ffffff; margin: 0; padding: 20px; }
    h1 { font-size: 20px; font-weight: 800; color: #000; margin-bottom: 4px; }
    h2 { font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #111827; padding-bottom: 4px; margin: 16px 0 8px 0; }
    h3 { font-size: 13px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0 16px 0; }
    th { background-color: #f3f4f6; color: #111827; font-weight: 700; text-align: left; padding: 6px 8px; border-bottom: 2px solid #9ca3af; }
    td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; color: #1f2937; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
    .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
    .gap-3 { gap: 12px; }
    .gap-4 { gap: 16px; }
    .p-3 { padding: 10px; }
    .p-4 { padding: 14px; }
    .border { border: 1px solid #d1d5db; }
    .rounded-xl, .rounded-2xl { border-radius: 6px; }
    .bg-white, .bg-\\[\\#10141C\\], .bg-\\[\\#0E121A\\], .bg-\\[\\#11141B\\], .bg-\\[\\#141822\\] { background-color: #f9fafb !important; border: 1px solid #e5e7eb !important; }
    .bg-emerald-500\\/10 { background-color: #ecfdf5 !important; border: 1px solid #a7f3d0 !important; }
    .text-emerald-400, .text-emerald-500 { color: #065f46 !important; font-weight: 700; }
    .text-rose-400, .text-rose-500 { color: #991b1b !important; font-weight: 700; }
    .text-blue-400, .text-blue-500 { color: #1e40af !important; font-weight: 700; }
    .print-bar { background: #1e293b; color: #fff; padding: 12px; text-align: center; margin-bottom: 20px; border-radius: 8px; }
    .print-btn { background: #10b981; color: #000; font-weight: bold; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; margin: 0 6px; }
    @media print { .print-bar { display: none !important; } body { padding: 0 !important; } }
  </style>
</head>
<body>
  <div class="print-bar">
    <button class="print-btn" onclick="window.print()">🖨️ Click to Print / Save as PDF</button>
  </div>
  ${clone.innerHTML}
</body>
</html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.html') ? filename : `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Universal print handler that opens a print window.
 */
export function printElement(elementId: string, documentTitle: string = 'Document'): void {
  openPrintWindow(elementId, documentTitle);
}
