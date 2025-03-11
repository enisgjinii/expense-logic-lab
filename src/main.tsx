
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Inject the Lovable script tag if it doesn't exist yet
if (!document.querySelector('script[src="https://cdn.gpteng.co/gptengineer.js"]')) {
  const script = document.createElement('script');
  script.src = 'https://cdn.gpteng.co/gptengineer.js';
  script.type = 'module';
  document.head.appendChild(script);
}

createRoot(document.getElementById("root")!).render(<App />);
