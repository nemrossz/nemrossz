import { THEMES } from '../constants/themes';
import { getUserLocation } from './marketService';

const SERVER_URL = 'http://localhost:3001/api';

export interface UserSession {
    ip: string;
    city: string;
    userAgent: string;
    theme: string;
    pageViews: Record<string, number>;
    totalTimeSeconds: number;
    lastVisit: string;
    screenWidth: number;
    screenHeight: number;
    language: string;
    referrer: string;
}

// --- MOCK DATABASE (Fallback if server is down) ---
const MOCK_DB_VISITS = [
    { ip: "192.168.1.10", city: "Budapest", theme: "gothic", views: 12, time: 450, device: "Chrome / Windows", pageViews: { home: 10, tech: 2 } },
    { ip: "172.16.0.5", city: "Debrecen", theme: "original", views: 4, time: 120, device: "Safari / iPhone", pageViews: { sport: 4 } },
    { ip: "10.0.0.8", city: "Szeged", theme: "christmas", views: 25, time: 1200, device: "Firefox / Linux", pageViews: { home: 25 } },
    { ip: "84.2.33.12", city: "Wien", theme: "vivid", views: 8, time: 300, device: "Chrome / Android", pageViews: { tech: 5, uzlet: 3 } },
    { ip: "145.23.1.99", city: "London", theme: "gothic", views: 2, time: 45, device: "Edge / Windows", pageViews: { home: 2 } },
];

export const trackVisit = async () => {
    try {
        let session = getLocalSession();
        
        // Enhance session data with browser info
        session.screenWidth = window.screen.width;
        session.screenHeight = window.screen.height;
        session.language = navigator.language;
        session.referrer = document.referrer;

        if (!session.city || session.city === 'Ismeretlen') {
            const loc = await getUserLocation();
            if (loc) session.city = loc.city;
        }

        session.lastVisit = new Date().toISOString();
        saveLocalSession(session);

        // Try sending to Server
        try {
            await fetch(`${SERVER_URL}/visit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ip: session.ip, // Server might overwrite this with real IP
                    city: session.city,
                    userAgent: session.userAgent,
                    theme: session.theme,
                    screenWidth: session.screenWidth,
                    screenHeight: session.screenHeight,
                    referrer: session.referrer,
                    language: session.language
                })
            });
        } catch (e) {
            console.warn("Server not reachable, using local storage stats only.");
        }

    } catch (e) {
        console.warn("Tracking error", e);
    }
};

export const trackPageView = async (sectionId: string) => {
    const session = getLocalSession();
    session.pageViews[sectionId] = (session.pageViews[sectionId] || 0) + 1;
    saveLocalSession(session);

    try {
        await fetch(`${SERVER_URL}/pageview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page: sectionId })
        });
    } catch {}
};

export const trackTime = () => {
    const session = getLocalSession();
    session.totalTimeSeconds += 5; 
    saveLocalSession(session);
    // Note: sending time updates to server every 5s might be too heavy for a simple demo
};

export const updateThemeStat = (themeId: string) => {
    const session = getLocalSession();
    session.theme = themeId;
    saveLocalSession(session);
    // Re-track visit to update theme on server
    trackVisit();
};

// --- INTERNAL HELPERS ---

const getLocalSession = (): UserSession => {
    try {
        const stored = localStorage.getItem('user_stats_session');
        if (stored) return JSON.parse(stored);
    } catch {}

    return {
        ip: 'unknown',
        city: 'Ismeretlen',
        userAgent: navigator.userAgent,
        theme: localStorage.getItem('app_theme') || 'unknown',
        pageViews: {},
        totalTimeSeconds: 0,
        lastVisit: new Date().toISOString(),
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        language: navigator.language,
        referrer: document.referrer
    };
};

const saveLocalSession = (session: UserSession) => {
    try {
        localStorage.setItem('user_stats_session', JSON.stringify(session));
    } catch {}
};

// --- ADMIN API ---

export const getAdminStats = async () => {
    // 1. Try fetching real stats from server
    try {
        const res = await fetch(`${SERVER_URL}/admin-stats`);
        if (res.ok) {
            const serverData = await res.json();
            
            // Map server data to frontend structure
            return {
                totalVisits: serverData.visits.length,
                uniqueIps: new Set(serverData.visits.map((v:any) => v.ip)).size,
                avgTime: 300, // Placeholder as time tracking on server is complex
                visits: serverData.visits.map((v: any) => ({
                    ip: v.ip,
                    city: v.city,
                    theme: v.theme,
                    views: v.views,
                    time: 0,
                    device: parseUA(v.userAgent) + ` (${v.screenWidth}x${v.screenHeight})`,
                    pageViews: {}
                })).reverse(),
                themeStats: serverData.themeStats,
                pageStats: serverData.pageViews
            };
        }
    } catch (e) {
        console.warn("Admin: Server unreachable, showing mock data");
    }

    // 2. Fallback to Mock Data (Client side simulation)
    const currentSession = getLocalSession();
    
    const allVisits = [
        {
            ip: currentSession.ip,
            city: currentSession.city,
            theme: currentSession.theme,
            views: Object.values(currentSession.pageViews).reduce((a, b) => a + b, 0),
            time: currentSession.totalTimeSeconds,
            device: parseUA(currentSession.userAgent),
            pageViews: currentSession.pageViews
        },
        ...MOCK_DB_VISITS
    ];

    const themeCounts: Record<string, number> = {};
    THEMES.forEach(t => themeCounts[t.id] = 0);
    
    const pageViewCounts: Record<string, number> = {};
    
    allVisits.forEach(v => {
        if (themeCounts[v.theme] !== undefined) themeCounts[v.theme]++;
        else themeCounts[v.theme] = 1;

        if (v.pageViews) {
             Object.entries(v.pageViews).forEach(([page, count]) => {
                 pageViewCounts[page] = (pageViewCounts[page] || 0) + (count as number);
             });
        }
    });

    return {
        totalVisits: 12430 + allVisits.length,
        uniqueIps: 8420 + allVisits.length,
        avgTime: Math.round(allVisits.reduce((acc, v) => acc + v.time, 0) / allVisits.length),
        visits: allVisits,
        themeStats: themeCounts,
        pageStats: pageViewCounts
    };
};

const parseUA = (ua: string) => {
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    return "Egyéb";
};