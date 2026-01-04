# Biztonsági Audit Jelentés - NemRosszHírek 2

**Dátum:** 2025.12.30.
**Verzió:** 2.0.0
**Státusz:** Javítva

Ez a dokumentum összefoglalja az alkalmazáson végzett biztonsági átvilágítást és az elvégzett javításokat.

---

## 1. Azonosított Kockázatok és Javítások

### 1.1. API Kulcs Kiszivárgása (Kritikus)
*   **Probléma:** A Finnhub API kulcs (`d59q...`) hardcode-olva volt a `services/marketService.ts` fájlban, így a böngésző forráskódjában bárki számára látható volt.
*   **Kockázat:** Illetéktelen használat, kvóta kimerítése, költségek generálása.
*   **Javítás:** Létrehoztunk egy Proxy végpontot a szerveren (`/api/stock/:symbol`). A kliens mostantól a saját szerverünket hívja, a szerver pedig beilleszti a kulcsot a kérésbe. A kulcs soha nem jut el a klienshez.

### 1.2. Cross-Site Scripting (XSS) (Magas)
*   **Probléma:** A `MarketWidget.tsx` komponens a `dangerouslySetInnerHTML` tulajdonságot használta a piaci elemzések megjelenítésére.
*   **Kockázat:** Ha a külső API vagy egy támadó képes lenne módosítani az elemzés tartalmát, kártékony JavaScript kódot futtathatna a felhasználók böngészőjében.
*   **Javítás:** Eltávolítottuk a HTML stringeket. A `marketService` mostantól strukturált JSON adatot (`AnalysisData` interfész) ad vissza (cím, összefoglaló, részletek), amelyet a React biztonságosan renderel.

### 1.3. Rate Limiting Hiánya (Közepes)
*   **Probléma:** A Node.js szerver nem korlátozta a beérkező kérések számát.
*   **Kockázat:** DDoS támadás, brute-force próbálkozások az admin felület ellen.
*   **Javítás:** Bevezettük az `express-rate-limit` köztesréteget. IP címenként 15 percenként maximum 1000 kérés engedélyezett.

### 1.4. HTTP Biztonsági Fejlécek (Alacsony)
*   **Probléma:** Hiányoztak a modern biztonsági fejlécek.
*   **Javítás:** Bevezettük a `helmet` csomagot, amely automatikusan beállítja a megfelelő fejléceket (HSTS, X-Content-Type-Options, stb.).

### 1.5. Kliens-oldali Admin Autentikáció (Alacsony - Elfogadott Kockázat)
*   **Állapot:** Az admin felület jelszóellenőrzése jelenleg egy egyszerű SHA-256 hash ellenőrzés a kliens oldalon.
*   **Megjegyzés:** Mivel ez egy demo alkalmazás és az admin felület csak statisztikákat olvas (nem módosít adatot), a kockázat elfogadható. Éles környezetben szerver oldali session kezelés (JWT/Cookie) javasolt.

---

## 2. További Teendők (Roadmap)

1.  HTTPS bevezetése éles környezetben (Let's Encrypt).
2.  Az API kulcsok környezeti változókba (`.env`) mozgatása a forráskódból.
3.  Admin bejelentkezés áthelyezése szerver oldalra.
