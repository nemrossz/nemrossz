import { SectionData } from './types';

export const SECTIONS: SectionData[] = [
  { id: 'home', name: 'Főoldal' },
  { id: 'tech', name: 'Tech' },
  { id: 'tudomany', name: 'Tudomány' },
  { id: 'belfold_kulfold', name: 'Belföld/Külföld' },
  { id: 'uzlet', name: 'Üzlet' },
  { id: 'szorakozas', name: 'Szórakozás' },
  { id: 'eletmod', name: 'Életmód' },
  { id: 'bulvar', name: 'Bulvár' },
  { id: 'sport', name: 'Sport' },
];

export const MAX_LOAD_LIMIT = 5;

// Mapping sections to file names (slugs) without accents
export const SECTION_FILE_MAP: Record<string, string> = {
    'tech': 'tech',
    'tudomany': 'tudomany',
    'belfold_kulfold': 'belfold_kulfold',
    'uzlet': 'uzlet',
    'szorakozas': 'szorakozas',
    'eletmod': 'eletmod',
    'bulvar': 'bulvar',
    'sport': 'sport'
};

// Simplified Tag lists for the UI filter (just a subset for visual purposes)
export const CATEGORY_TAGS: Record<string, string[]> = {
    'tech': ['AI', 'Gadget', 'Innováció'],
    'tudomany': ['Űr', 'Kutatás', 'Fizika'],
    'belfold_kulfold': ['Politika', 'Közélet', 'EU'],
    'uzlet': ['Tőzsde', 'Gazdaság', 'Valuta'],
    'szorakozas': ['Mozi', 'Zene', 'Streaming'],
    'eletmod': ['Egészség', 'Wellness', 'Tippek'],
    'bulvar': ['Sztárok', 'Pletyka', 'Botrány'],
    'sport': ['Foci', 'F1', 'Olimpia']
};