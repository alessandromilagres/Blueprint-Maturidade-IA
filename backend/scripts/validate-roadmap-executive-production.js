import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const API_BASE_URL = (process.env.API_BASE_URL || 'http://localhost:3001/api').replace(/\/+$/, '');
const LOGIN_EMAIL = process.env.VALIDATOR_EMAIL || process.env.LOGIN_EMAIL;
const LOGIN_PASSWORD = process.env.VALIDATOR_PASSWORD || process.env.LOGIN_PASSWORD;
const SHOULD_MUTATE = process.argv.includes('--mutate') || process.env.VALIDATOR_MUTATION === '1';

const results = {
  ok: true,
  apiBaseUrl: API_BASE_URL,
  mutate: SHOULD_MUTATE,
  checks: [],
  warnings: []
};

function record(name, ok, details = {}) {
  results.checks.push({ name, ok, ...details });
  if (!ok) results.ok = false;
}

function warn(message, details = {}) {
  results.warnings.push({ message, ...details });
}

function fail(name, message, details = {}) {
  record(name, false, { message, ...details });
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text();
  if (!response.ok) {
    const payload = typeof body === 'string' ? body.slice(0, 500) : JSON.stringify(body);
    throw new Error(`${options.method || 'GET'} ${path} -> ${response.status}: ${payload}`);
  }
  return { response, body };
}

async function checkTables() {
  const rows = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Iniciativa'
  `;
  record('db.iniciativaTable', rows.length > 0, { found: rows.map((r) => r.table_name) });

  const columnRows = await prisma.$queryRaw`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Iniciativa'
  `;
  const columns = new Set(columnRows.map((r) => r.column_name));
  const required = [
    'id', 'projetoId', 'projetoVersaoId', 'contextoTipo', 'contextoId', 'titulo',
    'status', 'prioridade', 'progresso', 'gapVinculado', 'scoreAlvo', 'roiEstimado'
  ];
  const missing = required.filter((c) => !columns.has(c));
  record('db.iniciativaColumns', missing.length === 0, { missing });
}

async function login() {
  if (!LOGIN_EMAIL || !LOGIN_PASSWORD) {
    throw new Error('Defina VALIDATOR_EMAIL e VALIDATOR_PASSWORD para autenticar na API.');
  }
  const { body } = await api('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LOGIN_EMAIL, senha: LOGIN_PASSWORD })
  });
  if (!body.token) throw new Error('Login não retornou token.');
  record('api.login', true, { email: LOGIN_EMAIL });
  return body.token;
}

async function pickProjeto(auth) {
  const { body: projetos } = await api('/projetos', { headers: auth });
  if (!Array.isArray(projetos) || projetos.length === 0) {
    warn('Nenhum projeto encontrado para smoke test read-only.');
    return null;
  }
  record('api.projectsAvailable', true, { count: projetos.length });
  return projetos[0];
}

async function checkReadonlyFlow(token) {
  const auth = { Authorization: `Bearer ${token}` };
  const projeto = await pickProjeto(auth);
  if (!projeto) return;

  const projetoId = projeto.id;

  const { body: iniciativas } = await api(`/iniciativas?projetoId=${projetoId}`, { headers: auth });
  record('api.iniciativas.list', Array.isArray(iniciativas), { count: iniciativas.length, projetoId });

  const { response: csvResp } = await api(`/iniciativas/export?projetoId=${projetoId}`, { headers: auth });
  const csvType = csvResp.headers.get('content-type') || '';
  record('api.iniciativas.exportCsv', csvType.includes('text/csv') || csvType.includes('text/plain'), {
    contentType: csvType,
    projetoId
  });

  const { body: executive } = await api(`/projetos/${projetoId}/executive-dashboard`, { headers: auth });
  record('api.executiveDashboard', executive?.projeto?.id === projetoId, {
    scoreGeral: executive?.scoreGeral,
    totalIniciativas: executive?.totalIniciativas
  });

  const { body: commandCenter } = await api(`/projetos/${projetoId}/produtos-command-center`, { headers: auth });
  record('api.produtosCommandCenter', commandCenter?.projeto?.id === projetoId, {
    totalProdutos: commandCenter?.kpis?.totalProdutos
  });

  const { response: execMd } = await api(`/exportar/executive-dashboard/${projetoId}`, { headers: auth });
  const execMdType = execMd.headers.get('content-type') || '';
  record('api.export.executiveDashboardMd', execMdType.includes('text/markdown'), { contentType: execMdType });

  const { response: ccMd } = await api(`/exportar/produtos-command-center/${projetoId}`, { headers: auth });
  const ccMdType = ccMd.headers.get('content-type') || '';
  record('api.export.produtosCommandCenterMd', ccMdType.includes('text/markdown'), { contentType: ccMdType });
}

async function checkMutationFlow(token) {
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const projeto = await pickProjeto(auth);
  if (!projeto) return;

  const projetoId = projeto.id;
  let criadaId = null;

  try {
    const { body: criada } = await api('/iniciativas', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({
        projetoId,
        contextoTipo: 'dimensao',
        contextoId: 'D01',
        contextoRotulo: 'Validação automatizada',
        titulo: `[VALIDATOR] Iniciativa temporária ${Date.now()}`,
        status: 'backlog',
        prioridade: 'media',
        progresso: 0
      })
    });
    criadaId = criada?.id;
    if (!criadaId) throw new Error('POST /iniciativas não retornou id.');

    const { body: atualizada } = await api(`/iniciativas/${criadaId}`, {
      method: 'PUT',
      headers: auth,
      body: JSON.stringify({ progresso: 10, status: 'planejada' })
    });
    if (Number(atualizada?.progresso) !== 10) {
      throw new Error('PUT /iniciativas não persistiu progresso.');
    }

    record('mutation.iniciativaCrud', true, { projetoId, iniciativaId: criadaId });
  } catch (error) {
    fail('mutation.iniciativaCrud', error.message, { projetoId, iniciativaId: criadaId });
  } finally {
    if (criadaId) {
      try {
        await api(`/iniciativas/${criadaId}`, { method: 'DELETE', headers: auth });
        record('mutation.cleanup', true, { iniciativaId: criadaId });
      } catch (error) {
        fail('mutation.cleanup', error.message, { iniciativaId: criadaId });
      }
    }
  }
}

async function main() {
  try {
    await api('/health');
    record('api.health', true);
  } catch (error) {
    fail('api.health', error.message);
  }

  try {
    await checkTables();
  } catch (error) {
    fail('db.schema', error.message);
  }

  let token = null;
  try {
    token = await login();
  } catch (error) {
    fail('api.login', error.message);
  }

  if (token) {
    try {
      await checkReadonlyFlow(token);
    } catch (error) {
      fail('api.readonlyRoadmapExecutiveFlow', error.message);
    }
    if (SHOULD_MUTATE) {
      await checkMutationFlow(token);
    } else {
      warn('Teste mutável não executado. Use --mutate ou VALIDATOR_MUTATION=1 para validar CRUD de iniciativas.');
    }
  }
}

await main();
await prisma.$disconnect();

console.log(JSON.stringify(results, null, 2));

if (!results.ok) {
  process.exit(1);
}
