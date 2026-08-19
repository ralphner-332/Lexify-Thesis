import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../common/RoleBadge';
import {
  Scale,
  LogOut,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
                <Scale className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-slate-900 tracking-tight text-base leading-none">
                  YAWA
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase leading-tight mt-0.5">
                  AI Legal Evaluation Research
                </span>
              </div>
            </Link>

            {/* Navigation Links according to Role */}
            <nav className="hidden md:flex space-x-1 pl-4 border-l border-slate-200 text-xs font-semibold">
              {user.role === 'STUDENT' && (
                <>
                  <Link
                    to="/student"
                    className={`px-3 py-2 rounded-lg transition ${
                      isActive('/student')
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/student/assessment"
                    className={`px-3 py-2 rounded-lg transition ${
                      isActive('/student/assessment')
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Assessment Session
                  </Link>
                  <Link
                    to="/student/assessment/feedback"
                    className={`px-3 py-2 rounded-lg transition ${
                      isActive('/student/assessment/feedback')
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Diagnostic Feedback
                  </Link>
                </>
              )}

              {user.role === 'ADMIN' && (
                <>
                  <Link
                    to="/admin"
                    className={`px-3 py-2 rounded-lg transition ${
                      isActive('/admin')
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/admin/questions"
                    className={`px-3 py-2 rounded-lg transition ${
                      isActive('/admin/questions')
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Questions
                  </Link>
                  <Link
                    to="/admin/rubrics"
                    className={`px-3 py-2 rounded-lg transition ${
                      isActive('/admin/rubrics')
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Rubrics
                  </Link>
                  <Link
                    to="/admin/agent-versions"
                    className={`px-3 py-2 rounded-lg transition ${
                      isActive('/admin/agent-versions')
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Agent Console
                  </Link>
                  <Link
                    to="/admin/evaluations"
                    className={`px-3 py-2 rounded-lg transition ${
                      isActive('/admin/evaluations')
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    AI Evals
                  </Link>
                  <Link
                    to="/admin/comparisons"
                    className={`px-3 py-2 rounded-lg transition ${
                      isActive('/admin/comparisons')
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Comparisons
                  </Link>
                  <Link
                    to="/admin/refinements"
                    className={`px-3 py-2 rounded-lg transition ${
                      isActive('/admin/refinements')
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Refinements
                  </Link>
                  <Link
                    to="/admin/version-lineage"
                    className={`px-3 py-2 rounded-lg transition ${
                      isActive('/admin/version-lineage')
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Lineage
                  </Link>
                  <Link
                    to="/admin/audit-logs"
                    className={`px-3 py-2 rounded-lg transition ${
                      isActive('/admin/audit-logs')
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Audit
                  </Link>
                </>
              )}

              {user.role === 'EXPERT' && (
                <Link
                  to="/expert"
                  className={`px-3 py-2 rounded-lg transition ${
                    isActive('/expert')
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Expert Portal
                </Link>
              )}
            </nav>
          </div>

          {/* User Info & Controls */}
          <div className="flex items-center space-x-3">
            <RoleBadge role={user.role} />

            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800 leading-none">{user.name}</span>
              <span className="text-[11px] text-slate-500 font-mono leading-tight mt-0.5">{user.email}</span>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
