import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, 
  Building2, 
  FolderKanban, 
  ClipboardCheck,
  Package,
  Users,
  Moon,
  Sun,
  LogOut,
  User,
  ChevronDown,
  Settings,
  FileText,
  BarChart3,
  Sparkles,
  Cpu,
  Palette,
  Check,
  Zap,
  Library,
  Layers,
  Activity,
  Mail,
  Gauge,
} from 'lucide-react';
import { useTheme, COLOR_THEMES } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { labelPerfilUsuario } from '../constants/perfilUsuario.js';

function NavDropdown({ label, icon: Icon, items, isAdmin }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  
  const filteredItems = items.filter(item => !item.adminOnly || isAdmin);
  const isActive = filteredItems.some(item => location.pathname === item.to || location.pathname.startsWith(item.to + '/'));

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (filteredItems.length === 0) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
          isActive
            ? 'bg-blue-600/30 text-white font-medium'
            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
        }`}
      >
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 z-[100] mt-1 max-h-[calc(100vh-4.5rem)] w-56 overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {filteredItems.map(({ to, icon: ItemIcon, label: itemLabel }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <ItemIcon className="w-4 h-4" />
              {itemLabel}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { darkMode, toggleDarkMode, colorTheme, changeColorTheme, colorThemes } = useTheme();
  const { usuario, logout, isAdmin, isAvaliador } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const themeMenuRef = useRef(null);
  const ehAvaliador = isAvaliador();

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setThemeMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const cadastrosItems = [
    { to: '/empresas', icon: Building2, label: 'Empresas' },
    { to: '/projetos', icon: FolderKanban, label: 'Projetos' },
    { to: '/produtos', icon: Package, label: 'Produtos IA-First' },
    { to: '/arquiteturas-referencia', icon: Layers, label: 'Arquiteturas de referência' },
    { to: '/usuarios', icon: Users, label: 'Usuários', adminOnly: true },
  ];

  const avaliacoesItems = ehAvaliador
    ? [
        { to: '/avaliacoes', icon: ClipboardCheck, label: 'Avaliações de Maturidade' },
      ]
    : isAdmin()
      ? [
        { to: '/diagnostico-rapido', icon: Zap, label: 'Diagnóstico Rápido (Demo)' },
        { to: '/diagnosticos', icon: BarChart3, label: 'Histórico Diagnósticos' },
        { to: '/avaliacoes', icon: ClipboardCheck, label: 'Avaliações de Maturidade' },
        { to: '/acompanhamento-avaliadores', icon: Users, label: 'Progresso dos avaliadores' },
        { to: '/analise-avaliacoes', icon: BarChart3, label: 'Análise de Avaliações' },
        { to: '/produtos', icon: Package, label: 'Avaliações de Produto' },
      ]
      : [
        { to: '/avaliacoes', icon: ClipboardCheck, label: 'Avaliações de Maturidade' },
        { to: '/acompanhamento-avaliadores', icon: Users, label: 'Progresso dos avaliadores' },
        { to: '/analise-avaliacoes', icon: BarChart3, label: 'Análise de Avaliações' },
        { to: '/produtos', icon: Package, label: 'Avaliações de Produto' },
      ];

  return (
    <div className="min-h-screen page-bg transition-colors duration-300">
      <nav className="nav-themed fixed w-full z-10 shadow-lg transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <NavLink to={ehAvaliador ? '/avaliacoes' : '/'} className="flex items-center gap-3 group">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center shadow-md transition-shadow">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-white text-sm leading-none">SysMap</span>
                  <span className="text-[10px] text-primary-themed-light leading-none">Solutions</span>
                </div>
              </div>
              <div className="h-5 w-px bg-slate-600 mx-1"></div>
              <span className="text-white font-medium text-sm">Blueprint IA</span>
            </NavLink>

            {/* Menu Central */}
            <div className="flex items-center gap-1">
              {/* Dashboard - oculto para avaliadores */}
              {!ehAvaliador && (
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                      isActive
                        ? 'bg-blue-600/30 text-white font-medium'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`
                  }
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </NavLink>
              )}

              {/* Cadastros - oculto para avaliadores */}
              {!ehAvaliador && (
                <NavDropdown 
                  label="Cadastros" 
                  icon={Building2} 
                  items={cadastrosItems}
                  isAdmin={isAdmin()}
                />
              )}

              {ehAvaliador ? (
                <NavLink
                  to="/avaliacoes"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                      isActive
                        ? 'bg-blue-600/30 text-white font-medium'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`
                  }
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Avaliações de Maturidade</span>
                </NavLink>
              ) : (
                <NavDropdown
                  label="Avaliações"
                  icon={ClipboardCheck}
                  items={avaliacoesItems}
                  isAdmin={isAdmin()}
                />
              )}

              {/* Especificações - oculto para avaliadores */}
              {!ehAvaliador && (
                <NavLink
                  to="/especificacoes"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                      isActive
                        ? 'bg-blue-600/30 text-white font-medium'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`
                  }
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Especificações</span>
                </NavLink>
              )}

              {/* Execução - Dropdown com Estágio AI-First e Ranking */}
              {!ehAvaliador && (
                <NavDropdown
                  label="Execução"
                  icon={Zap}
                  isAdmin={isAdmin()}
                  items={[
                    { to: '/estagio-ai-first', icon: Sparkles, label: 'Estágio AI-First' },
                    { to: '/dashboard/prontidao', icon: Gauge, label: 'Prontidão Executiva' },
                    { to: '/dashboard/comparativo-empresa', icon: Building2, label: 'Comparativo por Empresa' },
                    { to: '/dashboard/projetos-ranking', icon: BarChart3, label: 'Ranking Projetos' },
                    { to: '/biblioteca-ia', icon: Library, label: 'Biblioteca de Relatórios IA' },
                  ]}
                />
              )}
            </div>

            {/* Menu Direito */}
            <div className="flex items-center gap-2">
              {/* Seletor de Tema de Cores */}
              <div className="relative" ref={themeMenuRef}>
                <button
                  onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors"
                  aria-label="Mudar tema de cores"
                  title="Tema de cores"
                >
                  <Palette className="w-4 h-4" />
                </button>

                {themeMenuOpen && (
                  <div className="absolute top-full right-0 z-[100] mt-2 max-h-[calc(100vh-4.5rem)] w-64 overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white py-2 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tema Visual</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Escolha cores e estilo</p>
                    </div>
                    <div className="p-2 space-y-1">
                      {Object.values(COLOR_THEMES).map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => {
                            changeColorTheme(theme.id);
                            setThemeMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                            colorTheme === theme.id
                              ? 'bg-gray-100 dark:bg-gray-700 ring-2 ring-offset-1 ring-gray-300 dark:ring-gray-600'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          {/* Preview de 3 cores */}
                          <div className="flex -space-x-1">
                            {theme.preview.map((color, idx) => (
                              <div 
                                key={idx}
                                className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 shadow-sm"
                                style={{ backgroundColor: color, zIndex: 3 - idx }}
                              />
                            ))}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-gray-700 dark:text-gray-200">{theme.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{theme.description}</p>
                          </div>
                          {colorTheme === theme.id && (
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors"
                aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
                title={darkMode ? 'Modo claro' : 'Modo escuro'}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/40 hover:bg-slate-700/60 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {usuario?.nome?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm text-white font-medium leading-none max-w-[100px] truncate">
                      {usuario?.nome?.split(' ')[0]}
                    </p>
                    <p className="text-[10px] text-slate-400 leading-none mt-0.5">
                      {labelPerfilUsuario(usuario?.role)}
                    </p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute top-full right-0 z-[100] mt-1 max-h-[calc(100vh-4.5rem)] w-56 overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{usuario?.nome}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{usuario?.email}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{usuario?.empresa?.nome}</p>
                    </div>
                    {isAdmin() && (
                      <>
                        <NavLink
                          to="/configuracoes/ia"
                          onClick={() => setUserMenuOpen(false)}
                          className={({ isActive }) =>
                            `w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                              isActive
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`
                          }
                        >
                          <Cpu className="w-4 h-4" />
                          Configurações de IA
                        </NavLink>
                        <NavLink
                          to="/observabilidade"
                          onClick={() => setUserMenuOpen(false)}
                          className={({ isActive }) =>
                            `w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                              isActive
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`
                          }
                        >
                          <Activity className="w-4 h-4" />
                          Observabilidade
                        </NavLink>
                        <NavLink
                          to="/admin/email-convite-avaliacao"
                          onClick={() => setUserMenuOpen(false)}
                          className={({ isActive }) =>
                            `w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                              isActive
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`
                          }
                        >
                          <Mail className="w-4 h-4" />
                          E-mail convite avaliação
                        </NavLink>
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair do sistema
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="pt-14">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>
      
      <footer className="border-t border-gray-200 dark:border-gray-700 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">SysMap Solutions</span> — Blueprint IA Assessment de Maturidade
        </div>
      </footer>
    </div>
  );
}
