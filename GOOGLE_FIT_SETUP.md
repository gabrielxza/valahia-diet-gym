# 🔗 Google Fit Integration - Setup Guide

## ✅ STATO ATTUALE (2 Marzo 2026)

### Completato:
- ✅ OAuth Client creato
- ✅ Client ID configurato in app.js
- ✅ Progetto Google Cloud creato

### Da Fare:
- ⏳ Abilitare Fitness API
- ⏳ Configurare OAuth Consent Screen
- ⏳ Aggiungere Authorized JavaScript origins (URL deployment)
- ⏳ Aggiungere test users

---

## 📋 Prerequisiti

1. Account Google ✅
2. App già pubblicata online (non localhost) - GitHub Pages/Netlify
3. Google Cloud Console access ✅

---

## 🚀 Setup Passo-Passo

### Step 1: Crea Progetto Google Cloud

1. Vai su: https://console.cloud.google.com
2. Clicca **"Create Project"**
3. Nome progetto: `VALAHIA DIET`
4. Clicca **"Create"**

### Step 2: Abilita Google Fit API

1. Nel menu, vai su **"APIs & Services"** → **"Library"**
2. Cerca **"Fitness API"**
3. Clicca **"Enable"**

### Step 3: Crea OAuth Credentials ✅ COMPLETATO

1. Vai su **"APIs & Services"** → **"Credentials"**
2. Clicca **"Create Credentials"** → **"OAuth client ID"**
3. Application type: **"Web application"**
4. Name: `VALAHIA DIET Web Client`
5. **Authorized JavaScript origins**:
   - `https://gmg19.github.io` (aggiungi qui il tuo URL Netlify/GitHub Pages)
6. **Authorized redirect URIs**:
   - `https://gmg19.github.io/DietTracker` (aggiungi qui il tuo URL completo)
7. Clicca **"Create"**
8. **✅ FATTO - Client ID**: `803319997631-6ts9itvrdldbsqsalvr7ujls34hvpu5t.apps.googleusercontent.com`

### Step 4: Configure OAuth Consent Screen

1. Vai su **"OAuth consent screen"**
2. User Type: **"External"**
3. App name: `VALAHIA DIET`
4. User support email: tua-email@gmail.com
5. Developer contact: tua-email@gmail.com
6. Clicca **"Save and Continue"**

7. **Scopes**:
   - Clicca **"Add or Remove Scopes"**
   - Cerca e aggiungi:
     - `https://www.googleapis.com/auth/fitness.activity.read`
     - `https://www.googleapis.com/auth/fitness.body.read`
     - `https://www.googleapis.com/auth/fitness.location.read`
   - Clicca **"Update"** → **"Save and Continue"**

8. **Test users**:
   - Aggiungi tua-email@gmail.com
   - Clicca **"Save and Continue"**

### Step 5: Implementa OAuth Flow in app.js

```javascript
// Google Fit Configuration
const GOOGLE_FIT_CONFIG = {
    clientId: 'TUO_CLIENT_ID.apps.googleusercontent.com',
    scope: [
        'https://www.googleapis.com/auth/fitness.activity.read',
        'https://www.googleapis.com/auth/fitness.body.read'
    ].join(' '),
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/fitness/v1/rest']
};

let googleFitToken = null;

// Connect to Google Fit
async function connectGoogleFit() {
    try {
        // Load Google API
        await loadGoogleAPI();

        // Initialize OAuth
        await gapi.client.init({
            clientId: GOOGLE_FIT_CONFIG.clientId,
            scope: GOOGLE_FIT_CONFIG.scope,
            discoveryDocs: GOOGLE_FIT_CONFIG.discoveryDocs
        });

        // Sign in
        const authInstance = gapi.auth2.getAuthInstance();
        await authInstance.signIn();

        // Get token
        googleFitToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;

        alert('✅ Connesso a Google Fit!');

        // Sync steps
        await syncGoogleFitSteps();

    } catch (error) {
        console.error('Google Fit error:', error);
        alert('❌ Errore connessione Google Fit\n\nUsa "Aggiungi Passi" manualmente.');
    }
}

// Load Google API script
function loadGoogleAPI() {
    return new Promise((resolve, reject) => {
        if (window.gapi) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
            gapi.load('client:auth2', resolve);
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Sync steps from Google Fit
async function syncGoogleFitSteps() {
    try {
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0)).getTime();
        const endOfDay = new Date(now.setHours(23, 59, 59, 999)).getTime();

        // Fetch steps data
        const response = await gapi.client.fitness.users.dataset.aggregate({
            userId: 'me',
            requestBody: {
                aggregateBy: [{
                    dataTypeName: 'com.google.step_count.delta'
                }],
                startTimeMillis: startOfDay,
                endTimeMillis: endOfDay
            }
        });

        // Extract steps
        const steps = response.result.bucket[0]?.dataset[0]?.point[0]?.value[0]?.intVal || 0;

        // Save to daily steps
        const today = getTodayString();
        const weight = weights.length > 0 ? [...weights].sort((a, b) => new Date(b.date) - new Date(a.date))[0].weight : 70;
        const calories = Math.round(steps * weight * 0.04);

        dailySteps[today] = {
            steps,
            calories,
            weight,
            source: 'google_fit',
            timestamp: new Date().toISOString()
        };

        saveData();
        loadDailySteps();

        alert(`✅ Sincronizzato Google Fit!\n\n👟 ${steps.toLocaleString()} passi\n🔥 ${calories} kcal`);

    } catch (error) {
        console.error('Sync error:', error);
        alert('❌ Errore sincronizzazione\n\nRiprova o usa inserimento manuale');
    }
}

// Auto-sync every hour
setInterval(() => {
    if (googleFitToken) {
        syncGoogleFitSteps();
    }
}, 3600000); // 1 hour
```

### Step 6: Aggiungi script Google API in index.html

```html
<!-- Before closing </body> tag -->
<script src="https://apis.google.com/js/api.js"></script>
```

---

## 🧪 Test

1. Deploy app su hosting (Netlify/Vercel)
2. Aggiorna Authorized origins in Google Console con URL reale
3. Apri app su smartphone
4. Clicca "Connetti Google Fit"
5. Accetta permessi Google
6. Verifica sincronizzazione passi

---

## 📱 App Mobile Alternative (No OAuth)

Se troppo complesso, opzioni più semplici:

### Option A: Apple Health / Google Fit Export CSV
- Utente esporta dati da app Salute/Fit
- Carica CSV in VALAHIA DIET
- Parse automatico e import

### Option B: Manual Daily Input (ATTUALE)
- Utente controlla passi su telefono
- Inserisce manualmente in VALAHIA DIET
- Più semplice, funziona sempre

### Option C: Shortcuts iOS / Tasker Android
- Crea shortcut che legge passi
- Shortcut chiama webhook VALAHIA DIET
- Auto-sync senza OAuth

---

## 💡 Consiglio

Per ora usa **Option B** (manual input) perché:
- ✅ Funziona subito
- ✅ No setup complesso
- ✅ No problemi privacy/permissions
- ✅ Cross-platform (iOS + Android)

Implementa Google Fit solo se:
- Hai molti utenti (>100)
- Vuoi sincronizzazione automatica continua
- Sei disposto a mantenere OAuth credentials

---

**Autore**: Gabriel Georgescu
**Data**: 2026-03-02
**Versione VALAHIA DIET**: 1.1.0
