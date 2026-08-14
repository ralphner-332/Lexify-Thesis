import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <aside
      aria-label="Academic Research Disclaimer"
      className="bg-amber-500 text-amber-950 px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-center gap-2 border-b border-amber-600 shadow-sm"
    >
      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-950" />
      <span>
        <strong>ACADEMIC RESEARCH PROTOTYPE ONLY:</strong> This system is strictly an academic tool for FSUU College of Law Criminal Law I research. It is <u>not</u> a lawyer, professor, formal exam, institutional grading system, or source of legal advice.
      </span>
    </aside>
  );
};
