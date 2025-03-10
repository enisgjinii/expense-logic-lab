import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  ListFilter, 
  Upload, 
  Menu, 
  X,
  CreditCard,
  LogOut,
  UserCircle,
  PieChart,
  Check
} from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { toast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  isActive: boolean;
}

const SidebarItem = ({ icon, label, to, isActive }: SidebarItemProps) => {
  return (
    <Link to={to}>
      <Button 
        variant="ghost" 
        className={cn(
          "w-full justify-start gap-3 p-3 font-normal",
          isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
        )}
      >
        {icon}
        <span>{label}</span>
      </Button>
    </Link>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, themeMode, setThemeMode } = useFinance();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navigationItems = [
    {
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: "Dashboard",
      to: "/",
    },
    {
      icon: <ListFilter className="h-5 w-5" />,
      label: "Transactions",
      to: "/transactions",
    },
    {
      icon: <PieChart className="h-5 w-5" />,
      label: "Budget",
      to: "/budget",
    },
    {
      icon: <Upload className="h-5 w-5" />,
      label: "Import",
      to: "/import",
    },
  ];
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Theme switcher component for mobile dropdown
  const MobileThemeSwitcher = () => (
    <>
      <DropdownMenuItem disabled className="opacity-70">
        Theme
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setThemeMode("light")}>
        Light {themeMode === "light" && <Check className="ml-auto h-4 w-4" />}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setThemeMode("dark")}>
        Dark {themeMode === "dark" && <Check className="ml-auto h-4 w-4" />}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setThemeMode("system")}>
        System {themeMode === "system" && <Check className="ml-auto h-4 w-4" />}
      </DropdownMenuItem>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
        <div className="container flex h-14 items-center">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-primary" />
              <h1 className="font-semibold">Finance Tracker</h1>
            </div>
            
            <div className="flex items-center gap-2">
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full" aria-label="User menu">
                      <UserCircle className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                    <MobileThemeSwitcher />
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle Menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-background md:hidden animate-in">
          <div className="container pt-20 pb-8">
            <nav className="flex flex-col gap-1">
              {navigationItems.map((item, index) => (
                <SidebarItem 
                  key={index}
                  icon={item.icon}
                  label={item.label}
                  to={item.to}
                  isActive={location.pathname === item.to}
                />
              ))}
              
              {user ? (
                <>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 p-3 font-normal mt-4 border-t pt-4"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </Button>
                </>
              ) : (
                <Link to="/auth">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 p-3 font-normal mt-4 border-t pt-4"
                  >
                    <UserCircle className="h-5 w-5" />
                    <span>Login / Sign Up</span>
                  </Button>
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
      
      <div className="flex-1 flex md:container md:pt-4">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 flex-col gap-6 border-r pr-6 pt-4">
          <div className="flex items-center gap-2 px-4">
            <CreditCard className="h-6 w-6 text-primary" />
            <h1 className="font-semibold text-lg">Finance Tracker</h1>
          </div>
          
          <nav className="flex flex-col gap-1">
            {navigationItems.map((item, index) => (
              <SidebarItem 
                key={index}
                icon={item.icon}
                label={item.label}
                to={item.to}
                isActive={location.pathname === item.to}
              />
            ))}
          </nav>
          
          <div className="mt-auto border-t pt-4 px-4 flex flex-col gap-4">
            {user ? (
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 p-3 font-normal"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </Button>
            ) : (
              <Link to="/auth">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 p-3 font-normal"
                >
                  <UserCircle className="h-5 w-5" />
                  <span>Login / Sign Up</span>
                </Button>
              </Link>
            )}
            {/* Desktop Theme Switcher */}
            <div className="border-t pt-4">
              <p className="mb-2 text-sm font-medium">Theme</p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className={cn(themeMode === "light" && "bg-accent text-accent-foreground")}
                  onClick={() => setThemeMode("light")}
                >
                  Light
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={cn(themeMode === "dark" && "bg-accent text-accent-foreground")}
                  onClick={() => setThemeMode("dark")}
                >
                  Dark
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={cn(themeMode === "system" && "bg-accent text-accent-foreground")}
                  onClick={() => setThemeMode("system")}
                >
                  System
                </Button>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 pt-6 md:pt-0 px-4 md:pl-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
