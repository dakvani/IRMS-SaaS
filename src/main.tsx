import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { APIProvider } from '@vis.gl/react-google-maps';
import Layout from './components/Layout.tsx';
import Dashboard from './components/Dashboard.tsx';
import Employees from './components/Employees.tsx';
import SitesAndProjects from './components/SitesAndProjects.tsx';
import Timesheets from './components/Timesheets.tsx';
import Leaves from './components/Leaves.tsx';
import Assets from './components/Assets.tsx';
import Trainings from './components/Trainings.tsx';
import DataAndCompliance from './components/DataAndCompliance.tsx';
import Accommodations from './components/Accommodations.tsx';
import Settings from './components/Settings.tsx';
import './index.css';

// Restore auth token immediately before any component mounts
try {
  const savedToken = localStorage.getItem('irms_token');
  if (savedToken) {
    (window as any)._token = savedToken;
  }
} catch (e) {}

// Google Maps Platform Demo Key Quota Defense
(window as any).gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
};

// Safe JSON parser defense against HTML error pages (e.g. 502/503/404 Vite fallbacks)
const origJson = Response.prototype.json;
Response.prototype.json = async function () {
  try {
    const text = await this.text();
    if (!text || !text.trim()) {
      return {};
    }
    const trimmed = text.trim();
    if (trimmed.startsWith('<') || trimmed.toLowerCase().startsWith('<!doctype')) {
      console.warn(`[SafeJSON] Intercepted HTML payload for ${this.url || 'endpoint'} (HTTP ${this.status})`);
      return { error: `Server returned HTTP ${this.status} HTML response instead of JSON`, status: this.status, isHtmlFallback: true };
    }
    return JSON.parse(text);
  } catch (e: any) {
    if (e instanceof SyntaxError && (e.message.includes('<') || e.message.includes('<!doctype') || e.message.includes('is not valid JSON'))) {
      console.warn('[SafeJSON] Syntax error intercepted when parsing response:', e.message);
      return { error: 'Invalid JSON payload received', status: this.status, isHtmlFallback: true };
    }
    throw e;
  }
};

const origError = console.error;
console.error = (...args: unknown[]) => {
  const msg = args.map((a) => String(a)).join(' ');
  if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    return;
  }
  if (msg.includes("Unexpected token '<'") && msg.includes('is not valid JSON')) {
    console.warn('[HandledJSONError]', msg);
    return;
  }
  origError.apply(console, args);
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: 'dashboard',
        element: <Dashboard />
      },
      {
        path: 'employees',
        element: <Employees />
      },
      {
        path: 'employees/:id',
        element: <Employees />
      },
      {
        path: 'sites',
        element: <SitesAndProjects />
      },
      {
        path: 'timesheets',
        element: <Timesheets />
      },
      {
        path: 'leaves',
        element: <Leaves />
      },
      {
        path: 'assets',
        element: <Assets />
      },
      {
        path: 'accommodations',
        element: <Accommodations />
      },
      {
        path: 'inventory',
        element: <Navigate to="/accommodations" replace />
      },
      {
        path: 'trainings',
        element: <Trainings />
      },
      {
        path: 'data-compliance',
        element: <DataAndCompliance />
      },
      {
        path: 'reports',
        element: <DataAndCompliance initialTab="reports" />
      },
      {
        path: 'audit-logs',
        element: <DataAndCompliance initialTab="audit" />
      },
      {
        path: 'import',
        element: <DataAndCompliance initialTab="import" />
      },
      {
        path: 'settings',
        element: <Settings />
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />
      }
    ]
  }
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <APIProvider apiKey={(import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || ''}>
      <RouterProvider router={router} />
    </APIProvider>
  </StrictMode>,
);
