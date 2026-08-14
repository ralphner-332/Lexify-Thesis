import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../common/RoleBadge';
import { BookOpen, Scale, Layers, HelpCircle, LogOut, History, Award } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, role, isDemo, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Research Subtitle */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
                ⚖️
              </div>
              <div>
                <span className="font-extrabold tracking-tight text-lg text-white group-hover:text-brand-300 transition-colors">
                  YAWA
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-400 border-l border-slate-700 pl-2">
                  Criminal Law I AI Agent Research
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links according to Role */}
          <div className="hidden md:flex items-center space-x-1">
            {role === 'STUDENT' && (
              <Link
                to="/student"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/student')
                    ? 'bg-slate-800 text-brand-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  Assigned Assessments
                </span>
              </Link>
            )}

            {role === 'EXPERT' && (
              <Link
                to="/expert"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/expert')
                    ? 'bg-slate-800 text-brand-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Scale className="w-4 h-4" />
                  Expert Evaluations
                </span>
              </Link>
            )}

            {role === 'ADMIN' && (
              <>
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/admin')
                      ? 'bg-slate-800 text-brand-400'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Overview
                </Link>
                <Link
                  to="/admin/questions"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/admin/questions')
                      ? 'bg-slate-800 text-brand-400'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4" />
                    Questions
                  </span>
                </Link>
                <Link
                  to="/admin/rubrics"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/admin/rubrics')
                      ? 'bg-slate-800 text-brand-400'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    Rubrics
                  </span>
                </Link>
                <Link
                  to="/admin/agent-versions"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/admin/agent-versions')
                      ? 'bg-slate-800 text-brand-400'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    Agent Versions
                  </span>
                </Link>
                <Link
                  to="/admin/audit-logs"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/admin/audit-logs')
                      ? 'bg-slate-800 text-brand-400'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <History className="w-4 h-4" />
                    Audit Trail
                  </span>
                </Link>
              </>
            )}
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-medium text-slate-200">{user.name}</span>
                  <span className="text-[11px] text-slate-400">{user.email}</span>
                </div>
                <RoleBadge role={role || 'STUDENT'} isDemo={isDemo} />
                <button
                  onClick={logout}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
