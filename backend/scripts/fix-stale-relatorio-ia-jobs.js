/**
 * Marca jobs IA queued/running obsoletos como failed.
 * Uso: node backend/scripts/fix-stale-relatorio-ia-jobs.js
 */
import { recuperarJobsRelatorioIAOrfaos } from '../src/utils/relatorioIAJobStale.js';

const n = await recuperarJobsRelatorioIAOrfaos();
console.log(JSON.stringify({ ok: true, recuperados: n }, null, 2));
process.exit(0);
