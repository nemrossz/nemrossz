import React, { useState, useEffect, useMemo, Suspense, lazy, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { Navigation } from './components/Navigation';
import { CookieConsent } from './components/CookieConsent';
import { NewsFeed } from './components/NewsFeed';
import { fetchNewsBatch, fetchTags, filterNewsByTags, preloadHistory } from './services/newsService';
import { trackVisit, trackPageView, trackTime, updateThemeStat } from './services/statsService';
import { useTheme } from './context/ThemeContext';
import { NewsItem } from './types';
import { Loader2, Ban, X } from 'lucide-react';
import { useIntersectionObserver } from './hooks/useIntersectionObserver';

const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State to track infinite scroll position
  const [lastLoadedDate, setLastLoadedDate] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const { currentTheme } = useTheme();

  // Infinite Scroll Observer
  const { containerRef, isVisible } = useIntersectionObserver({
    root: null,
    rootMargin: '200px', // Trigger load 200px before reaching bottom
    threshold: 0
  });

  // --- STATS & ADMIN LOGIC ---
  useEffect(() => {
      trackVisit();
      const interval = setInterval(trackTime, 5000);

      if (window.location.search.includes('admin=true')) {
          setShowAdmin(true);
          window.history.replaceState({}, '', window.location.pathname);
      }

      const visited = localStorage.getItem('has_visited_before');
      if (!visited) {
          localStorage.setItem('has_visited_before', 'true');
          setTimeout(() => {
              window.dispatchEvent(new CustomEvent('openThemeSelector', { 
                  detail: { showWelcome: true } 
              }));
          }, 2000);
      }
      return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      updateThemeStat(currentTheme.id);
  }, [currentTheme.id]);

  useEffect(() => {
    trackPageView(activeSection);
  }, [activeSection]);

  // --- INITIAL DATA LOADING ---
  useEffect(() => {
    // Reset state on section change
    setNews([]);
    setLastLoadedDate(null);
    setHasMore(true);
    setActiveTags([]);
    setLoading(true);
    
    // Initial Fetch
    loadNextBatch(null, activeSection, true);
    preloadHistory();
  }, [activeSection]);

  // --- INFINITE SCROLL TRIGGER ---
  useEffect(() => {
      if (isVisible && hasMore && !loading && news.length > 0) {
          loadNextBatch(lastLoadedDate, activeSection, false);
      }
  }, [isVisible, hasMore, loading, lastLoadedDate, activeSection, news.length]);

  const loadNextBatch = async (dateCursor: string | null, sectionId: string, reset: boolean) => {
    setLoading(true);
    
    try {
      const fetchPromise = fetchNewsBatch(dateCursor, sectionId);
      const tagsPromise = (reset || availableTags.length === 0) ? fetchTags(sectionId) : Promise.resolve(null);
      
      const [result, sectionTags] = await Promise.all([fetchPromise, tagsPromise]);
      
      if (sectionTags && Array.isArray(sectionTags)) {
          setAvailableTags(sectionTags);
      }

      if (result.news.length === 0) {
          setHasMore(false); // No more news found after scanning
      } else {
          setNews(prev => reset ? result.news : [...prev, ...result.news]);
          setLastLoadedDate(result.lastDate);
      }

    } catch (error) {
      console.error("Failed to load news:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handleTagClick = (tag: string) => {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const clearTag = (tag: string) => setActiveTags(prev => prev.filter(t => t !== tag));
  const clearAllTags = () => setActiveTags([]);

  const filteredNews = useMemo(() => {
    return activeTags.length > 0 ? filterNewsByTags(news, activeTags) : news;
  }, [news, activeTags]);

  if (showAdmin) {
      return (
        <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-black text-white">Betöltés...</div>}>
            <AdminDashboard onClose={() => setShowAdmin(false)} />
        </Suspense>
      );
  }

  return (
    <div className="min-h-screen text-[var(--text-main)] bg-[var(--bg-page)] transition-colors duration-500">
      <TopBar />
      <Navigation activeSection={activeSection} onSectionChange={setActiveSection} />
      
      {activeTags.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mt-8 animate-fade-in">
            <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] p-2 rounded-lg flex flex-wrap items-center gap-2 shadow-lg">
                <span className="text-[var(--text-muted)] text-base font-black uppercase tracking-wider ml-2 mr-1">Szűrés:</span>
                {activeTags.map(tag => (
                    <div key={tag} className="bg-[var(--color-tertiary)] border border-[var(--color-tertiary)] text-black pl-3 pr-1 py-1 rounded-md flex items-center gap-1 text-base font-bold uppercase transition-all hover:bg-opacity-80">
                        <span>{tag}</span>
                        <button onClick={() => clearTag(tag)} className="p-1 hover:text-white hover:bg-black/20 rounded-md transition-colors"><X size={16} /></button>
                    </div>
                ))}
                <button onClick={clearAllTags} className="text-base text-[var(--text-muted)] hover:text-white underline ml-auto mr-2 font-bold uppercase">Összes törlése</button>
            </div>
        </div>
      )}

      <main className="mt-10 min-h-[40vh]">
        <NewsFeed 
            news={filteredNews} 
            loading={loading} 
            activeSection={activeSection}
            availableTags={availableTags}
            activeTags={activeTags}
            onTagClick={handleTagClick}
        />

        {/* LOADING & INFINITE SCROLL SENTINEL */}
        <div className="flex justify-center py-12" ref={containerRef}>
            {loading && (
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-[var(--color-primary)]" size={32} />
                    <span className="text-[var(--text-muted)] text-sm font-bold uppercase tracking-widest">Hírek betöltése...</span>
                </div>
            )}
            
            {!hasMore && !loading && news.length > 0 && (
                 <div className="flex flex-col items-center gap-3 text-[var(--text-muted)] py-4 px-8 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-main)]">
                    <Ban size={24} className="text-[var(--color-tertiary)]" />
                    <span className="text-base font-black tracking-widest uppercase">Nincs több hír</span>
                </div>
            )}
        </div>
      </main>

      <CookieConsent />
    </div>
  );
};

export default App;