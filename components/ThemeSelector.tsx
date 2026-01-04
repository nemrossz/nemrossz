import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Palette, Check, ArrowRight } from 'lucide-react';

export const ThemeSelector: React.FC = () => {
    const { currentTheme, setTheme, availableThemes } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [showWelcomeTooltip, setShowWelcomeTooltip] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowWelcomeTooltip(false);
            }
        };

        const handleOpenEvent = (event: Event) => {
            setIsOpen(true);
            // Check if it's a CustomEvent with detail
            if ('detail' in event && (event as CustomEvent).detail?.showWelcome) {
                setShowWelcomeTooltip(true);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('openThemeSelector', handleOpenEvent);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('openThemeSelector', handleOpenEvent);
        };
    }, []);

    const handleThemeSelect = (id: string) => {
        setTheme(id);
        setIsOpen(false);
        setShowWelcomeTooltip(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (isOpen) setShowWelcomeTooltip(false);
                }}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10 transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)]"
                title="Téma választása"
            >
                <Palette size={14} className="text-[var(--color-tertiary)]" />
                <span className="hidden sm:inline text-[10px] uppercase font-bold tracking-wider">Téma</span>
            </button>

            {/* Welcome Tooltip - Floating next to the dropdown */}
            {isOpen && showWelcomeTooltip && (
                <div className="absolute right-[calc(100%+15px)] top-[140%] w-max transform -translate-y-1/2 z-[160] animate-pulse-slow hidden md:block">
                     <div className="bg-[var(--color-primary)] text-white text-xs font-bold py-2 px-3 rounded-lg shadow-xl flex items-center gap-2 relative">
                        <span>Válassz színt az oldalnak!</span>
                        {/* Arrow pointing right */}
                        <div className="absolute top-1/2 -right-1.5 w-3 h-3 bg-[var(--color-primary)] transform -translate-y-1/2 rotate-45"></div>
                    </div>
                </div>
            )}
            {/* Mobile Tooltip version (below) */}
             {isOpen && showWelcomeTooltip && (
                <div className="absolute right-0 top-[-40px] w-max z-[160] md:hidden">
                     <div className="bg-[var(--color-primary)] text-white text-xs font-bold py-1 px-2 rounded-lg shadow-xl relative">
                        <span>Válassz színt!</span>
                        <div className="absolute bottom-[-4px] right-4 w-2 h-2 bg-[var(--color-primary)] rotate-45"></div>
                    </div>
                </div>
            )}

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-xl shadow-xl z-[150] overflow-hidden animate-fade-in">
                    <div className="py-1">
                        {availableThemes.map((theme) => (
                            <button
                                key={theme.id}
                                onClick={() => handleThemeSelect(theme.id)}
                                className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div 
                                        className="w-4 h-4 rounded-full border border-white/20" 
                                        style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.bgPanel})` }}
                                    ></div>
                                    <span className={`text-xs font-bold uppercase tracking-wide ${currentTheme.id === theme.id ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}`}>
                                        {theme.name}
                                    </span>
                                </div>
                                {currentTheme.id === theme.id && <Check size={14} className="text-[var(--color-secondary)]" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};