/**
 * TOConline API Integration
 * Docs: https://api-docs.toconline.pt
 * Auth: OAuth 2.0 Bearer Token
 * Base: {API_URL}/api/v1/
 *
 * Flow:
 *   Stripe payment confirmed
 *     → emitir Fatura-Recibo (FR) no TOConline
 *     → guardar tocDocId no pagamento
 *     → download PDF para o aluno
 */

export interface TocConfig {
  apiUrl: string;         // e.g. https://app.toconline.pt
  oauthUrl: string;       // e.g. https://app.toconline.pt
  clientId: string;       // OAUTH_CLIENT_ID from TOConline
  clientSecret: string;   // OAUTH_CLIENT_SECRET
  accessToken?: string;   // cached after login
}

export interface TocInvoiceLine {
  item_type: 'Service' | 'Product';
  item_code?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_percentage: number;    // 23 for IVA normal PT
  tax_country_region: string; // "PT"
}

export interface TocInvoicePayload {
  document_type: 'FT' | 'FS' | 'FR';
  customer_business_name: string;
  customer_tax_registration_number?: string;
  customer_address_detail?: string;
  customer_postcode?: string;
  customer_city?: string;
  customer_country?: string;
  payment_mechanism?: 'MO' | 'CC' | 'TB' | 'OU'; // MO=dinheiro, CC=cartão, TB=transferência
  external_reference?: string;
  notes?: string;
  lines: TocInvoiceLine[];
}

export interface TocInvoiceResult {
  id: string;
  document_number: string;
  gross_total: number;
  pdf_url?: string;
  status: 'success' | 'error';
  error?: string;
}

// ─── Mock API for demo (real calls would hit TOConline) ──────────────────────

let mockDocCounter = 1000;

function generateMockFR(payload: TocInvoicePayload): TocInvoiceResult {
  const num = ++mockDocCounter;
  const total = payload.lines.reduce((s, l) => s + l.unit_price * l.quantity * (1 + l.tax_percentage / 100), 0);
  return {
    id: `toc_doc_${num}`,
    document_number: `FR 2025/${num}`,
    gross_total: Math.round(total * 100) / 100,
    pdf_url: `https://integration.toconline.pt/public-file/mock_${num}.pdf`,
    status: 'success',
  };
}

/**
 * Emite uma Fatura-Recibo (FR) no TOConline.
 * Em produção, faz POST /api/v1/commercial_sales_documents com Bearer token.
 */
export async function emitirFatura(
  config: TocConfig,
  payload: TocInvoicePayload,
  simulate = true
): Promise<TocInvoiceResult> {
  if (simulate) {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 900));
    return generateMockFR(payload);
  }

  // ── REAL CALL ──────────────────────────────────────────────────────────────
  const res = await fetch(`${config.apiUrl}/api/v1/commercial_sales_documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${config.accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    return { id: '', document_number: '', gross_total: 0, status: 'error', error: err };
  }

  const data = await res.json();
  const doc = data?.data?.attributes || data;

  return {
    id: String(data?.data?.id || ''),
    document_number: doc.number || doc.document_number || '',
    gross_total: doc.gross_total || 0,
    status: 'success',
  };
}

/**
 * Obtém URL de download do PDF da fatura
 */
export async function getPdfUrl(config: TocConfig, docId: string, simulate = true): Promise<string> {
  if (simulate) {
    await new Promise(r => setTimeout(r, 400));
    return `https://integration.toconline.pt/public-file/mock_${docId}.pdf`;
  }

  const res = await fetch(`${config.apiUrl}/api/url_for_print/${docId}?filter[type]=Document&filter[copies]=1`, {
    headers: { 'Authorization': `Bearer ${config.accessToken}` },
  });
  const data = await res.json();
  const u = data?.data?.attributes?.url;
  return u ? `${u.scheme}://${u.host}${u.path}` : '';
}

/**
 * Autentica com OAuth simplificado (client_credentials)
 */
export async function autenticar(config: TocConfig): Promise<string> {
  const creds = btoa(`${config.clientId}:${config.clientSecret}`);
  const res = await fetch(`${config.oauthUrl}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'Authorization': `Basic ${creds}`,
    },
    body: 'grant_type=client_credentials&scope=commercial',
  });
  const data = await res.json();
  return data.access_token || '';
}

/**
 * Constrói payload FR para mensalidade de academia
 */
export function buildMensalidadePayload(
  alunoNome: string,
  plano: string,
  valor: number,
  nif?: string,
  stripeRef?: string,
): TocInvoicePayload {
  const valorSemIVA = Math.round((valor / 1.23) * 100) / 100;
  return {
    document_type: 'FR',
    customer_business_name: alunoNome,
    customer_tax_registration_number: nif,
    customer_country: 'PT',
    payment_mechanism: 'CC',
    external_reference: stripeRef,
    notes: `Mensalidade Gracie Barra Braga — ${plano}`,
    lines: [
      {
        item_type: 'Service',
        item_code: 'GB-MENSALIDADE',
        description: `Mensalidade Jiu-Jitsu — ${plano}`,
        quantity: 1,
        unit_price: valorSemIVA,
        tax_percentage: 23,
        tax_country_region: 'PT',
      },
    ],
  };
}
