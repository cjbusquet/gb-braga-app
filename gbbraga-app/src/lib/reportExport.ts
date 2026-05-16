/**
 * Real PDF & CSV export using jsPDF + browser APIs
 * No server required — runs 100% in the browser
 */
import jsPDF from 'jspdf';

interface ReportData {
  titulo: string;
  subtitulo?: string;
  periodo: string;
  rows: { label: string; value: string | number; sub?: string }[];
  tabela?: { headers: string[]; rows: (string | number)[][] };
}

// ─── PDF Export ─────────────────────────────────────────────────────────────
export function exportPDF(data: ReportData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, M = 18;

  // Header bar
  doc.setFillColor(200, 16, 46);
  doc.rect(0, 0, W, 28, 'F');

  // Logo area (white text)
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('GRACIE BARRA', M, 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('BRAGA, PORTUGAL  ·  Brazilian Jiu-Jitsu', M, 19);

  // Date top right
  doc.setFontSize(8);
  doc.text(new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }), W - M, 19, { align: 'right' });

  // Title
  doc.setTextColor(17, 17, 17);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(data.titulo.toUpperCase(), M, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(92, 91, 102);
  doc.text(`Período: ${data.periodo}`, M, 50);
  if (data.subtitulo) doc.text(data.subtitulo, M, 56);

  // Divider
  doc.setDrawColor(226, 224, 219);
  doc.setLineWidth(0.4);
  doc.line(M, 60, W - M, 60);

  let y = 70;

  // KPI grid (2 columns)
  const COL = (W - M * 2 - 8) / 2;
  data.rows.forEach((row, i) => {
    const x = M + (i % 2 === 0 ? 0 : COL + 8);
    if (i % 2 === 0 && i > 0) y += 24;

    // Card background
    doc.setFillColor(247, 246, 244);
    doc.roundedRect(x, y - 5, COL, 20, 2, 2, 'F');
    doc.setDrawColor(226, 224, 219);
    doc.roundedRect(x, y - 5, COL, 20, 2, 2, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(152, 150, 164);
    doc.text(row.label.toUpperCase(), x + 5, y + 1);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(17, 17, 17);
    doc.text(String(row.value), x + 5, y + 10);

    if (row.sub) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(152, 150, 164);
      doc.text(row.sub, x + 5, y + 15.5);
    }
  });

  y += 32;

  // Table
  if (data.tabela) {
    doc.setDrawColor(226, 224, 219);
    doc.line(M, y, W - M, y);
    y += 8;

    // Table header
    doc.setFillColor(240, 239, 236);
    doc.rect(M, y - 4, W - M * 2, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(92, 91, 102);
    const colW = (W - M * 2) / data.tabela.headers.length;
    data.tabela.headers.forEach((h, i) => doc.text(h.toUpperCase(), M + i * colW + 2, y + 1));
    y += 10;

    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(17, 17, 17);
    data.tabela.rows.forEach((row, ri) => {
      if (ri % 2 === 1) {
        doc.setFillColor(250, 249, 247);
        doc.rect(M, y - 4, W - M * 2, 7, 'F');
      }
      row.forEach((cell, ci) => {
        doc.text(String(cell), M + ci * colW + 2, y);
      });
      y += 8;
      if (y > 270) { doc.addPage(); y = 20; }
    });
  }

  // Footer
  doc.setFillColor(17, 17, 17);
  doc.rect(0, 287, W, 10, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('Gracie Barra Braga · Gerado automaticamente pelo sistema de gestão · TOConline certificado AT', M, 293);
  doc.text(`Pág. 1`, W - M, 293, { align: 'right' });

  doc.save(`GB_${data.titulo.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ─── CSV Export ──────────────────────────────────────────────────────────────
export function exportCSV(headers: string[], rows: (string | number)[][], filename: string) {
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel
  const csv = BOM + [headers, ...rows].map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')
  ).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Predefined report builders ──────────────────────────────────────────────
export function exportRelatorioFinanceiro(pagamentos: { alunoNome: string; valor: number; status: string; vencimento: string; plano: string }[]) {
  const total = pagamentos.reduce((s, p) => s + p.valor, 0);
  const pago = pagamentos.filter(p => p.status === 'pago').reduce((s, p) => s + p.valor, 0);
  const pendente = pagamentos.filter(p => p.status === 'pendente').reduce((s, p) => s + p.valor, 0);
  const vencido = pagamentos.filter(p => p.status === 'vencido').reduce((s, p) => s + p.valor, 0);

  exportPDF({
    titulo: 'Relatório Financeiro',
    periodo: new Date().toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }),
    rows: [
      { label: 'Total Faturado',   value: `€${total}`,    sub: `${pagamentos.length} cobranças` },
      { label: 'Recebido',         value: `€${pago}`,     sub: `${pagamentos.filter(p => p.status==='pago').length} pagamentos` },
      { label: 'Pendente',         value: `€${pendente}`, sub: `${pagamentos.filter(p => p.status==='pendente').length} a receber` },
      { label: 'Vencido',          value: `€${vencido}`,  sub: `${pagamentos.filter(p => p.status==='vencido').length} em atraso` },
      { label: 'Taxa Recebimento', value: `${Math.round((pago/total)*100)||0}%`, sub: 'Meta: ≥ 95%' },
      { label: 'Taxa Inadimplência', value: `${Math.round((vencido/total)*100)||0}%`, sub: 'Meta: < 5%' },
    ],
    tabela: {
      headers: ['Aluno', 'Plano', 'Valor', 'Vencimento', 'Estado'],
      rows: pagamentos.map(p => [p.alunoNome, p.plano, `€${p.valor}`, p.vencimento, p.status.toUpperCase()]),
    },
  });
}

export function exportRelatorioAlunos(alunos: { nome: string; faixa: string; plano: string; frequencia: number; status: string; dataMatricula: string }[]) {
  exportPDF({
    titulo: 'Relatório de Alunos',
    periodo: new Date().toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }),
    rows: [
      { label: 'Total Matriculados', value: alunos.length },
      { label: 'Ativos', value: alunos.filter(a => a.status === 'ativo').length },
      { label: 'Inativos', value: alunos.filter(a => a.status !== 'ativo').length },
      { label: 'Freq. Média', value: `${Math.round(alunos.reduce((s,a) => s+a.frequencia,0)/alunos.length)}%` },
    ],
    tabela: {
      headers: ['Nome', 'Faixa', 'Plano', 'Frequência', 'Estado'],
      rows: alunos.map(a => [a.nome, a.faixa, a.plano, `${a.frequencia}%`, a.status]),
    },
  });
}
