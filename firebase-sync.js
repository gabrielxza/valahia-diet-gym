// ========================================
// FIREBASE CONFIGURATION & INITIALIZATION
// ========================================

const firebaseConfig = {
    apiKey: "AIzaSyDpC11Jcc7ea2DviinVJMazlL5W0HNqRxg",
    authDomain: "valahia-diet-gym-11747.firebaseapp.com",
    projectId: "valahia-diet-gym-11747",
    storageBucket: "valahia-diet-gym-11747.firebasestorage.app",
    messagingSenderId: "939145249574",
    appId: "1:939145249574:web:04754dea4607b0066937e7"
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

// Detect if running as native Android app
function isNativeApp() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform());
}

// Sign in with Google
window.signInWithFirebase = async function() {
    try {
        if (isNativeApp()) {
            // Native app: use @capacitor-firebase/authentication plugin
            // This opens native Google Sign-In dialog (no WebView redirect)
            const FirebaseAuthentication = window.Capacitor.Plugins.FirebaseAuthentication;
            if (!FirebaseAuthentication) {
                alert('❌ Firebase Authentication plugin non trovato\n\nRicompila l\'app.');
                return false;
            }
            const result = await FirebaseAuthentication.signInWithGoogle();
            const idToken = result.credential?.idToken;
            if (!idToken) {
                alert('❌ Nessun token Google ricevuto');
                return false;
            }
            const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
            const userCredential = await auth.signInWithCredential(credential);
            await handleFirebaseSignIn(userCredential.user);
            return true;
        } else {
            // Browser PWA: use popup
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await auth.signInWithPopup(provider);
            await handleFirebaseSignIn(result.user);
            return true;
        }

    } catch (error) {
        console.error('Firebase sign-in error:', error);
        alert('❌ Errore accesso Firebase\n\n' + error.message + '\n\nRiprova o continua senza sync cloud.');
        return false;
    }
};

async function handleFirebaseSignIn(user) {
    currentFirebaseUser = user;
    console.log('✅ Firebase signed in:', user.email);

    localStorage.setItem(`firebase_sync_enabled_${currentUser}`, 'true');
    syncEnabled = true;

    await migrateLocalDataToFirestore();
    startRealtimeSync();

    alert(`✅ Cloud Sync attivato!\n\n📧 Account: ${user.email}\n\n🔄 I tuoi dati saranno sincronizzati su tutti i dispositivi!`);

    if (typeof window.updateCloudSyncUI === 'function') {
        const lastSync = localStorage.getItem(`last_firebase_sync_${currentUser}`);
        window.updateCloudSyncUI(true, user.email, lastSync);
    }
}

// Controlla se già loggato
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentFirebaseUser = user;
        const syncPref = localStorage.getItem(`firebase_sync_enabled_${currentUser}`);

        if (syncPref === 'true') {
            syncEnabled = true;
            console.log('🔄 Auto-sync cloud attivo per:', user.email);

            await loadDataFromFirestore();
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

        const userDoc = db.collection('users').doc(currentFirebaseUser.uid);

        // Prepara tutti i dati
        const dataToMigrate = {
            localUsername: currentUser,
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

        const userDoc = await db.collection('users').doc(currentFirebaseUser.uid).get();

        if (!userDoc.exists) {
            console.log('Nessun dato cloud trovato, uso dati locali');
            return;
        }

        const cloudData = userDoc.data();

        // Carica sempre i dati dal cloud (fonte di verità)

        // Aggiorna localStorage con dati cloud
        if (cloudData.meals) localStorage.setItem(`meals_${currentUser}`, JSON.stringify(cloudData.meals));
        if (cloudData.weights) localStorage.setItem(`weights_${currentUser}`, JSON.stringify(cloudData.weights));
        if (cloudData.activities) localStorage.setItem(`activities_${currentUser}`, JSON.stringify(cloudData.activities));
        if (cloudData.goal) localStorage.setItem(`goal_${currentUser}`, JSON.stringify(cloudData.goal));
        if (cloudData.selectedDiet) localStorage.setItem(`diet_${currentUser}`, cloudData.selectedDiet);
        if (cloudData.dailyTracking) localStorage.setItem(`dailyTracking_${currentUser}`, JSON.stringify(cloudData.dailyTracking));
        if (cloudData.dailySteps) localStorage.setItem(`dailySteps_${currentUser}`, JSON.stringify(cloudData.dailySteps));
        if (cloudData.workoutTracking) localStorage.setItem(`workoutTracking_${currentUser}`, JSON.stringify(cloudData.workoutTracking));

        // Aggiorna TUTTE le variabili globali in app.js
        if (typeof meals !== 'undefined' && cloudData.meals) meals = cloudData.meals;
        if (typeof weights !== 'undefined' && cloudData.weights) weights = cloudData.weights;
        if (typeof activities !== 'undefined' && cloudData.activities) activities = cloudData.activities;
        if (typeof goal !== 'undefined' && cloudData.goal) goal = cloudData.goal;
        if (typeof selectedDiet !== 'undefined' && cloudData.selectedDiet) selectedDiet = cloudData.selectedDiet;
        if (typeof dailyTracking !== 'undefined' && cloudData.dailyTracking) dailyTracking = cloudData.dailyTracking;
        if (typeof dailySteps !== 'undefined' && cloudData.dailySteps) dailySteps = cloudData.dailySteps;
        if (typeof workoutTracking !== 'undefined' && cloudData.workoutTracking) workoutTracking = cloudData.workoutTracking;

        lastSyncTime = cloudData.lastUpdated?.toDate()?.toISOString() || new Date().toISOString();
        localStorage.setItem(`last_firebase_sync_${currentUser}`, lastSyncTime);

        console.log('✅ Dati sincronizzati da cloud');

        // Aggiorna UI cloud sync timestamp
        if (typeof window.updateCloudSyncUI === 'function' && currentFirebaseUser) {
            window.updateCloudSyncUI(true, currentFirebaseUser.email, lastSyncTime);
        }

        // Ricarica tutta l'UI con i nuovi dati
        const uiFunctions = [
            'loadTodayMeals', 'loadTodayCalories', 'loadTodayActivities',
            'loadTodayActivityStats', 'loadCurrentWeight', 'loadWeightChart',
            'loadGoalStatus', 'loadSelectedDiet', 'updateGoalProgress',
            'loadTodaysPlan', 'updateDailySummary', 'updateWeeklyChart',
            'loadDailySteps', 'updateCharts', 'updateBadges',
            'loadBodyMeasurements', 'loadWaterIntake', 'updateMacros',
            'updatePerformanceMetrics', 'checkCalorieAlert'
        ];
        uiFunctions.forEach(fn => {
            if (typeof window[fn] === 'function') {
                try { window[fn](); } catch(e) { console.warn('UI refresh error:', fn, e); }
            }
        });

    } catch (error) {
        console.error('Errore caricamento da Firestore:', error);
        if (error.code) {
            // Errore Firestore reale (permission-denied, unavailable, ecc.)
            alert('❌ Errore Cloud Sync\n\nCodice: ' + error.code);
        }
    }
}

// ========================================
// REAL-TIME SYNC
// ========================================

let unsubscribeSnapshot = null;

function startRealtimeSync() {
    if (!syncEnabled || !currentFirebaseUser) return;

    // Listen for changes da altri dispositivi
    unsubscribeSnapshot = db.collection('users').doc(currentFirebaseUser.uid)
        .onSnapshot((doc) => {
            if (doc.exists) {
                const cloudData = doc.data();
                const cloudTimestamp = cloudData.lastUpdated?.toDate()?.toISOString();
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
        const userDoc = db.collection('users').doc(currentFirebaseUser.uid);

        const dataToSync = {
            localUsername: currentUser,
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
        alert('❌ Errore salvataggio cloud\n\nCodice: ' + (error.code || error.message));
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
