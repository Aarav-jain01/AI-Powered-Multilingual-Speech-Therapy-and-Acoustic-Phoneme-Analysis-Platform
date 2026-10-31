import React from 'react';
import { BookOpen, Moon, Stethoscope, Sun, Type, Users } from 'lucide-react';
import { ChildProfile } from '../../types/patient';
import { AppView } from './Navbar';

interface WorkspaceToolbarProps {
  currentView: AppView;
  childrenList: ChildProfile[];
  activeChildId: string;
  onSelectChild: (childId: string) => void;
  isDyslexicFont: boolean;
  onToggleDyslexicFont: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  onOpenDisclaimer: () => void;
  onOpenDocs: (docKey?: string) => void;
}

const VIEW_LABELS: Record<AppView, string> = {
  home: 'Platform Overview',
  child: 'Child Practice Studio',
  parent: 'Parent Care & Privacy Hub',
  clinician: 'SLP Clinical Review Station',
  admin: 'Governance, CMS & Release Gates',
};

export const WorkspaceToolbar: React.FC<WorkspaceToolbarProps> = ({
  currentView,
  childrenList,
  activeChildId,
  onSelectChild,
  isDyslexicFont,
  onToggleDyslexicFont,
  isDark,
  onToggleDark,
  onOpenDisclaimer,
  onOpenDocs,
}) => {
  if (currentView === 'home') return null;

  return (
    <div className="bg-zinc-100/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto border-x border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Contextual Breadcrumb */}
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 font-mono">
          <span className="text-zinc-400 dark:text-zinc-500">WORKSPACE</span>
          <span aria-hidden="true">/</span>
          <span className="font-sans font-semibold text-zinc-950 dark:text-zinc-100">
            {VIEW_LABELS[currentView]}
          </span>
        </div>

        {/* Workspace Controls: Active Child Selector + Accessibility + Theme + Clinical Scope + Docs */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 px-2.5 py-1.5">
            <Users className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <label
              htmlFor="active-child-select"
              className="text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap"
            >
              Child:
            </label>
            <select
              id="active-child-select"
              value={activeChildId}
              onChange={(e) => onSelectChild(e.target.value)}
              className="font-semibold text-zinc-950 dark:text-zinc-100 bg-transparent focus:outline-hidden cursor-pointer"
            >
              {childrenList.map((c) => (
                <option key={c.id} value={c.id} className="bg-white text-zinc-950">
                  {c.name} ({c.ageYears}y · {c.homeLanguages.join(' + ')})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onToggleDyslexicFont}
            aria-pressed={isDyslexicFont}
            className={`px-3 py-1.5 border font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              isDyslexicFont
                ? 'bg-zinc-950 border-zinc-950 text-white dark:bg-zinc-100 dark:border-zinc-100 dark:text-zinc-950 font-semibold'
                : 'bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>{isDyslexicFont ? 'Dyslexic Font: On' : 'Dyslexic Font'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleDark}
            className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 font-mono text-[11px] inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{isDark ? 'LIGHT' : 'DARK'}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenDocs('architecture')}
            className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 font-medium inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Specs &amp; Docs</span>
          </button>

          <button
            type="button"
            onClick={onOpenDisclaimer}
            className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 font-medium inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Clinical Notice</span>
          </button>
        </div>
      </div>
    </div>
  );
};
