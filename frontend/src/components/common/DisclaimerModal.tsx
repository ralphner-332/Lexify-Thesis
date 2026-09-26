import React from 'react';
import { Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const DisclaimerModal: React.FC = () => {
  const { user, acceptDisclaimer } = useAuth();

  // Do not show for admins, or if already accepted
  if (!user || user.role === 'ADMIN' || user.disclaimerAcceptedAt) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center text-slate-700">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Security & Data Privacy Notice
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Lexify Legal Assessment System
            </p>
          </div>
        </div>

        <div className="p-6 space-y-3 text-slate-700 text-xs leading-relaxed">
          <p>
            Lexify processes information submitted through this system for assessment and authorized academic purposes.
          </p>

          <p>
            Users should submit only information required by the assessment.
          </p>

          <p>
            Account information, submitted answers, assessment results, and related system records may be stored securely for authorized academic use.
          </p>

          <p className="text-slate-500 pt-1 border-t border-slate-100 text-[11px]">
            By continuing, the user acknowledges the collection and processing of the information required to operate the assessment system.
          </p>
        </div>

        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => acceptDisclaimer()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition"
          >
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
