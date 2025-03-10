
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  ListFilter, 
  Upload, 
  Menu, 
  X,
  CreditCard
} from 'lucide-react';

const SidebarItem = ({ 
  icon, 
  label, 
  to, 
  isActive 
}: { 
  icon: React.ReactNode; 
  label: string; 
  to: string; 
  isActive: boolean;
}) => {
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
      icon: <Upload className="h-5 w-5" />,
      label: "Import",
      to: "/import",
    },
  ];
  
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
