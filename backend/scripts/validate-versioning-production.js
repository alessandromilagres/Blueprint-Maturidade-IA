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
    : await response.arrayBuffer();
  if (!response.ok) {
    const payload = body instanceof ArrayBuffer ? `${body.byteLength} bytes` : JSON.stringify(body);
    throw new Error(`${options.method || 'GET'} ${path} -> ${response.status}: ${payload}`);
  }
  return { response, body };
}

async function checkTables() {
  const requiredTables = [
    'ProjetoVersao',
    'ProjetoVersaoAvaliacao',
    'ProjetoVersaoConvite',
    'AvaliacaoEvento'
  ];
  const rows = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('ProjetoVersao', 'ProjetoVersaoAvaliacao', 'ProjetoVersaoConvite', 'AvaliacaoEvento')
  `;
  const existing = new Set(rows.map((row) => row.table_name));
  const missing = requiredTables.filter((table) => !existing.has(table));
  record('db.requiredTables', missing.length === 0, { missing, found: [...existing] });

  const columnRows = await prisma.$queryRaw`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('ProjetoVersao', 'ProjetoVersaoAvaliacao', 'ProjetoVersaoConvite', 'AvaliacaoEvento')
  `;
  const columnsByTable = columnRows.reduce((acc, row) => {
    if (!acc[row.table_name]) acc[row.table_name] = new Set();
    acc[row.table_name].add(row.column_name);
    return acc;
  }, {});
  const requiredColumns = {
    ProjetoVersao: ['id', 'projetoId', 'numero', 'titulo', 'status', 'iniciadaEm', 'fechadaEm'],
    ProjetoVersaoAvaliacao: ['avaliacaoId', 'projetoVersaoId'],
    ProjetoVersaoConvite: ['conviteId', 'projetoVersaoId'],
    AvaliacaoEvento: ['id', 'tipo', 'projetoId', 'usuarioId', 'metadata', 'createdAt']
  };
  const missingColumns = Object.entries(requiredColumns).flatMap(([table, columns]) =>
    columns
      .filter((column) => !columnsByTable[table]?.has(column))
      .map((column) => `${table}.${column}`)
  );
  record('db.requiredColumns', missingColumns.length === 0, { missing: missingColumns });
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

async function checkReadonlyVersionFlow(token) {
  const auth = { Authorization: `Bearer ${token}` };
  const { body: projetos } = await api('/projetos', { headers: auth });
  if (!Array.isArray(projetos) || projetos.length === 0) {
    warn('Nenhum projeto encontrado para smoke test read-only.');
    record('api.projectsAvailable', true, { count: 0 });
    return;
  }
  record('api.projectsAvailable', true, { count: projetos.length });

  let selected = null;
  let versoesData = null;
  for (const projeto of projetos) {
    const { body } = await api(`/projetos/${projeto.id}/versoes`, { headers: auth });
    if ((body.versoes || []).length > 0) {
      selected = projeto;
      versoesData = body;
      break;
    }
  }

  if (!selected) {
    warn('Nenhum projeto com versões encontrado; rode com --mutate para validar ações em projeto temporário.');
    record('api.versionedProjectAvailable', true, { count: 0 });
    return;
  }

  const versoes = versoesData.versoes || [];
  const missingPayload = versoes.flatMap((versao) => {
    const missing = [];
    if (!versao.checklistFechamento) missing.push('checklistFechamento');
    if (!versao.resumoExecutivo) missing.push('resumoExecutivo');
    if (!Array.isArray(versao.avaliacaoIds)) missing.push('avaliacaoIds');
    return missing.map((field) => `${versao.id}.${field}`);
  });
  record('api.versionPayload', missingPayload.length === 0, {
    projetoId: selected.id,
    projetoNome: selected.nome,
    versoes: versoes.length,
    missing: missingPayload
  });

  const versaoTeste = versoes.find((v) => (v.avaliacaoFinalizadaIds || []).length > 0) || versoes[0];
  const { body: dashboard } = await api(`/dashboard/projeto/${selected.id}?versaoId=${versaoTeste.id}`, { headers: auth });
  record('api.dashboardByVersion', Number(dashboard.projetoVersao?.id) === Number(versaoTeste.id), {
    expectedVersionId: versaoTeste.id,
    returnedVersionId: dashboard.projetoVersao?.id || null
  });

  const { body: zipBody } = await api(`/exportar/versao/${selected.id}/${versaoTeste.id}/zip`, { headers: auth });
  record('api.versionZipExport', zipBody.byteLength > 100, {
    projetoId: selected.id,
    versaoId: versaoTeste.id,
    bytes: zipBody.byteLength
  });
}

async function checkMutationFlow(token) {
  const auth = { Authorization: `Bearer ${token}` };
  const jsonAuth = { ...auth, 'Content-Type': 'application/json' };
  const { body: empresas } = await api('/empresas', { headers: auth });
  if (!Array.isArray(empresas) || empresas.length === 0) {
    fail('mutation.companyAvailable', 'Nenhuma empresa disponível para criar projeto temporário.');
    return;
  }

  let projeto = null;
  try {
    const { body } = await api('/projetos', {
      method: 'POST',
      headers: jsonAuth,
      body: JSON.stringify({
        nome: `Validador Versionamento ${Date.now()}`,
        descricao: 'Projeto temporário criado pelo validador de versionamento.',
        status: 'ativo',
        empresaId: empresas[0].id
      })
    });
    projeto = body;

    let { body: versoesData } = await api(`/projetos/${projeto.id}/versoes`, { headers: auth });
    const v1 = versoesData.versaoAtual || versoesData.versoes?.[0];
    if (!v1?.id || v1.status !== 'aberta') throw new Error('Versão inicial não está aberta.');

    const { body: fechada } = await api(`/projetos/${projeto.id}/versoes/${v1.id}/fechar`, {
      method: 'POST',
      headers: auth
    });
    if (fechada.status !== 'fechada') throw new Error('Fechamento não retornou status fechada.');

    const { body: v2 } = await api(`/projetos/${projeto.id}/versoes`, {
      method: 'POST',
      headers: jsonAuth,
      body: JSON.stringify({ titulo: 'Rodada Validada 2' })
    });
    if (v2.status !== 'aberta' || Number(v2.numero) !== 2) throw new Error('Criação da próxima versão falhou.');

    const { body: reaberta } = await api(`/projetos/${projeto.id}/versoes/${v1.id}/reabrir`, {
      method: 'POST',
      headers: jsonAuth,
      body: JSON.stringify({ motivo: 'Validação automatizada antes de produção' })
    });
    if (reaberta.status !== 'aberta') throw new Error('Reabertura não retornou status aberta.');

    ({ body: versoesData } = await api(`/projetos/${projeto.id}/versoes`, { headers: auth }));
    const abertas = (versoesData.versoes || []).filter((v) => v.status === 'aberta');
    if (abertas.length !== 1 || Number(abertas[0].id) !== Number(v1.id)) {
      throw new Error(`Regra de versão única aberta falhou: ${JSON.stringify(abertas)}`);
    }

    record('mutation.versionLifecycle', true, {
      projetoTemporarioId: projeto.id,
      steps: ['createProject', 'initialVersion', 'closeVersion', 'createNextVersion', 'reopenVersion', 'singleOpenVersion']
    });
  } catch (error) {
    fail('mutation.versionLifecycle', error.message, { projetoTemporarioId: projeto?.id || null });
  } finally {
    if (projeto?.id) {
      try {
        await api(`/projetos/${projeto.id}`, { method: 'DELETE', headers: auth });
        record('mutation.cleanup', true, { projetoTemporarioId: projeto.id });
      } catch (error) {
        fail('mutation.cleanup', error.message, { projetoTemporarioId: projeto.id });
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
      await checkReadonlyVersionFlow(token);
    } catch (error) {
      fail('api.readonlyVersionFlow', error.message);
    }
    if (SHOULD_MUTATE) {
      await checkMutationFlow(token);
    } else {
      warn('Teste mutável não executado. Use --mutate ou VALIDATOR_MUTATION=1 para validar fechar/criar/reabrir em projeto temporário.');
    }
  }
}

await main();
await prisma.$disconnect();

console.log(JSON.stringify(results, null, 2));

if (!results.ok) {
  process.exit(1);
}
