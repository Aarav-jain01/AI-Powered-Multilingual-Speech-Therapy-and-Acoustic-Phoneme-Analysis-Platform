import React, { useEffect, useState } from 'react';
import { FileText, X } from 'lucide-react';

export interface DocCatalogItem {
  key: string;
  title: string;
  category: string;
}

export const DOC_CATALOG: DocCatalogItem[] = [
  { key: 'architecture', title: 'System Architecture & Acoustic Data Flow', category: 'Engineering' },
  { key: 'ml_pipeline', title: 'Multilingual CTC & GOP Speech Pipeline', category: 'ML / Speech' },
  { key: 'evaluation', title: 'Model Evaluation & Demographic Fairness Audit', category: 'ML / Speech' },
  { key: 'clinical_review', title: 'SLP Clinical Governance & Developmental Norms', category: 'Clinical' },
  { key: 'privacy', title: 'DPDP Act 2023, COPPA & GDPR-K Privacy Spec', category: 'Compliance' },
  { key: 'datasets', title: 'Training Datasets & Pediatric Augmentations', category: 'ML / Speech' },
  { key: 'api', title: 'OpenAPI v1 REST & WebSocket Reference', category: 'Engineering' },
  { key: 'adding_language', title: 'Adding a New Language Playbook', category: 'Localization' },
  { key: 'decisions', title: 'Architectural Decision Records (ADRs)', category: 'Engineering' },
  { key: 'release_gates', title: 'CI/CD Model Release Gates (YAML)', category: 'Governance' },
];

interface DocsDrawerModalProps {
  isOpen: boolean;
  initialDocKey?: string;
  onClose: () => void;
}

export const DocsDrawerModal: React.FC<DocsDrawerModalProps> = ({
  isOpen,
  initialDocKey = 'architecture',
  onClose,
}) => {
  const [selectedKey, setSelectedKey] = useState(initialDocKey);
  const [docContent, setDocContent] = useState('');
  const [docPath, setDocPath] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialDocKey) {
      setSelectedKey(initialDocKey);
    }
  }, [initialDocKey]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/v1/docs/${selectedKey}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setDocContent(data.content || 'Documentation loaded.');
          setDocPath(data.path || '');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDocContent('Unable to fetch documentation content.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedKey]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div
        className="bg-white rounded-2xl max-w-5xl w-full h-[85vh] border border-slate-200 shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Platform Documentation & Clinical Specifications"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-sky-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Clinical, Privacy & Engineering Specification Library
              </h2>
              <p className="text-xs text-slate-500 font-mono">{docPath || 'docs/'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 rounded-lg transition-colors"
            aria-label="Close documentation viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
          {/* Sidebar catalog */}
          <aside className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/70 p-4 overflow-y-auto space-y-1">
            {DOC_CATALOG.map((item) => {
              const active = item.key === selectedKey;
              return (
                <button
                  key={item.key}
                  onClick={() => setSelectedKey(item.key)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                    active
                      ? 'bg-white text-slate-900 font-semibold border border-slate-200 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="block text-xs leading-snug">{item.title}</span>
                  <span className="block text-[11px] text-slate-400 mt-0.5">{item.category}</span>
                </button>
              );
            })}
          </aside>

          {/* Document content */}
          <div className="md:col-span-8 p-6 overflow-y-auto bg-white">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-6 bg-slate-100 rounded w-2/3" />
                <div className="h-4 bg-slate-100 rounded w-full" />
                <div className="h-4 bg-slate-100 rounded w-5/6" />
                <div className="h-32 bg-slate-100 rounded w-full" />
              </div>
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-xs text-slate-700 leading-relaxed">
                {docContent}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
