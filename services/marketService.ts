import { MarketRate, WeatherInfo, DailyForecast, WeatherPart, AnalysisData } from '../types';

// --- CONFIGURATION ---
// Note: Finnhub Key is now on the server side.
const FINNHUB_REFRESH_MS = 10 * 60 * 1000; 
const SERVER_API_URL = 'http://localhost:3001/api';

// --- HELPER: COOKIE CONSENT ---
const canUseStorage = (): boolean => {
    try {
        return localStorage.getItem('cookie_consent') === 'accepted';
    } catch { return false; }
};

// --- STRUCTURED ANALYSIS DATA (No more HTML) ---
const ANALYSIS_DATE = "2025-12-27"; // Matches the latest news folder

const BTC_ANALYSIS: AnalysisData = {
    title: "2. BITCOIN MÉLYELEMZÉS (COINGLASS INTELLIGENCE)",
    summary: "A láncon belüli (on-chain) és derivatív adatok azt mutatják, hogy a piac tisztulási folyamaton ment keresztül.",
    details: "Liquidation Data: Az elmúlt napokban a likvidálások volumene normalizálódott.",
    sentiment: 'Bullish',
    date: ANALYSIS_DATE
};

const SPX_ANALYSIS: AnalysisData = {
    title: "S&P 500 Elemzés",
    summary: "Az árfolyam a makrogazdasági adatokra reagál.",
    details: "Technikai kép: A mozgóátlagok feletti tartományban.",
    sentiment: 'Semleges',
    date: ANALYSIS_DATE
};

const GENERIC_ANALYSIS: AnalysisData = {
    title: "Napi Elemzés",
    summary: "A piac jelenleg a makrogazdasági adatokra reagál.",
    details: "",
    sentiment: 'Semleges',
    date: ANALYSIS_DATE
};

// --- MARKET HISTORY LOGIC ---

type MarketHistory = Record<string, Record<string, number>>;
const getDateStr = (date: Date) => date.toISOString().split('T')[0];

const fetchMarketHistory = async (): Promise<MarketHistory> => {
    try {
        const res = await fetch('/market_history.json?t=' + Date.now());
        if (res.ok) return await res.json();
    } catch (e) {}
    return {};
};

// --- FINNHUB CACHE LOGIC ---

interface FinnhubCacheItem {
    symbol: string;
    currentPrice: number;
    previousClose: number;
    lastUpdated: number;
    history: number[];
}
type FinnhubCache = Record<string, FinnhubCacheItem>;

const getFinnhubCache = (): FinnhubCache => {
    try {
        const item = localStorage.getItem('finnhub_cache');
        if (!item) return {};
        return JSON.parse(item) as FinnhubCache;
    } catch { return {}; }
};

const saveFinnhubCache = (cache: FinnhubCache) => {
    if (!canUseStorage()) return;
    try {
        localStorage.setItem('finnhub_cache', JSON.stringify(cache));
    } catch {}
};

const fetchFinnhubQuote = async (symbol: string, currentCache: FinnhubCacheItem | undefined): Promise<FinnhubCacheItem | null> => {
    const now = Date.now();
    
    if (currentCache && (now - currentCache.lastUpdated < FINNHUB_REFRESH_MS)) {
        return currentCache;
    }

    try {
        const encodedSymbol = encodeURIComponent(symbol);
        // SECURITY UPDATE: Use Proxy
        const response = await fetch(`${SERVER_API_URL}/stock/${encodedSymbol}`);
        
        if (response.ok) {
            const data = await response.json();
            let isValid = true;
            if (symbol === '^GSPC' && data.c < 2000) isValid = false;
            if (symbol === '^NDX' && data.c < 5000) isValid = false;

            if (data.c && data.c > 0 && isValid) {
                const history = currentCache ? [...currentCache.history, data.c].slice(-2) : [data.c];
                return {
                    symbol,
                    currentPrice: data.c,
                    previousClose: data.pc || data.c,
                    lastUpdated: now,
                    history
                };
            }
        }
    } catch (e) {
        console.warn(`Finnhub proxy fetch failed for ${symbol}`, e);
    }

    if (currentCache) return currentCache; 
    return null;
};


// --- MARKET DATA FETCHING ---

interface TempMarketRate {
    symbol: string;
    name: string;
    price: number;
    change1d?: number; 
    change1w?: number; 
    analysis?: AnalysisData;
}

export const subscribeToRates = (callback: (rates: MarketRate[]) => void) => {
  let isSubscribed = true;

  const fetchRates = async () => {
    try {
      const history: MarketHistory = await fetchMarketHistory();
      const currentPrices: Record<string, number> = {};
      const newRates: TempMarketRate[] = [];
      const safeVal = (v: any) => (typeof v === 'number' ? v : 0);

      // 1. Forex
      try {
          const forexRes = await fetch('https://api.frankfurter.app/latest?from=USD&to=HUF,EUR');
          if (forexRes.ok) {
              const forexData = await forexRes.json();
              const usdHuf = forexData.rates.HUF;
              const eurHuf = forexData.rates.HUF / forexData.rates.EUR;
              
              newRates.push(
                { symbol: 'USDHUF', name: 'US Dollar', price: safeVal(usdHuf), analysis: GENERIC_ANALYSIS },
                { symbol: 'EURHUF', name: 'Euro', price: safeVal(eurHuf), analysis: GENERIC_ANALYSIS }
              );
          }
      } catch (e) { console.warn("Forex fetch failed"); }

      // 2. Crypto
      try {
          const cryptoRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true&include_7d_change=true`);
          if (cryptoRes.ok) {
              const cgData = await cryptoRes.json();
              if (cgData['bitcoin']) {
                  newRates.push({
                      symbol: 'BTCUSD', name: 'Bitcoin', price: cgData['bitcoin'].usd,
                      change1d: cgData['bitcoin'].usd_24h_change,
                      change1w: cgData['bitcoin'].usd_7d_change,
                      analysis: BTC_ANALYSIS
                  });
              }
              if (cgData['ethereum']) {
                  newRates.push({
                      symbol: 'ETHUSD', name: 'Ethereum', price: cgData['ethereum'].usd,
                      change1d: cgData['ethereum'].usd_24h_change,
                      change1w: cgData['ethereum'].usd_7d_change,
                      analysis: GENERIC_ANALYSIS
                  });
              }
          }
      } catch (e) { console.warn("Crypto fetch failed"); }

      // 3. Stocks (Via Proxy)
      let finnhubCache = canUseStorage() ? getFinnhubCache() : {};
      
      const processStock = async (symbol: string, displayName: string) => {
          let data = await fetchFinnhubQuote(symbol, finnhubCache[symbol]);
          
          if (data && data.currentPrice > 0) {
              finnhubCache[symbol] = data; 
              
              const change1dCalc = data.previousClose > 0 
                  ? ((data.currentPrice - data.previousClose) / data.previousClose) * 100 
                  : 0;

              newRates.push({
                  symbol: displayName,
                  name: displayName,
                  price: data.currentPrice,
                  change1d: change1dCalc,
                  change1w: undefined, 
                  analysis: symbol.includes('GSPC') ? SPX_ANALYSIS : GENERIC_ANALYSIS
              });
          }
      };

      await processStock('^GSPC', 'S&P 500');
      await processStock('^NDX', 'Nasdaq 100');

      saveFinnhubCache(finnhubCache);

      // --- FALLBACK: CALCULATE MISSING CHANGES ---
      const today = new Date();
      const sortedDates = Object.keys(history).sort();
      
      let yesterdayKey = '';
      if (sortedDates.length > 0) {
          const todayStr = getDateStr(today);
          const entriesBeforeToday = sortedDates.filter(d => d < todayStr);
          if (entriesBeforeToday.length > 0) yesterdayKey = entriesBeforeToday[entriesBeforeToday.length - 1];
      }

      let weekAgoKey = '';
      const targetWeekDate = new Date(today);
      targetWeekDate.setDate(today.getDate() - 7);
      const targetWeekStr = getDateStr(targetWeekDate);
      
      const weekCandidates = sortedDates.filter(d => d <= targetWeekStr);
      if (weekCandidates.length > 0) weekAgoKey = weekCandidates[weekCandidates.length - 1];
      else if (sortedDates.length > 0) weekAgoKey = sortedDates[0];

      const finalRates = newRates.map(rate => {
          if (rate.change1d === undefined || rate.change1d === null) {
              if (yesterdayKey && history[yesterdayKey] && history[yesterdayKey][rate.symbol]) {
                  const prev = history[yesterdayKey][rate.symbol];
                  rate.change1d = ((rate.price - prev) / prev) * 100;
              } else rate.change1d = 0;
          }

          if (rate.change1w === undefined || rate.change1w === null) {
              if (weekAgoKey && history[weekAgoKey] && history[weekAgoKey][rate.symbol]) {
                  const prev = history[weekAgoKey][rate.symbol];
                  rate.change1w = ((rate.price - prev) / prev) * 100;
              } else rate.change1w = 0;
          }
          
          return rate as MarketRate;
      });

      if (isSubscribed) callback(finalRates);
    } catch (error) {
      console.error("Market data error:", error);
    }
  };

  fetchRates(); 
  const interval = setInterval(fetchRates, 30000); 

  return () => {
    isSubscribed = false;
    clearInterval(interval);
  };
};

// Weather logic remains unchanged
const CITY_COORDS: Record<string, {lat: number, lon: number}> = {
    'Budapest': { lat: 47.4979, lon: 19.0402 },
    'Székesfehérvár': { lat: 47.1899, lon: 18.4103 },
    'Wien': { lat: 48.2082, lon: 16.3738 },
    'Rijeka': { lat: 45.3271, lon: 14.4422 }
};

const getWeatherCondition = (code: number): string => {
    if (code === 0) return 'Napos';
    if (code >= 1 && code <= 3) return 'Felhős';
    if (code >= 45 && code <= 48) return 'Köd';
    if (code >= 51 && code <= 67) return 'Eső';
    if (code >= 71 && code <= 77) return 'Hó';
    if (code >= 95) return 'Vihar';
    return 'Változó';
};

const calculatePart = (temps: number[], codes: number[]): WeatherPart => {
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const midIndex = Math.floor(codes.length / 2);
    const condition = getWeatherCondition(codes[midIndex]);
    return { min: Math.round(min), max: Math.round(max), condition };
};

const fetchWeatherFromCoords = async (lat: number, lon: number, cityName: string): Promise<WeatherInfo> => {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&timezone=auto&forecast_days=3`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Weather API Error');
        const data = await response.json();
        const current = data.current;
        const hourly = data.hourly;
        
        const todayDayTemps = hourly.temperature_2m.slice(6, 20);
        const todayDayCodes = hourly.weather_code.slice(6, 20);
        const todayNightTemps = hourly.temperature_2m.slice(20, 30);
        const todayNightCodes = hourly.weather_code.slice(20, 30);
        const tomorrowDayTemps = hourly.temperature_2m.slice(30, 44);
        const tomorrowDayCodes = hourly.weather_code.slice(30, 44);
        const tomorrowNightTemps = hourly.temperature_2m.slice(44, 54);
        const tomorrowNightCodes = hourly.weather_code.slice(44, 54);

        return {
          city: cityName,
          temp: Math.round(current.temperature_2m),
          condition: getWeatherCondition(current.weather_code),
          humidity: current.relative_humidity_2m,
          windSpeed: current.wind_speed_10m,
          today: { day: calculatePart(todayDayTemps, todayDayCodes), night: calculatePart(todayNightTemps, todayNightCodes) },
          tomorrow: { day: calculatePart(tomorrowDayTemps, tomorrowDayCodes), night: calculatePart(tomorrowNightTemps, tomorrowNightCodes) }
        };
    } catch (e) {
        return {
            city: cityName,
            temp: 0,
            condition: '...',
            humidity: 0,
            windSpeed: 0,
            today: { day: { min:0, max:0, condition:'...'}, night: { min:0, max:0, condition:'...'} },
            tomorrow: { day: { min:0, max:0, condition:'...'}, night: { min:0, max:0, condition:'...'} }
        };
    }
};

export const fetchWeather = async (city: string): Promise<WeatherInfo> => {
    const coords = CITY_COORDS[city];
    if (coords) {
        return fetchWeatherFromCoords(coords.lat, coords.lon, city);
    }
    return fetchWeatherFromCoords(CITY_COORDS['Budapest'].lat, CITY_COORDS['Budapest'].lon, city);
};

export const getUserLocation = async (): Promise<{lat: number, lon: number, city: string} | null> => {
    if (!navigator.geolocation) return null;
    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                let city = 'Helyzetem';
                try {
                    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1&language=hu`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.results && data.results.length > 0) city = data.results[0].name;
                        else throw new Error("Empty results");
                    } else throw new Error("Status " + res.status);
                } catch (e) {
                    try {
                        const resFallback = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=hu`);
                        if (resFallback.ok) {
                            const dataFallback = await resFallback.json();
                            city = dataFallback.city || dataFallback.locality || dataFallback.principalSubdivision || 'Helyzetem';
                        }
                    } catch (e2) {}
                }
                resolve({ lat, lon, city });
            },
            (error) => resolve(null),
            { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false }
        );
    });
};

export const fetchUserWeather = async (): Promise<WeatherInfo | null> => {
    try {
        const loc = await getUserLocation();
        if (!loc) return null;
        return fetchWeatherFromCoords(loc.lat, loc.lon, loc.city);
    } catch (e) { return null; }
};