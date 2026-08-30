import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import Dashboard from './components/Dashboard.tsx';
import Employees from './components/Employees.tsx';
import SitesAndProjects from './components/SitesAndProjects.tsx';
import Timesheets from './components/Timesheets.tsx';
import Leaves from './components/Leaves.tsx';
import Assets from './components/Assets.tsx';
import Trainings from './components/Trainings.tsx';
import Reports from './components/Reports.tsx';
import BulkImport from './components/BulkImport.tsx';
import Vehicles from './components/Vehicles.tsx';
import Accommodations from './components/Accommodations.tsx';
import RoomInventory from './components/RoomInventory.tsx';
import AuditLogs from './components/AuditLogs.tsx';
import Settings from './components/Settings.tsx';
import './index.css';

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
        path: 'vehicles',
        element: <Vehicles />
      },
      {
        path: 'accommodations',
        element: <Accommodations />
      },
      {
        path: 'inventory',
        element: <RoomInventory />
      },
      {
        path: 'trainings',
        element: <Trainings />
      },
      {
        path: 'reports',
        element: <Reports />
      },
      {
        path: 'audit-logs',
        element: <AuditLogs />
      },
      {
        path: 'settings',
        element: <Settings />
      },
      {
        path: 'import',
        element: <BulkImport />
      }
    ]
  }
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
