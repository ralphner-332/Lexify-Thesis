import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedLayout } from './components/common/ProtectedLayout';
import { DisclaimerModal } from './components/common/DisclaimerModal';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { AssessmentWizard } from './pages/student/AssessmentWizard';
import { ReviewAnswersPage } from './pages/student/ReviewAnswersPage';
import { FeedbackViewer } from './pages/student/FeedbackViewer';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { QuestionManager } from './pages/admin/QuestionManager';
import { RubricBuilder } from './pages/admin/RubricBuilder';
import { ModelConfigConsole } from './pages/admin/ModelConfigConsole';
import { SubmissionsExplorer } from './pages/admin/SubmissionsExplorer';
import { ModelComparisonDashboard } from './pages/admin/ModelComparisonDashboard';
import { QuestionComparisonDashboard } from './pages/admin/QuestionComparisonDashboard';
import { SummativeComparisonDashboard } from './pages/admin/SummativeComparisonDashboard';
import { ResearchExportReportPortal } from './pages/admin/ResearchExportReportPortal';

// Root Route Decider
const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <Navigate to="/student" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
          {/* Security & Data Privacy Notice Modal */}
          <DisclaimerModal />

          {/* Main Routing Architecture */}
          <div className="flex-1 flex flex-col">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/" element={<RootRedirect />} />

              {/* Student Portal (Role: STUDENT, ADMIN) */}
              <Route element={<ProtectedLayout allowedRoles={['STUDENT', 'ADMIN']} />}>
                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/student/assessment" element={<AssessmentWizard />} />
                <Route path="/student/assessment/review" element={<ReviewAnswersPage />} />
                <Route path="/student/assessment/feedback" element={<FeedbackViewer />} />
              </Route>

              {/* Administrator Consoles (Role: ADMIN) */}
              <Route element={<ProtectedLayout allowedRoles={['ADMIN']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/submissions" element={<SubmissionsExplorer />} />
                <Route path="/admin/comparisons" element={<ModelComparisonDashboard />} />
                <Route path="/admin/comparisons/student" element={<ModelComparisonDashboard />} />
                <Route path="/admin/comparisons/question" element={<QuestionComparisonDashboard />} />
                <Route path="/admin/comparisons/summative" element={<SummativeComparisonDashboard />} />
                <Route path="/admin/model-comparison" element={<ModelComparisonDashboard />} />
                <Route path="/admin/questions" element={<QuestionManager />} />
                <Route path="/admin/rubrics" element={<RubricBuilder />} />
                <Route path="/admin/models" element={<ModelConfigConsole />} />
                <Route path="/admin/exports" element={<ResearchExportReportPortal />} />
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
