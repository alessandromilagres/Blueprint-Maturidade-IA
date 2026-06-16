import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ActivityProvider } from './contexts/ActivityContext';
import { ToastProvider } from './contexts/ToastContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Empresas from './pages/Empresas';
import EmpresaDetalhe from './pages/EmpresaDetalhe';
import Projetos from './pages/Projetos';
import ProjetoDetalhe from './pages/ProjetoDetalhe';
import ProjetoDesejosIaDashboard from './pages/ProjetoDesejosIaDashboard';
import Avaliacoes from './pages/Avaliacoes';
import AvaliacaoForm from './pages/AvaliacaoForm';
import AvaliacaoConcluida from './pages/AvaliacaoConcluida';
import Relatorio from './pages/Relatorio';
import RelatorioExecutivo from './pages/RelatorioExecutivo';
import RelatorioMITIA from './pages/RelatorioMITIA';
import RelatorioMITIACompleto from './pages/RelatorioMITIACompleto';
import RelatoriosIABiblioteca from './pages/RelatoriosIABiblioteca';
import DashboardProjeto from './pages/DashboardProjeto';
import DashboardEmpresa from './pages/DashboardEmpresa';
import DashboardProntidao from './pages/DashboardProntidao';
import PlanoAcaoProjeto from './pages/PlanoAcaoProjeto';
import EvolucaoProjeto from './pages/EvolucaoProjeto';
import ComparativoEmpresa from './pages/ComparativoEmpresa';
import Produtos from './pages/Produtos';
import ProdutoForm from './pages/ProdutoForm';
import ProdutoDetalhe from './pages/ProdutoDetalhe';
import AvaliacaoProdutoForm from './pages/AvaliacaoProdutoForm';
import DashboardProduto from './pages/DashboardProduto';
import DashboardProjetosRanking from './pages/DashboardProjetosRanking';
import DashboardProjetoProdutos from './pages/DashboardProjetoProdutos';
import DashboardProjetoFinanceiro from './pages/DashboardProjetoFinanceiro';
import Usuarios from './pages/Usuarios';
import ConviteAvaliacao from './pages/ConviteAvaliacao';
import AcessoMagicLink from './pages/AcessoMagicLink';
import EspecificacaoProduto from './pages/EspecificacaoProduto';
import IdealizacaoProduto from './pages/IdealizacaoProduto';
import ProdutoEscolhaModelo from './pages/ProdutoEscolhaModelo';
import Especificacoes from './pages/Especificacoes';
import ConfiguracoesIA from './pages/ConfiguracoesIA';
import DiagnosticoRapido from './pages/DiagnosticoRapido';
import DiagnosticoRelatorio from './pages/DiagnosticoRelatorio';
import DiagnosticosLista from './pages/DiagnosticosLista';
import EstagioAIFirst from './pages/EstagioAIFirst';
import ArquiteturasReferenciaLista from './pages/ArquiteturasReferenciaLista';
import ArquiteturaReferenciaForm from './pages/ArquiteturaReferenciaForm';
import Observabilidade from './pages/Observabilidade';
import AcompanhamentoAvaliadores from './pages/AcompanhamentoAvaliadores';
import AnaliseAvaliacoes from './pages/AnaliseAvaliacoes';
import AdminEmailConviteAvaliacao from './pages/AdminEmailConviteAvaliacao';
import AvaliadorEntrada from './pages/AvaliadorEntrada';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <BrowserRouter>
        <ActivityProvider>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/avaliacao/acesso/:token" element={<AcessoMagicLink />} />
          <Route path="/avaliacao-convite/:token" element={<ConviteAvaliacao />} />
          
          {/* Diagnóstico Rápido - Público (demonstração sem login) */}
          <Route path="/diagnostico-rapido" element={<DiagnosticoRapido />} />
          <Route path="/diagnostico-rapido/:id" element={<DiagnosticoRapido />} />
          <Route path="/diagnostico-rapido/:id/relatorio" element={<DiagnosticoRelatorio />} />
          
          {/* Dashboards específicos (sem Layout padrão, mas protegidos) */}
          <Route path="/dashboard/projeto/:id" element={<PrivateRoute><DashboardProjeto /></PrivateRoute>} />
          <Route path="/dashboard/projeto/:id/plano-acao" element={<PrivateRoute><PlanoAcaoProjeto /></PrivateRoute>} />
          <Route path="/dashboard/projeto/:id/evolucao" element={<PrivateRoute><EvolucaoProjeto /></PrivateRoute>} />
          <Route path="/dashboard/empresa/:id" element={<PrivateRoute><DashboardEmpresa /></PrivateRoute>} />
          <Route path="/dashboard/produto/:id" element={<PrivateRoute><DashboardProduto /></PrivateRoute>} />
          <Route path="/dashboard/projetos-ranking" element={<PrivateRoute><DashboardProjetosRanking /></PrivateRoute>} />
          <Route path="/dashboard/projeto-produtos/:id" element={<PrivateRoute><DashboardProjetoProdutos /></PrivateRoute>} />
          <Route path="/dashboard/projeto-financeiro/:id" element={<PrivateRoute><DashboardProjetoFinanceiro /></PrivateRoute>} />
          <Route path="/avaliador/entrada" element={<PrivateRoute><AvaliadorEntrada /></PrivateRoute>} />
          
          {/* Rotas com Layout padrão (protegidas) */}
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="empresas" element={<Empresas />} />
            <Route path="empresas/:id" element={<EmpresaDetalhe />} />
            <Route path="projetos" element={<Projetos />} />
            <Route path="projetos/:id/desejos-ia" element={<ProjetoDesejosIaDashboard />} />
            <Route path="projetos/:id" element={<ProjetoDetalhe />} />
            <Route path="avaliacoes" element={<Avaliacoes />} />
            <Route path="acompanhamento-avaliadores" element={<AcompanhamentoAvaliadores />} />
            <Route path="analise-avaliacoes" element={<AnaliseAvaliacoes />} />
            <Route path="avaliacoes/:id" element={<AvaliacaoForm />} />
            <Route path="avaliacao-concluida/:id" element={<AvaliacaoConcluida />} />
            <Route path="dashboard/prontidao" element={<DashboardProntidao />} />
            <Route path="dashboard/comparativo-empresa" element={<ComparativoEmpresa />} />
            <Route path="diagnosticos" element={<DiagnosticosLista />} />
            <Route path="relatorios/:id" element={<Relatorio />} />
            <Route path="relatorios/:id/executivo" element={<RelatorioExecutivo />} />
            <Route path="relatorios/:id/mit-ia" element={<RelatorioMITIA />} />
            <Route path="relatorios/:id/mit-ia-completo" element={<RelatorioMITIACompleto />} />
            <Route path="biblioteca-ia" element={<RelatoriosIABiblioteca />} />
            {/* Módulo de Produto IA-First */}
            <Route path="produtos" element={<Produtos />} />
            <Route path="produtos/novo" element={<ProdutoEscolhaModelo />} />
            <Route path="produtos/novo/:modeloCriacao" element={<ProdutoForm />} />
            <Route path="produtos/:id/editar" element={<ProdutoForm />} />
            <Route path="produtos/:id/idealizacao" element={<IdealizacaoProduto />} />
            <Route path="produtos/:id/especificacao" element={<EspecificacaoProduto />} />
            <Route path="produtos/:id" element={<ProdutoDetalhe />} />
            <Route path="avaliacoes-produto/:id" element={<AvaliacaoProdutoForm />} />
            {/* Especificações */}
            <Route path="especificacoes" element={<Especificacoes />} />
            {/* Gestão de Usuários */}
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="observabilidade" element={<AdminRoute><Observabilidade /></AdminRoute>} />
            <Route path="admin/email-convite-avaliacao" element={<AdminRoute><AdminEmailConviteAvaliacao /></AdminRoute>} />
            <Route path="arquiteturas-referencia" element={<ArquiteturasReferenciaLista />} />
            <Route path="arquiteturas-referencia/nova" element={<ArquiteturaReferenciaForm />} />
            <Route path="arquiteturas-referencia/:id/editar" element={<ArquiteturaReferenciaForm />} />
            {/* Configurações */}
            <Route path="configuracoes/ia" element={<ConfiguracoesIA />} />
            {/* Estágio AI-First */}
            <Route path="estagio-ai-first" element={<EstagioAIFirst />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        </ActivityProvider>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
