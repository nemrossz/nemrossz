import React, { useState } from 'react';
import { COOKIE_POLICY } from '../constants/cookieText';
import { ShieldCheck, X } from 'lucide-react';

export const CookieConsent: React.FC = () => {
    const [isVisible, setIsVisible] = useState(() => {
        try {
            const consent = localStorage.getItem('cookie_consent');
            return consent !== 'accepted' && consent !== 'declined';
        } catch {
            return true;
        }
    });
    const [showDetails, setShowDetails] = useState(false);

    const handleAccept = () => {
        try {
            localStorage.setItem('cookie_consent', 'accepted');
            window.dispatchEvent(new Event('cookie_consent_updated'));
        } catch (e) {
            console.warn("LocalStorage error", e);
        }
        setIsVisible(false);
    };

    const handleDecline = () => {
        try {
            localStorage.setItem('cookie_consent', 'declined');
            localStorage.removeItem('finnhub_cache');
            localStorage.removeItem('market_history_cache');
            window.dispatchEvent(new Event('cookie_consent_updated'));
        } catch (e) {
            console.warn("LocalStorage error", e);
        }
        setIsVisible(false);
    };

    if (!isVisible) return null;

    if (showDetails) {
        return (
            <div className="fixed inset-0 z-[999] bg-black/80 flex items-center justify-center p-4">
                <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] p-6 rounded-xl max-w-2xl w-full shadow-2xl relative">
                    <button onClick={() => setShowDetails(false)} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-main)]">
                        <X size={24} />
                    </button>
                    <h2 className="text-xl font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
                        <ShieldCheck className="text-[var(--color-primary)]" />
                        Adatkezelési Tájékoztató
                    </h2>
                    {/* Updated text-zinc-300 to text-[var(--text-main)] for visibility on light themes */}
                    <div className="text-base text-[var(--text-main)] whitespace-pre-line mb-6 max-h-[60vh] overflow-y-auto custom-scrollbar leading-relaxed">
                        {COOKIE_POLICY.details}
                    </div>
                    <div className="flex justify-end gap-4">
                        {/* Updated button styling for light theme visibility */}
                        <button onClick={handleDecline} className="px-6 py-3 rounded-lg border border-[var(--border-main)] text-[var(--text-main)] font-bold hover:bg-[var(--border-main)] transition-colors text-base">
                            {COOKIE_POLICY.declineBtn}
                        </button>
                        <button onClick={handleAccept} className="px-6 py-3 rounded-lg bg-[var(--color-primary)] text-white font-bold hover:bg-opacity-80 transition-colors text-base">
                            {COOKIE_POLICY.acceptBtn}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-0 left-0 w-full bg-[var(--bg-panel)] border-t border-[var(--border-main)] p-6 z-[999] shadow-[0_-10px_40px_rgba(0,0,0,0.8)] animate-fade-in">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                    <p className="text-xs font-bold text-[var(--color-tertiary)] mb-2 uppercase tracking-wide">
                        ⚠️ A hírek AI generáltak, pontatlanságokat tartalmazhatnak. A tartalmukért felelősséget nem vállalunk!
                    </p>
                    <p className="text-base text-[var(--text-muted)] leading-relaxed font-medium">
                        {COOKIE_POLICY.shortText}{' '}
                        {/* Updated hover color */}
                        <button onClick={() => setShowDetails(true)} className="text-[var(--color-tertiary)] underline hover:text-[var(--text-main)] font-bold">
                            {COOKIE_POLICY.readMoreBtn}
                        </button>
                    </p>
                </div>
                <div className="flex gap-4 flex-shrink-0">
                    {/* Updated button styling for light theme visibility */}
                    <button onClick={handleDecline} className="px-6 py-3 rounded-lg border border-[var(--border-main)] text-[var(--text-main)] font-bold hover:bg-[var(--border-main)] transition-colors text-base whitespace-nowrap">
                        {COOKIE_POLICY.declineBtn}
                    </button>
                    <button onClick={handleAccept} className="px-6 py-3 rounded-lg bg-[var(--color-primary)] text-white font-bold hover:bg-opacity-80 transition-colors text-base whitespace-nowrap shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                        {COOKIE_POLICY.acceptBtn}
                    </button>
                </div>
            </div>
        </div>
    );
};