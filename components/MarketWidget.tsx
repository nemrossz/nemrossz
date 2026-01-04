import React, { useEffect, useState } from 'react';
import { subscribeToRates } from '../services/marketService';
import { MarketRate } from '../types';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

export const MarketWidget: React.FC = () => {
    const [rates, setRates] = useState<MarketRate[]>([]);
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const [popoverMaxHeight, setPopoverMaxHeight] = useState('80vh');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        let isMounted = true;

        const timer = setTimeout(() => {
            unsubscribe = subscribeToRates((newRates) => {
                if (isMounted) {
                    setRates(newRates);
                    if (newRates.length > 0) setIsVisible(true);
                }
            });
        }, 2000);

        return () => {
            isMounted = false;
            clearTimeout(timer);
            if (unsubscribe) unsubscribe();
        };
    }, []);

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
        setHoverIndex(index);
        const rect = e.currentTarget.getBoundingClientRect();
        const availableSpace = window.innerHeight - rect.top - 20;
        setPopoverMaxHeight(`${Math.max(200, availableSpace)}px`);
    };

    if (!isVisible || rates.length === 0) return null;

    return (
        <div className="bg-[var(--bg-panel)] rounded-xl shadow-lg border border-[var(--border-main)] p-5 mb-6 relative z-20 hover:border-[var(--color-primary)] transition-colors animate-fade-in">
            <div className="flex justify-between items-center mb-4 border-b border-[var(--border-main)] pb-2">
                <h3 className="font-black text-[var(--text-main)] flex items-center gap-2 uppercase tracking-wide text-lg">
                    <BarChart3 className="text-[var(--color-tertiary)]" size={20} />
                    Piacok
                </h3>
            </div>
            
            <div className="space-y-2">
                <div className="grid grid-cols-4 text-base text-[var(--text-muted)] px-2 pb-1 uppercase tracking-wider font-bold">
                    <div className="col-span-1">Pár</div>
                    <div className="col-span-1 text-right">Ár</div>
                    <div className="col-span-1 text-right">1 Nap</div>
                    <div className="col-span-1 text-right">1 Hét</div>
                </div>

                {rates.map((rate, idx) => (
                    <div 
                        key={rate.symbol} 
                        className="group relative grid grid-cols-4 items-center p-2 rounded hover:bg-[var(--bg-page)] transition-colors cursor-default border border-transparent hover:border-[var(--border-main)]"
                        onMouseEnter={(e) => handleMouseEnter(e, idx)}
                        onMouseLeave={() => setHoverIndex(null)}
                    >
                        <div className="col-span-1 font-bold text-[var(--text-main)] text-base">{rate.symbol}</div>
                        {/* Updated text-white to text-[var(--text-main)] for light theme visibility */}
                        <div className="col-span-1 text-right text-base text-[var(--text-main)] font-mono font-bold">
                            {rate.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className={`col-span-1 text-right text-base font-mono font-bold flex justify-end items-center ${rate.change1d >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                            {rate.change1d > 0 ? '+' : ''}{rate.change1d.toFixed(2)}%
                        </div>
                        <div className={`col-span-1 text-right text-base font-mono font-bold ${rate.change1w >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                            {rate.change1w > 0 ? '+' : ''}{rate.change1w.toFixed(2)}%
                        </div>

                        {rate.analysis && (
                            <div 
                                className="absolute right-full top-0 mr-4 w-[700px] max-w-[85vw] z-50 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none transform translate-x-4 group-hover:translate-x-0"
                            >
                                <div 
                                    className="bg-[var(--bg-panel)] p-5 rounded-xl border border-[var(--color-primary)] shadow-2xl overflow-y-auto custom-scrollbar"
                                    style={{ maxHeight: popoverMaxHeight }}
                                >
                                    <h4 className="text-base text-[var(--color-secondary)] font-black uppercase tracking-widest mb-2 border-b border-[var(--border-main)] pb-1">
                                        Elemzés ({rate.analysis.date}): {rate.symbol}
                                    </h4>
                                    
                                    {/* Safe Rendering of Structured Analysis */}
                                    <div className="text-base text-[var(--text-main)] pr-2 font-medium space-y-3">
                                        <h3 className="text-lg font-bold text-[var(--color-secondary)] border-b border-[var(--color-tertiary)] pb-1">
                                            {rate.analysis.title}
                                        </h3>
                                        <p>{rate.analysis.summary}</p>
                                        <p className="text-[var(--text-muted)] italic">{rate.analysis.details}</p>
                                        <p>
                                            <strong>Hangulat: </strong> 
                                            <span className={rate.analysis.sentiment === 'Bullish' ? 'text-green-500' : rate.analysis.sentiment === 'Bearish' ? 'text-red-500' : 'text-yellow-500'}>
                                                {rate.analysis.sentiment}
                                            </span>
                                        </p>
                                    </div>

                                    <div className="mt-3 pt-2 border-t border-[var(--border-main)] text-sm text-[var(--text-muted)] font-bold uppercase">
                                        Forrás: (Google Gemini)
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};