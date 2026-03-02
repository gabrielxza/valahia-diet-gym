# 💎 VALAHIA DIET - PWA

Progressive Web App per il tuo percorso di benessere e dimagrimento personalizzato.

## 🚀 Come Testare Localmente

### Opzione 1: Python Server (Consigliato)
```bash
cd C:\Users\gmg19\Desktop\DietTracker
python -m http.server 8000
```
Poi apri: http://localhost:8000/login.html

### Opzione 2: Live Server (VS Code Extension)
1. Installa extension "Live Server" in VS Code
2. Click destro su `login.html` → "Open with Live Server"

### Opzione 3: Node.js http-server
```bash
npm install -g http-server
cd C:\Users\gmg19\Desktop\DietTracker
http-server -p 8000
```

## 🔐 Credenziali Login

**Utente: Gabriel**
- Password: `diet2024`

**Utente: Cristina**
- Password: `diet2024`

⚠️ **IMPORTANTE:** Cambia le password nel file `login.html` (linea 50-53)

## 📱 Installare su Android

1. Apri il sito con Chrome Android
2. Chrome mostrerà banner "Aggiungi a schermata Home"
3. Oppure: Menu Chrome (⋮) → "Aggiungi a schermata Home"
4. L'app apparirà come icona normale!

## 🎨 Icone PWA

Per ora le icone sono placeholder. Per creare icone personalizzate:

1. Crea un'immagine 512x512 px (es: con Canva)
2. Salva come `icon-512.png`
3. Crea versione 192x192 px → `icon-192.png`
4. Metti entrambe nella cartella `DietTracker/`

## 🌐 Deploy Online (Hosting GRATUITO)

### Opzione A: Netlify Drop
1. Vai su https://app.netlify.com/drop
2. Trascina cartella `DietTracker`
3. Ottieni URL: `https://random-name.netlify.app`
4. Condividi URL SOLO con chi vuoi (privato con password login)

### Opzione B: GitHub Pages
1. Crea repository su GitHub
2. Carica tutti i file
3. Vai su Settings → Pages → Deploy from main branch
4. Ottieni URL: `https://username.github.io/diet-tracker`

### Opzione C: Vercel
1. Vai su https://vercel.com
2. Sign up gratis
3. Import repository o upload folder
4. Deploy automatico

## 📊 Funzionalità V1

✅ Login 2 profili (Gabriel + Cristina)
✅ Dashboard giornaliera
✅ Aggiungi pasti (colazione, pranzo, cena, spuntino)
✅ Tracciare peso giornaliero
✅ **Tracciare attività fisica** (camminata, corsa, treadmill, bici, nuoto, palestra, yoga)
✅ **Calcolo automatico calorie bruciate** (basato su peso, durata, intensità)
✅ **Tracking passi** per attività
✅ **Statistiche attività** (passi totali, durata, calorie bruciate)
✅ Grafico peso ultimi 7 giorni
✅ Calcolo calorie totali giornaliere
✅ Dati salvati localmente (LocalStorage)
✅ Funziona offline (Service Worker)
✅ Installabile come app (PWA)

## 🔮 Funzionalità Future (V2)

- [ ] Database alimenti con calorie pre-compilate
- [ ] Foto progresso (before/after)
- [ ] Obiettivi peso target
- [ ] Statistiche settimanali/mensili
- [ ] Export dati PDF
- [ ] Promemoria bere acqua
- [ ] Ricette favorite
- [ ] Lista spesa

## 🛠️ Tecnologie

- HTML5 + CSS3 + Vanilla JavaScript
- LocalStorage (dati locali)
- Service Worker (offline)
- Manifest.json (installabile)
- Responsive Design (mobile-first)

## 📝 Note

- **Privacy**: Tutti i dati sono salvati SOLO sul dispositivo (LocalStorage)
- **Offline**: Funziona anche senza internet (dopo primo caricamento)
- **Sincronizzazione**: NON c'è sync tra dispositivi (ogni device ha dati propri)
- **Backup**: Esporta dati periodicamente (feature futura)

---

**Autore**: Sviluppato per Dr. Gabriel Georgescu
**Versione**: 1.0.0
**Data**: 2026-02-28
