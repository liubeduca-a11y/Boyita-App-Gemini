import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log("App starting initialization...");

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Critical Error: Root element not found in DOM");
} else {
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    console.log("App rendered successfully");
  } catch (error) {
    console.error("Fatal error during React mount:", error);
    rootElement.innerHTML = `
      <div style="padding: 20px; color: red; font-family: sans-serif;">
        <h1 style="font-size: 1.5rem;">Error al iniciar la aplicación</h1>
        <p>Ha ocurrido un error crítico durante el inicio.</p>
        <pre style="background: #f0f0f0; padding: 10px; overflow: auto; max-height: 200px;">${error instanceof Error ? error.stack : String(error)}</pre>
        <button onclick="localStorage.clear(); window.location.reload();" style="padding: 10px 20px; background: #AEC6CF; border: none; border-radius: 8px; cursor: pointer;">
          Limpiar Datos y Reintentar
        </button>
      </div>
    `;
  }
}
