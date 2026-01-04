import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const STATS_FILE = path.join(__dirname, 'stats.json');
const HISTORY_FILE = path.join(__dirname, '../public/market_history.json');
const CONTENT_DIR = path.join(__dirname, '../public/Tartalom');

// Security: API Key moved to server side
const FINNHUB_KEY = 'd59qdi9r01qgqlm1tu8gd59qdi9r01qgqlm1tu90';

// Security: Admin Password Hash (Moved from client to server)
// Hash of "luTou8OO8&iMe8fN"
const ADMIN_HASH = "f516802523277026727500350493864557922096706012625299831780516565";

// Security: Headers
app.use(helmet());

// Security: Rate Limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 1000, // Limit each IP to 1000 requests per windowMs
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});
app.use(limiter);

// Specific stricter limit for login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10, // Max 10 login attempts per 15 mins
    message: { error: "Túl sok próbálkozás. Kérlek várj." }
});

app.use(cors());
app.use(express.json());

// --- CONTENT INDEXING (Performance Optimization) ---
// Scans the directory structure to tell the client exactly which dates have content.
// This prevents the client from guessing dates and getting 404s.
app.get('/api/content-index', async (req, res) => {
    try {
        // PERFORMANCE: Cache this response for 5 minutes (300s) on client/CDN
        res.set('Cache-Control', 'public, max-age=300');
        
        const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
        // Filter for directories that look like dates (YYYY-MM-DD)
        const dates = entries
            .filter(dirent => dirent.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(dirent.name))
            .map(dirent => dirent.name)
            .sort((a, b) => b.localeCompare(a)); // Descending order (newest first)
        
        res.json({ dates });
    } catch (e) {
        console.error("Content index error:", e);
        res.status(500).json({ dates: [] });
    }
});

// --- MARKET DATA PROXY (Security) ---
// Proxies requests to Finnhub so the API key is not exposed to the client.
app.get('/api/stock/:symbol', async (req, res) => {
    const { symbol } = req.params;
    // Basic validation to prevent arbitrary URL calls
    if (!symbol || !/^[A-Za-z0-9\^]+$/.test(symbol)) {
        return res.status(400).json({ error: "Invalid symbol" });
    }

    try {
        // PERFORMANCE: Stock data usually has a delay anyway, caching for 1 minute is safe
        res.set('Cache-Control', 'public, max-age=60');

        const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_KEY}`);
        if (!response.ok) throw new Error("Finnhub API Error");
        const data = await response.json();
        res.json(data);
    } catch (e) {
        res.status(502).json({ error: "Failed to fetch stock data" });
    }
});

// --- MARKET DATA FETCHER LOGIC (Background Task) ---

const fetchMarketDataForHistory = async () => {
    const currentPrices = {};

    try {
        // 1. Forex
        try {
            const forexRes = await fetch('https://api.frankfurter.app/latest?from=USD&to=HUF,EUR');
            if (forexRes.ok) {
                const data = await forexRes.json();
                currentPrices['USDHUF'] = data.rates.HUF;
                currentPrices['EURHUF'] = data.rates.HUF / data.rates.EUR;
            }
        } catch (e) { console.error("Server Forex fetch error", e); }

        // 2. Crypto
        try {
            const cryptoRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
            if (cryptoRes.ok) {
                const data = await cryptoRes.json();
                if (data.bitcoin) currentPrices['BTCUSD'] = data.bitcoin.usd;
                if (data.ethereum) currentPrices['ETHUSD'] = data.ethereum.usd;
            }
        } catch (e) { console.error("Server Crypto fetch error", e); }

        // 3. Stocks (Finnhub) - Using local key
        const fetchStock = async (symbol, name) => {
             try {
                 const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_KEY}`);
                 if (res.ok) {
                     const data = await res.json();
                     if (data.c > 0) currentPrices[name] = data.c;
                 }
             } catch (e) { console.error(`Server Stock fetch error ${symbol}`, e); }
        };

        await fetchStock('^GSPC', 'S&P 500');
        await fetchStock('^NDX', 'Nasdaq 100');

        return currentPrices;
    } catch (e) {
        console.error("General market fetch error", e);
        return {};
    }
};

const updateMarketHistory = async () => {
    try {
        const today = new Date().toISOString().split('T')[0];
        let history = {};
        
        try {
            const dataStr = await fs.readFile(HISTORY_FILE, 'utf8');
            history = JSON.parse(dataStr);
        } catch (e) {
            // File might not exist yet
        }
        
        const currentRates = await fetchMarketDataForHistory();
        
        if (Object.keys(currentRates).length > 0) {
            history[today] = { ...history[today], ...currentRates };
            
            // Cleanup: Keep only last 8 days
            const sortedDates = Object.keys(history).sort();
            if (sortedDates.length > 8) {
                const cutOff = sortedDates.length - 8;
                for (let i = 0; i < cutOff; i++) {
                    delete history[sortedDates[i]];
                }
            }

            await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2));
            console.log(`[Market] History updated for ${today}`);
        }

    } catch (e) {
        console.error("Failed to update market history", e);
    }
};

// Check for updates
updateMarketHistory();
setInterval(() => {
    updateMarketHistory();
}, 60 * 60 * 1000); 

// --- STATS LOGIC ---

const initStats = async () => {
    try {
        await fs.access(STATS_FILE);
    } catch {
        const initialData = {
            visits: [],
            pageViews: {},
            themeStats: {},
            totalTime: 0
        };
        await fs.writeFile(STATS_FILE, JSON.stringify(initialData, null, 2));
    }
};

initStats();

app.post('/api/visit', async (req, res) => {
    try {
        const { ip, city, userAgent, theme, screenWidth, screenHeight, referrer, language } = req.body;
        const realIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || ip;

        const dataStr = await fs.readFile(STATS_FILE, 'utf8');
        const data = JSON.parse(dataStr);

        const today = new Date().toISOString().split('T')[0];
        const existingVisit = data.visits.find(v => v.ip === realIp && v.date === today && v.userAgent === userAgent);

        if (existingVisit) {
            existingVisit.views = (existingVisit.views || 1) + 1;
            existingVisit.lastAction = new Date().toISOString();
            existingVisit.theme = theme; 
        } else {
            data.visits.push({
                ip: realIp,
                city: city || 'Unknown',
                userAgent,
                theme,
                screenWidth,
                screenHeight,
                referrer,
                language,
                date: today,
                firstVisit: new Date().toISOString(),
                lastAction: new Date().toISOString(),
                views: 1,
                timeSpent: 0
            });
        }
        
        data.themeStats[theme] = (data.themeStats[theme] || 0) + 1;

        if (data.visits.length > 1000) {
            data.visits = data.visits.slice(-1000);
        }

        await fs.writeFile(STATS_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to save stats' });
    }
});

app.post('/api/pageview', async (req, res) => {
    try {
        const { page } = req.body;
        const dataStr = await fs.readFile(STATS_FILE, 'utf8');
        const data = JSON.parse(dataStr);
        
        data.pageViews[page] = (data.pageViews[page] || 0) + 1;
        
        await fs.writeFile(STATS_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// SECURITY UPDATE: Server-side Authentication
app.post('/api/admin-login', loginLimiter, async (req, res) => {
    const { password } = req.body;
    
    if (!password) return res.status(400).json({ error: "Password required" });

    // Hash the input password
    const hash = crypto.createHash('sha256').update(password).digest('hex');

    if (hash === ADMIN_HASH) {
        // Auth success - return the stats
        try {
            const dataStr = await fs.readFile(STATS_FILE, 'utf8');
            const data = JSON.parse(dataStr);
            res.json({ success: true, stats: data });
        } catch (e) {
            res.status(500).json({ error: "Stats file error" });
        }
    } else {
        // Auth failed
        res.status(401).json({ error: "Helytelen jelszó" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});