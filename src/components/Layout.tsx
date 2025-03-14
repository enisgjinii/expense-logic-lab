
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  BarChart3, 
  LayoutDashboard, 
  Receipt, 
  Tag, 
  FileUp, 
  PieChart, 
  Settings, 
  User, 
  LogOut,
  Menu,
  X,
  Moon,
  Sun
} from 'lucide-react';
import { useTheme } from '@/contexts/useThemeManager';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useFinance();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  
  React.useEffect(() => {
    if (!user && location.pathname !== '/auth') {
      navigate('/auth');
    }
  }, [user, location.pathname, navigate]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const menuItems = [
    { path: '/', label: t('common.dashboard'), icon: <LayoutDashboard size={20} /> },
    { path: '/transactions', label: t('common.transactions'), icon: <Receipt size={20} /> },
    { path: '/categories', label: t('common.categories'), icon: <Tag size={20} /> },
    { path: '/budget', label: t('common.budget'), icon: <BarChart3 size={20} /> },
    { path: '/reports', label: t('common.reports'), icon: <PieChart size={20} /> },
    { path: '/import', label: t('common.import'), icon: <FileUp size={20} /> },
    { path: '/settings', label: t('common.settings'), icon: <Settings size={20} /> },
    { path: '/profile', label: t('common.profile'), icon: <User size={20} /> }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  if (location.pathname === '/auth') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {isMobile && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="fixed top-4 right-4 z-50"
          onClick={toggleMenu}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      )}

      <aside 
        className={`
          bg-background border-r border-border
          ${isMobile ? 'fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out' : 'w-64 flex-shrink-0'}
          ${isMobile && !isMenuOpen ? '-translate-x-full' : 'translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <Link to="/" className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Finance Tracker</span>
            </Link>
          </div>
          
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center space-x-3 px-3 py-2 rounded-md transition-colors
                      ${location.pathname === item.path 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-muted text-foreground/80 hover:text-foreground'}
                    `}
                    onClick={isMobile ? closeMenu : undefined}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="p-4 border-t mt-auto">
            <div className="flex justify-between items-center mb-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme}
                className="rounded-full h-9 w-9"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <LanguageSwitcher />
            </div>
            
            {user && (
              <div className="pt-2 border-t">
                <div className="flex items-center">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.email || t('common.welcome')}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleLogout}
                    className="rounded-full h-9 w-9"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {children}
      </main>

      {isMobile && isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={closeMenu}
        />
      )}
    </div>
  );
};

export default Layout;
