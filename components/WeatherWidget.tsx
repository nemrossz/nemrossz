import React, { useState, useEffect } from 'react';
import { fetchWeather, fetchUserWeather } from '../services/marketService';
import { WeatherInfo } from '../types';
import { CloudRain, Wind, Droplets, MapPin, ArrowRight, Sun, Moon, Cloud, CloudFog, Snowflake, CloudLightning, CloudSun } from 'lucide-react';

export const WeatherWidget: React.FC = () => {
    const [weatherData, setWeatherData] = useState<WeatherInfo[]>([]);
    const [popoverMaxHeight, setPopoverMaxHeight] = useState('80vh');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        let isMounted = true;
        
        const timer = setTimeout(() => {
            const loadWeather = async () => {
                const fixedCities = ['Budapest', 'Székesfehérvár', 'Wien', 'Rijeka'];
                try {
                    const promises = fixedCities.map(city => fetchWeather(city));
                    const userWeatherPromise = fetchUserWeather().catch(() => null);
                    
                    const [fixedData, userData] = await Promise.all([
                        Promise.all(promises),
                        userWeatherPromise
                    ]);

                    if (!isMounted) return;

                    let finalData = fixedData;
                    if (userData) {
                         const exists = finalData.some(w => w.city.toLowerCase() === userData.city.toLowerCase());
                         if (!exists) {
                             finalData = [...finalData, userData];
                         }
                    }
                    if (finalData.length > 0) {
                        setWeatherData(finalData);
                        setIsVisible(true);
                    }
                } catch (e) {}
            };
            loadWeather();
        }, 1000);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, []);

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const availableSpace = window.innerHeight - rect.top - 20;
        setPopoverMaxHeight(`${Math.max(200, availableSpace)}px`);
    };

    const getWeatherIcon = (condition: string, size: number = 20, className: string = "") => {
        switch (condition) {
            case 'Napos': return <Sun size={size} className={className} />;
            case 'Felhős': return <Cloud size={size} className={className} />;
            case 'Köd': return <CloudFog size={size} className={className} />;
            case 'Eső': return <CloudRain size={size} className={className} />;
            case 'Hó': return <Snowflake size={size} className={className} />;
            case 'Vihar': return <CloudLightning size={size} className={className} />;
            case 'Változó': return <CloudSun size={size} className={className} />;
            default: return <CloudSun size={size} className={className} />;
        }
    };

    if (!isVisible || weatherData.length === 0) return null;

    return (
        <div className="bg-[var(--bg-panel)] rounded-xl shadow-lg border border-[var(--border-main)] p-5 mb-6 relative z-20 hover:border-[var(--color-primary)] transition-colors animate-fade-in">
            <div className="flex justify-between items-center mb-4 border-b border-[var(--border-main)] pb-2">
                <h3 className="font-black text-[var(--text-main)] flex items-center gap-2 uppercase tracking-wide text-lg">
                    <CloudRain className="text-[var(--color-tertiary)]" size={20} />
                    Időjárás
                </h3>
            </div>
            
            <div className="space-y-3">
                {weatherData.map((w, idx) => (
                    <div 
                        key={`${w.city}-${idx}`} 
                        className="group relative p-3 rounded-lg bg-[var(--bg-page)] hover:bg-white/5 transition-colors cursor-default border border-[var(--border-main)] hover:border-[var(--color-secondary)]"
                        onMouseEnter={handleMouseEnter}
                    >
                        <div className="flex justify-between items-center relative z-10">
                            <div>
                                <div className="flex items-center gap-2 text-base font-bold text-[var(--text-main)] uppercase tracking-wide">
                                    <MapPin size={14} className="text-[var(--text-muted)] group-hover:text-[var(--color-tertiary)] transition-colors" />
                                    {w.city}
                                </div>
                                <div className="text-base text-[var(--color-secondary)] font-medium pl-6">{w.condition}</div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-2">
                                    {getWeatherIcon(w.condition, 22, "text-[var(--color-primary)]")}
                                    <span className="text-2xl font-bold text-[var(--text-main)]">{w.temp}°</span>
                                </div>
                            </div>
                        </div>

                        {/* Hover Details Bubble */}
                        <div className="absolute right-full top-0 mr-4 w-80 max-w-[85vw] opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 transform translate-x-4 group-hover:translate-x-0">
                            <div 
                                className="bg-[var(--bg-panel)] p-5 rounded-xl text-base flex flex-col gap-3 text-[var(--text-main)] font-medium border border-[var(--color-primary)] shadow-2xl shadow-black overflow-y-auto custom-scrollbar"
                                style={{ maxHeight: popoverMaxHeight }}
                            >
                                <div className="grid grid-cols-2 gap-4 pb-2 border-b border-[var(--border-main)]">
                                    {/* Today */}
                                    <div className="flex flex-col gap-2 border-r border-[var(--border-main)] pr-2">
                                        <div className="flex items-center gap-1 text-[var(--color-tertiary)] font-black uppercase tracking-wider text-base">
                                            Ma
                                        </div>
                                        <div className="flex items-start gap-2">
                                            {/* Changed text-white to text-[var(--color-tertiary)] for visibility on light themes */}
                                            <Sun size={18} className="text-[var(--color-tertiary)] mt-0.5 flex-shrink-0" />
                                            <div>
                                                <div className="text-[var(--text-main)] font-mono text-base font-bold">
                                                    {w.today.day.min}° / {w.today.day.max}°
                                                </div>
                                                <div className="text-[var(--text-muted)] text-base leading-tight">
                                                    {w.today.day.condition}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Moon size={18} className="text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
                                            <div>
                                                <div className="text-[var(--text-muted)] font-mono text-base font-bold">
                                                    {w.today.night.min}° / {w.today.night.max}°
                                                </div>
                                                <div className="text-[var(--text-muted)] text-base leading-tight">
                                                    {w.today.night.condition}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Tomorrow */}
                                    <div className="flex flex-col gap-2 pl-1">
                                         <div className="flex items-center gap-1 text-[var(--text-muted)] font-black uppercase tracking-wider text-base">
                                            Holnap <ArrowRight size={14} />
                                        </div>
                                        <div className="flex items-start gap-2">
                                            {/* Changed text-white to text-[var(--color-tertiary)] for visibility on light themes */}
                                            <Sun size={18} className="text-[var(--color-tertiary)] mt-0.5 flex-shrink-0" />
                                            <div>
                                                <div className="text-[var(--text-main)] font-mono text-base font-bold">
                                                    {w.tomorrow.day.min}° / {w.tomorrow.day.max}°
                                                </div>
                                                <div className="text-[var(--text-muted)] text-base leading-tight">
                                                    {w.tomorrow.day.condition}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Moon size={18} className="text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
                                            <div>
                                                <div className="text-[var(--text-muted)] font-mono text-base font-bold">
                                                    {w.tomorrow.night.min}° / {w.tomorrow.night.max}°
                                                </div>
                                                <div className="text-[var(--text-muted)] text-base leading-tight">
                                                    {w.tomorrow.night.condition}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between pt-1 text-[var(--text-muted)]">
                                    <span className="flex items-center gap-1 text-base"><Droplets size={16} className="text-[var(--text-main)]"/> {w.humidity}%</span>
                                    <span className="flex items-center gap-1 text-base"><Wind size={16} className="text-[var(--text-muted)]"/> {w.windSpeed} km/h</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};