
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { LanguageProvider } from './contexts/LanguageContext'

// Detect if RTL styling is needed
const applyDirectionStyles = () => {
  const savedLanguage = localStorage.getItem('app-language');
  const rtlLanguages: string[] = []; // Add RTL language codes if needed in future
  
  if (savedLanguage && rtlLanguages.includes(savedLanguage)) {
    document.documentElement.dir = 'rtl';
    document.documentElement.classList.add('rtl');
  }
};

// Apply direction styles before rendering to avoid flicker
applyDirectionStyles();

// Inject the Lovable script tag if it doesn't exist yet
if (!document.querySelector('script[src="https://cdn.gpteng.co/gptengineer.js"]')) {
  const script = document.createElement('script');
  script.src = 'https://cdn.gpteng.co/gptengineer.js';
  script.type = 'module';
  document.head.appendChild(script);
}

createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);
