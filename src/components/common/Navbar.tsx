import React from 'react';

export type AppView = 'home' | 'child' | 'parent' | 'clinician' | 'admin';

interface NavbarProps {
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  onPrimaryAction: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  onPrimaryAction,
}) => {
  const navItems: { id: AppView; label: string }[] = [
    { id: 'home', label: 'Overview' },
    { id: 'child', label: 'Child Studio' },
    { id: 'parent', label: 'Parent Hub' },
    { id: 'clinician', label: 'SLP Portal' },
    { id: 'admin', label: 'Governance' },
  ];

  return (
    <header className="bg-white/95 dark:bg-[#09090B]/95 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto border-x border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single clean architectural wordmark */}
        <button
          type="button"
          onClick={() => onSelectView('home')}
          className="text-lg sm:text-xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 whitespace-nowrap shrink-0 font-display hover:opacity-80 transition-opacity cursor-pointer"
        >
          Bolo<span className="font-serif-editorial italic font-normal">Speech</span>
        </button>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav
          className="hidden md:flex items-center gap-7 text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400"
          aria-label="Primary Navigation"
        >
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 cursor-pointer ${
                  isActive
                    ? 'text-zinc-950 dark:text-zinc-50 border-zinc-950 dark:border-zinc-100 font-semibold'
                    : 'border-transparent hover:text-zinc-950 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary CTA button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onPrimaryAction}
            className="px-4 py-2 text-xs font-semibold text-white bg-zinc-950 dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {currentView === 'home' ? 'Register Family' : 'Add Child Profile'}
          </button>
        </div>
      </div>

      {/* Compact mobile navigation row */}
      <nav
        className="md:hidden flex items-center justify-between gap-2 px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 overflow-x-auto text-xs font-medium"
        aria-label="Mobile Navigation"
      >
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              className={`px-2.5 py-1 whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
