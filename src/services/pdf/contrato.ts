/**
 * Enrollment contract PDF rendering, using jsPDF. Runs entirely client-side.
 */
import jsPDF from 'jspdf';

export interface ContratoPdfParams {
  alunoNome: string;
  alunoNif?: string;
  plano: string;
  valor: number;
  dataAssinatura: string;
  dataInicio?: string;
  assinaturaImg?: string | null;
}

export function exportContratoPDF(params: ContratoPdfParams): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, M = 18;

  // ── Header ──────────────────────────────────────────────────────────────
  doc.setFillColor(200, 16, 46);
  doc.rect(0, 0, W, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('GRACIE BARRA', M, 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('BRAGA, PORTUGAL  ·  Brazilian Jiu-Jitsu', M, 19);
  doc.text('Rua Nova de Santa Cruz, 11 – 4710-409 Braga', W - M, 12, { align: 'right' });
  doc.text('NIF 518948471', W - M, 19, { align: 'right' });

  // ── Title ────────────────────────────────────────────────────────────────
  doc.setTextColor(17, 17, 17);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('CONTRATO DE ADESÃO', M, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(`Data: ${params.dataAssinatura}`, W - M, 42, { align: 'right' });

  doc.setDrawColor(226, 224, 219);
  doc.setLineWidth(0.4);
  doc.line(M, 47, W - M, 47);

  let y = 56;

  const section = (title: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(200, 16, 46);
    doc.text(title.toUpperCase(), M, y);
    y += 5;
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
  };

  const paragraph = (text: string) => {
    const lines = doc.splitTextToSize(text, W - M * 2);
    doc.text(lines, M, y);
    y += lines.length * 5.2 + 4;
  };

  // ── Parties ──────────────────────────────────────────────────────────────
  section('Partes');
  paragraph(
    `Tribo Laurada Lda. (NIF 518948471), proprietária da escola de Jiu-Jitsu Gracie Barra Braga, ` +
    `com sede na Rua Nova de Santa Cruz, 11 – 4710-409 Braga (doravante "Academia");`
  );
  paragraph(
    `E o(a) aluno(a) ${params.alunoNome}${params.alunoNif ? ` (NIF ${params.alunoNif})` : ''} (doravante "Aluno").`
  );

  // ── Object ───────────────────────────────────────────────────────────────
  section('Objeto');
  paragraph(
    `O presente contrato regula a prestação de serviços de ensino de Brazilian Jiu-Jitsu pela ` +
    `Academia ao Aluno, no âmbito do plano ${params.plano}, com mensalidade de €${params.valor}/mês.`
  );

  // ── Obligations ──────────────────────────────────────────────────────────
  section('Obrigações do Aluno');
  const obligations = [
    'Efetuar o pagamento da mensalidade até ao dia 5 de cada mês.',
    'Utilizar o uniforme oficial da Gracie Barra durante os treinos.',
    'Cumprir o regulamento interno da escola e as normas de higiene e segurança.',
    'Declarar estar fisicamente apto para a prática do Jiu-Jitsu e informar de qualquer limitação.',
    'Respeitar professores, colegas e as instalações da Academia.',
  ];
  obligations.forEach(o => {
    doc.text('•', M, y);
    const lines = doc.splitTextToSize(o, W - M * 2 - 5);
    doc.text(lines, M + 5, y);
    y += lines.length * 5.2 + 2;
  });
  y += 2;

  // ── Duration ─────────────────────────────────────────────────────────────
  section('Vigência');
  paragraph(
    `O contrato entra em vigor na data da assinatura${params.dataInicio ? ` (${params.dataInicio})` : ''} ` +
    `e mantém-se válido enquanto o Aluno frequentar a escola e cumprir as obrigações estabelecidas. ` +
    `O cancelamento pode ser solicitado com 30 dias de antecedência.`
  );

  // ── RGPD ────────────────────────────────────────────────────────────────
  section('Proteção de Dados (RGPD)');
  paragraph(
    `Os dados pessoais do Aluno são tratados pela Academia exclusivamente para fins de gestão da ` +
    `frequência, faturação e comunicação interna, em conformidade com o Regulamento (UE) 2016/679. ` +
    `O Aluno pode exercer os seus direitos de acesso, retificação e apagamento junto da Academia.`
  );

  // ── Signature ────────────────────────────────────────────────────────────
  const sigY = y + 4;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(M, sigY + 30, M + 74, sigY + 30);
  doc.line(W - M - 74, sigY + 30, W - M, sigY + 30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Pela Academia (Tribo Laurada Lda.)', M, sigY + 35);
  doc.text(`Aluno: ${params.alunoNome}`, W - M - 74, sigY + 35);
  doc.text(`Data: ${params.dataAssinatura}`, W - M - 74, sigY + 40);

  if (params.assinaturaImg) {
    try {
      doc.addImage(params.assinaturaImg, 'PNG', W - M - 74, sigY + 4, 74, 22);
    } catch {
      // ignore if image is invalid
    }
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  doc.setFillColor(17, 17, 17);
  doc.rect(0, 287, W, 10, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('Gracie Barra Braga · Tribo Laurada Lda. · NIF 518948471 · Rua Nova de Santa Cruz, 11 – 4710-409 Braga', M, 293);
  doc.text('Documento gerado automaticamente', W - M, 293, { align: 'right' });

  const safeName = params.alunoNome.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  const filename = `Contrato_GB_${safeName}_${params.dataAssinatura.replace(/\//g, '-')}.pdf`;
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
