# Netlify Telepítési és Üzemeltetési Útmutató

Ez az útmutató lépésről lépésre bemutatja, hogyan tudod a **NemRosszHírek 2** weboldalt ingyenesen kitenni az internetre a **Netlify** segítségével.

Mivel a weboldal **statikus fájlokból** épül fel (React + Vite), és a híreket is szöveges fájlokból olvassa be, a Netlify ideális választás: gyors, biztonságos és automatizált.

---

## 1. Előkészületek

Mielőtt elkezdenéd, szükséged lesz:
1.  Egy **GitHub** (vagy GitLab / Bitbucket) fiókra.
2.  Egy **Netlify** fiókra (regisztrálhatsz a GitHub fiókoddal).
3.  A projekt kódjára a saját gépeden.

---

## 2. A kód feltöltése GitHub-ra

Ahhoz, hogy a Netlify automatikusan frissítse az oldalt, amikor új hírt írsz, a kódot verziókezelőben kell tárolni.

1.  Jelentkezz be a [GitHub-ra](https://github.com/) és hozz létre egy új repository-t (pl. `nem-rossz-hirek`).
2.  A projekt mappájában nyiss egy terminált, és futtasd le ezeket a parancsokat (ha még nem git repó):

```bash
git init
git add .
git commit -m "Kezdeti verzió"
git branch -M main
git remote add origin https://github.com/FELHASZNALONEV/nem-rossz-hirek.git
git push -u origin main
```
*(Cseréld ki a `FELHASZNALONEV`-et a sajátodra!)*

---

## 3. Összekötés a Netlify-al

1.  Jelentkezz be a [Netlify](https://app.netlify.com/) oldalán.
2.  Kattints az **"Add new site"** gombra, majd válaszd az **"Import from an existing project"** opciót.
3.  Válaszd a **GitHub**-ot.
4.  Engedélyezd a hozzáférést, majd válaszd ki a listából a `nem-rossz-hirek` repository-t.

### Konfiguráció beállítása (Build Settings)

A Netlify valószínűleg automatikusan felismeri a beállításokat, de ellenőrizd le:

*   **Base directory:** (Hagyd üresen)
*   **Build command:** `npm run build`
*   **Publish directory:** `dist`

Kattints a **"Deploy nem-rossz-hirek"** gombra.

A Netlify most elkezdi építeni az oldalt (ez kb. 1 percet vesz igénybe). Ha kész, kapsz egy linket (pl. `random-nev-123456.netlify.app`), ahol az oldalad már él is!

---

## 4. Domain beállítása (Opcionális)

Ha van saját domained (pl. `nemrosszhirek.hu`):
1.  Menj a Netlify-on a **Domain Management** menüpontba.
2.  Kattints az **"Add custom domain"** gombra.
3.  Írd be a domained nevét, és kövesd a DNS beállítási utasításokat (CNAME rekord beállítása).

---

## 5. Hogyan frissítsd a híreket? (Napi ügymenet)

A rendszer úgy lett kialakítva, hogy a tartalom a fájlrendszerben van. Netlify esetén ez a következőképpen működik:

1.  A saját gépeden a `public/Tartalom` mappában hozd létre az új napi mappát (pl. `2025-12-28`).
2.  Másold bele a `.txt` fájlokat és a képeket.
3.  Töltsd fel a változásokat GitHub-ra:

```bash
git add .
git commit -m "Új hírek: 2025-12-28"
git push
```

**Mi történik ezután?**
1.  A Netlify érzékeli, hogy változott a kód (új fájlok kerültek a `public` mappába).
2.  Automatikusan elindít egy új "Build"-et.
3.  A Build során a Vite átmásolja az új `Tartalom` mappát a `dist` mappába.
4.  Kb. 1 perc múlva az éles weboldalon megjelennek az új hírek.

Nem kell szervert újraindítani, nem kell adatbázist karbantartani.

---

## 6. Hibaelhárítás Netlify-on

**Probléma:** `npm error ERESOLVE unable to resolve dependency tree` (Deploy hiba)
*   **Ok:** A projekt React 19-et használ, de néhány kiegészítő (pl. `lucide-react`) régebbi verzióhoz ragaszkodik a leírásában.
*   **Megoldás:** A projekt gyökerében létrehoztunk egy `.npmrc` fájlt `legacy-peer-deps=true` tartalommal. Ez automatikusan megoldja a problémát a Netlify-on. Ha manuálisan telepítesz csomagokat, használd az `npm install --legacy-peer-deps` parancsot.

**Probléma:** Az oldal betölt, de nem látni a híreket ("Nincsenek hírek").
*   **Ok:** A rendszer dátum-visszakereső algoritmusa nem találja a fájlokat, vagy a fájlnevek kis/nagybetű érzékenyek lettek (Linux szerveren `Tech.txt` nem ugyanaz, mint `tech.txt`).
*   **Megoldás:**
    1.  Ellenőrizd a böngésző konzolt (F12 -> Console). Ha 404-es hibákat látsz a `.txt` fájloknál, akkor a fájl nincs ott vagy rossz a neve.
    2.  Győződj meg róla, hogy a `public/Tartalom` mappában a mappanevek (`YYYY-MM-DD`) és a fájlnevek (`tech.txt`, `sport.txt`) **pontosan** egyeznek a kód által várttal (kisbetűk használata javasolt mindenhol).

**Probléma:** "Page Not Found" frissítéskor (ha közvetlen linket használnál).
*   **Megoldás:** Jelenleg az alkalmazás nem használ URL útvonalakat (routingot), mindent a főoldalon kezel, így ez nem fordulhat elő. Ha később bevezetsz routingot (pl. `nemrosszhirek.hu/tech`), létre kell hozni egy `_redirects` fájlt a `public` mappában ezzel a tartalommal:
    ```
    /*  /index.html  200
    ```
