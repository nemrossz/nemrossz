# API Specifikáció - NemRosszHírek 2 Server

A Node.js háttérszolgáltatás a port 3001-en fut. A kliens oldali alkalmazás (port 5173) ezeket a végpontokat hívja meg.

---

## 1. Tartalomkezelés

### `GET /api/content-index`
Visszaadja az elérhető hír-dátumok listáját. Ez helyettesíti a kliens oldali lassú dátum-keresést.

**Válasz (200 OK):**
```json
{
  "dates": [
    "2025-12-30",
    "2025-12-29",
    "..."
  ]
}
```

---

## 2. Piaci Adatok (Proxy)

### `GET /api/stock/:symbol`
Lekéri egy részvény adatait a Finnhub API-ról a szerver oldali kulcs használatával.

**Paraméterek:**
*   `symbol`: A részvény jele (pl. `^GSPC`, `AAPL`). Csak alfanumerikus karakterek és `^` engedélyezett.

**Válasz (200 OK):**
```json
{
  "c": 4500.50, // Current Price
  "pc": 4480.00, // Previous Close
  ...
}
```

---

## 3. Statisztika

### `POST /api/visit`
Látogatás rögzítése.

**Body:**
```json
{
  "ip": "user-ip", // Opcionális, szerver felülírja
  "city": "Budapest",
  "userAgent": "Mozilla...",
  "theme": "original",
  "screenWidth": 1920,
  "screenHeight": 1080
}
```

### `POST /api/pageview`
Oldalmegtekintés növelése.

**Body:**
```json
{
  "page": "tech"
}
```

### `GET /api/admin-stats`
Nyers statisztikai adatok lekérése az admin dashboard számára.

**Válasz:**
A `stats.json` fájl teljes tartalma.
