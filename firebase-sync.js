// ========================================
// FIREBASE CONFIGURATION & INITIALIZATION
// ========================================

const firebaseConfig = {
    apiKey: "AIzaSyCW4ynPDZE2pNu8afpl87ZFfA83Wo9VOWo",
    authDomain: "valahia-diet-gym-ab277.firebaseapp.com",
    projectId: "valahia-diet-gym-ab277",
    storageBucket: "valahia-diet-gym-ab277.firebasestorage.app",
    messagingSenderId: "997858897314",
    appId: "1:997858897314:web:fd8eed00c1796c30d96fb"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence({ synchronizeTabs: true })
    .catch((err) => {
        console.warn('Firestore persistence error:', err.code);
    });

// ========================================
// GLOBAL STATE
// ========================================

let currentFirebaseUser = null;
let syncEnabled = false;
let lastSyncTime = null;

// ========================================
// AUTHENTICATION
// ========================================

// Sign in with Google (riusa OAuth già configurato)
window.signInWithFirebase = async function() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/fitness.activity.read');
        provider.addScope('https://www.googleapis.com/auth/fitness.body.read');

        const result = await auth.signInWithPopup(provider);
        currentFirebaseUser = result.user;

        console.log('✅ Firebase signed in:', currentFirebaseUser.email);

        // Salva preferenza sync
        localStorage.setItem(`firebase_sync_enabled_${currentUser}`, 'true');
        syncEnabled = true;

        // Migra dati localStorage → Firestore (prima volta)
        await migrateLocalDataToFirestore();

        // Avvia sync automatico
        startRealtimeSync();

        alert(`✅ Cloud Sync attivato!\n\n📧 Account: ${currentFirebaseUser.email}\n\n🔄 I tuoi dati saranno sincronizzati su tutti i dispositivi!`);

        // Update UI
        if (typeof window.updateCloudSyncUI === 'function') {
            const lastSync = localStorage.getItem(`last_firebase_sync_${currentUser}`);
            window.updateCloudSyncUI(true, currentFirebaseUser.email, lastSync);
        }

        return true;

    } catch (error) {
        console.error('Firebase sign-in error:', error);
        alert('❌ Errore accesso Firebase\n\nRiprova o continua senza sync cloud.');
        return false;
    }
};

// Controlla se già loggato
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentFirebaseUser = user;
        const syncPref = localStorage.getItem(`firebase_sync_enabled_${currentUser}`);

        if (syncPref === 'true') {
            syncEnabled = true;
            console.log('🔄 Auto-sync cloud attivo per:', user.email);

            // Carica dati da Firestore
            await loadDataFromFirestore();

            // Avvia sync real-time
            startRealtimeSync();
        }
    }
});

// ========================================
// DATA MIGRATION (localStorage → Firestore)
// ========================================

async function migrateLocalDataToFirestore() {
    try {
        console.log('📤 Migrazione dati localStorage → Firestore...');

        const userDoc = db.collection('users').doc(currentUser);

        // Prepara tutti i dati
        const dataToMigrate = {
            meals: JSON.parse(localStorage.getItem(`meals_${currentUser}`) || '[]'),
            weights: JSON.parse(localStorage.getItem(`weights_${currentUser}`) || '[]'),
            activities: JSON.parse(localStorage.getItem(`activities_${currentUser}`) || '[]'),
            goal: JSON.parse(localStorage.getItem(`goal_${currentUser}`) || 'null'),
            selectedDiet: localStorage.getItem(`diet_${currentUser}`) || null,
            dailyTracking: JSON.parse(localStorage.getItem(`dailyTracking_${currentUser}`) || '{}'),
            dailySteps: JSON.parse(localStorage.getItem(`dailySteps_${currentUser}`) || '{}'),
            workoutTracking: JSON.parse(localStorage.getItem(`workoutTracking_${currentUser}`) || '{}'),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
            deviceInfo: {
                userAgent: navigator.userAgent,
                lastSyncedFrom: 'migration'
            }
        };

        // Upload in batch
        const batch = db.batch();

        batch.set(userDoc, dataToMigrate, { merge: true });

        await batch.commit();

        console.log('✅ Migrazione completata!');
        lastSyncTime = new Date().toISOString();
        localStorage.setItem(`last_firebase_sync_${currentUser}`, lastSyncTime);

    } catch (error) {
        console.error('Errore migrazione:', error);
        throw error;
    }
}

// ========================================
// SYNC DATA (Firestore → localStorage)
// ========================================

async function loadDataFromFirestore() {
    try {
        console.log('📥 Caricamento dati da Firestore...');

        const userDoc = await db.collection('users').doc(currentUser).get();

        if (!userDoc.exists) {
            console.log('Nessun dato cloud trovato, uso dati locali');
            return;
        }

        const cloudData = userDoc.data();

        // Confronta timestamp per evitare sovrascritture
        const localLastSync = localStorage.getItem(`last_firebase_sync_${currentUser}`);
        const cloudLastUpdated = cloudData.lastUpdated?.toDate().toISOString();

        if (localLastSync && cloudLastUpdated && localLastSync > cloudLastUpdated) {
            console.log('Dati locali più recenti, skip sync');
            return;
        }

        // Aggiorna localStorage con dati cloud
        if (cloudData.meals) localStorage.setItem(`meals_${currentUser}`, JSON.stringify(cloudData.meals));
        if (cloudData.weights) localStorage.setItem(`weights_${currentUser}`, JSON.stringify(cloudData.weights));
        if (cloudData.activities) localStorage.setItem(`activities_${currentUser}`, JSON.stringify(cloudData.activities));
        if (cloudData.goal) localStorage.setItem(`goal_${currentUser}`, JSON.stringify(cloudData.goal));
        if (cloudData.selectedDiet) localStorage.setItem(`diet_${currentUser}`, cloudData.selectedDiet);
        if (cloudData.dailyTracking) localStorage.setItem(`dailyTracking_${currentUser}`, JSON.stringify(cloudData.dailyTracking));
        if (cloudData.dailySteps) localStorage.setItem(`dailySteps_${currentUser}`, JSON.stringify(cloudData.dailySteps));
        if (cloudData.workoutTracking) localStorage.setItem(`workoutTracking_${currentUser}`, JSON.stringify(cloudData.workoutTracking));

        // Aggiorna variabili globali in app.js
        if (typeof meals !== 'undefined' && cloudData.meals) meals = cloudData.meals;
        if (typeof weights !== 'undefined' && cloudData.weights) weights = cloudData.weights;
        if (typeof activities !== 'undefined' && cloudData.activities) activities = cloudData.activities;
        if (typeof goal !== 'undefined' && cloudData.goal) goal = cloudData.goal;

        lastSyncTime = cloudLastUpdated || new Date().toISOString();
        localStorage.setItem(`last_firebase_sync_${currentUser}`, lastSyncTime);

        console.log('✅ Dati sincronizzati da cloud');

        // Ricarica UI
        if (typeof loadTodayMeals === 'function') loadTodayMeals();
        if (typeof loadCurrentWeight === 'function') loadCurrentWeight();
        if (typeof loadGoalStatus === 'function') loadGoalStatus();

    } catch (error) {
        console.error('Errore caricamento da Firestore:', error);
    }
}

// ========================================
// REAL-TIME SYNC
// ========================================

let unsubscribeSnapshot = null;

function startRealtimeSync() {
    if (!syncEnabled || !currentFirebaseUser) return;

    // Listen for changes da altri dispositivi
    unsubscribeSnapshot = db.collection('users').doc(currentUser)
        .onSnapshot((doc) => {
            if (doc.exists) {
                const cloudData = doc.data();
                const cloudTimestamp = cloudData.lastUpdated?.toDate().toISOString();
                const localTimestamp = localStorage.getItem(`last_firebase_sync_${currentUser}`);

                // Solo sync se dati cloud più recenti
                if (!localTimestamp || cloudTimestamp > localTimestamp) {
                    console.log('🔄 Dati aggiornati da altro dispositivo, sincronizzazione...');
                    loadDataFromFirestore();
                }
            }
        }, (error) => {
            console.error('Snapshot error:', error);
        });

    console.log('👂 Real-time sync attivo');
}

function stopRealtimeSync() {
    if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
    }
    syncEnabled = false;
    console.log('🛑 Real-time sync fermato');
}

// ========================================
// SAVE TO FIRESTORE (chiamata da app.js)
// ========================================

window.syncToFirestore = async function() {
    if (!syncEnabled || !currentFirebaseUser) {
        return; // Sync disabilitato
    }

    try {
        const userDoc = db.collection('users').doc(currentUser);

        const dataToSync = {
            meals: JSON.parse(localStorage.getItem(`meals_${currentUser}`) || '[]'),
            weights: JSON.parse(localStorage.getItem(`weights_${currentUser}`) || '[]'),
            activities: JSON.parse(localStorage.getItem(`activities_${currentUser}`) || '[]'),
            goal: JSON.parse(localStorage.getItem(`goal_${currentUser}`) || 'null'),
            selectedDiet: localStorage.getItem(`diet_${currentUser}`) || null,
            dailyTracking: JSON.parse(localStorage.getItem(`dailyTracking_${currentUser}`) || '{}'),
            dailySteps: JSON.parse(localStorage.getItem(`dailySteps_${currentUser}`) || '{}'),
            workoutTracking: JSON.parse(localStorage.getItem(`workoutTracking_${currentUser}`) || '{}'),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };

        await userDoc.set(dataToSync, { merge: true });

        lastSyncTime = new Date().toISOString();
        localStorage.setItem(`last_firebase_sync_${currentUser}`, lastSyncTime);

        console.log('✅ Dati sincronizzati su cloud');

        // Update UI with last sync time
        if (typeof window.updateCloudSyncUI === 'function' && currentFirebaseUser) {
            window.updateCloudSyncUI(true, currentFirebaseUser.email, lastSyncTime);
        }

    } catch (error) {
        console.error('Errore sync Firestore:', error);
    }
};

// ========================================
// SIGN OUT
// ========================================

window.signOutFromFirebase = async function() {
    try {
        await auth.signOut();
        currentFirebaseUser = null;
        stopRealtimeSync();
        localStorage.removeItem(`firebase_sync_enabled_${currentUser}`);
        console.log('👋 Firebase sign-out completato');
    } catch (error) {
        console.error('Sign-out error:', error);
    }
};

// ========================================
// AUTO-SYNC ON DATA CHANGE
// ========================================

// Override saveData() per auto-sync
const originalSaveData = window.saveData;
window.saveData = function() {
    // Chiama funzione originale
    if (originalSaveData) originalSaveData();

    // Poi sync to Firestore
    window.syncToFirestore();
};

console.log('🔥 Firebase sync module loaded');
