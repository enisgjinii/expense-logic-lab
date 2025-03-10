
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { FinanceProvider } from './contexts/FinanceContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Import from './pages/Import';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Auth from './pages/Auth';
import NotFound from './pages/NotFound';
import Index from './pages/Index';
import { Toaster } from './components/ui/toaster';
import Settings from './pages/Settings';

function App() {
  return (
    <FinanceProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/import" element={<Layout><Import /></Layout>} />
          <Route path="/transactions" element={<Layout><Transactions /></Layout>} />
          <Route path="/budget" element={<Layout><Budget /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </FinanceProvider>
  );
}

export default App;
