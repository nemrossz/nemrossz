# NemRosszHírek 2

Ez a dokumentum a **NemRosszHírek 2** webalkalmazás technikai leírását tartalmazza.
A 2.0-ás verzió jelentős teljesítménybeli és biztonsági frissítéseket kapott.

---

## 1. Gyors indítás

Szükséges szoftverek: **Node.js 18+**

1.  Függőségek telepítése:
    ```bash
    npm install
    ```

2.  Szerver és Kliens indítása (Két külön terminálban):
    *   **Szerver:** `npm run server` (Port 3001)
    *   **Kliens:** `npm run dev` (Port 5173)

---

## 2. Architektúra (Flat-File CMS + Node Helper)

A rendszer nem használ hagyományos adatbázist. A hírek a `public/Tartalom` mappában lévő szöveges fájlokban tárolódnak.

*   **Frontend:** React 19 SPA (Vite). Betölti és megjeleníti a fájlokat.
*   **Backend:** Express szerver. Feladatai:
    *   Tartalom indexelése (gyorsítja a betöltést).
    *   API Proxy (elrejti a titkos kulcsokat).
    *   Biztonság (Rate limiting, Headers).

Részletes leírás: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## 3. Biztonság

A 2.0-ás verzióban végrehajtottuk a biztonsági auditot.
*   API kulcsok szerver oldalra mozgatva.
*   XSS védelem a widgetekben.
*   Rate limiting bekapcsolva.

Részletek: [docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md)

---

## 4. API Végpontok

A szerver a következő végpontokat biztosítja a kliens számára:
*   `GET /api/content-index`: Hírek dátumainak listázása.
*   `GET /api/stock/:symbol`: Tőzsdei adatok lekérése (Proxy).
*   `POST /api/visit`: Statisztika.

Részletek: [docs/API_SPEC.md](docs/API_SPEC.md)
