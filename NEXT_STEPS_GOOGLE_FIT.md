# 🎯 PROSSIMI PASSI - Google Fit Integration

**Data**: 2 Marzo 2026
**Stato**: OAuth Client creato ✅ | Client ID configurato in app ✅

---

## 🚀 COSA FARE ADESSO (in ordine)

### 1️⃣ Abilita Fitness API su Google Cloud Console

1. Vai su: https://console.cloud.google.com
2. Seleziona il progetto creato (quello con il Client ID)
3. Menu **"APIs & Services"** → **"Library"**
4. Cerca **"Fitness API"** nella barra di ricerca
5. Clicca sulla **Fitness API**
6. Clicca **"ENABLE"** (Abilita)
7. Aspetta conferma ✅

---

### 2️⃣ Configura OAuth Consent Screen

1. Vai su **"APIs & Services"** → **"OAuth consent screen"**
2. Seleziona **"External"** (se non l'hai già fatto)
3. Compila i campi:
   - **App name**: `VALAHIA DIET GYM`
   - **User support email**: la tua email Gmail
   - **Developer contact email**: la tua email Gmail
4. Clicca **"SAVE AND CONTINUE"**

5. **SCOPES** (Permessi):
   - Clicca **"ADD OR REMOVE SCOPES"**
   - Cerca e seleziona:
     - ✅ `https://www.googleapis.com/auth/fitness.activity.read`
     - ✅ `https://www.googleapis.com/auth/fitness.body.read`
   - Clicca **"UPDATE"**
   - Clicca **"SAVE AND CONTINUE"**

6. **TEST USERS**:
   - Clicca **"ADD USERS"**
   - Aggiungi le email della famiglia:
     - gmg19@gmail.com (la tua email)
     - (altre email familiari se usano Google Fit)
   - Clicca **"ADD"**
   - Clicca **"SAVE AND CONTINUE"**

7. **SUMMARY**:
   - Verifica tutto sia corretto
   - Clicca **"BACK TO DASHBOARD"**

---

### 3️⃣ Configura Authorized JavaScript Origins

**IMPORTANTE**: Devi prima deployare l'app online!

#### Opzione A: GitHub Pages (RACCOMANDATO)
1. Vai su GitHub
2. Crea repository pubblico `DietTracker`
3. Carica tutti i file (index.html, app.js, style.css, manifest.json, service-worker.js)
4. Vai su Settings → Pages
5. Source: Deploy from branch `main`
6. Salva
7. L'URL sarà: `https://gmg19.github.io/DietTracker`

#### Opzione B: Netlify
1. Vai su: https://app.netlify.com
2. Drag & drop cartella `DietTracker`
3. L'URL sarà tipo: `https://valahia-diet.netlify.app`

#### Dopo il deployment:

1. Torna su Google Cloud Console
2. **"APIs & Services"** → **"Credentials"**
3. Clicca sul tuo OAuth Client ID
4. **Authorized JavaScript origins**:
   - Clicca **"ADD URI"**
   - Incolla l'URL: `https://gmg19.github.io` (o il tuo URL Netlify)
5. **Authorized redirect URIs**:
   - Clicca **"ADD URI"**
   - Incolla: `https://gmg19.github.io/DietTracker` (o `https://tuo-sito.netlify.app`)
6. Clicca **"SAVE"**

---

## ✅ TEST FINALE

1. Apri l'app dal URL online (NON da file locale!)
2. Login come Gabriel/Diana/Alex/Cristina
3. Scroll verso **"Google Fit Sync"**
4. Clicca **"🔗 Connetti Google Fit"**
5. Si aprirà popup Google:
   - Seleziona il tuo account Google
   - Accetta i permessi richiesti
   - Dovrebbe apparire: **"✅ Google Fit connesso! Sincronizzazione attiva"**
6. Verifica che i passi vengano importati

---

## 🔧 TROUBLESHOOTING

### Errore: "Origin not allowed"
- **Causa**: JavaScript origin non configurato
- **Fix**: Aggiungi l'URL deployment in Authorized JavaScript origins (step 3️⃣)

### Errore: "Access blocked: app not verified"
- **Causa**: OAuth Consent Screen non pubblicato
- **Fix**: Non pubblicare (usa test users), aggiungi la tua email come test user

### Errore: "API not enabled"
- **Causa**: Fitness API non abilitata
- **Fix**: Vai su APIs & Services → Library → Fitness API → Enable

### Non importa i passi
- **Causa**: Nessun dato su Google Fit
- **Fix**:
  1. Apri Google Fit sul telefono
  2. Verifica che traccia i passi di oggi
  3. Riprova la sincronizzazione

---

## 📱 ALTERNATIVA SEMPLICE (se troppo complicato)

Se Google Fit risulta troppo complesso, puoi usare:

**Inserimento manuale passi**:
1. Controlla passi su telefono (Salute iOS / Google Fit Android)
2. Clicca **"➕ Aggiungi Passi"** nell'app
3. Inserisci il numero manualmente
4. Funziona subito, no setup OAuth!

---

## 📞 SUPPORTO

Se hai problemi:
1. Controlla la console JavaScript (F12 → Console)
2. Copia errore esatto
3. Cerca errore su Google o chiedi aiuto

---

**Client ID corrente**: `803319997631-6ts9itvrdldbsqsalvr7ujls34hvpu5t.apps.googleusercontent.com`

**Configurazione app.js**: ✅ Già fatto automaticamente!
