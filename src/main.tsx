
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { FinanceProvider } from './contexts/FinanceContext'
import { ThemeProvider } from './contexts/useThemeManager'
import { Toaster } from './components/ui/toaster'
import { Toaster as SonnerToaster } from 'sonner'
import { LanguageProvider } from './contexts/LanguageContext'
import './i18n/i18n'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <FinanceProvider>
            <App />
            <Toaster />
            <SonnerToaster position="top-right" />
          </FinanceProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
