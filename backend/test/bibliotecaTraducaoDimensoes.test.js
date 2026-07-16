import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizarModeloOperacional,
  obterTraducaoDimensao,
  obterTraducaoDimensaoEfetiva,
  dimensaoForaEscopoModeloOperacional,
  filtrarDimensoesPorModeloOperacional,
  blocoTraducaoDimensaoModeloPrompt
} from '../src/utils/bibliotecaTraducaoDimensoes.js';

describe('modelo operacional + biblioteca tradução', () => {
  it('normaliza aliases grt/grs/coe', () => {
    assert.equal(normalizarModeloOperacional('GRT'), 'delivery');
    assert.equal(normalizarModeloOperacional('grs'), 'sustentacao');
    assert.equal(normalizarModeloOperacional('COE-IA'), 'coe');
    assert.equal(normalizarModeloOperacional(''), null);
  });

  it('normaliza aliases sistema / sistema_interno', () => {
    assert.equal(normalizarModeloOperacional('sistema'), 'sistema');
    assert.equal(normalizarModeloOperacional('sistemas'), 'sistema');
    assert.equal(normalizarModeloOperacional('systems'), 'sistema');
    assert.equal(normalizarModeloOperacional('sistema_interno'), 'sistema_interno');
    assert.equal(normalizarModeloOperacional('sistemas_internos'), 'sistema_interno');
    assert.equal(normalizarModeloOperacional('ERP'), 'sistema_interno');
    assert.equal(normalizarModeloOperacional('core_interno'), 'sistema_interno');
  });

  it('normaliza aliases seguranca_informacao', () => {
    assert.equal(normalizarModeloOperacional('seguranca_informacao'), 'seguranca_informacao');
    assert.equal(normalizarModeloOperacional('segurança'), 'seguranca_informacao');
    assert.equal(normalizarModeloOperacional('segurança_da_informação'), 'seguranca_informacao');
    assert.equal(normalizarModeloOperacional('infosec'), 'seguranca_informacao');
    assert.equal(normalizarModeloOperacional('si'), 'seguranca_informacao');
    assert.equal(normalizarModeloOperacional('cyber'), 'seguranca_informacao');
    assert.equal(normalizarModeloOperacional('CISO'), 'seguranca_informacao');
  });

  it('D4 delivery usa DORA; sustentacao proíbe deploy', () => {
    const d = obterTraducaoDimensao('delivery', 'D4');
    const s = obterTraducaoDimensao('sustentacao', 'D4');
    assert.match(d.perguntas_e_metricas.join(' '), /DORA/i);
    assert.match(s.proibido, /deploy/i);
    assert.doesNotMatch(s.perguntas_e_metricas.join(' '), /DORA/i);
  });

  it('defaults do produto não citam clientes fixos', () => {
    const s9 = obterTraducaoDimensao('sustentacao', 'D9');
    assert.doesNotMatch(s9.perguntas_e_metricas.join(' '), /Ipiranga|Araújo|Tagout/i);
    const sis4 = obterTraducaoDimensao('sistema', 'D4');
    const si4 = obterTraducaoDimensao('sistema_interno', 'D4');
    assert.doesNotMatch(sis4.perguntas_e_metricas.join(' '), /Ipiranga|Araújo|Natura|Claro/i);
    assert.doesNotMatch(si4.perguntas_e_metricas.join(' '), /Ipiranga|Araújo|Natura|Claro/i);
  });

  it('override da unidade sobrescreve métricas do default', () => {
    const efetiva = obterTraducaoDimensaoEfetiva(
      {
        modeloOperacional: 'sustentacao',
        traducaoDimensoes: JSON.stringify({
          D4: {
            perguntas_e_metricas: ['FCR do cliente ACME na ferramenta X'],
            proibido: 'Não falar de deploy'
          }
        })
      },
      'D4'
    );
    assert.deepEqual(efetiva.perguntas_e_metricas, ['FCR do cliente ACME na ferramenta X']);
    assert.match(efetiva.proibido, /deploy/i);
    assert.equal(efetiva.fonte, 'default_produto+cadastro_unidade');
  });

  it('D8 fora do escopo no delivery e permanece na sustentacao', () => {
    assert.equal(dimensaoForaEscopoModeloOperacional('delivery', 'D8'), true);
    assert.equal(dimensaoForaEscopoModeloOperacional('sustentacao', 'D8'), false);
    const dims = [
      { codigoFramework: 'D4', area: 'Engenharia' },
      { codigoFramework: 'D8', area: 'Legado' }
    ];
    const filtradas = filtrarDimensoesPorModeloOperacional(dims, {
      modeloOperacional: 'delivery'
    });
    assert.deepEqual(
      filtradas.map((d) => d.codigoFramework),
      ['D4']
    );
  });

  it('prompt de tradução Sustentação/D7 proíbe defeitos/CT', () => {
    const bloco = blocoTraducaoDimensaoModeloPrompt(
      { nome: 'GRS', modeloOperacional: 'sustentacao' },
      { codigoFramework: 'D7', area: 'QA' }
    );
    assert.match(bloco, /PROIBIDO/i);
    assert.match(bloco, /defeitos\/CT/i);
    assert.match(bloco, /falso positivo/i);
  });

  it('infra / desenvolvimento / dados têm léxico distinto em D4', () => {
    const infra = obterTraducaoDimensao('infraestrutura', 'D4');
    const dev = obterTraducaoDimensao('desenvolvimento', 'D4');
    const dados = obterTraducaoDimensao('dados', 'D4');
    assert.match(infra.perguntas_e_metricas.join(' '), /IaC|infra/i);
    assert.match(dev.perguntas_e_metricas.join(' '), /DORA|squad/i);
    assert.match(dados.perguntas_e_metricas.join(' '), /pipeline|dbt|ELT|ETL/i);
    assert.doesNotMatch(infra.perguntas_e_metricas.join(' '), /FCR/i);
    assert.match(dados.proibido || '', /DORA|FCR/i);
  });

  it('sistema / sistema_interno têm léxico distinto de ITSM e cloud', () => {
    const sis = obterTraducaoDimensao('sistema', 'D4');
    const si = obterTraducaoDimensao('sistema_interno', 'D4');
    const sis8 = obterTraducaoDimensao('sistema', 'D8');
    const si8 = obterTraducaoDimensao('sistema_interno', 'D8');
    assert.match(sis.perguntas_e_metricas.join(' '), /aplicações|integração|ciclo de vida|sistemas/i);
    assert.match(si.perguntas_e_metricas.join(' '), /ERP|interno|corporativ/i);
    assert.match(sis.proibido || '', /FCR|service desk|cloud|IaC/i);
    assert.match(si.proibido || '', /ITSM|Delivery/i);
    assert.match(sis8.escopo || '', /PRIMÁRIA/i);
    assert.match(si8.escopo || '', /PRIMÁRIA/i);
    assert.doesNotMatch(sis.perguntas_e_metricas.join(' '), /FCR|Terraform/i);
  });

  it('seguranca_informacao tem D7 primária e léxico infosec', () => {
    const d7 = obterTraducaoDimensao('seguranca_informacao', 'D7');
    const d4 = obterTraducaoDimensao('seguranca_informacao', 'D4');
    const d10 = obterTraducaoDimensao('seguranca_informacao', 'D10');
    assert.match(d7.escopo || '', /PRIMÁRIA/i);
    assert.match(d7.perguntas_e_metricas.join(' '), /vulnerabilidad|IAM|PII|incidente|gate/i);
    assert.match(d7.proibido || '', /defeitos\/CT|FCR|DORA/i);
    assert.match(d4.perguntas_e_metricas.join(' '), /secure SDLC|gate|SAST|remediação/i);
    assert.doesNotMatch(d4.perguntas_e_metricas.join(' '), /FCR|DORA/i);
    assert.match(d10.perguntas_e_metricas.join(' '), /alerta|playbook|HITL|auditab/i);
    assert.doesNotMatch(d10.perguntas_e_metricas.join(' '), /User Story|N1|N2|N3/i);
  });

  it('normaliza aliases infra/dev/dados', () => {
    assert.equal(normalizarModeloOperacional('SRE'), 'infraestrutura');
    assert.equal(normalizarModeloOperacional('engenharia'), 'desenvolvimento');
    assert.equal(normalizarModeloOperacional('data_platform'), 'dados');
  });
});
