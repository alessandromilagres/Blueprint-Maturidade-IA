/**
 * Regenera relatório executivo IA (reuse=false) e valida comparativoVersoes no payload.
 * Uso: VALIDATOR_EMAIL=... VALIDATOR_PASSWORD=... node scripts/regenerar-relatorio-ia-teste.js [projetoId] [versaoId]
 */
const API = (process.env.API_BASE_URL || 'http://127.0.0.1:3001/api').replace(/\/+$/, '');
const EMAIL = process.env.VALIDATOR_EMAIL || process.env.LOGIN_EMAIL;
const PASSWORD = process.env.VALIDATOR_PASSWORD || process.env.LOGIN_PASSWORD;
const projetoId = Number(process.argv[2] || 1);
const versaoId = process.argv[3] ? Number(process.argv[3]) : null;

async function main() {
  if (!EMAIL || !PASSWORD) {
    throw new Error('Defina VALIDATOR_EMAIL e VALIDATOR_PASSWORD para autenticar na API.');
  }

  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, senha: PASSWORD })
  });
  const loginBody = await loginRes.json();
  if (!loginRes.ok || !loginBody.token) {
    throw new Error(`Login falhou: ${loginRes.status} ${JSON.stringify(loginBody)}`);
  }
  const auth = { Authorization: `Bearer ${loginBody.token}` };

  let vid = versaoId;
  if (!vid) {
    const verRes = await fetch(`${API}/projetos/${projetoId}/versoes`, { headers: auth });
    const verBody = await verRes.json();
    const versoes = verBody.versoes || [];
    vid = versoes.sort((a, b) => b.numero - a.numero)[0]?.id;
  }
  if (!vid) throw new Error('Versão não encontrada');

  console.log(`Gerando relatório executivo IA — projeto ${projetoId}, versão ${vid} (pode levar alguns minutos)...`);

  const url = `${API}/dashboard/projeto/${projetoId}/relatorio-ia?reuse=false&versaoId=${vid}`;
  const t0 = Date.now();
  const res = await fetch(url, { method: 'POST', headers: auth });
  const body = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(body).slice(0, 500)}`);

  const cmp = body.dadosUsados?.comparativoVersoes;
  const relatorio = body.relatorio || '';
  const temEvolucaoNoTexto =
    /evolução entre rodadas|evolução entre versões|variação/i.test(relatorio);

  console.log(JSON.stringify({
    ok: true,
    projetoId,
    versaoId: vid,
    fromCache: body.fromCache ?? false,
    relatorioSalvoId: body.relatorioSalvoId,
    comparativoDisponivel: cmp?.disponivel ?? false,
    delta: cmp?.delta ?? null,
    tendencia: cmp?.tendencia ?? null,
    temEvolucaoNoTexto,
    tempoSegundos: Math.round((Date.now() - t0) / 1000),
    provider: body.provider,
    tokens: body.tokens
  }, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
