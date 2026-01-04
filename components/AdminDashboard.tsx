import React, { useState } from 'react';
import { Lock, MapPin, Monitor, Clock, BarChart3, PieChart, X } from 'lucide-react';
import { THEMES } from '../constants/themes';

const SERVER_URL = 'http://localhost:3001/api';

export const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // SECURITY UPDATE: Auth logic moved to server
            const response = await fetch(`${SERVER_URL}/admin-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setIsAuthenticated(true);
                // Transform server data to frontend format if necessary
                const serverData = data.stats;
                const transformedStats = {
                    totalVisits: serverData.visits.length,
                    uniqueIps: new Set(serverData.visits.map((v:any) => v.ip)).size,
                    avgTime: 300, 
                    visits: serverData.visits.map((v: any) => ({
                        ip: v.ip,
                        city: v.city,
                        theme: v.theme,
                        views: v.views,
                        time: 0,
                        device: (v.userAgent?.includes("Firefox") ? "Firefox" : v.userAgent?.includes("Chrome") ? "Chrome" : "Egyéb") + ` (${v.screenWidth}x${v.screenHeight})`,
                        pageViews: {}
                    })).reverse(),
                    themeStats: serverData.themeStats,
                    pageStats: serverData.pageViews
                };
                setStats(transformedStats);
            } else {
                setError(data.error || 'Helytelen jelszó');
            }
        } catch (e) {
            setError('Szerver hiba. Ellenőrizd a kapcsolatot.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-zinc-800 rounded-full">
                            <Lock className="text-[#d946ef]" size={32} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-center text-white mb-2">ADMIN HOZZÁFÉRÉS</h2>
                    <p className="text-zinc-500 text-center mb-6 text-sm">A statisztikák megtekintéséhez add meg a jelszót.</p>
                    
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-[#d946ef] focus:outline-none transition-colors"
                            placeholder="Jelszó..."
                            autoFocus
                        />
                        {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-[#d946ef] hover:bg-[#c026d3] text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Ellenőrzés...' : 'Belépés'}
                        </button>
                    </form>
                    <button onClick={onClose} className="w-full mt-4 text-zinc-500 hover:text-white text-sm">Vissza az oldalra</button>
                </div>
            </div>
        );
    }

    if (!stats) return <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center text-white">Betöltés...</div>;

    return (
        <div className="fixed inset-0 z-[200] bg-[#050505] overflow-y-auto text-white">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-10 border-b border-zinc-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            <BarChart3 className="text-[#d946ef]" />
                            Látogatói Statisztika
                        </h1>
                        <p className="text-zinc-400 mt-1">Státusz: Online (Biztonságos kapcsolat)</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                        <div className="text-zinc-500 text-sm font-bold uppercase mb-2">Összes Megnyitás</div>
                        <div className="text-4xl font-black text-white">{stats.totalVisits.toLocaleString()}</div>
                    </div>
                    <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                        <div className="text-zinc-500 text-sm font-bold uppercase mb-2">Egyedi IP Címek</div>
                        <div className="text-4xl font-black text-white">{stats.uniqueIps.toLocaleString()}</div>
                    </div>
                    <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                        <div className="text-zinc-500 text-sm font-bold uppercase mb-2">Adatforrás</div>
                        <div className="text-4xl font-black text-[#10b981]">Szerver</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    {/* Theme Distribution */}
                    <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <PieChart size={20} className="text-[#fbbf24]" />
                            Témaválasztás Megoszlása
                        </h3>
                        <div className="space-y-4">
                            {Object.entries(stats.themeStats || {}).map(([themeId, count]: [string, any]) => {
                                const themeName = THEMES.find(t => t.id === themeId)?.name || themeId;
                                const total = Object.values(stats.themeStats).reduce((a:any, b:any) => a + b, 0) as number;
                                const percent = Math.round((count / total) * 100) || 0;
                                
                                return (
                                    <div key={themeId}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-zinc-300">{themeName}</span>
                                            <span className="font-bold text-white">{count} ({percent}%)</span>
                                        </div>
                                        <div className="w-full bg-black rounded-full h-3 overflow-hidden">
                                            <div 
                                                className="h-full rounded-full transition-all duration-1000"
                                                style={{ 
                                                    width: `${percent}%`,
                                                    backgroundColor: THEMES.find(t => t.id === themeId)?.colors.primary || '#555'
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Page Views */}
                    <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Monitor size={20} className="text-[#3b82f6]" />
                            Legnépszerűbb Oldalak
                        </h3>
                        <div className="space-y-3">
                            {Object.entries(stats.pageStats || {})
                                .sort(([,a], [,b]) => (b as number) - (a as number))
                                .map(([page, count]: [string, any]) => (
                                <div key={page} className="flex items-center justify-between p-3 bg-black/50 rounded border border-zinc-800">
                                    <span className="font-mono text-[#d946ef] uppercase">{page}</span>
                                    <span className="font-bold">{count} megtekintés</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Visitors Table */}
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                    <div className="p-6 border-b border-zinc-800">
                        <h3 className="text-xl font-bold">Legutóbbi Látogatók Részletei</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-black/50 text-zinc-400 uppercase text-xs">
                                <tr>
                                    <th className="p-4">IP Cím</th>
                                    <th className="p-4">Helyzet</th>
                                    <th className="p-4">Eszköz</th>
                                    <th className="p-4">Választott Téma</th>
                                    <th className="p-4 text-right">Megtekintések</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {stats.visits.map((v: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-mono text-zinc-300">{v.ip}</td>
                                        <td className="p-4 flex items-center gap-2">
                                            <MapPin size={14} className="text-[#fbbf24]" />
                                            {v.city}
                                        </td>
                                        <td className="p-4 text-zinc-400">{v.device}</td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 rounded bg-black border border-zinc-700 text-xs font-bold uppercase">
                                                {THEMES.find(t => t.id === v.theme)?.name || v.theme}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-bold text-[#10b981]">{v.views}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};