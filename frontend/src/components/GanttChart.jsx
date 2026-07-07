/**
 * Gantt leve e sem dependências (CSS grid + divs).
 * Decisão de arquitetura: evitar libs com licença comercial/GPL (ex.: @dhtmlx/gantt).
 * Agrupa por "grupos" (a lente ativa do roadmap) e posiciona barras na linha do tempo.
 */
import { useMemo } from 'react';

const STATUS_COR = {
  backlog: 'bg-gray-400',
  planejada: 'bg-blue-500',
  em_andamento: 'bg-amber-500',
  concluida: 'bg-emerald-500',
  cancelada: 'bg-red-400'
};

const STATUS_LABEL = {
  backlog: 'Backlog',
  planejada: 'Planejada',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada'
};

function inicioMes(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function proximoMes(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

function formatMesAno(d) {
  return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}

export default function GanttChart({ grupos = [], onSelecionar }) {
  const todas = useMemo(() => grupos.flatMap((g) => g.iniciativas || []), [grupos]);

  const { inicio, fim, meses, spanMs } = useMemo(() => {
    const datas = [];
    for (const ini of todas) {
      if (ini.dataInicio) datas.push(new Date(ini.dataInicio));
      if (ini.dataFimPrevista) datas.push(new Date(ini.dataFimPrevista));
    }
    let min;
    let max;
    if (datas.length === 0) {
      const ano = new Date().getFullYear();
      min = new Date(ano, 0, 1);
      max = new Date(ano, 11, 31);
    } else {
      min = inicioMes(new Date(Math.min(...datas.map((d) => d.getTime()))));
      max = new Date(Math.max(...datas.map((d) => d.getTime())));
    }
    // Garante ao menos 3 meses de janela
    if (max.getTime() - min.getTime() < 1000 * 60 * 60 * 24 * 80) {
      max = new Date(min.getFullYear(), min.getMonth() + 3, 0);
    }
    const listaMeses = [];
    let cursor = inicioMes(min);
    const limite = proximoMes(max);
    while (cursor < limite && listaMeses.length < 48) {
      listaMeses.push(new Date(cursor));
      cursor = proximoMes(cursor);
    }
    const inicioReal = listaMeses[0];
    const fimReal = proximoMes(listaMeses[listaMeses.length - 1]);
    return {
      inicio: inicioReal,
      fim: fimReal,
      meses: listaMeses,
      spanMs: fimReal.getTime() - inicioReal.getTime()
    };
  }, [todas]);

  function posicaoBarra(ini) {
    if (!ini.dataInicio && !ini.dataFimPrevista) return null;
    const di = ini.dataInicio ? new Date(ini.dataInicio) : new Date(ini.dataFimPrevista);
    const df = ini.dataFimPrevista ? new Date(ini.dataFimPrevista) : new Date(ini.dataInicio);
    const left = Math.max(0, ((di.getTime() - inicio.getTime()) / spanMs) * 100);
    const right = Math.min(100, ((df.getTime() - inicio.getTime()) / spanMs) * 100);
    const width = Math.max(2, right - left);
    return { left: `${left}%`, width: `${width}%` };
  }

  if (todas.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Nenhuma iniciativa para exibir na timeline. Crie iniciativas ou importe do roadmap IA.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px]">
        {/* Cabeçalho de meses */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <div className="w-56 shrink-0 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
            Iniciativa
          </div>
          <div className="flex-1 flex">
            {meses.map((m, i) => (
              <div
                key={i}
                className="flex-1 text-center text-[10px] py-2 text-gray-500 dark:text-gray-400 border-l border-gray-100 dark:border-gray-800"
              >
                {formatMesAno(m)}
              </div>
            ))}
          </div>
        </div>

        {grupos.map((grupo) => (
          <div key={grupo.chave}>
            <div
              className={`flex items-center px-3 py-1.5 text-xs font-semibold border-b border-gray-100 dark:border-gray-800 ${
                grupo.critico
                  ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                  : 'bg-gray-50 text-gray-600 dark:bg-gray-800/50 dark:text-gray-300'
              }`}
            >
              {grupo.rotulo}
              {grupo.critico && <span className="ml-2 text-[10px] font-normal">(zona crítica · score &lt; 2,5)</span>}
              <span className="ml-auto text-[10px] font-normal text-gray-400">
                {grupo.iniciativas.length} {grupo.iniciativas.length === 1 ? 'iniciativa' : 'iniciativas'}
              </span>
            </div>

            {grupo.iniciativas.map((ini) => {
              const pos = posicaoBarra(ini);
              return (
                <div
                  key={ini.id}
                  className="flex items-center border-b border-gray-50 dark:border-gray-800/60 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 cursor-pointer"
                  onClick={() => onSelecionar?.(ini)}
                >
                  <div className="w-56 shrink-0 px-3 py-2">
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate" title={ini.titulo}>
                      {ini.titulo}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">{ini.responsavel || 'Sem responsável'}</p>
                  </div>
                  <div className="flex-1 relative h-9">
                    {/* grade de meses */}
                    <div className="absolute inset-0 flex">
                      {meses.map((_, i) => (
                        <div key={i} className="flex-1 border-l border-gray-100 dark:border-gray-800" />
                      ))}
                    </div>
                    {pos ? (
                      <div
                        className={`absolute top-1.5 h-6 rounded ${STATUS_COR[ini.status] || 'bg-gray-400'} shadow-sm flex items-center overflow-hidden`}
                        style={pos}
                        title={`${ini.titulo} — ${STATUS_LABEL[ini.status] || ini.status} (${ini.progresso || 0}%)`}
                      >
                        <div
                          className="h-full bg-black/20"
                          style={{ width: `${Math.max(0, Math.min(100, ini.progresso || 0))}%` }}
                        />
                        <span className="absolute left-1.5 text-[10px] text-white font-medium truncate pr-1">
                          {ini.progresso ? `${ini.progresso}%` : ''}
                        </span>
                      </div>
                    ) : (
                      <span className="absolute left-2 top-2.5 text-[10px] text-gray-400 italic">sem datas</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 mt-3 px-3">
        {Object.entries(STATUS_LABEL).map(([k, label]) => (
          <span key={k} className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
            <span className={`w-3 h-3 rounded ${STATUS_COR[k]}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
