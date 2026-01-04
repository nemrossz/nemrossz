# Telepítési Útmutató (Docker + Mac)

Mivel a rendszernek technikai gondja akadt a fájlok automatikus létrehozásával, kérlek, hozd létre manuálisan az alábbi 3 fájlt a weboldal főkönyvtárában (ott, ahol a `package.json` és `index.html` van).

---

### 1. Lépés: `Dockerfile` létrehozása
Hozz létre egy `Dockerfile` nevű fájlt (kiterjesztés nélkül), és másold bele pontosan ezt:

```dockerfile
FROM node:18-alpine

# Munkakönyvtár beállítása
WORKDIR /app

# Függőségek másolása és telepítése
COPY package*.json ./
RUN npm install

# Forráskód másolása
COPY . .

# Port megnyitása
EXPOSE 5173

# Fejlesztői szerver indítása
CMD ["npm", "run", "dev", "--", "--host"]
```

---

### 2. Lépés: `telepites.sh` létrehozása
Hozz létre egy `telepites.sh` nevű fájlt, és másold bele ezt:

```bash
#!/bin/bash
echo "🐳 Docker környezet építése..."

# Docker image elkészítése
docker build -t nemrosszhirek-app .

if [ $? -eq 0 ]; then
    echo "✅ Telepítés sikeres! Most futtasd az ./inditas.sh fájlt."
else
    echo "❌ Hiba történt a telepítés során. Ellenőrizd, hogy fut-e a Docker Desktop."
fi
```

---

### 3. Lépés: `inditas.sh` létrehozása
Hozz létre egy `inditas.sh` nevű fájlt, és másold bele ezt:

```bash
#!/bin/bash
echo "🚀 Alkalmazás indítása..."

# Meglévő konténer leállítása, ha fut
docker stop nemrosszhirek-container 2>/dev/null || true
docker rm nemrosszhirek-container 2>/dev/null || true

# Új konténer indítása
# A -v "$(pwd):/app" rész biztosítja, hogy a fájlok módosítása azonnal látszódjon (hot reload)
docker run -d \
  -p 5173:5173 \
  -v "$(pwd):/app" \
  -v /app/node_modules \
  --name nemrosszhirek-container \
  nemrosszhirek-app

echo "⏳ Várakozás a szerverre..."
sleep 5

echo "✅ Az alkalmazás fut!"
echo "👉 Nyisd meg a böngészőben: http://localhost:5173"
```

---

### 4. Lépés: Futtatás
Nyisd meg a Terminált a mappában, és add ki ezeket a parancsokat:

1. Jogosultságok megadása:
   ```bash
   chmod +x telepites.sh inditas.sh
   ```

2. Telepítés (csak egyszer kell):
   ```bash
   ./telepites.sh
   ```

3. Indítás:
   ```bash
   ./inditas.sh
   ```
