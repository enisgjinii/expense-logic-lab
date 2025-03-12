import React, { useState, useEffect } from 'react';
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
  Check,
  ChevronRight,
  Settings,
  LineChart,
  User,
  Moon,
  Sun,
  Laptop,
  HelpCircle,
  Tag
} from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { toast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  isActive: boolean;
  count?: number;
  isCollapsed?: boolean;
}

const SidebarItem = ({ icon, label, to, isActive, count, isCollapsed }: SidebarItemProps) => {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to={to}>
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start gap-3 p-3 font-normal relative transition-all duration-200 hover:bg-primary/10",
                isActive ? "bg-primary/15 text-primary" : "hover:bg-accent/50"
              )}
            >
              <div className={cn("flex items-center gap-3", isCollapsed && "justify-center w-full")}>
                {icon}
                {!isCollapsed && <span>{label}</span>}
                {!isCollapsed && count !== undefined && (
                  <Badge variant="secondary" className="ml-auto px-1.5 min-w-5 text-xs">
                    {count}
                  </Badge>
                )}
              </div>
              {isActive && <div className="absolute left-0 top-1/2 w-1 h-8 bg-primary rounded-r-md transform -translate-y-1/2" />}
            </Button>
          </Link>
        </TooltipTrigger>
        {isCollapsed && <TooltipContent side="right">{label}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, themeMode, setThemeMode } = useFinance();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
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
      count: 12,
    },
    {
      icon: <PieChart className="h-5 w-5" />,
      label: "Budget",
      to: "/budget",
    },
    {
      icon: <LineChart className="h-5 w-5" />,
      label: "Reports",
      to: "/reports",
    },
    {
      icon: <Tag className="h-5 w-5" />,
      label: "Categories",
      to: "/categories",
    },
    {
      icon: <Upload className="h-5 w-5" />,
      label: "Import",
      to: "/import",
    },
  ];

  const bottomItems = [
    {
      icon: <User className="h-5 w-5" />,
      label: "Profile",
      to: "/profile",
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: "Settings",
      to: "/settings",
    },
  ];
  
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    localStorage.setItem('sidebarCollapsed', String(!isCollapsed));
  };

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
    
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const MobileThemeSwitcher = () => (
    <>
      <DropdownMenuItem disabled className="opacity-70">
        Theme
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setThemeMode("light")}>
        <Sun className="mr-2 h-4 w-4" />
        Light {themeMode === "light" && <Check className="ml-auto h-4 w-4" />}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setThemeMode("dark")}>
        <Moon className="mr-2 h-4 w-4" />
        Dark {themeMode === "dark" && <Check className="ml-auto h-4 w-4" />}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setThemeMode("system")}>
        <Laptop className="mr-2 h-4 w-4" />
        System {themeMode === "system" && <Check className="ml-auto h-4 w-4" />}
      </DropdownMenuItem>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col">
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
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="rounded-full bg-primary/10 p-1">
                        <UserCircle className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex flex-col space-y-0.5">
                        <p className="text-sm font-medium">{user.email}</p>
                        <p className="text-xs text-muted-foreground">User Account</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
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
      
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-background/95 backdrop-blur-sm md:hidden animate-in">
          <div className="container pt-20 pb-8">
            <nav className="flex flex-col gap-1">
              {navigationItems.map((item, index) => (
                <SidebarItem 
                  key={index}
                  icon={item.icon}
                  label={item.label}
                  to={item.to}
                  isActive={location.pathname === item.to}
                  count={item.count}
                />
              ))}
              
              <div className="my-3 border-t"></div>
              
              {bottomItems.map((item, index) => (
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
        <aside className={cn(
          "hidden md:flex flex-col gap-6 border-r pt-4 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[70px]" : "w-64"
        )}>
          <div className={cn(
            "flex items-center gap-2 px-4", 
            isCollapsed ? "justify-center" : "justify-between"
          )}>
            {!isCollapsed && (
              <>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-primary" />
                  <h1 className="font-semibold text-lg">Finance App</h1>
                </div>
              </>
            )}
            {isCollapsed && <CreditCard className="h-6 w-6 text-primary" />}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar} 
              className={cn("ml-auto hover:bg-primary/10", isCollapsed && "ml-0")}
            >
              <ChevronRight className={cn("h-5 w-5 transition-transform", isCollapsed && "rotate-180")} />
            </Button>
          </div>
          
          <nav className="flex flex-col gap-1 px-2">
            {navigationItems.map((item, index) => (
              <SidebarItem 
                key={index}
                icon={item.icon}
                label={item.label}
                to={item.to}
                isActive={location.pathname === item.to}
                count={item.count}
                isCollapsed={isCollapsed}
              />
            ))}
          </nav>
          
          <div className="mt-auto border-t pt-4 px-2 flex flex-col gap-1">
            {bottomItems.map((item, index) => (
              <SidebarItem
                key={index}
                icon={item.icon}
                label={item.label}
                to={item.to}
                isActive={location.pathname === item.to}
                isCollapsed={isCollapsed}
              />
            ))}
            
            {user ? (
              <Button 
                variant="ghost" 
                className={cn(
                  "justify-start gap-3 p-3 font-normal mt-1 hover:bg-primary/10",
                  isCollapsed && "justify-center"
                )}
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                {!isCollapsed && <span>Logout</span>}
              </Button>
            ) : (
              <Link to="/auth">
                <Button 
                  variant="ghost" 
                  className={cn(
                    "w-full justify-start gap-3 p-3 font-normal hover:bg-primary/10",
                    isCollapsed && "justify-center"
                  )}
                >
                  <UserCircle className="h-5 w-5" />
                  {!isCollapsed && <span>Login</span>}
                </Button>
              </Link>
            )}
            
            {!isCollapsed && (
              <div className="border-t mt-4 pt-4 px-2">
                <p className="mb-2 text-sm font-medium">Theme</p>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={cn("flex items-center gap-1", themeMode === "light" && "bg-accent text-accent-foreground")}
                    onClick={() => setThemeMode("light")}
                  >
                    <Sun className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={cn("flex items-center gap-1", themeMode === "dark" && "bg-accent text-accent-foreground")}
                    onClick={() => setThemeMode("dark")}
                  >
                    <Moon className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={cn("flex items-center gap-1", themeMode === "system" && "bg-accent text-accent-foreground")}
                    onClick={() => setThemeMode("system")}
                  >
                    <Laptop className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
            
            {isCollapsed && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-full justify-center p-3 mt-4"
                  >
                    {themeMode === 'light' ? (
                      <Sun className="h-5 w-5" />
                    ) : themeMode === 'dark' ? (
                      <Moon className="h-5 w-5" />
                    ) : (
                      <Laptop className="h-5 w-5" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right">
                  <DropdownMenuItem onClick={() => setThemeMode("light")}>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light</span>
                    {themeMode === "light" && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setThemeMode("dark")}>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark</span>
                    {themeMode === "dark" && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setThemeMode("system")}>
                    <Laptop className="mr-2 h-4 w-4" />
                    <span>System</span>
                    {themeMode === "system" && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <div className="mt-4 flex justify-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="opacity-60 hover:opacity-100">
                      <HelpCircle className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Help & Support</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </aside>
        
        <main className={cn(
          "flex-1 pt-6 px-4 md:pt-0 md:pl-8 pb-12 overflow-auto",
          isCollapsed && "md:pl-4"
        )}>
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
