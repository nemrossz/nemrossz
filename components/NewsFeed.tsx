import React, { useMemo, useState } from 'react';
import { NewsItem } from '../types';
import { NewsCard } from './NewsCard';
import { WeatherWidget } from './WeatherWidget';
import { MarketWidget } from './MarketWidget';
import { TagsWidget } from './TagsWidget';
import { Sparkles, Ban } from 'lucide-react';
import { getRandomHistoricalNews } from '../services/newsService';

interface NewsFeedProps {
    news: NewsItem[];
    loading: boolean;
    activeSection: string;
    availableTags: string[];
    activeTags: string[];
    onTagClick: (tag: string) => void;
}

const getFallbackImage = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    }
    return `https://picsum.photos/seed/${Math.abs(hash)}/800/600`;
};

// Extracted Component for better performance and readability
export const NewsFeed: React.FC<NewsFeedProps> = ({ 
    news, loading, activeSection, availableTags, activeTags, onTagClick 
}) => {
    const [sidebarPopoverMaxHeight, setSidebarPopoverMaxHeight] = useState('80vh');

    const handleSidebarMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const availableSpace = window.innerHeight - rect.top - 20;
        setSidebarPopoverMaxHeight(`${Math.max(200, availableSpace)}px`);
    };

    // Memoize random items to prevent re-generation on every render
    const randomNewsMap = useMemo(() => {
        const map: Record<number, NewsItem[]> = {};
        let idx = 0;
        let cyc = 0;
        
        while (idx < news.length) {
            map[cyc] = getRandomHistoricalNews(6);
            idx += 5 + 1 + 6 + 1; // Approx spacing logic matching the loop below
            cyc++;
        }
        return map;
    }, [news.length]); // Only recalc if news count changes

    if (news.length === 0 && !loading) {
        return (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)] gap-4">
            <Ban size={48} className="opacity-20 text-[var(--color-tertiary)]" />
            <div className="font-black uppercase tracking-widest text-base">Nincsenek hírek ebben a kategóriában.</div>
          </div>
        );
    }

    const blocks: React.ReactNode[] = [];
    let currentIndex = 0;
    let cycle = 0;

    while (currentIndex < news.length) {
        const keyBase = `cycle-${cycle}`;
        const mainListCount = 5;
        const mainListItems = news.slice(currentIndex, currentIndex + mainListCount);
        const randomSidebarItems = randomNewsMap[cycle] || [];

        const subGridItems = mainListItems.slice(1);
        const isSubGridOdd = subGridItems.length % 2 !== 0;

        blocks.push(
            <div key={`${keyBase}-split`} className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16 animate-fade-in">
                <div className="lg:col-span-2 space-y-8">
                    {mainListItems[0] && (
                        <div className="h-[300px]">
                            <NewsCard item={mainListItems[0]} layout="standard" onTagClick={onTagClick} alignment="center" />
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {subGridItems.map((item, idx) => {
                            const isLastAndOdd = isSubGridOdd && idx === subGridItems.length - 1;
                            return (
                                <div key={item.id} className={`h-[320px] ${isLastAndOdd ? 'md:col-span-2' : ''}`}>
                                    <NewsCard 
                                        item={item} 
                                        layout="compact" 
                                        onTagClick={onTagClick} 
                                        alignment={isLastAndOdd ? 'center' : (idx % 2 === 0 ? 'left' : 'right')} 
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="hidden lg:block space-y-6">
                    {cycle === 0 ? (
                        <>
                            <WeatherWidget />
                            <MarketWidget />
                            {activeSection !== 'home' && (
                                <TagsWidget 
                                    onTagClick={onTagClick} 
                                    availableTags={availableTags} 
                                    activeTags={activeTags} 
                                />
                            )}
                        </>
                    ) : randomSidebarItems.length > 0 ? (
                         <div className="bg-[var(--bg-panel)] rounded-xl shadow-lg border border-[var(--border-main)] p-5 relative z-20 hover:border-[var(--color-primary)] transition-colors">
                            <h3 className="font-black text-[var(--text-main)] mb-4 flex items-center gap-2 uppercase tracking-wide text-lg">
                                <Sparkles className="text-[var(--color-tertiary)]" size={20} />
                                Ajánlott
                            </h3>
                            <div className="space-y-4">
                                {randomSidebarItems.map((item, idx) => {
                                    // Logic: Find the first tag that is <= 9 characters. If none, display nothing.
                                    const displayTag = item.tags.find(t => t.length <= 9);

                                    return (
                                    <div key={`sidebar-${cycle}-${idx}`} className="group relative flex gap-3 p-3 bg-[var(--bg-page)] border border-[var(--border-main)] hover:border-[var(--color-secondary)] rounded-lg transition-all cursor-default hover:z-[80] hover:bg-white/5" onMouseEnter={handleSidebarMouseEnter}>
                                        <div className="w-1/5 flex flex-col gap-2 min-w-[60px]">
                                            <div className="w-full aspect-square rounded-lg overflow-hidden border border-[var(--border-main)] bg-[var(--bg-page)] relative">
                                                <img 
                                                    src={item.image} 
                                                    onError={(e) => { e.currentTarget.src = getFallbackImage(item.title); }}
                                                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity grayscale-[50%] group-hover:grayscale-0" 
                                                    alt="" 
                                                />
                                            </div>
                                            <div className="flex flex-wrap gap-1 leading-none">
                                                {displayTag && (
                                                    <button 
                                                        onClick={(e) => {e.stopPropagation(); onTagClick(displayTag);}} 
                                                        className="text-[10px] font-bold text-[var(--tag-text)] bg-[var(--color-tertiary)] hover:text-white uppercase px-1 rounded truncate w-full text-center"
                                                    >
                                                        {displayTag}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-4/5 flex flex-col">
                                            <h4 className="text-base font-black text-[var(--text-main)] mb-1 line-clamp-2 leading-snug group-hover:text-[var(--color-secondary)] transition-colors">{item.title}</h4>
                                            <p className="text-base text-[var(--text-muted)] line-clamp-3 leading-relaxed overflow-hidden font-medium">{item.content}</p>
                                        </div>
                                        {/* Popover */}
                                        <div className="absolute right-full top-0 mr-4 w-[700px] max-w-[85vw] opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 pointer-events-none translate-x-4 group-hover:translate-x-0">
                                            <div className="bg-[var(--bg-panel)] p-5 rounded-xl text-base text-[var(--text-main)] border border-[var(--color-secondary)] shadow-2xl shadow-black overflow-y-auto custom-scrollbar" style={{ maxHeight: sidebarPopoverMaxHeight }}>
                                                <h5 className="font-black mb-2 text-[var(--color-secondary)] text-lg">{item.title}</h5>
                                                <p className="leading-relaxed whitespace-pre-line font-medium text-[var(--text-main)]">{item.content}</p>
                                            </div>
                                        </div>
                                    </div>
                                )})}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        );
        currentIndex += mainListCount;
        if (currentIndex >= news.length) break;

        const heroItem = news[currentIndex];
        if (heroItem) {
            blocks.push(
                <div key={`${keyBase}-hero`} className="max-w-7xl mx-auto px-4 mb-16 animate-fade-in">
                    <NewsCard item={heroItem} layout="text-hero" onTagClick={onTagClick} />
                </div>
            );
            currentIndex += 1;
        }
        if (currentIndex >= news.length) break;

        const gridCount = 6;
        const gridItems = news.slice(currentIndex, currentIndex + gridCount);
        if (gridItems.length > 0) {
            const isGridOdd = gridItems.length % 2 !== 0;
            blocks.push(
                <div key={`${keyBase}-grid`} className="max-w-7xl mx-auto px-4 mb-16 animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-6">
                    {gridItems.map((item, idx) => {
                        const isLastAndOdd = isGridOdd && idx === gridItems.length - 1;
                        return (
                            <div key={item.id} className={`h-[350px] ${isLastAndOdd ? 'md:col-span-2' : ''}`}>
                                <NewsCard 
                                    item={item} 
                                    layout="compact" 
                                    onTagClick={onTagClick} 
                                    alignment={isLastAndOdd ? 'center' : (idx % 2 === 0 ? 'left' : 'right')} 
                                />
                            </div>
                        );
                    })}
                </div>
            );
            currentIndex += gridCount;
        }
        cycle++;
    }
    return <>{blocks}</>;
};