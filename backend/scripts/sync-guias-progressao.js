#!/usr/bin/env node
/**
 * Sincroniza guias de progressão D01–D16 (docx → txt) para backend/src/data/guiasProgressao/.
 * Requer macOS textutil ou substitua por pandoc em outros SOs.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(__dirname, '../..');
const origem = path.join(raiz, 'docs/Atual/Dimensoes_Evolucao');
const destino = path.join(raiz, 'backend/src/data/guiasProgressao');

fs.mkdirSync(destino, { recursive: true });

const arquivos = fs
  .readdirSync(origem)
  .filter((f) => /^Guia_Progressao_D\d{2}_/.test(f) && f.endsWith('.docx'));

if (!arquivos.length) {
  console.error('Nenhum Guia_Progressao_D*.docx encontrado em', origem);
  process.exit(1);
}

for (const arquivo of arquivos) {
  const base = arquivo.replace(/\.docx$/, '');
  const saida = path.join(destino, `${base}.txt`);
  const entrada = path.join(origem, arquivo);
  try {
    const texto = execSync(`textutil -convert txt -stdout "${entrada}"`, { encoding: 'utf8' });
    fs.writeFileSync(saida, texto, 'utf8');
    console.log('OK', base);
  } catch (err) {
    console.error('Falha', arquivo, err.message);
    process.exit(1);
  }
}

console.log(`\n${arquivos.length} guia(s) sincronizado(s) em ${destino}`);
