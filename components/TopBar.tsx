import React, { useEffect, useState } from 'react';
import { MarketRate, WeatherInfo } from '../types';
import { subscribeToRates, fetchWeather, fetchUserWeather } from '../services/marketService';
import { TrendingUp, TrendingDown, Sun, Cloud, MapPin, Info } from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';

export const TopBar: React.FC = () => {
  const [rates, setRates] = useState<MarketRate[]>([]);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    const timer = setTimeout(() => {
        unsubscribe = subscribeToRates((newRates) => {
            if (isMounted) setRates(newRates);
        });

        const initWeather = async () => {
            try {
                const local = await fetchUserWeather();
                if (isMounted && local) {
                    setWeather(local);
                    return;
                }
                const defaultWeather = await fetchWeather('Budapest');
                if (isMounted) setWeather(defaultWeather);
            } catch (error) {}
        };
        initWeather();
    }, 1500);

    return () => {
        isMounted = false;
        clearTimeout(timer);
        if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <div className="bg-[var(--bg-panel)] text-[var(--text-main)] h-10 flex items-center justify-between px-4 text-[11px] font-bold z-[100] relative border-b border-[var(--border-main)] transition-colors duration-300">
      {/* Market Ticker */}
      <div className="flex items-center flex-1 overflow-hidden mr-4 justify-center">
        <div className="flex space-x-8 animate-pulse-slow">
            {rates.map((rate) => (
                <div key={rate.symbol} className="flex items-center space-x-2 whitespace-nowrap cursor-default group">
                    <span className="text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">{rate.symbol}</span>
                    <span className="text-[var(--text-main)] bg-[var(--bg-page)] px-1.5 py-0.5 rounded border border-[var(--border-main)]">{rate.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    <span className={`flex items-center ${rate.change1d >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                        {rate.change1d >= 0 ? <TrendingUp size={10} className="mr-1"/> : <TrendingDown size={10} className="mr-1"/>}
                        {rate.change1d > 0 ? '+' : ''}{rate.change1d.toFixed(2)}%
                    </span>
                </div>
            ))}
        </div>
      </div>

      {/* Right Side: Theme + Weather */}
      <div className="flex items-center space-x-4 border-l border-[var(--border-main)] pl-4 text-[var(--text-muted)] min-w-[100px] justify-end">
        
        {/* Theme Selector Inserted Here */}
        <div className="border-r border-[var(--border-main)] pr-4 mr-2 flex items-center gap-3">
            
            {/* Disclaimer Icon */}
            <div className="relative group flex items-center">
                <Info size={14} className="text-[var(--text-muted)] hover:text-[var(--color-tertiary)] cursor-help transition-colors" />
                <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-[var(--bg-panel)] border border-[var(--color-tertiary)] rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <p className="text-[10px] font-bold text-[var(--text-main)] leading-relaxed">
                        A hírek AI generáltak, pontatlanságokat tartalmazhatnak. A tartalmukért felelősséget nem vállalunk!
                    </p>
                </div>
            </div>

            <ThemeSelector />
        </div>

        {weather && (
            <>
                <span className="hidden sm:flex items-center gap-1 hover:text-[var(--text-main)] cursor-default transition-colors">
                    <MapPin size={10} className="text-[var(--color-tertiary)]" />
                    <span className="tracking-wide">{weather.city.toUpperCase()}</span>
                </span>
                <div className="flex items-center space-x-2 bg-[var(--bg-page)] px-2 py-0.5 rounded border border-[var(--border-main)]">
                    {weather.condition === 'Napos' ? <Sun size={12} className="text-[var(--color-tertiary)]" /> : <Cloud size={12} className="text-[var(--color-primary)]" />}
                    <span className="text-[var(--text-main)]">{weather.temp}°C</span>
                </div>
            </>
        )}
      </div>
    </div>
  );
};