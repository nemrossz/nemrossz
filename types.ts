export interface NewsItem {
  id: string;
  section: string;
  title: string;
  tags: string[];
  content: string;
  sourceLink: string;
  image?: string;
  date: string; // ISO String
  author?: string; // New field for [Hír szerzője]
}

export interface AnalysisData {
    title: string;
    summary: string;
    details: string;
    sentiment: 'Bullish' | 'Bearish' | 'Semleges';
    date: string; // Date of the analysis (simulating folder name)
}

export interface MarketRate {
  symbol: string;
  name: string;
  price: number;
  change1d: number; // Percentage 1 Day
  change1w: number; // Percentage 1 Week
  analysis?: AnalysisData; // Replaced HTML string with structured data
}

export interface WeatherPart {
  min: number;
  max: number;
  condition: string;
}

export interface DailyForecast {
  day: WeatherPart;
  night: WeatherPart;
}

export interface WeatherInfo {
  city: string;
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  today: DailyForecast;
  tomorrow: DailyForecast;
}

export type LayoutType = 'standard' | 'full-hero' | 'text-hero' | 'grid-columns' | 'mixed';

export interface SectionData {
    id: string;
    name: string;
}

// Representing the logical blocks of content to load
export interface ContentBlock {
    type: LayoutType;
    items: NewsItem[];
}