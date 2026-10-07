import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import DashboardLayout from './components/layout/DashboardLayout.jsx';
import { ROLES } from './utils/roles.js';

import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TicketsListPage from './pages/TicketsListPage.jsx';
import TicketDetailPage from './pages/TicketDetailPage.jsx';
import CreateTicketPage from './pages/CreateTicketPage.jsx';
import AssetsPage from './pages/AssetsPage.jsx';
import AssetDetailPage from './pages/AssetDetailPage.jsx';
import KnowledgeBasePage from './pages/KnowledgeBasePage.jsx';
import KnowledgeArticleDetailPage from './pages/KnowledgeArticleDetailPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import DepartmentsCategoriesPage from './pages/DepartmentsCategoriesPage.jsx';
import AuditLogsPage from './pages/AuditLogsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tickets" element={<TicketsListPage />} />
        <Route path="/tickets/new" element={<CreateTicketPage />} />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/assets/:id" element={<AssetDetailPage />} />
        <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
        <Route path="/knowledge-base/:id" element={<KnowledgeArticleDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        <Route
          path="/users"
          element={
            <ProtectedRoute roles={[ROLES.SYSTEM_ADMIN]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute roles={[ROLES.SYSTEM_ADMIN, ROLES.IT_MANAGER]}>
              <DepartmentsCategoriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute roles={[ROLES.SYSTEM_ADMIN, ROLES.IT_MANAGER]}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
