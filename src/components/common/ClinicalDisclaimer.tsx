import React from 'react';
import { AlertCircle, ShieldCheck, Stethoscope } from 'lucide-react';

interface ClinicalDisclaimerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClinicalDisclaimer: React.FC<ClinicalDisclaimerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div 
        className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl border border-slate-200"
        role="dialog"
        aria-labelledby="disclaimer-title"
      >
        <div className="flex items-center gap-3 text-amber-700 mb-4">
          <div className="p-2.5 bg-amber-50 rounded-lg">
            <Stethoscope className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 id="disclaimer-title" className="text-lg font-bold text-slate-900">
              Clinical Scope & Practice Disclaimer
            </h2>
            <p className="text-xs text-slate-500">Pediatric Speech-Language Practice Protocol</p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-slate-700 leading-relaxed mb-6">
          <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200/60 flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900">
              <strong>Not a Diagnostic Tool:</strong> BoloSpeech is an assistive home practice and telepractice monitoring tool designed to support structured speech sound drills under the supervision of a licensed Speech-Language Pathologist (SLP).
            </p>
          </div>

          <p>
            BoloSpeech does <strong>not</strong> diagnose speech disorders, childhood apraxia, autism-related communication delays, or medical conditions. Clinical assessment requires a licensed human clinician.
          </p>

          <p>
            <strong>Red-Flag Guidance:</strong> If your child experiences sudden speech regression, persistent pain, swallowing difficulty, or rapid loss of vocal volume, immediately consult a pediatrician or certified SLP.
          </p>

          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Adheres to ASHA practice boundaries and Indian Rehabilitation Council (RCI) guidelines.</span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 text-white font-medium text-sm rounded-lg hover:bg-slate-800 transition-colors"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
