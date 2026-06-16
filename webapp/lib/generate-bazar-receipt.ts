import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BazarSaleResponse } from '@/shared/types/bazar-sale-response';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatCpf(cpf: string): string {
  const d = cpf.replace(/\D/g, '');
  return d.length === 11 ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : cpf;
}

function pad(n: number, len = 6) {
  return String(n).padStart(len, '0');
}

export function generateBazarReceipt(sale: BazarSaleResponse) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const ML = 20;   // margin left
  const MR = 20;   // margin right
  const PW = 210;
  const CW = PW - ML - MR;   // 170mm
  let y = 20;

  /* ── outer border ──────────────────────────────────────────────── */
  doc.setDrawColor(0);
  doc.setLineWidth(0.6);
  doc.rect(ML, y, CW, 254);

  /* ── institution header ────────────────────────────────────────── */
  // inner top double-line look: thick border at bottom of header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(0);
  doc.text('CARITAS', PW / 2, y + 12, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(sale.parish.name, PW / 2, y + 18, { align: 'center' });

  y += 24;
  doc.setLineWidth(0.6);
  doc.line(ML, y, ML + CW, y);   // separator

  /* ── document title ────────────────────────────────────────────── */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('RECIBO DE VENDA — BAZAR / BRECHÓ', PW / 2, y + 9, { align: 'center' });

  y += 15;
  doc.setLineWidth(0.3);
  doc.line(ML, y, ML + CW, y);   // separator

  /* ── receipt number + date row ─────────────────────────────────── */
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`Nº ${pad(sale.id)}`, ML + 4, y);

  doc.setFont('helvetica', 'normal');
  doc.text(`Data de emissão: ${formatDateTime(new Date().toISOString())}`, ML + CW - 4, y, { align: 'right' });

  y += 4;
  doc.setLineWidth(0.3);
  doc.line(ML, y, ML + CW, y);

  /* ── buyer section ─────────────────────────────────────────────── */
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(80);
  doc.text('DADOS DO COMPRADOR', ML + 4, y);
  doc.setTextColor(0);

  y += 4;

  // row 1
  labelValue(doc, 'Nome do Comprador', sale.buyerName, ML + 4, y, 100);
  labelValue(doc, 'CPF', formatCpf(sale.buyerCpf), ML + 108, y, 58);

  y += 10;

  // row 2
  labelValue(doc, 'Data da Venda', formatDateTime(sale.soldAt), ML + 4, y, 100);
  labelValue(doc, 'Paróquia', sale.parish.name, ML + 108, y, 58);

  y += 10;
  doc.setLineWidth(0.3);
  doc.line(ML, y, ML + CW, y);

  /* ── items table ───────────────────────────────────────────────── */
  y += 0.1;

  autoTable(doc, {
    startY: y,
    margin: { left: ML, right: MR },
    tableWidth: CW,
    head: [['Nº', 'DESCRIÇÃO DO PRODUTO', 'QTD.', 'PREÇO UNITÁRIO', 'TOTAL']],
    body: sale.items.map((item, i) => [
      pad(i + 1, 2),
      item.productName,
      String(item.quantity),
      BRL.format(item.unitPrice),
      BRL.format(item.subtotal),
    ]),
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 8,
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontSize: 9.5,
      lineColor: [180, 180, 180],
      lineWidth: 0.2,
      cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { cellWidth: 'auto' },
      2: { halign: 'center', cellWidth: 18 },
      3: { halign: 'right', cellWidth: 34 },
      4: { halign: 'right', fontStyle: 'bold', cellWidth: 34 },
    },
    tableLineColor: [0, 0, 0],
    tableLineWidth: 0.3,
    showHead: 'firstPage',
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  /* ── total row ─────────────────────────────────────────────────── */
  const totalRowH = 10;
  doc.setLineWidth(0.3);
  doc.line(ML, y, ML + CW, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('VALOR TOTAL', ML + CW - 38, y + 6.5, { align: 'right' });

  doc.setFontSize(11);
  doc.text(BRL.format(sale.total), ML + CW - 4, y + 6.5, { align: 'right' });

  y += totalRowH;
  doc.setLineWidth(0.6);
  doc.line(ML, y, ML + CW, y);

  /* ── extenso row ───────────────────────────────────────────────── */
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60);
  doc.text(
    `Valor por extenso: ${valorPorExtenso(sale.total)}`,
    ML + 4, y
  );
  doc.setTextColor(0);

  y += 5;
  doc.setLineWidth(0.3);
  doc.line(ML, y, ML + CW, y);

  /* ── declaration ───────────────────────────────────────────────── */
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const declaration = `Declaro para os devidos fins que recebi a(s) ${sale.items.length} peça(s) descrita(s) acima, ` +
    `adquirida(s) no Bazar/Brechó da ${sale.parish.name}, pelo valor total de ${BRL.format(sale.total)}, ` +
    `conforme identificado neste recibo.`;
  const lines = doc.splitTextToSize(declaration, CW - 8);
  doc.text(lines, ML + 4, y);

  y += lines.length * 5 + 6;
  doc.setLineWidth(0.3);
  doc.line(ML, y, ML + CW, y);

  /* ── signature area ────────────────────────────────────────────── */
  y += 16;

  const sigW = 60;
  const sig1x = ML + 10;
  const sig2x = ML + CW - sigW - 10;

  doc.setLineWidth(0.4);
  doc.line(sig1x, y, sig1x + sigW, y);
  doc.line(sig2x, y, sig2x + sigW, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60);
  doc.text('Assinatura do Responsável', sig1x + sigW / 2, y + 4, { align: 'center' });
  doc.text('Assinatura do Comprador', sig2x + sigW / 2, y + 4, { align: 'center' });
  doc.text('CARITAS — ' + sale.parish.name, sig1x + sigW / 2, y + 8, { align: 'center' });
  doc.text(sale.buyerName, sig2x + sigW / 2, y + 8, { align: 'center' });
  doc.setTextColor(0);

  y += 18;
  doc.setLineWidth(0.6);
  doc.line(ML, y, ML + CW, y); // bottom of outer box

  /* ── footer ────────────────────────────────────────────────────── */
  y += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(120);
  doc.text(
    'Este documento não possui valor fiscal. Emitido exclusivamente para fins de controle interno da Caritas.',
    PW / 2, y, { align: 'center' }
  );

  doc.save(`recibo-venda-${pad(sale.id)}.pdf`);
}

/* ─── Helpers ────────────────────────────────────────────────────── */

function labelValue(doc: jsPDF, label: string, value: string, x: number, y: number, maxW: number) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(80);
  doc.text(label.toUpperCase(), x, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(0);
  const truncated = doc.splitTextToSize(value, maxW)[0] as string;
  doc.text(truncated, x, y + 5);
}

/* very simple extenso for BRL values (covers common range) */
function valorPorExtenso(value: number): string {
  const reais = Math.floor(value);
  const centavos = Math.round((value - reais) * 100);

  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
    'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas  = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos',
    'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  function grupo(n: number): string {
    if (n === 0) return '';
    if (n === 100) return 'cem';
    const parts: string[] = [];
    const c = Math.floor(n / 100);
    const r = n % 100;
    if (c) parts.push(centenas[c]);
    if (r < 20) {
      if (r) parts.push(unidades[r]);
    } else {
      const d = Math.floor(r / 10);
      const u = r % 10;
      parts.push(dezenas[d]);
      if (u) parts.push(unidades[u]);
    }
    return parts.join(' e ');
  }

  function numero(n: number): string {
    if (n === 0) return 'zero';
    const parts: string[] = [];
    const mil = Math.floor(n / 1000);
    const rem = n % 1000;
    if (mil) parts.push(mil === 1 ? 'mil' : `${grupo(mil)} mil`);
    if (rem) parts.push(grupo(rem));
    return parts.join(' e ');
  }

  const rStr = `${numero(reais)} ${reais === 1 ? 'real' : 'reais'}`;
  if (centavos === 0) return rStr;
  const cStr = `${numero(centavos)} ${centavos === 1 ? 'centavo' : 'centavos'}`;
  return `${rStr} e ${cStr}`;
}
