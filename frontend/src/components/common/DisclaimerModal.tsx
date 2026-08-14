import React from 'react';
import { ShieldAlert, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const DisclaimerModal: React.FC = () => {
  const { user, acceptDisclaimer } = useAuth();

  if (!user || user.disclaimerAcceptedAt) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-amber-500 p-6 text-amber-950 flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 shrink-0 text-amber-950" />
          <div>
            <h2 className="text-xl font-bold">Research Prototype Notice</h2>
            <p className="text-xs text-amber-900 mt-0.5">
              Father Saturnino Urios University (FSUU) College of Law
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4 text-slate-700 text-sm leading-relaxed">
          <p>
            Welcome to <strong>YAWA (Yet Another Written-Answer AI Agent)</strong>. This platform is a locally deployed empirical research prototype designed to study the iterative refinement of AI evaluation in Philippine Criminal Law I.
          </p>

          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-amber-900 text-xs space-y-2">
            <p className="font-semibold text-amber-950">Important Conditions of Use:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>This software is <strong>NOT</strong> an official institutional grading system.</li>
              <li>Scores and reasoning are for academic research analysis only.</li>
              <li>This prototype does not provide formal legal advice or replace law faculty evaluation.</li>
              <li>All evaluation sessions and adjustments are recorded for academic verification.</li>
            </ul>
          </div>

          <p className="text-xs text-slate-500">
            By proceeding, you acknowledge that you understand the prototype status of this system and consent to participating in this academic study.
          </p>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => acceptDisclaimer()}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-sm transition-colors shadow-md hover:shadow-lg"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            I Understand and Agree
          </button>
        </div>
      </div>
    </div>
  );
};
