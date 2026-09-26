import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../common/RoleBadge';
import {
  Scale,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  FileText,
  HelpCircle,
  Sliders,
  Cpu,
  Download,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/student' || path === '/admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const navLinkClass = (path: string, exact = false) => {
    const active = exact ? location.pathname === path : isActive(path);
    return `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
      active
        ? 'bg-slate-100 text-slate-900 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`;
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          {/* Logo & Brand Identity */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                <Scale className="w-4 h-4 text-slate-200" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 tracking-tight text-base leading-none">
                  Lexify
                </span>
                <span className="text-[10px] text-slate-500 font-normal leading-tight mt-0.5">
                  Legal Assessment System
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links by Role */}
            <nav className="hidden lg:flex items-center space-x-1 pl-4 border-l border-slate-200">
              {/* STUDENT ROLE */}
              {user.role === 'STUDENT' && (
                <Link to="/student" className={navLinkClass('/student', true)}>
                  <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Dashboard</span>
                </Link>
              )}

              {/* ADMIN ROLE */}
              {user.role === 'ADMIN' && (
                <>
                  <Link to="/admin" className={navLinkClass('/admin', true)}>
                    <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                    <span>Overview</span>
                  </Link>
                  <Link to="/admin/submissions" className={navLinkClass('/admin/submissions')}>
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Submissions</span>
                  </Link>
                  <Link to="/admin/comparisons" className={navLinkClass('/admin/comparisons')}>
                    <Cpu className="w-3.5 h-3.5 text-slate-400" />
                    <span>Model Comparison</span>
                  </Link>
                  <Link to="/admin/questions" className={navLinkClass('/admin/questions')}>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>Questions</span>
                  </Link>
                  <Link to="/admin/rubrics" className={navLinkClass('/admin/rubrics')}>
                    <Sliders className="w-3.5 h-3.5 text-slate-400" />
                    <span>Rubric</span>
                  </Link>
                  <Link to="/admin/models" className={navLinkClass('/admin/models')}>
                    <Cpu className="w-3.5 h-3.5 text-slate-400" />
                    <span>Models</span>
                  </Link>
                  <Link to="/admin/exports" className={navLinkClass('/admin/exports')}>
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>Exports</span>
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* User Profile & Logout */}
          <div className="hidden lg:flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-right">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-500 font-mono leading-tight">
                  {user.email}
                </span>
              </div>
              <RoleBadge role={user.role} size="sm" />
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden space-x-2">
            <RoleBadge role={user.role} size="sm" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <nav className="flex flex-col space-y-1">
            {user.role === 'STUDENT' && (
              <Link to="/student" className={navLinkClass('/student', true)}>
                <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                <span>Dashboard</span>
              </Link>
            )}

            {user.role === 'ADMIN' && (
              <>
                <Link to="/admin" className={navLinkClass('/admin', true)}>
                  <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Overview</span>
                </Link>
                <Link to="/admin/submissions" className={navLinkClass('/admin/submissions')}>
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Submissions</span>
                </Link>
                <Link to="/admin/comparisons" className={navLinkClass('/admin/comparisons')}>
                  <Cpu className="w-3.5 h-3.5 text-slate-400" />
                  <span>Model Comparison</span>
                </Link>
                <Link to="/admin/questions" className={navLinkClass('/admin/questions')}>
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Questions</span>
                </Link>
                <Link to="/admin/rubrics" className={navLinkClass('/admin/rubrics')}>
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  <span>Rubric</span>
                </Link>
                <Link to="/admin/models" className={navLinkClass('/admin/models')}>
                  <Cpu className="w-3.5 h-3.5 text-slate-400" />
                  <span>Models</span>
                </Link>
                <Link to="/admin/exports" className={navLinkClass('/admin/exports')}>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Exports</span>
                </Link>
              </>
            )}
          </nav>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-900">{user.name}</span>
              <span className="text-[10px] text-slate-500">{user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md font-medium"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
