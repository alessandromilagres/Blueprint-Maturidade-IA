/**
 * Seed para configurações de custo por perfil profissional
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const configuracoesCusto = [
  { perfil: 'dev_junior', descricao: 'Desenvolvedor Júnior', custoHora: 80, ativo: true },
  { perfil: 'dev_pleno', descricao: 'Desenvolvedor Pleno', custoHora: 120, ativo: true },
  { perfil: 'dev_senior', descricao: 'Desenvolvedor Sênior', custoHora: 180, ativo: true },
  { perfil: 'tech_lead', descricao: 'Tech Lead', custoHora: 220, ativo: true },
  { perfil: 'arquiteto', descricao: 'Arquiteto de Software', custoHora: 280, ativo: true },
  { perfil: 'po', descricao: 'Product Owner', custoHora: 200, ativo: true },
  { perfil: 'designer', descricao: 'Designer UX/UI', custoHora: 150, ativo: true },
  { perfil: 'qa', descricao: 'QA Engineer', custoHora: 100, ativo: true },
  { perfil: 'devops', descricao: 'DevOps Engineer', custoHora: 180, ativo: true },
  { perfil: 'data_scientist', descricao: 'Data Scientist', custoHora: 200, ativo: true },
  { perfil: 'ml_engineer', descricao: 'ML Engineer', custoHora: 220, ativo: true },
];

async function seedCustos() {
  console.log('Criando configurações de custo...');
  
  for (const config of configuracoesCusto) {
    await prisma.configuracaoCusto.upsert({
      where: { perfil: config.perfil },
      update: config,
      create: config
    });
  }
  
  console.log(`${configuracoesCusto.length} configurações de custo criadas/atualizadas.`);
}

seedCustos()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
