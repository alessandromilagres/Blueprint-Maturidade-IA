import nodemailer from 'nodemailer';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { montarHtmlConviteAvaliacaoAsync, montarAssuntoConviteAsync, getHtmlBlocoMencaoDesejosIaConvite } from './emailConviteTemplate.js';

// ============================================
// CONFIGURAÇÃO MULTI-PROVIDER
// EMAIL_PROVIDER: 'graph' (Microsoft Graph) ou 'smtp' (SMTP tradicional)
// ============================================
const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || 'smtp').toLowerCase();

const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
};

const GRAPH_CONFIG = {
  tenantId: process.env.AZURE_TENANT_ID || '',
  clientId: process.env.AZURE_CLIENT_ID || '',
  clientSecret: process.env.AZURE_CLIENT_SECRET || '',
  senderAddress: process.env.MAIL_SENDER_ADDRESS || ''
};

const transporter = nodemailer.createTransport(SMTP_CONFIG);

// URL base usada nos links dos e-mails. Por padrão usa o domínio oficial da
// aplicação (agentica.sysmap.com.br) para que o certificado SSL funcione e o
// link não exponha IPs. Em desenvolvimento, defina BASE_URL no .env (ex.:
// BASE_URL=http://localhost:5173).
const BASE_URL = process.env.BASE_URL || 'https://agentica.sysmap.com.br';

// Cache do token OAuth2 (evita pedir um novo a cada email)
let tokenCache = { value: null, expiresAt: 0 };

export function gerarTokenConvite() {
  return crypto.randomBytes(32).toString('hex');
}

// ============================================
// MICROSOFT GRAPH - OAuth2 Token
// ============================================
async function obterTokenGraph() {
  // Reutiliza token se ainda válido (com margem de 60s)
  if (tokenCache.value && Date.now() < tokenCache.expiresAt - 60000) {
    return tokenCache.value;
  }

  const url = `https://login.microsoftonline.com/${GRAPH_CONFIG.tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: GRAPH_CONFIG.clientId,
    client_secret: GRAPH_CONFIG.clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao obter token Graph (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  tokenCache = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000)
  };

  return tokenCache.value;
}

// ============================================
// MICROSOFT GRAPH - Envio de email
// ============================================
async function enviarEmailViaGraph({ destinatarioEmail, assunto, htmlConteudo }) {
  const token = await obterTokenGraph();
  const sender = GRAPH_CONFIG.senderAddress;

  const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`;

  const payload = {
    message: {
      subject: assunto,
      body: {
        contentType: 'HTML',
        content: htmlConteudo
      },
      toRecipients: [
        { emailAddress: { address: destinatarioEmail } }
      ],
      from: {
        emailAddress: { address: sender }
      }
    },
    saveToSentItems: true
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok && response.status !== 202) {
    const errorText = await response.text();
    throw new Error(`Falha ao enviar email via Graph (${response.status}): ${errorText}`);
  }

  return { success: true, messageId: `graph-${Date.now()}`, provider: 'graph' };
}

// ============================================
// TEMPLATE HTML DO RESULTADO DA AVALIAÇÃO (sem notas — só perguntas e respostas textuais)
// ============================================
function escapeHtmlEmail(text) {
  if (text == null || text === '') return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function gerarHtmlResultadoAvaliacao({
  destinatarioNome,
  empresaNome,
  projetoNome,
  respostas,
  dataConclusao
}) {
  const porArea = new Map();
  (respostas || []).forEach((r) => {
    const area = r.area || 'Outras';
    if (!porArea.has(area)) porArea.set(area, []);
    porArea.get(area).push(r);
  });

  const blocosRespostas = Array.from(porArea.entries())
    .map(([area, lista]) => `
        <div style="margin-top: 18px;">
          <div style="background: #1e293b; color: white; padding: 10px 14px; border-radius: 6px 6px 0 0; font-weight: 600; font-size: 14px;">${escapeHtmlEmail(area)}</div>
          <div style="border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 6px 6px; background: white;">
            ${lista
              .map(
                (r) => `
              <div style="padding: 12px 14px; border-bottom: 1px solid #f1f5f9;">
                <div style="font-size: 13px; color: #1e293b; margin-bottom: 8px; font-weight: 600;">${escapeHtmlEmail(r.pergunta)}</div>
                <div style="font-size: 13px; color: #334155;">
                  <span style="color: #64748b;">Sua resposta:</span>
                  ${escapeHtmlEmail(r.textoResposta || '—')}
                </div>
                ${
                  r.observacoes
                    ? `<div style="font-size: 12px; color: #475569; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e2e8f0;"><span style="color: #64748b;">Comentários:</span> ${escapeHtmlEmail(r.observacoes)}</div>`
                    : ''
                }
              </div>`
              )
              .join('')}
          </div>
        </div>`
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.55; color: #1e293b; }
        .container { max-width: 720px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e2a4a 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .header p { color: #93c5fd; margin: 5px 0 0 0; font-size: 14px; }
        .content { background: #f8fafc; padding: 28px; border: 1px solid #e2e8f0; }
        .footer { background: #1e293b; padding: 18px; text-align: center; border-radius: 0 0 10px 10px; }
        .footer p { color: #94a3b8; margin: 0; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Obrigado pela participação</h1>
          <p>Registro das suas respostas · Blueprint IA</p>
        </div>

        <div class="content">
          <p>Olá <strong>${escapeHtmlEmail(destinatarioNome)}</strong>,</p>
          <p>Sua avaliação de maturidade em IA foi concluída com sucesso. A seguir está o <strong>registro das perguntas e das respostas que você informou</strong>. Notas, scores e níveis de maturidade não são enviados neste e-mail.</p>

          <div style="font-size: 13px; color: #64748b; margin-top: 12px;">
            <strong>Empresa:</strong> ${escapeHtmlEmail(empresaNome)} &nbsp;·&nbsp;
            <strong>Projeto:</strong> ${escapeHtmlEmail(projetoNome)} &nbsp;·&nbsp;
            <strong>Concluída em:</strong> ${escapeHtmlEmail(dataConclusao)}
          </div>

          <h3 style="font-size: 16px; margin: 24px 0 8px;">Perguntas e respostas</h3>
          ${blocosRespostas || '<p style="color: #64748b;">Sem respostas registradas.</p>'}

          <p style="font-size: 12px; color: #64748b; margin-top: 24px; padding-top: 14px; border-top: 1px solid #e2e8f0;">
            O plano de ação detalhado, recomendações estratégicas e relatórios consolidados são elaborados pela equipe responsável e disponibilizados aos gestores da organização.
          </p>
        </div>

        <div class="footer">
          <p>SysMap Solutions — Blueprint IA Assessment de Maturidade</p>
          <p style="margin-top: 6px;">Este é um email automático, por favor não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ============================================
// API PÚBLICA - Envio de convite
// ============================================
// incluirMencaoDesejosIaNoConvite: convite maturidade (projeto) — parágrafo Desejos IA no HTML; padrão true.
export async function enviarEmailConviteAvaliacao({
  destinatarioEmail,
  destinatarioNome,
  remetenteNome, // mantido para compat: hoje não usado no template
  empresaNome,
  tipo,
  itemNome,
  token,
  loginUsuario, // opcional: e-mail/login do usuário
  senhaTemporaria, // opcional: senha gerada (ex.: "SysMap")
  incluirMencaoDesejosIaNoConvite = true
}) {
  const linkAvaliacao =
    tipo === 'projeto'
      ? `${BASE_URL}/avaliacao/acesso/${token}`
      : `${BASE_URL}/avaliacao-convite/${token}`;
  const tipoTexto = tipo === 'projeto' ? 'Avaliação de Maturidade em IA' : 'Avaliação de Produto IA-First';
  const qrCodeDataUrl = await QRCode.toDataURL(linkAvaliacao, {
    width: 220,
    margin: 2,
    color: {
      dark: '#0D1B2A',
      light: '#FFFFFF'
    }
  });
  const blocoOpcionalDesejosIa =
    tipo === 'projeto' && incluirMencaoDesejosIaNoConvite !== false
      ? getHtmlBlocoMencaoDesejosIaConvite()
      : '';
  const html = await montarHtmlConviteAvaliacaoAsync({
    destinatarioNome,
    empresaNome,
    tipoTexto,
    itemNome: itemNome || '—',
    linkAvaliacao,
    qrCodeDataUrl,
    loginUsuario:
      tipo === 'projeto' && !senhaTemporaria
        ? null
        : loginUsuario || destinatarioEmail,
    senhaTemporaria,
    blocoOpcionalDesejosIa
  });
  const assunto = await montarAssuntoConviteAsync({
    tipoTexto,
    empresaNome,
    itemNome: itemNome || ''
  });

  // Provider: Microsoft Graph
  if (EMAIL_PROVIDER === 'graph') {
    if (!GRAPH_CONFIG.tenantId || !GRAPH_CONFIG.clientId || !GRAPH_CONFIG.clientSecret || !GRAPH_CONFIG.senderAddress) {
      console.log('Microsoft Graph nao configurado. Email simulado:');
      console.log('  Para:', destinatarioEmail);
      console.log('  Assunto:', assunto);
      console.log('  Link:', linkAvaliacao);
      return { success: true, simulado: true, linkAvaliacao, message: 'Email simulado - Graph nao configurado' };
    }

    try {
      const result = await enviarEmailViaGraph({ destinatarioEmail, assunto, htmlConteudo: html });
      console.log('Email enviado via Graph para', destinatarioEmail);
      return { ...result, linkAvaliacao };
    } catch (error) {
      console.error('Erro ao enviar email via Graph:', error.message);
      throw error;
    }
  }

  // Provider: SMTP (default)
  const mailOptions = {
    from: `"Blueprint IA - SysMap" <${SMTP_CONFIG.auth.user || 'noreply@sysmap.com.br'}>`,
    to: destinatarioEmail,
    subject: assunto,
    html
  };

  if (!SMTP_CONFIG.auth.user) {
    console.log('SMTP nao configurado. Email simulado:');
    console.log('  Para:', destinatarioEmail);
    console.log('  Assunto:', mailOptions.subject);
    console.log('  Link:', linkAvaliacao);
    return { success: true, simulado: true, linkAvaliacao, message: 'Email simulado - SMTP nao configurado' };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado via SMTP:', info.messageId);
    return { success: true, messageId: info.messageId, linkAvaliacao, provider: 'smtp' };
  } catch (error) {
    console.error('Erro ao enviar email via SMTP:', error);
    throw error;
  }
}

// ============================================
// API PÚBLICA - Envio de resultado da avaliação
// ============================================
export async function enviarEmailResultadoAvaliacao({
  destinatarioEmail,
  destinatarioNome,
  empresaNome,
  projetoNome,
  respostas,
  dataConclusao
}) {
  const assunto = `[Blueprint IA] Avaliação registrada — ${projetoNome}`;
  const html = gerarHtmlResultadoAvaliacao({
    destinatarioNome,
    empresaNome,
    projetoNome,
    respostas,
    dataConclusao
  });

  if (EMAIL_PROVIDER === 'graph') {
    if (!GRAPH_CONFIG.tenantId || !GRAPH_CONFIG.clientId || !GRAPH_CONFIG.clientSecret || !GRAPH_CONFIG.senderAddress) {
      console.log('Microsoft Graph nao configurado. Email de resultado simulado:');
      console.log('  Para:', destinatarioEmail, '|', assunto);
      return { success: true, simulado: true, message: 'Email simulado - Graph nao configurado' };
    }
    try {
      const result = await enviarEmailViaGraph({ destinatarioEmail, assunto, htmlConteudo: html });
      console.log('Email de resultado enviado via Graph para', destinatarioEmail);
      return result;
    } catch (error) {
      console.error('Erro ao enviar email de resultado via Graph:', error.message);
      throw error;
    }
  }

  const mailOptions = {
    from: `"Blueprint IA - SysMap" <${SMTP_CONFIG.auth.user || 'noreply@sysmap.com.br'}>`,
    to: destinatarioEmail,
    subject: assunto,
    html
  };

  if (!SMTP_CONFIG.auth.user) {
    console.log('SMTP nao configurado. Email de resultado simulado:');
    console.log('  Para:', destinatarioEmail, '|', assunto);
    return { success: true, simulado: true, message: 'Email simulado - SMTP nao configurado' };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email de resultado enviado via SMTP:', info.messageId);
    return { success: true, messageId: info.messageId, provider: 'smtp' };
  } catch (error) {
    console.error('Erro ao enviar email de resultado via SMTP:', error);
    throw error;
  }
}

// ============================================
// Lembrete — continuar avaliação de projeto (maturidade)
// ============================================
function gerarHtmlLembreteAvaliacao({
  destinatarioNome,
  empresaNome,
  projetoNome,
  linkAcao,
  progressoTexto
}) {
  const n = escapeHtmlEmail(destinatarioNome);
  const e = escapeHtmlEmail(empresaNome);
  const p = escapeHtmlEmail(projetoNome);
  const prog = escapeHtmlEmail(progressoTexto);
  const href = escapeHtmlEmail(linkAcao);
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e2a4a 0%, #2563eb 100%); padding: 28px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 22px; }
        .content { background: #f8fafc; padding: 28px; border: 1px solid #e2e8f0; }
        .btn { display: inline-block; background: #2563eb; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0; }
        .footer { background: #1e293b; padding: 18px; text-align: center; border-radius: 0 0 10px 10px; }
        .footer p { color: #94a3b8; margin: 0; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Lembrete — Blueprint IA</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${n}</strong>,</p>
          <p>A <strong>${e}</strong> conta com sua participação na avaliação de maturidade em IA do projeto <strong>${p}</strong>.</p>
          <p style="color: #475569; font-size: 14px;"><strong>Andamento:</strong> ${prog}</p>
          <p style="text-align: center;">
            <a href="${href}" class="btn">Continuar avaliação</a>
          </p>
          <p style="font-size: 12px; color: #64748b; word-break: break-all;">${href}</p>
        </div>
        <div class="footer">
          <p>SysMap Solutions — Blueprint IA</p>
          <p style="margin-top: 8px;">Este é um email automático, por favor não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function enviarEmailLembreteAvaliacaoProjeto({
  destinatarioEmail,
  destinatarioNome,
  empresaNome,
  projetoNome,
  linkAcao,
  progressoTexto
}) {
  const assunto = `[Blueprint IA] Lembrete — Avaliação "${projetoNome}"`;
  const html = gerarHtmlLembreteAvaliacao({
    destinatarioNome,
    empresaNome,
    projetoNome,
    linkAcao,
    progressoTexto
  });

  if (EMAIL_PROVIDER === 'graph') {
    if (!GRAPH_CONFIG.tenantId || !GRAPH_CONFIG.clientId || !GRAPH_CONFIG.clientSecret || !GRAPH_CONFIG.senderAddress) {
      console.log('Microsoft Graph nao configurado. Lembrete simulado:', destinatarioEmail, linkAcao);
      return { success: true, simulado: true, linkAcao, message: 'Email simulado - Graph nao configurado' };
    }
    try {
      const result = await enviarEmailViaGraph({ destinatarioEmail, assunto, htmlConteudo: html });
      return { ...result, linkAcao };
    } catch (error) {
      console.error('Erro lembrete Graph:', error.message);
      throw error;
    }
  }

  const mailOptions = {
    from: `"Blueprint IA - SysMap" <${SMTP_CONFIG.auth.user || 'noreply@sysmap.com.br'}>`,
    to: destinatarioEmail,
    subject: assunto,
    html
  };

  if (!SMTP_CONFIG.auth.user) {
    console.log('SMTP nao configurado. Lembrete simulado:', destinatarioEmail, linkAcao);
    return { success: true, simulado: true, linkAcao, message: 'Email simulado - SMTP nao configurado' };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId, linkAcao, provider: 'smtp' };
  } catch (error) {
    console.error('Erro lembrete SMTP:', error);
    throw error;
  }
}

function gerarHtmlLembreteAvaliacaoProdutoHtml({
  destinatarioNome,
  empresaNome,
  projetoNome,
  produtoNome,
  linkAcao,
  progressoTexto
}) {
  const n = escapeHtmlEmail(destinatarioNome);
  const e = escapeHtmlEmail(empresaNome);
  const pj = escapeHtmlEmail(projetoNome);
  const pr = escapeHtmlEmail(produtoNome);
  const prog = escapeHtmlEmail(progressoTexto);
  const href = escapeHtmlEmail(linkAcao);
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%); padding: 28px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 22px; }
        .content { background: #f8fafc; padding: 28px; border: 1px solid #e2e8f0; }
        .btn { display: inline-block; background: #7c3aed; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0; }
        .footer { background: #1e293b; padding: 18px; text-align: center; border-radius: 0 0 10px 10px; }
        .footer p { color: #94a3b8; margin: 0; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Lembrete — Produto IA-First</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${n}</strong>,</p>
          <p>A <strong>${e}</strong> conta com sua participação na <strong>avaliação de produto IA-First</strong> (projeto <strong>${pj}</strong>, produto <strong>${pr}</strong>).</p>
          <p style="color: #475569; font-size: 14px;"><strong>Andamento:</strong> ${prog}</p>
          <p style="text-align: center;">
            <a href="${href}" class="btn">Continuar avaliação</a>
          </p>
          <p style="font-size: 12px; color: #64748b; word-break: break-all;">${href}</p>
        </div>
        <div class="footer">
          <p>SysMap Solutions — Blueprint IA</p>
          <p style="margin-top: 8px;">Este é um email automático, por favor não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function enviarEmailLembreteAvaliacaoProduto({
  destinatarioEmail,
  destinatarioNome,
  empresaNome,
  projetoNome,
  produtoNome,
  linkAcao,
  progressoTexto
}) {
  const assunto = `[Blueprint IA] Lembrete — Produto "${produtoNome}"`;
  const html = gerarHtmlLembreteAvaliacaoProdutoHtml({
    destinatarioNome,
    empresaNome,
    projetoNome,
    produtoNome,
    linkAcao,
    progressoTexto
  });

  if (EMAIL_PROVIDER === 'graph') {
    if (!GRAPH_CONFIG.tenantId || !GRAPH_CONFIG.clientId || !GRAPH_CONFIG.clientSecret || !GRAPH_CONFIG.senderAddress) {
      console.log('Microsoft Graph nao configurado. Lembrete produto simulado:', destinatarioEmail, linkAcao);
      return { success: true, simulado: true, linkAcao, message: 'Email simulado - Graph nao configurado' };
    }
    try {
      const result = await enviarEmailViaGraph({ destinatarioEmail, assunto, htmlConteudo: html });
      return { ...result, linkAcao };
    } catch (error) {
      console.error('Erro lembrete produto Graph:', error.message);
      throw error;
    }
  }

  const mailOptions = {
    from: `"Blueprint IA - SysMap" <${SMTP_CONFIG.auth.user || 'noreply@sysmap.com.br'}>`,
    to: destinatarioEmail,
    subject: assunto,
    html
  };

  if (!SMTP_CONFIG.auth.user) {
    console.log('SMTP nao configurado. Lembrete produto simulado:', destinatarioEmail, linkAcao);
    return { success: true, simulado: true, linkAcao, message: 'Email simulado - SMTP nao configurado' };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId, linkAcao, provider: 'smtp' };
  } catch (error) {
    console.error('Erro lembrete produto SMTP:', error);
    throw error;
  }
}

// ============================================
// DIAGNÓSTICO RÁPIDO (DEMO) — resultado por e-mail
// ============================================

function escapeHtmlDiagnostico(text) {
  if (text == null || text === '') return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatRecomendacaoDiagnosticoHtml(raw) {
  if (!raw) return '';
  const segments = [];
  let rest = String(raw);
  const re = /\*\*(.+?)\*\*/s;
  while (rest.length > 0) {
    const m = rest.match(re);
    if (!m) {
      segments.push(escapeHtmlDiagnostico(rest));
      break;
    }
    const idx = m.index ?? 0;
    if (idx > 0) {
      segments.push(escapeHtmlDiagnostico(rest.slice(0, idx)));
    }
    segments.push(`<strong>${escapeHtmlDiagnostico(m[1])}</strong>`);
    rest = rest.slice(idx + m[0].length);
  }
  return segments.join('').replace(/\n/g, '<br/>');
}

function gerarHtmlDiagnosticoRapidoCompleto({
  destinatarioNome,
  empresaNome,
  diagnosticoId,
  dataConclusao,
  duracaoMinutos,
  scoreGeral,
  nivelMaturidade,
  scoresPorDimensao,
  principaisGaps,
  recomendacaoHtml,
  proximasAcoes,
  respostas,
  linkRelatorio,
  linkMailtoAssessment
}) {
  const linhasScores = (scoresPorDimensao || [])
    .map(
      (d) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${escapeHtmlDiagnostico(d.icone || '')} ${escapeHtmlDiagnostico(d.nome)}</td>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:600;">${escapeHtmlDiagnostico(String(d.score?.toFixed ? d.score.toFixed(1) : d.score))}</td>
      </tr>`
    )
    .join('');

  const blocosGaps = (principaisGaps || [])
    .map(
      (g) => `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:8px;">
        <div style="font-size:13px;font-weight:600;color:#1e293b;">${escapeHtmlDiagnostico(g.dimensao)}</div>
        <div style="font-size:12px;color:#64748b;margin-top:4px;">
          Score: ${escapeHtmlDiagnostico(String(g.score))}/5 · Gap: ${escapeHtmlDiagnostico(String(g.gap))} pts · <span style="font-weight:600;">${escapeHtmlDiagnostico(g.prioridade)}</span>
        </div>
      </div>`
    )
    .join('');

  const listaAcoes = (proximasAcoes || [])
    .map(
      (a, i) => `
      <div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:8px;font-size:13px;color:#334155;">
        <span style="flex-shrink:0;width:22px;height:22px;background:#dcfce7;color:#166534;border-radius:999px;text-align:center;line-height:22px;font-size:12px;font-weight:700;">${i + 1}</span>
        <span>${escapeHtmlDiagnostico(a)}</span>
      </div>`
    )
    .join('');

  const blocosRespostas = (respostas || [])
    .map((r) => {
      const obs = r.observacoes ? `<div style="font-size:12px;color:#64748b;margin-top:4px;"><em>${escapeHtmlDiagnostico(r.observacoes)}</em></div>` : '';
      return `
      <div style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
        <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;">${escapeHtmlDiagnostico(r.dimensao || 'Dimensão')}</div>
        <div style="font-size:13px;color:#1e293b;margin-top:4px;">${escapeHtmlDiagnostico(r.pergunta)}</div>
        <div style="font-size:12px;color:#475569;margin-top:4px;">Pontuação: <strong>${r.pontuacao != null ? escapeHtmlDiagnostico(String(r.pontuacao)) : '—'}</strong></div>
        ${obs}
      </div>`;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.55; color: #1e293b; }
        .container { max-width: 720px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e2a4a 0%, #2563eb 100%); padding: 28px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 22px; }
        .header p { color: #93c5fd; margin: 8px 0 0 0; font-size: 13px; }
        .content { background: #f8fafc; padding: 26px; border: 1px solid #e2e8f0; }
        .footer { background: #1e293b; padding: 18px; text-align: center; border-radius: 0 0 10px 10px; }
        .footer p { color: #94a3b8; margin: 0; font-size: 12px; }
        .score-card { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; text-align: center; margin: 14px 0 18px; }
        .score-num { font-size: 38px; font-weight: 800; color: #2563eb; line-height: 1; }
        .nivel-badge { display: inline-block; background: #2563eb; color: white; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-top: 8px; }
        table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
        th { background: #f1f5f9; padding: 10px; text-align: left; font-size: 12px; color: #475569; text-transform: uppercase; }
        .btn { display: inline-block; background: #2563eb; color: white !important; padding: 14px 22px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 8px 8px 8px 0; }
        .btn-secondary { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Diagnóstico Rápido (Demo)</h1>
          <p>Resultado completo · Blueprint IA · SysMap Solutions</p>
        </div>

        <div class="content">
          <p>Olá <strong>${escapeHtmlDiagnostico(destinatarioNome)}</strong>,</p>
          <p>Você concluiu o <strong>Diagnóstico Rápido de Maturidade em IA</strong>. Abaixo está o <strong>relatório completo</strong> com scores, gaps, recomendações e todas as respostas da demonstração.</p>

          <div style="font-size: 13px; color: #64748b; margin: 12px 0;">
            <strong>Empresa:</strong> ${escapeHtmlDiagnostico(empresaNome)} &nbsp;·&nbsp;
            <strong>Concluído em:</strong> ${escapeHtmlDiagnostico(dataConclusao)}
            ${duracaoMinutos != null ? ` &nbsp;·&nbsp; <strong>Duração:</strong> ${escapeHtmlDiagnostico(String(duracaoMinutos))} min` : ''}
          </div>

          <div class="score-card">
            <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Score geral</div>
            <div class="score-num">${escapeHtmlDiagnostico(String(scoreGeral?.toFixed ? scoreGeral.toFixed(2) : scoreGeral))}</div>
            <div style="color:#64748b;font-size:13px;">de 5.0</div>
            <div class="nivel-badge">${escapeHtmlDiagnostico(nivelMaturidade)}</div>
          </div>

          <h3 style="font-size: 16px; margin: 20px 0 8px;">Score por dimensão</h3>
          <table>
            <thead>
              <tr>
                <th>Dimensão</th>
                <th style="text-align:center;">Score</th>
              </tr>
            </thead>
            <tbody>${linhasScores || '<tr><td colspan="2" style="padding:12px;color:#64748b;">Sem dados.</td></tr>'}</tbody>
          </table>

          <h3 style="font-size: 16px; margin: 22px 0 10px;">Principais gaps</h3>
          ${blocosGaps || '<p style="color:#64748b;font-size:13px;">—</p>'}

          <h3 style="font-size: 16px; margin: 22px 0 10px;">Recomendação de próximo passo</h3>
          <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:16px;font-size:14px;color:#334155;line-height:1.6;">
            ${recomendacaoHtml || '<p style="margin:0;color:#64748b;">—</p>'}
          </div>

          <h3 style="font-size: 16px; margin: 22px 0 10px;">Próximos passos sugeridos</h3>
          ${listaAcoes || '<p style="color:#64748b;font-size:13px;">—</p>'}

          <h3 style="font-size: 16px; margin: 24px 0 10px;">Todas as respostas (demo)</h3>
          <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;">
            ${blocosRespostas || '<p style="color:#64748b;font-size:13px;">Sem respostas.</p>'}
          </div>

          <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e2e8f0;">
            <p style="font-size:14px;color:#334155;margin-bottom:12px;">
              <strong>Acesse o relatório online</strong> (mesma visualização da tela):
            </p>
            <a class="btn" href="${escapeHtmlDiagnostico(linkRelatorio)}">Abrir relatório no navegador</a>
          </div>

          <div style="margin-top:22px;padding:18px;background:linear-gradient(135deg,#eff6ff 0%,#f5f3ff 100%);border:1px solid #bfdbfe;border-radius:10px;">
            <p style="margin:0 0 12px;font-size:14px;color:#1e293b;font-weight:600;">Assessment completo (108 perguntas)</p>
            <p style="margin:0 0 14px;font-size:13px;color:#475569;">
              Este diagnóstico é uma demonstração. Para uma análise completa de maturidade em IA, solicite o <strong>Assessment de Maturidade</strong> com a equipe SysMap — o mesmo fluxo do botão no final do relatório na web.
            </p>
            <a class="btn btn-secondary" href="${escapeHtmlDiagnostico(linkMailtoAssessment)}">Solicitar Assessment Completo por e-mail</a>
          </div>

          <p style="font-size: 11px; color: #94a3b8; margin-top: 22px;">
            Referência do diagnóstico: ID #${escapeHtmlDiagnostico(String(diagnosticoId))}
          </p>
        </div>

        <div class="footer">
          <p>SysMap Solutions — Blueprint IA</p>
          <p style="margin-top:6px;">Mensagem automática · Em caso de dúvida, utilize o botão acima ou responda ao e-mail de contato.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Envia e-mail com o resultado completo do diagnóstico rápido (demo) + link do relatório + mailto para assessment completo.
 */
export async function enviarEmailDiagnosticoRapidoResultado(payload) {
  const {
    destinatarioEmail,
    destinatarioNome,
    empresaNome,
    diagnosticoId,
    dataConclusao,
    duracaoMinutos,
    scoreGeral,
    nivelMaturidade,
    scoresPorDimensao,
    principaisGaps,
    recomendacaoTexto,
    proximasAcoes,
    respostas,
    linkRelatorio,
    linkMailtoAssessment
  } = payload;

  const assunto = `[Blueprint IA] Seu Diagnóstico Rápido — resultado completo (#${diagnosticoId})`;
  const recomendacaoHtml = formatRecomendacaoDiagnosticoHtml(recomendacaoTexto);

  const html = gerarHtmlDiagnosticoRapidoCompleto({
    destinatarioNome,
    empresaNome,
    diagnosticoId,
    dataConclusao,
    duracaoMinutos,
    scoreGeral,
    nivelMaturidade,
    scoresPorDimensao,
    principaisGaps,
    recomendacaoHtml,
    proximasAcoes,
    respostas,
    linkRelatorio,
    linkMailtoAssessment
  });

  if (EMAIL_PROVIDER === 'graph') {
    if (!GRAPH_CONFIG.tenantId || !GRAPH_CONFIG.clientId || !GRAPH_CONFIG.clientSecret || !GRAPH_CONFIG.senderAddress) {
      console.log('[Diagnostico Rapido] Graph nao configurado. Email simulado para:', destinatarioEmail);
      return { success: true, simulado: true, message: 'Email simulado - Graph nao configurado' };
    }
    try {
      const result = await enviarEmailViaGraph({ destinatarioEmail, assunto, htmlConteudo: html });
      console.log('[Diagnostico Rapido] Email enviado via Graph para', destinatarioEmail);
      return result;
    } catch (error) {
      console.error('[Diagnostico Rapido] Erro Graph:', error.message);
      throw error;
    }
  }

  const mailOptions = {
    from: `"Blueprint IA - SysMap" <${SMTP_CONFIG.auth.user || 'noreply@sysmap.com.br'}>`,
    to: destinatarioEmail,
    subject: assunto,
    html
  };

  if (!SMTP_CONFIG.auth.user) {
    console.log('[Diagnostico Rapido] SMTP nao configurado. Email simulado para:', destinatarioEmail, '| link:', linkRelatorio);
    return { success: true, simulado: true, message: 'Email simulado - SMTP nao configurado' };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[Diagnostico Rapido] Email enviado via SMTP:', info.messageId);
    return { success: true, messageId: info.messageId, provider: 'smtp' };
  } catch (error) {
    console.error('[Diagnostico Rapido] Erro SMTP:', error);
    throw error;
  }
}

// ============================================
// Notificação — cadastro / workflow de produto
// ============================================
function gerarHtmlNotificacaoWorkflowProduto({
  destinatarioNome,
  titulo,
  mensagem,
  produtoNome,
  empresaNome,
  projetoNome,
  linkEdicao
}) {
  const safe = (s) => escapeHtmlEmail(s ?? '');
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:'Segoe UI',Arial,sans-serif;line-height:1.55;color:#1e293b;">
      <div style="max-width:640px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#1e2a4a 0%,#2563eb 100%);padding:24px;border-radius:10px 10px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;font-size:20px;">Blueprint IA</h1>
          <p style="color:#93c5fd;margin:6px 0 0;font-size:13px;">${safe(titulo)}</p>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;">
          <p>Olá <strong>${safe(destinatarioNome)}</strong>,</p>
          <p>${safe(mensagem)}</p>
          <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin:16px 0;">
            <div style="font-size:12px;color:#64748b;text-transform:uppercase;">Produto</div>
            <div style="font-weight:600;margin-top:4px;">${safe(produtoNome)}</div>
            <div style="font-size:12px;color:#64748b;margin-top:12px;text-transform:uppercase;">Empresa / Projeto</div>
            <div style="margin-top:4px;">${safe(empresaNome)} — ${safe(projetoNome)}</div>
          </div>
          <p style="text-align:center;margin:24px 0;">
            <a href="${safe(linkEdicao)}" style="display:inline-block;background:#2563eb;color:white!important;padding:12px 22px;text-decoration:none;border-radius:8px;font-weight:600;">Abrir cadastro do produto</a>
          </p>
          <p style="font-size:12px;color:#64748b;word-break:break-all;">${safe(linkEdicao)}</p>
        </div>
        <div style="background:#1e293b;padding:16px;text-align:center;border-radius:0 0 10px 10px;">
          <p style="color:#94a3b8;margin:0;font-size:12px;">SysMap Solutions — Blueprint IA</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * @param {Array<{ email: string, nome: string }>} destinatarios
 */
export async function enviarEmailNotificacaoCadastroProduto({
  destinatarios,
  assunto,
  titulo,
  mensagem,
  produtoNome,
  empresaNome,
  projetoNome,
  linkEdicao
}) {
  const lista = Array.isArray(destinatarios) ? destinatarios : [];
  const resultados = [];
  for (const d of lista) {
    if (!d?.email) continue;
    const html = gerarHtmlNotificacaoWorkflowProduto({
      destinatarioNome: d.nome || d.email,
      titulo,
      mensagem,
      produtoNome,
      empresaNome,
      projetoNome,
      linkEdicao
    });
    if (EMAIL_PROVIDER === 'graph') {
      if (!GRAPH_CONFIG.tenantId || !GRAPH_CONFIG.clientId || !GRAPH_CONFIG.clientSecret || !GRAPH_CONFIG.senderAddress) {
        console.log('[Produto workflow] Graph nao configurado. Email simulado para:', d.email, assunto);
        resultados.push({ email: d.email, simulado: true });
        continue;
      }
      try {
        await enviarEmailViaGraph({ destinatarioEmail: d.email, assunto, htmlConteudo: html });
        resultados.push({ email: d.email, ok: true });
      } catch (e) {
        console.error('[Produto workflow] Erro Graph', d.email, e.message);
        resultados.push({ email: d.email, erro: e.message });
      }
      continue;
    }
    const mailOptions = {
      from: `"Blueprint IA - SysMap" <${SMTP_CONFIG.auth.user || 'noreply@sysmap.com.br'}>`,
      to: d.email,
      subject: assunto,
      html
    };
    if (!SMTP_CONFIG.auth.user) {
      console.log('[Produto workflow] SMTP nao configurado. Email simulado para:', d.email);
      resultados.push({ email: d.email, simulado: true });
      continue;
    }
    try {
      await transporter.sendMail(mailOptions);
      resultados.push({ email: d.email, ok: true });
    } catch (e) {
      console.error('[Produto workflow] Erro SMTP', d.email, e.message);
      resultados.push({ email: d.email, erro: e.message });
    }
  }
  return { enviados: resultados.length, resultados };
}

// ============================================
// VERIFICAÇÃO DE CONEXÃO
// ============================================
export async function verificarConexaoSMTP() {
  if (EMAIL_PROVIDER === 'graph') {
    if (!GRAPH_CONFIG.tenantId || !GRAPH_CONFIG.clientId || !GRAPH_CONFIG.clientSecret) {
      return { conectado: false, provider: 'graph', mensagem: 'Microsoft Graph nao configurado' };
    }
    try {
      await obterTokenGraph();
      return { conectado: true, provider: 'graph', mensagem: `Microsoft Graph OK (sender: ${GRAPH_CONFIG.senderAddress})` };
    } catch (error) {
      return { conectado: false, provider: 'graph', mensagem: error.message };
    }
  }

  if (!SMTP_CONFIG.auth.user) {
    return { conectado: false, provider: 'smtp', mensagem: 'SMTP nao configurado' };
  }
  try {
    await transporter.verify();
    return { conectado: true, provider: 'smtp', mensagem: 'Conexao SMTP OK' };
  } catch (error) {
    return { conectado: false, provider: 'smtp', mensagem: error.message };
  }
}
