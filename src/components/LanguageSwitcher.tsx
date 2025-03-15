
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Languages } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Language } from '@/locales';

interface LanguageSwitcherProps {
  variant?: 'default' | 'outline' | 'ghost' | 'icon';
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'outline' }) => {
  const { language, setLanguage, t, availableLanguages } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="sm" className="h-8 gap-1">
          <Languages className="h-4 w-4" />
          {variant !== 'icon' && (
            <span className="hidden md:inline-flex">
              {availableLanguages[language].nativeName}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(availableLanguages).map(([code, lang]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLanguage(code as Language)}
            className={language === code ? "bg-accent" : ""}
          >
            <div className="flex items-center gap-2">
              <span>{lang.nativeName}</span>
              <span className="text-muted-foreground text-xs">({lang.name})</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
