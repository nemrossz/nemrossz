export interface Theme {
    id: string;
    name: string;
    colors: {
        bgPage: string;      // Main background (pl. body)
        bgPanel: string;     // Widget/Card backgrounds
        border: string;      // Borders for panels
        primary: string;     // Strong accent (pl. active buttons, main logo part)
        secondary: string;   // Secondary accent (pl. highlights, hover states)
        tertiary: string;    // Warning/Gold/Third color
        textMain: string;
        textMuted: string;
        tagText: string;     // Color for text inside tags
    }
}

export const THEMES: Theme[] = [
    {
        id: 'original',
        name: 'Sötét (Zöld)',
        colors: {
            bgPage: '#050505',
            bgPanel: '#121212',
            border: '#27272a', // zinc-800
            primary: '#10b981', // Emerald-500
            secondary: '#34d399', // Emerald-400
            tertiary: '#fbbf24', // Amber-400 (Gold)
            textMain: '#FFFFFF',
            textMuted: '#a1a1aa', // zinc-400
            tagText: '#000000'
        }
    },
    {
        id: 'neon',
        name: 'Sötét (Cyber)',
        colors: {
            bgPage: '#050505',
            bgPanel: '#121212',
            border: '#10b981',   // Smaragd Zöld (Szegélyek)
            primary: '#FF204E',  // Neon Piros (Logo, Aktív menü)
            secondary: '#10b981',// Smaragd Zöld (Árfolyam emelkedés, Hover)
            tertiary: '#FF204E', // Neon Piros (Címkék, Árfolyam esés)
            textMain: '#FFFFFF',
            textMuted: '#a1a1aa',
            tagText: '#FFFFFF'
        }
    },
    {
        id: 'original-red',
        name: 'Sötét (Piros)',
        colors: {
            bgPage: '#050505',
            bgPanel: '#121212',
            border: '#27272a', // zinc-800
            primary: '#FF204E', // Red (Was Green)
            secondary: '#fc5c65', // Lighter Red (Was Light Green)
            tertiary: '#10b981', // Green (Was Red)
            textMain: '#FFFFFF',
            textMuted: '#a1a1aa',
            tagText: '#000000'
        }
    },
    {
        id: 'light-green',
        name: 'Világos (Zöld)',
        colors: {
            bgPage: '#f3f4f6',   // Gray-100
            bgPanel: '#ffffff',  // White
            border: '#e5e7eb',   // Gray-200
            primary: '#059669',  // Emerald-600 (Darker for contrast on white)
            secondary: '#10b981',// Emerald-500
            tertiary: '#d97706', // Amber-600
            textMain: '#111827', // Gray-900
            textMuted: '#6b7280', // Gray-500
            tagText: '#FFFFFF'
        }
    },
    {
        id: 'light-red',
        name: 'Világos (Piros)',
        colors: {
            bgPage: '#f4f4f5',   // Zinc-100
            bgPanel: '#ffffff',  // White
            border: '#e4e4e7',   // Zinc-200
            primary: '#dc2626',  // Red-600
            secondary: '#ef4444',// Red-500
            tertiary: '#059669', // Emerald-600
            textMain: '#18181b', // Zinc-900
            textMuted: '#71717a', // Zinc-500
            tagText: '#FFFFFF'
        }
    },
    {
        id: 'light-blue',
        name: 'Világos (Kék)',
        colors: {
            bgPage: '#f1f5f9',   // Slate-100
            bgPanel: '#ffffff',  // White
            border: '#cbd5e1',   // Slate-300
            primary: '#014bae',  // Requested Blue
            secondary: '#0f172a',// Slate-900 (Dark Blue-Black)
            tertiary: '#334155', // Slate-700 (Dark Gray for Tags)
            textMain: '#020617', // Slate-950
            textMuted: '#64748b', // Slate-500
            tagText: '#FFFFFF'   // White text on dark gray tags
        }
    },
    {
        id: 'gothic',
        name: 'Sötét (Gót)',
        colors: {
            bgPage: '#0A0A0E',
            bgPanel: '#070027',
            border: '#1e1b4b', // Indigo-950
            primary: '#c10e6a', // Strong Magenta
            secondary: '#d946ef', // Neon Pink
            tertiary: '#eaa72b', // Gold
            textMain: '#FFFFFF',
            textMuted: '#a1a1aa',
            tagText: '#000000'
        }
    },
    {
        id: 'vivid',
        name: 'Sötét (Magenta)',
        colors: {
            bgPage: '#050505',
            bgPanel: '#121212',
            border: '#27272a',
            primary: '#d946ef',   // Vivid Magenta
            secondary: '#fbbf24', // Golden Amber
            tertiary: '#4c1d95',  // Deep Purple
            textMain: '#FFFFFF',
            textMuted: '#a1a1aa',
            tagText: '#FFFFFF'
        }
    },
    {
        id: 'christmas',
        name: 'Sötét (Karácsony)',
        colors: {
            bgPage: '#022c22',    // Very Dark Green (Pine)
            bgPanel: '#064e3b',   // Dark Green
            border: '#0f766e',    // Teal-ish border
            primary: '#3b82f6',   // Royal Blue (Ornaments)
            secondary: '#94a3b8', // Silver (Tinsel)
            tertiary: '#f59e0b',  // Warm Gold (Lights)
            textMain: '#f1f5f9',  // Silver-White
            textMuted: '#cbd5e1',  // Muted Silver
            tagText: '#000000'
        }
    }
];

export const DEFAULT_THEME_ID = 'original';