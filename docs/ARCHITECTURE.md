# Rendszer Architektúra

## Áttekintés

A **NemRosszHírek 2** egy hibrid architektúrát használ, amely ötvözi a statikus oldalgenerálás (SPA) egyszerűségét egy könnyűsúlyú Node.js backenddel a dinamikus funkciók (proxy, statisztika, indexelés) támogatására.

```mermaid
graph TD
    User[Felhasználó Böngészője]
    Frontend[React 19 SPA (Vite)]
    NodeServer[Express Szerver (Port 3001)]
    FileSystem[Fájlrendszer (public/Tartalom)]
    ExtAPI[Külső API-k (Finnhub, Coingecko)]

    User --> Frontend
    Frontend -- Hírek betöltése (.txt) --> FileSystem
    Frontend -- Dátum Index / Proxy --> NodeServer
    Frontend -- Statisztika küldés --> NodeServer
    NodeServer -- API Proxy --> ExtAPI
    NodeServer -- Olvasás --> FileSystem
```

## Komponensek

### 1. Frontend (Client)
*   **Technológia:** React 19, TypeScript, Tailwind CSS.
*   **Feladata:** UI megjelenítése, Hírek letöltése és parse-olása, Interakciók kezelése.
*   **Optimalizáció:**
    *   `NewsFeed`: Virtualizált jellegű lista renderelés.
    *   `content-index`: A szervertől kéri le, mely napokon van hír, elkerülve a felesleges HTTP kéréseket.

### 2. Backend (Server)
*   **Technológia:** Node.js, Express.
*   **Feladata:**
    *   **Content Indexing:** Beolvassa a `public/Tartalom` könyvtárat és JSON formátumban visszaadja a dátumokat.
    *   **Security Proxy:** Elrejti a Finnhub API kulcsot a kliens elől.
    *   **Statisztika:** Egy egyszerű JSON fájlba (`server/stats.json`) menti a látogatottsági adatokat.
    *   **Rate Limiting:** Védi a végpontokat a túlterheléstől.

### 3. Adattárolás (Flat-File CMS)
Nincs SQL adatbázis. Minden tartalom a `public/Tartalom` mappában található szöveges fájlokban van. Ez lehetővé teszi a könnyű hordozhatóságot és a verziókezelést (Git).

## Adatfolyam (Hírek betöltése)

1.  Az App induláskor meghívja a `GET /api/content-index` végpontot.
2.  A szerver visszaadja a dátumokat: `['2025-12-30', '2025-12-29']`.
3.  A `newsService` sorban lekéri az adott dátumhoz tartozó `.txt` fájlokat (pl. `public/Tartalom/2025-12-30/tech.txt`).
4.  A kliens parse-olja a szövegfájlt és megjeleníti a kártyákat.
