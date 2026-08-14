import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedLayout } from './components/common/ProtectedLayout';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { ExpertDashboard } from './pages/expert/ExpertDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { QuestionManager } from './pages/admin/QuestionManager';
import { RubricBuilder } from './pages/admin/RubricBuilder';
import { AgentVersionConsole } from './pages/admin/AgentVersionConsole';
import { AuditLogViewer } from './pages/admin/AuditLogViewer';

const RootRedirect: React.FC = () => {
  const { role, user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'STUDENT') return <Navigate to="/student" replace />;
  if (role === 'EXPERT') return <Navigate to="/expert" replace />;
  if (role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Student Portal */}
          <Route element={<ProtectedLayout allowedRoles={['STUDENT']} />}>
            <Route path="/student" element={<StudentDashboard />} />
          </Route>

          {/* Expert Evaluator Portal */}
          <Route element={<ProtectedLayout allowedRoles={['EXPERT']} />}>
            <Route path="/expert" element={<ExpertDashboard />} />
          </Route>

          {/* Researcher / Admin Portal */}
          <Route element={<ProtectedLayout allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/questions" element={<QuestionManager />} />
            <Route path="/admin/rubrics" element={<RubricBuilder />} />
            <Route path="/admin/agent-versions" element={<AgentVersionConsole />} />
            <Route path="/admin/audit-logs" element={<AuditLogViewer />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
