import { prisma } from '../lib/prisma.js';

export const CHAVE_EMAIL_CONVITE_HTML = 'email_convite_avaliacao_template_html';
export const CHAVE_EMAIL_CONVITE_ASSUNTO = 'email_convite_avaliacao_assunto';

/** Chaves permitidas em `{{chave}}` (evita substituição arbitrária). */
export const PLACEHOLDERS_CONVITE = [
  'nomeUsuario',
  'nomeEmpresa',
  'linkAvaliacao',
  'labelBotao',
  'blocoCredenciais',
  'tipoAvaliacao',
  'nomeItem',
  'blocoQRCodeConvite',
  'assinaturaNome',
  'assinaturaEmpresa',
  // Convite maturidade: parágrafo opcional sobre Desejos IA (vazio se o gestor desmarcar no envio).
  'blocoOpcionalDesejosIa'
];

export const DESCRICAO_PLACEHOLDERS_CONVITE = PLACEHOLDERS_CONVITE.map((k) => `{{${k}}}`).join(', ');

function escapeHtml(s) {
  if (s == null || s === '') return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function getDefaultAssuntoConvite() {
  return '[Blueprint MaturidadeIA] Convite para avaliação — {{nomeEmpresa}}';
}

/** HTML padrão (texto solicitado + bloco de credenciais opcional + botão). */
export function getDefaultConviteTemplateHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.65; color: #1e293b; margin: 0; padding: 0; background: #f1f5f9; }
    .wrap { max-width: 640px; margin: 0 auto; padding: 24px 16px; }
    .card { background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 24px rgba(15,23,42,0.06); }
    .head { background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%); padding: 28px 24px; text-align: center; }
    .head h1 { color: #fff; margin: 0; font-size: 22px; font-weight: 700; }
    .head p { color: #bfdbfe; margin: 8px 0 0; font-size: 13px; }
    .body { padding: 28px 24px 32px; }
    .body p { margin: 0 0 14px; font-size: 15px; color: #334155; }
    .hr { border: none; border-top: 2px solid #cbd5e1; margin: 22px 0; }
    .sec-bar { font-size: 11px; letter-spacing: 0.06em; color: #94a3b8; text-align: center; margin: 22px 0 10px; line-height: 1.5; }
    .sec-title-mid { font-size: 12px; font-weight: 700; letter-spacing: 0.14em; color: #475569; text-align: center; margin: 0 0 12px; }
    .lista { margin: 0; padding-left: 0; color: #334155; font-size: 15px; list-style: none; }
    .lista li { margin-bottom: 10px; padding-left: 1.35em; position: relative; }
    .lista li::before { content: '→'; position: absolute; left: 0; color: #64748b; font-weight: 600; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; letter-spacing: 0.02em; }
    .btn-wrap { text-align: center; margin: 28px 0 20px; }
    .link-fallback { font-size: 12px; color: #64748b; word-break: break-all; margin-top: 8px; }
    .foot { padding: 18px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 13px; color: #475569; }
    .foot .sig { margin-top: 16px; font-size: 14px; color: #1e293b; font-weight: 600; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="head">
        <h1>Blueprint MaturidadeIA</h1>
        <p>SysMap Solutions</p>
      </div>
      <div class="body">
        {{blocoCredenciais}}

        <p>Olá <strong>{{nomeUsuario}}</strong>,</p>
        <p>Parabéns, você foi convidado(a) pela <strong>{{nomeEmpresa}}</strong> para realizar uma avaliação no sistema <strong>Blueprint MaturidadeIA</strong> da SysMap Solutions.</p>

        <div class="btn-wrap">
          <a href="{{linkAvaliacao}}" class="btn">{{labelBotao}}</a>
        </div>
        <p class="link-fallback">Se o botão não funcionar, copie e cole este link no navegador:<br/><span style="color:#2563eb;">{{linkAvaliacao}}</span></p>
        {{blocoQRCodeConvite}}

        <hr class="hr" />
        <div class="sec-bar">━━━━━━━━━━━━━━━━</div>
        <div class="sec-title-mid">COMO FUNCIONA</div>
        <div class="sec-bar" style="margin-top:0;margin-bottom:16px;">━━━━━━━━━━━━━━━━</div>
        <p>A ferramenta avalia <strong>12 dimensões</strong> de maturidade em IA — de estratégia e dados até cultura e governança. Você responde apenas as dimensões relevantes para sua área.</p>
        <p>Não há resposta certa ou errada. O que nos interessa é sua percepção honesta do estado atual — incluindo o que ainda não funciona bem. Diagnósticos precisos dependem de respostas francas.</p>
        <p>As respostas são individuais e serão consolidadas de forma agregada no relatório final. Nenhuma resposta será atribuída nominalmente.</p>
        <p>Ainda teremos um miniquestionário de como a IA pode ajudar suas atividades e quais seriam seus principais desafios.</p>
        {{blocoOpcionalDesejosIa}}

        <hr class="hr" />
        <div class="sec-bar">━━━━━━━━━━━━━━━━</div>
        <div class="sec-title-mid">DICAS PARA RESPONDER</div>
        <div class="sec-bar" style="margin-top:0;margin-bottom:16px;">━━━━━━━━━━━━━━━━</div>
        <ul class="lista">
          <li>Responda com base na realidade atual, não no que gostaríamos que fosse</li>
          <li>Se não souber responder alguma pergunta, selecione &quot;Não sei / Não se aplica&quot;</li>
          <li>Use o campo de comentários sempre que quiser detalhar — esses comentários são muito valiosos</li>
          <li>Você pode pausar e retomar a qualquer momento</li>
        </ul>

        <p style="margin-top:22px;">Qualquer dúvida, responda este e-mail diretamente.</p>
        <p>Obrigado pela sua contribuição.</p>
      </div>
      <div class="foot">
        <p style="margin:0;"><strong>Tipo:</strong> {{tipoAvaliacao}} &nbsp;·&nbsp; <strong>Escopo:</strong> {{nomeItem}}</p>
        <div class="sig">{{assinaturaNome}}<br/><span style="font-weight:500;color:#64748b;">{{assinaturaEmpresa}}</span></div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function gerarBlocoCredenciaisConviteHtml(loginUsuario, senhaTemporaria) {
  if (!loginUsuario) return '';
  const u = escapeHtml(loginUsuario);
  const senhaHtml = senhaTemporaria
    ? `<div style="color:#1e293b;font-size:15px;font-weight:600;margin-top:2px;font-family:Consolas,monospace;">${escapeHtml(senhaTemporaria)}</div>`
    : `<div style="color:#64748b;font-size:14px;margin-top:2px;">Use a senha já cadastrada anteriormente.</div>`;
  const avisoSenha = senhaTemporaria
    ? 'Recomendamos alterar a senha após o primeiro acesso em &quot;Meu Perfil&quot;.'
    : 'Se não lembrar a senha, solicite a redefinição ao gestor responsável.';
  return `
          <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:10px;padding:18px;margin:0 0 22px;">
            <div style="color:#92400e;font-weight:700;font-size:15px;margin-bottom:10px;">Suas credenciais de acesso</div>
            <div style="background:#fff;border-radius:8px;padding:12px;margin-bottom:8px;">
              <div style="color:#64748b;font-size:12px;text-transform:uppercase;">Usuário (login)</div>
              <div style="color:#1e293b;font-size:15px;font-weight:600;margin-top:2px;">${u}</div>
            </div>
            <div style="background:#fff;border-radius:8px;padding:12px;">
              <div style="color:#64748b;font-size:12px;text-transform:uppercase;">Senha temporária</div>
              ${senhaHtml}
            </div>
            <p style="color:#92400e;font-size:12px;margin:10px 0 0;">${avisoSenha}</p>
          </div>`;
}

export function gerarBlocoQRCodeConviteHtml(qrCodeDataUrl) {
  if (!qrCodeDataUrl) return '';
  return `
          <div style="margin:22px 0 4px;padding:18px;background:#f8fafc;border:1px solid #dbeafe;border-radius:12px;text-align:center;">
            <div style="font-size:14px;font-weight:700;color:#1e3a8a;margin-bottom:8px;">Responder pelo celular</div>
            <p style="font-size:13px;color:#334155;margin:0 0 14px;line-height:1.5;">
              No celular, abra o app de <strong>câmera</strong>, aponte para o QR Code abaixo e toque na notificação que aparecer para iniciar a avaliação.
            </p>
            <img src="${qrCodeDataUrl}" width="200" height="200" alt="QR Code para acessar a avaliação no celular" style="display:block;margin:0 auto;border:8px solid #ffffff;border-radius:12px;" />
            <p style="font-size:12px;color:#64748b;margin:12px 0 0;">
              Não é necessário instalar nenhum aplicativo.
            </p>
          </div>`;
}

export function substituirPlaceholdersConvite(templateHtml, vars) {
  let out = templateHtml;
  for (const key of PLACEHOLDERS_CONVITE) {
    if (!Object.prototype.hasOwnProperty.call(vars, key)) continue;
    const token = `{{${key}}}`;
    const val = vars[key] == null ? '' : String(vars[key]);
    out = out.split(token).join(val);
  }
  return out;
}

export async function getConviteConfigFromDb() {
  const [rowHtml, rowAssunto] = await Promise.all([
    prisma.configuracaoIA.findUnique({ where: { chave: CHAVE_EMAIL_CONVITE_HTML } }),
    prisma.configuracaoIA.findUnique({ where: { chave: CHAVE_EMAIL_CONVITE_ASSUNTO } })
  ]);
  return {
    templateHtml: (rowHtml?.valor && rowHtml.valor.trim()) ? rowHtml.valor : getDefaultConviteTemplateHtml(),
    assunto: (rowAssunto?.valor && rowAssunto.valor.trim()) ? rowAssunto.valor : getDefaultAssuntoConvite(),
    usandoPadraoHtml: !rowHtml?.valor?.trim(),
    usandoPadraoAssunto: !rowAssunto?.valor?.trim()
  };
}

export async function salvarConviteConfigNoDb({ templateHtml, assunto }) {
  await prisma.$transaction([
    prisma.configuracaoIA.upsert({
      where: { chave: CHAVE_EMAIL_CONVITE_HTML },
      create: { chave: CHAVE_EMAIL_CONVITE_HTML, valor: templateHtml, criptografado: false },
      update: { valor: templateHtml }
    }),
    prisma.configuracaoIA.upsert({
      where: { chave: CHAVE_EMAIL_CONVITE_ASSUNTO },
      create: { chave: CHAVE_EMAIL_CONVITE_ASSUNTO, valor: assunto, criptografado: false },
      update: { valor: assunto }
    })
  ]);
}

/**
 * Monta o HTML final do convite (template do banco ou padrão + variáveis).
 * `linkAvaliacao` não é escapado em href (URL gerada pelo servidor).
 */
/** Parágrafo opcional do convite (maturidade): explica o bloco Desejos IA no fim do questionário. */
export function getHtmlBlocoMencaoDesejosIaConvite() {
  return `<p style="margin-top:14px;padding:14px 16px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;color:#134e4a;font-size:14px;line-height:1.55;">
      <strong>Desejos IA:</strong> no <strong>final</strong> do questionário há um bloco opcional com esse nome (visão de futuro e roadmap).
      Ele <strong>não altera</strong> a pontuação de maturidade — serve para apoiar prioridades. Pode deixá-lo em branco.
    </p>`;
}

export async function montarHtmlConviteAvaliacaoAsync({
  destinatarioNome,
  empresaNome,
  tipoTexto,
  itemNome,
  linkAvaliacao,
  qrCodeDataUrl,
  loginUsuario,
  senhaTemporaria,
  blocoOpcionalDesejosIa = ''
}) {
  const { templateHtml } = await getConviteConfigFromDb();
  const blocoCredenciais = gerarBlocoCredenciaisConviteHtml(
    loginUsuario || null,
    senhaTemporaria || null
  );
  const blocoQRCodeConvite = gerarBlocoQRCodeConviteHtml(qrCodeDataUrl);
  const vars = {
    nomeUsuario: escapeHtml(destinatarioNome),
    nomeEmpresa: escapeHtml(empresaNome),
    linkAvaliacao,
    labelBotao: 'INICIAR avaliação',
    blocoCredenciais,
    tipoAvaliacao: escapeHtml(tipoTexto),
    nomeItem: escapeHtml(itemNome),
    blocoQRCodeConvite,
    assinaturaNome: 'Alessandro Heringer Milagres',
    assinaturaEmpresa: 'SysMap',
    blocoOpcionalDesejosIa: blocoOpcionalDesejosIa || ''
  };
  const html = substituirPlaceholdersConvite(templateHtml, vars);
  if (!blocoQRCodeConvite || templateHtml.includes('{{blocoQRCodeConvite}}')) {
    return html;
  }
  return html.replace('</body>', `${blocoQRCodeConvite}</body>`);
}

export function montarAssuntoConvite(assuntoTemplate, { tipoTexto, empresaNome, itemNome }) {
  let s = assuntoTemplate || getDefaultAssuntoConvite();
  s = s.split('{{tipoAvaliacao}}').join(tipoTexto || '');
  s = s.split('{{nomeEmpresa}}').join(empresaNome || '');
  s = s.split('{{nomeItem}}').join(itemNome || '');
  return s;
}

export async function montarAssuntoConviteAsync(vars) {
  const { assunto } = await getConviteConfigFromDb();
  return montarAssuntoConvite(assunto, vars);
}

/** Variáveis de exemplo ou vindas do body do preview (admin). */
export function buildVariaveisConvitePreview(opts = {}) {
  const incluirCred = opts.incluirCredenciais !== false;
  const link =
    opts.linkAvaliacao != null && String(opts.linkAvaliacao).trim()
      ? String(opts.linkAvaliacao)
      : 'https://agentica.sysmap.com.br/avaliacao-convite/exemplo-preview';
  const login = incluirCred ? opts.loginUsuario || 'usuario.exemplo@empresa.com' : null;
  const senha = incluirCred ? opts.senhaTemporaria || 'SenhaTemp123' : null;
  const blocoCredenciais = gerarBlocoCredenciaisConviteHtml(login, senha);
  const incluirDesejos =
    opts.incluirMencaoDesejosIaNoConvite !== false && opts.incluirMencaoDesejosIaNoConvite !== '0';
  return {
    nomeUsuario: escapeHtml(opts.nomeUsuario ?? 'Maria Silva'),
    nomeEmpresa: escapeHtml(opts.nomeEmpresa ?? 'Empresa Exemplo Ltda'),
    linkAvaliacao: link,
    labelBotao: escapeHtml(opts.labelBotao ?? 'INICIAR avaliação'),
    blocoCredenciais,
    tipoAvaliacao: escapeHtml(opts.tipoAvaliacao ?? 'Avaliação de Maturidade em IA'),
    nomeItem: escapeHtml(opts.nomeItem ?? 'Projeto Piloto'),
    blocoQRCodeConvite: gerarBlocoQRCodeConviteHtml(opts.qrCodeDataUrl || ''),
    assinaturaNome: escapeHtml(opts.assinaturaNome ?? 'Alessandro Heringer Milagres'),
    assinaturaEmpresa: escapeHtml(opts.assinaturaEmpresa ?? 'SysMap'),
    blocoOpcionalDesejosIa: incluirDesejos ? getHtmlBlocoMencaoDesejosIaConvite() : ''
  };
}

/** HTML final com placeholders substituídos (template vindo do editor ou do banco). */
export function previewConviteHtml(templateHtml, opts = {}) {
  const vars = buildVariaveisConvitePreview(opts);
  return substituirPlaceholdersConvite(templateHtml, vars);
}
