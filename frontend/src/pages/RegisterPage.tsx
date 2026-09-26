import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Scale, AlertCircle, Eye, EyeOff, Check, X } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Password complexity checks
  const passwordChecks = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const isPasswordValid =
    passwordChecks.minLength &&
    passwordChecks.hasUppercase &&
    passwordChecks.hasLowercase &&
    passwordChecks.hasNumber &&
    passwordChecks.hasSpecial;

  const isConfirmMatch = confirmPassword.length > 0 && password === confirmPassword;
  const isConfirmMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || trimmedName.length < 2) {
      setError('Please enter your full name (minimum 2 characters).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setError('Please provide a valid institutional email address.');
      return;
    }

    if (!passwordChecks.minLength) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!passwordChecks.hasUppercase) {
      setError('Password must contain at least one uppercase letter.');
      return;
    }

    if (!passwordChecks.hasLowercase) {
      setError('Password must contain at least one lowercase letter.');
      return;
    }

    if (!passwordChecks.hasNumber) {
      setError('Password must contain at least one number.');
      return;
    }

    if (!passwordChecks.hasSpecial) {
      setError('Password must contain at least one special character.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await api.auth.register({
        name: trimmedName,
        email: trimmedEmail,
        password,
        confirmPassword,
      });

      // Redirect to login page with registered flag
      navigate('/login?registered=true');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 bg-slate-900 text-white rounded-lg flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Scale className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lexify</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Legal Assessment System</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-8 border border-slate-200 rounded-lg shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-6">Create account</h2>

          {error && (
            <div className="mb-5 p-3 rounded-md bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Full name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Maria Santos"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 text-xs focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Institutional email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@urios.edu.ph"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 text-xs focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="e.g. Lexify123!"
                  className="w-full pl-3 pr-10 py-2 bg-white border border-slate-300 rounded-md text-slate-900 text-xs focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-hidden focus:text-slate-900"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>

              {/* Password Requirements Checklist */}
              <div className="mt-2.5 p-3 rounded-md bg-slate-50 border border-slate-200 space-y-1.5 text-[11px]">
                <span className="font-semibold text-slate-700 block mb-1">
                  Password must contain:
                </span>
                <div className="space-y-1">
                  <div
                    className={`flex items-center gap-1.5 transition-colors ${
                      passwordChecks.minLength ? 'text-emerald-700 font-medium' : 'text-slate-500'
                    }`}
                  >
                    {passwordChecks.minLength ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span>At least 8 characters</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 transition-colors ${
                      passwordChecks.hasUppercase ? 'text-emerald-700 font-medium' : 'text-slate-500'
                    }`}
                  >
                    {passwordChecks.hasUppercase ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span>One uppercase letter</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 transition-colors ${
                      passwordChecks.hasLowercase ? 'text-emerald-700 font-medium' : 'text-slate-500'
                    }`}
                  >
                    {passwordChecks.hasLowercase ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span>One lowercase letter</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 transition-colors ${
                      passwordChecks.hasNumber ? 'text-emerald-700 font-medium' : 'text-slate-500'
                    }`}
                  >
                    {passwordChecks.hasNumber ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span>One number</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 transition-colors ${
                      passwordChecks.hasSpecial ? 'text-emerald-700 font-medium' : 'text-slate-500'
                    }`}
                  >
                    {passwordChecks.hasSpecial ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span>One special character (e.g. ! @ # $ %)</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className={`w-full pl-3 pr-10 py-2 bg-white border rounded-md text-slate-900 text-xs focus:ring-1 outline-hidden ${
                    isConfirmMismatch
                      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-400'
                      : isConfirmMatch
                      ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-400'
                      : 'border-slate-300 focus:border-slate-400 focus:ring-slate-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-hidden focus:text-slate-900"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>

              {isConfirmMismatch && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">
                  Passwords do not match.
                </p>
              )}
              {isConfirmMatch && (
                <p className="mt-1 text-[11px] text-emerald-600 font-medium">
                  Passwords match.
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !isPasswordValid || password !== confirmPassword}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md text-xs transition disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>

            <div className="pt-3 text-center border-t border-slate-100">
              <span className="text-slate-500">Already have an account? </span>
              <Link
                to="/login"
                className="font-medium text-slate-900 hover:underline inline-block"
              >
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
