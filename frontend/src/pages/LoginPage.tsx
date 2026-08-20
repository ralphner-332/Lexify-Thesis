import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, GraduationCap, Scale, Shield, AlertCircle, Sparkles } from 'lucide-react';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState<UserRole | 'standard' | null>(null);

  const { login, quickLogin, user, role } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to respective portal
  React.useEffect(() => {
    if (user && role) {
      if (role === 'STUDENT') navigate('/student');
      else if (role === 'EXPERT') navigate('/expert');
      else if (role === 'ADMIN') navigate('/admin');
    }
  }, [user, role, navigate]);

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoadingRole('standard');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoadingRole(null);
    }
  };

  const handleQuickLogin = async (targetRole: UserRole) => {
    setError(null);
    setLoadingRole(targetRole);
    try {
      await quickLogin(targetRole);
    } catch (err: any) {
      setError(err.message || 'Quick login failed in current environment.');
    } finally {
      setLoadingRole(null);
    }
  };

  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full space-y-8">
          {/* Header & Logo */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-xl shadow-brand-500/30 mb-4">
              <span className="text-3xl">⚖️</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">YAWA</h1>
            <p className="mt-1 text-sm text-slate-400">
              Yet Another Written-Answer AI Agent
            </p>
            <p className="mt-0.5 text-xs text-brand-400 font-medium">
              FSUU College of Law • Criminal Law I Research Prototype
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-8 border border-slate-700 shadow-2xl space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 flex items-start gap-2.5 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Standard Credentials Form */}
            <form onSubmit={handleStandardLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@urios.edu.ph"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingRole !== null}
                className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-brand-600/30 disabled:opacity-50"
              >
                {loadingRole === 'standard' ? 'Authenticating...' : 'Sign In with Credentials'}
              </button>
            </form>

            {/* Local Development Quick Role Switcher */}
            {isDev && (
              <div className="pt-4 border-t border-slate-700/60">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Local Dev Mode: One-Click Demo Role Login</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Instant simulation using seeded research test accounts (<code className="text-amber-300">isDemo: true</code>):
                </p>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('STUDENT')}
                    disabled={loadingRole !== null}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-blue-300 hover:text-white transition-all disabled:opacity-50 group"
                  >
                    <GraduationCap className="w-4 h-4 mb-1 text-blue-400 group-hover:scale-110 transition-transform" />
                    <span>Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('EXPERT')}
                    disabled={loadingRole !== null}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-indigo-300 hover:text-white transition-all disabled:opacity-50 group"
                  >
                    <Scale className="w-4 h-4 mb-1 text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span>Expert</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('ADMIN')}
                    disabled={loadingRole !== null}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-purple-300 hover:text-white transition-all disabled:opacity-50 group"
                  >
                    <Shield className="w-4 h-4 mb-1 text-purple-400 group-hover:scale-110 transition-transform" />
                    <span>Admin</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="text-center text-xs text-slate-500 space-y-1">
            <p>Empirical Study on Iteratively Refined AI Agent Evaluation</p>
            <p>Father Saturnino Urios University • Butuan City, Philippines</p>
          </div>
        </div>
      </div>
    </div>
  );
};
