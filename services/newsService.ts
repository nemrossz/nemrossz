import { NewsItem } from '../types';
import { SECTION_FILE_MAP } from '../constants';

// --- CONFIGURATION ---
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/ViktorPosa/hirek/main/Output';

// Global cache to avoid refetching same data
let globalNewsCache: NewsItem[] = [];

const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

const getPreviousDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() - 1);
    return formatDate(date);
};

// Helper to generate a consistent hash from a string (for IDs)
const stringToHash = (str: string): number => {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
};

// --- PARSER LOGIC FOR NEW FORMAT ---
const parseNewFormat = (rawText: string, sectionSlug: string, dateStr: string): NewsItem[] => {
    const items: NewsItem[] = [];
    const lines = rawText.split(/\r?\n/);
    
    let currentItem: Partial<NewsItem> = {};
    let currentContent: string[] = [];
    let mode: 'idle' | 'content' = 'idle';

    const finalizeItem = () => {
        // CONTENT CHECK: Must have content to be valid
        if (currentContent.length > 0) {
            currentItem.content = currentContent.join('\n').trim();
        }

        // Skip if critical data is missing
        if (!currentItem.content) {
            currentItem = {};
            currentContent = [];
            mode = 'idle';
            return;
        }

        // Fallbacks
        const finalTitle = currentItem.title || "Hír";
        
        if (!currentItem.image) {
            const seed = stringToHash(finalTitle);
            currentItem.image = `https://picsum.photos/seed/${seed}/800/600`;
        }

        items.push({
            id: Math.random().toString(36).substr(2, 9),
            section: currentItem.section || sectionSlug,
            title: finalTitle,
            tags: currentItem.tags || [],
            content: currentItem.content,
            sourceLink: currentItem.sourceLink || '#',
            image: currentItem.image,
            date: dateStr,
            author: currentItem.author || 'Ismeretlen'
        } as NewsItem);

        currentItem = {};
        currentContent = [];
        mode = 'idle';
    };

    // Helper to strip [Key], [Key]: and whitespace
    const cleanLine = (line: string): string => {
        return line.replace(/^\[.*?\]:?\s*/, '').trim();
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const lowerLine = line.toLowerCase();

        if (lowerLine.startsWith('[hírszekció]')) {
            if (currentItem.section || currentItem.title || currentContent.length > 0) finalizeItem();
            currentItem.section = cleanLine(line);
            mode = 'idle';
            continue;
        }

        if (lowerLine.startsWith('[cím]')) {
            currentItem.title = cleanLine(line);
            mode = 'idle';
            continue;
        }

        if (lowerLine.startsWith('[tagek]')) {
            const rawTags = cleanLine(line);
            currentItem.tags = rawTags.split(/[,]+/) 
                // Aggressively clean tags: remove #, *, : and trim
                .map(t => t.replace(/[*#:]/g, '').trim()) 
                .filter(t => t.length > 0);
            mode = 'idle';
            continue;
        }

        if (lowerLine.startsWith('[tartalom]')) {
            const contentStart = cleanLine(line);
            if (contentStart) currentContent.push(contentStart);
            mode = 'content';
            continue;
        }

        if (lowerLine.startsWith('[forráslink]')) {
            currentItem.sourceLink = cleanLine(line);
            mode = 'idle';
            continue;
        }

        if (lowerLine.startsWith('[hír szerzője]')) {
            currentItem.author = cleanLine(line);
            mode = 'idle';
            continue;
        }

        if (line.startsWith('{{kép linkje}}')) {
            // Regex handles {{...}} and {{...}}:
            let imgLink = line.replace(/^{{.*?}}:?\s*/, '').trim();
            if (imgLink.startsWith('http')) {
                currentItem.image = imgLink;
            }
            mode = 'idle';
            continue;
        }

        if (mode === 'content') {
            if (!line.match(/^\[.*?\]/)) {
                 currentContent.push(line);
            }
        }
    }

    if (currentItem.section || currentItem.title || currentContent.length > 0) {
        finalizeItem();
    }

    return items;
};

// --- GITHUB FETCHING ---

const fetchFileFromGit = async (dateStr: string, filename: string): Promise<string | null> => {
    try {
        const url = `${GITHUB_RAW_BASE}/${dateStr}/Tartalom/${filename}`;
        const response = await fetch(url);
        if (!response.ok) return null;
        return await response.text();
    } catch (error) {
        return null;
    }
};

interface FetchResult {
    news: NewsItem[];
    lastDate: string; // The date of the batch we just fetched
}

// SMART FETCH: Scans backwards from 'startDate' until it finds a day with content.
// Returns the content and the date it found it on.
export const fetchNewsBatch = async (startAfterDate: string | null, sectionId: string = 'home'): Promise<FetchResult> => {
    let currentDate = startAfterDate ? getPreviousDate(startAfterDate) : formatDate(new Date());
    const MAX_SCAN_DAYS = 10; // How many days back to look for content before giving up
    
    for (let i = 0; i < MAX_SCAN_DAYS; i++) {
        let filesToFetch: string[] = [];
        
        if (sectionId === 'home') {
            filesToFetch = ['tech.txt', 'belfold_kulfold.txt', 'uzlet.txt', 'szorakozas.txt', 'sport.txt', 'bulvar.txt', 'tudomany.txt', 'eletmod.txt'];
        } else {
            const slug = SECTION_FILE_MAP[sectionId];
            if (slug) filesToFetch = [`${slug}.txt`];
        }

        // Try fetching all files for this date in parallel
        const fetchPromises = filesToFetch.map(async (filename) => {
            const text = await fetchFileFromGit(currentDate, filename);
            if (text) {
                const slug = filename.replace('.txt', '');
                return parseNewFormat(text, slug, currentDate);
            }
            return [];
        });

        const results = await Promise.all(fetchPromises);
        let dailyNews: NewsItem[] = [];
        results.forEach(items => dailyNews = [...dailyNews, ...items]);

        // If we found news, return them!
        if (dailyNews.length > 0) {
            if (sectionId === 'home') {
                dailyNews.sort(() => Math.random() - 0.5);
            }

            // Update cache
            dailyNews.forEach(item => {
                if (!globalNewsCache.some(c => c.title === item.title)) {
                    globalNewsCache.push(item);
                }
            });

            return { news: dailyNews, lastDate: currentDate };
        }

        // If no news, decrease date and loop again (Lazy skip)
        currentDate = getPreviousDate(currentDate);
    }

    return { news: [], lastDate: currentDate };
};

// Wrapper to match old API if needed, or used for tags
export const fetchTags = async (sectionId: string): Promise<string[]> => {
    const today = formatDate(new Date());
    let currentDate = today;

    // Try today and yesterday
    for(let i=0; i<3; i++) {
        let filename = 'tech_cimke.txt';
        if (sectionId !== 'home') {
            const slug = SECTION_FILE_MAP[sectionId];
            if (slug) filename = `${slug}_cimke.txt`;
        }

        const text = await fetchFileFromGit(currentDate, filename);
        if (text) {
            // 1. Remove explicit headers like [Tagek], [cimke] etc globally
            let cleanText = text.replace(/\[.*?\]:?/g, '');

            // 2. Remove special characters that cause issues (*, :)
            cleanText = cleanText.replace(/[*:]/g, '');

            // 3. Split by standard separators (comma, hash, newlines, spaces)
            const rawTags = cleanText.split(/[,#\s]+/);

            const uniqueTags = new Set(
                rawTags
                    .map(t => t.trim())
                    .filter(t => t.length > 1) // Filter single char garbage or empty
            );
            
            return Array.from(uniqueTags).sort();
        }
        currentDate = getPreviousDate(currentDate);
    }
    return [];
};

export const filterNewsByTags = (news: NewsItem[], activeTags: string[]): NewsItem[] => {
    if (!activeTags || activeTags.length === 0) return news;
    return news.filter(item => 
        activeTags.some(tag => item.tags.some(t => t.toLowerCase() === tag.toLowerCase()))
    );
};

export const preloadHistory = async (): Promise<void> => {
    // Optional
};

export const getRandomHistoricalNews = (count: number): NewsItem[] => {
    if (globalNewsCache.length === 0) return [];
    const shuffled = [...globalNewsCache];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
};