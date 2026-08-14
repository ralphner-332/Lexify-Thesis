import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedLayout } from './components/common/ProtectedLayout';
import { DisclaimerBanner } from './components/layout/DisclaimerBanner';
import { DisclaimerModal } from './components/common/DisclaimerModal';
import { LoginPage } from './pages/LoginPage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { AssessmentWizard } from './pages/student/AssessmentWizard';
import { ReviewAnswersPage } from './pages/student/ReviewAnswersPage';
import { FeedbackViewer } from './pages/student/FeedbackViewer';

// Expert Pages
import { ExpertDashboard } from './pages/expert/ExpertDashboard';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { QuestionManager } from './pages/admin/QuestionManager';
import { RubricBuilder } from './pages/admin/RubricBuilder';
import { AgentVersionConsole } from './pages/admin/AgentVersionConsole';
import { AuditLogViewer } from './pages/admin/AuditLogViewer';
import { AdminEvaluationExplorer } from './pages/admin/AdminEvaluationExplorer';

// Root Route Decider
const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'STUDENT') return <Navigate to="/student" replace />;
  if (user.role === 'EXPERT') return <Navigate to="/expert" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;

  return <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
          {/* Institutional & Academic Research Disclaimer Banner */}
          <DisclaimerBanner />

          {/* Mandatory Research Consent Modal */}
          <DisclaimerModal />

          {/* Main Routing Architecture */}
          <div className="flex-1 flex flex-col">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<RootRedirect />} />

              {/* Student Portal (Role: STUDENT) */}
              <Route element={<ProtectedLayout allowedRoles={['STUDENT']} />}>
                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/student/assessment" element={<AssessmentWizard />} />
                <Route path="/student/assessment/review" element={<ReviewAnswersPage />} />
                <Route path="/student/assessment/feedback" element={<FeedbackViewer />} />
              </Route>

              {/* Expert Double-Blind Evaluator Portal (Role: EXPERT) */}
              <Route element={<ProtectedLayout allowedRoles={['EXPERT']} />}>
                <Route path="/expert" element={<ExpertDashboard />} />
              </Route>

              {/* Researcher Admin Consoles (Role: ADMIN) */}
              <Route element={<ProtectedLayout allowedRoles={['ADMIN']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/questions" element={<QuestionManager />} />
                <Route path="/admin/rubrics" element={<RubricBuilder />} />
                <Route path="/admin/agent-versions" element={<AgentVersionConsole />} />
                <Route path="/admin/evaluations" element={<AdminEvaluationExplorer />} />
                <Route path="/admin/audit-logs" element={<AuditLogViewer />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
