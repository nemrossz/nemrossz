import React from 'react';
import { SECTIONS } from '../constants';
import { Menu, ShieldCheck } from 'lucide-react';

interface NavigationProps {
  activeSection: string;
  onSectionChange: (id: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeSection, onSectionChange }) => {
  return (
    <nav className="sticky top-0 z-[90] bg-[var(--bg-page)] border-b border-[var(--border-main)] shadow-xl transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo Group */}
          <div className="relative group/logo flex-shrink-0 flex items-center gap-3 cursor-pointer select-none mr-7" onClick={() => onSectionChange('home')}>
             <div className="relative">
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--color-tertiary)] rounded-full border border-black z-10 animate-pulse"></div>
                {/* Updated: text-white replaced with text-[var(--text-main)] for light theme visibility */}
                <div className="relative bg-[var(--bg-panel)] rounded-lg flex flex-col items-center justify-center text-[var(--text-main)] border border-[var(--color-primary)] group-hover/logo:bg-[var(--color-primary)] group-hover/logo:text-white transition-colors px-2 py-1 h-12 min-w-[3.5rem]">
                    <span className="font-black text-xl leading-none -mb-1">NR</span>
                    <span className="font-black text-[9px] uppercase tracking-widest leading-none mt-1">Hírek</span>
                </div>
             </div>
             
             <div className="hidden lg:flex flex-col justify-center">
                <span className="font-black text-xl tracking-tight text-[var(--text-main)] leading-none group-hover/logo:text-[var(--color-secondary)] transition-colors">NemRossz<span className="text-[var(--color-tertiary)]">Hírek</span></span>
             </div>

             <div className="absolute top-full left-0 pt-4 w-64 opacity-0 group-hover/logo:opacity-100 transition-all duration-300 ease-out z-50 pointer-events-none transform translate-y-2 group-hover/logo:translate-y-0">
                <div className="bg-[var(--bg-panel)] p-3 rounded-xl border border-[var(--color-secondary)] shadow-2xl shadow-black flex items-center gap-3">
                    <ShieldCheck size={24} className="text-[var(--color-secondary)]" />
                    <span className="text-[var(--text-main)] text-xs font-bold uppercase tracking-wide leading-tight">
                        Semmi politika,<br/>semmi háború
                    </span>
                </div>
             </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex flex-1 items-center justify-start gap-1 overflow-x-auto hide-scrollbar">
            {SECTIONS.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => onSectionChange(section.id)}
                  className={`
                    relative px-3 py-2 rounded-lg text-[15px] font-bold transition-all duration-200 whitespace-nowrap
                    ${isActive 
                      ? 'text-white bg-[var(--color-primary)] border border-[var(--color-primary)]' 
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-main)] hover:border-[var(--color-secondary)]' 
                    }
                  `}
                >
                  {section.name}
                  {isActive && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-black/40 rounded-full"></span>}
                </button>
              );
            })}
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-2 border-l border-[var(--border-main)] pl-3 ml-1">
            <button className="p-2 text-[var(--text-muted)] hover:bg-[var(--color-primary)] hover:text-white rounded-lg transition-colors">
                <Menu size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
        
        {/* Mobile Scroller */}
        <div className="md:hidden flex overflow-x-auto pb-3 pt-1 space-x-2 hide-scrollbar px-1 border-t border-[var(--border-main)]">
             {SECTIONS.map((section) => {
               const isActive = activeSection === section.id;
               return (
                  <button
                    key={section.id}
                    onClick={() => onSectionChange(section.id)}
                    className={`
                      flex-shrink-0 px-3 py-1.5 rounded-md text-[13px] font-bold border transition-all duration-200 uppercase tracking-wide
                      ${isActive
                        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                        : 'bg-[var(--bg-panel)] text-[var(--text-muted)] border-[var(--border-main)]'
                      }
                    `}
                  >
                    {section.name}
                  </button>
               )
             })}
        </div>
      </div>
    </nav>
  );
};