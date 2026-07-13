import { executarGeracaoBookSatf } from './satfBookIA.js';
import { isTipoRelatorioIABookSatf } from '../constants/tiposRelatorioIA.js';

let bookSatfDeps = null;

export function registerRelatorioIABookSatfDeps(deps) {
  bookSatfDeps = deps;
}

export function relatorioIABookSatfDepsDisponivel() {
  return Boolean(
    bookSatfDeps?.atualizarProgressoJobBook &&
      bookSatfDeps?.obterVersaoSelecionadaProjeto &&
      bookSatfDeps?.idsAvaliacoesDaVersao
  );
}

export { isTipoRelatorioIABookSatf };

function montarQueryBookSatfInProcess({
  jobId,
  tipo,
  filtroNivelMax,
  versaoId,
  empresaUnidadeId
}) {
  const modoRapido = tipo === 'completo_satf_rapido' || tipo === 'book_unidade_satf_rapido';
  const query = {
    reuse: 'false',
    jobId: String(jobId)
  };
  if (filtroNivelMax == null) {
    query.nivelPrioridadeMapeamentoMaturidade = '0';
  } else {
    query.nivelPrioridadeMapeamentoMaturidade = String(filtroNivelMax);
  }
  if (modoRapido) query.mode = 'rapido';
  if (versaoId) query.projetoVersaoId = String(versaoId);
  if (empresaUnidadeId) query.empresaUnidadeId = String(empresaUnidadeId);
  return query;
}

/**
 * Gera book SATF no mesmo processo do worker — evita deadlock do fetch HTTP para localhost.
 */
export async function gerarBookSatfInProcess({
  projetoId,
  jobId,
  tipo,
  filtroNivelMax,
  versaoId,
  empresaUnidadeId,
  signal
}) {
  if (!relatorioIABookSatfDepsDisponivel()) {
    throw new Error('Deps do book SATF não registradas no startup do servidor');
  }

  const exigeUnidade = tipo === 'book_unidade_satf' || tipo === 'book_unidade_satf_rapido';
  const req = {
    params: { id: String(projetoId) },
    query: montarQueryBookSatfInProcess({
      jobId,
      tipo,
      filtroNivelMax,
      versaoId,
      empresaUnidadeId
    }),
    body: {},
    on() {}
  };

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn, arg) => {
      if (settled) return;
      settled = true;
      fn(arg);
    };

    const onAbort = () => finish(reject, Object.assign(new Error('Cancelado pelo usuário'), { name: 'AbortError' }));
    if (signal?.aborted) {
      onAbort();
      return;
    }
    signal?.addEventListener('abort', onAbort, { once: true });

    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        const code = this.statusCode || 200;
        if (code >= 400) {
          finish(
            reject,
            new Error(body?.error || body?.details || `Book SATF falhou (HTTP ${code})`)
          );
        } else {
          finish(resolve, body);
        }
      }
    };

    executarGeracaoBookSatf(req, res, bookSatfDeps, { exigeUnidade })
      .catch((err) => finish(reject, err))
      .finally(() => signal?.removeEventListener('abort', onAbort));
  });
}
