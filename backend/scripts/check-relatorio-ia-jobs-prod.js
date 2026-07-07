#!/usr/bin/env node
/**
 * Consulta jobs de relatório IA em produção (somente leitura).
 * Uso:
 *   API_BASE_URL=https://agentica.sysmap.com.br/api \
 *   VALIDATOR_EMAIL=... VALIDATOR_PASSWORD=... \
 *   node scripts/check-relatorio-ia-jobs-prod.js [projetoId]
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadDotenv() {
  const path = resolve(__dirname, '../.env');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[k]) process.env[k] = v;
  }
}

loadDotenv();

const API = (process.env.API_BASE_URL || 'https://agentica.sysmap.com.br/api').replace(/\/+$/, '');
const EMAIL = process.env.VALIDATOR_EMAIL || process.env.LOGIN_EMAIL;
const PASSWORD = process.env.VALIDATOR_PASSWORD || process.env.LOGIN_PASSWORD;
const projetoId = Number(process.argv[2] || 7);

async function main() {
  if (!EMAIL || !PASSWORD) {
    console.error('Defina VALIDATOR_EMAIL e VALIDATOR_PASSWORD (ou LOGIN_EMAIL/LOGIN_PASSWORD no backend/.env).');
    process.exit(1);
  }

  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, senha: PASSWORD })
  });
  const loginBody = await loginRes.json();
  if (!loginRes.ok || !loginBody.token) {
    console.error('Login falhou:', loginRes.status, loginBody.error || loginBody);
    process.exit(1);
  }

  const auth = { Authorization: `Bearer ${loginBody.token}` };
  const jobsRes = await fetch(`${API}/relatorios-ia-jobs?projetoId=${projetoId}&limit=15`, { headers: auth });
  const jobs = await jobsRes.json();
  if (!jobsRes.ok) {
    console.error('Erro ao listar jobs:', jobsRes.status, jobs);
    process.exit(1);
  }

  const list = Array.isArray(jobs) ? jobs : [];
  const ativos = list.filter((j) => j.status === 'queued' || j.status === 'running');
  const ultimo = list[0] || null;

  console.log(JSON.stringify({
    ok: true,
    projetoId,
    releaseInfo: (await (await fetch(`${API}/release-info`)).json()).releaseId,
    jobsAtivos: ativos.length,
    ativos: ativos.map((j) => ({
      id: j.id,
      tipo: j.tipo,
      status: j.status,
      progresso: j.progresso,
      etapa: j.etapa,
      startedAt: j.startedAt,
      relatorioId: j.relatorio?.id ?? null,
      relatorioVersao: j.relatorio?.versao ?? null
    })),
    ultimoJob: ultimo
      ? {
          id: ultimo.id,
          tipo: ultimo.tipo,
          status: ultimo.status,
          progresso: ultimo.progresso,
          etapa: ultimo.etapa,
          erro: ultimo.erro || null,
          createdAt: ultimo.createdAt,
          finishedAt: ultimo.finishedAt || null,
          relatorioVersao: ultimo.relatorio?.versao ?? null
        }
      : null
  }, null, 2));
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
