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
// PROFILE-ISOLATED FIRESTORE PATH
// Each profile gets its own document: users/{uid}/profiles/{currentUser}
// e.g. users/abc123/profiles/gabriel  — users/abc123/profiles/diana
// ========================================

function getProfileDoc() {
    return db.collection('users').doc(currentFirebaseUser.uid)
             .collection('profiles').doc(currentUser);
}

// ========================================
// AUTHENTICATION
// ========================================

function isNativeApp() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform());
}

window.signInWithFirebase = async function() {
    try {
        if (isNativeApp()) {
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
    console.log('✅ Firebase signed in:', user.email, 'profilo:', currentUser);

    localStorage.setItem(`firebase_sync_enabled_${currentUser}`, 'true');
    syncEnabled = true;

    const localHasData = (typeof meals !== 'undefined' && meals.length > 0)
        || (typeof weights !== 'undefined' && weights.length > 0)
        || (typeof goal !== 'undefined' && goal !== null);

    if (localHasData) {
        await migrateLocalDataToFirestore();
    } else {
        await loadDataFromFirestore();
    }
    startRealtimeSync();

    alert(`✅ Cloud Sync attivato!\n\n👤 Profilo: ${currentUser}\n📧 Account: ${user.email}\n\n🔄 I dati di ${currentUser} saranno sincronizzati!`);

    if (typeof window.updateCloudSyncUI === 'function') {
        window.updateCloudSyncUI(true, user.email, lastSyncTime);
    }
}

// Auto-restore sync on page load
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentFirebaseUser = user;
        if (syncEnabled) return;
        const syncPref = localStorage.getItem(`firebase_sync_enabled_${currentUser}`);

        if (syncPref === 'true') {
            syncEnabled = true;
            console.log('🔄 Auto-sync attivo per profilo:', currentUser);
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
        console.log('📤 Upload dati profilo', currentUser, '→ Firestore...');

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
            deviceInfo: { userAgent: navigator.userAgent, lastSyncedFrom: 'migration' }
        };

        await getProfileDoc().set(dataToMigrate, { merge: true });

        console.log('✅ Upload completato per profilo:', currentUser);
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
        console.log('📥 Download dati profilo', currentUser, 'da Firestore...');

        let snapshot = await getProfileDoc().get();

        // Fallback: vecchio path legacy (users/{uid}) — migra solo se localUsername corrisponde
        if (!snapshot.exists) {
            const legacyDoc = await db.collection('users').doc(currentFirebaseUser.uid).get();
            if (legacyDoc.exists && legacyDoc.data().localUsername === currentUser) {
                console.log('📦 Migrazione automatica dal vecchio path per:', currentUser);
                await getProfileDoc().set(legacyDoc.data(), { merge: true });
                snapshot = await getProfileDoc().get();
            }
        }

        if (!snapshot.exists) {
            console.log('Nessun dato cloud per profilo', currentUser, '— uso dati locali');
            return;
        }

        const cloudData = snapshot.data();

        // Aggiorna localStorage
        if (cloudData.meals?.length > 0) localStorage.setItem(`meals_${currentUser}`, JSON.stringify(cloudData.meals));
        if (cloudData.weights?.length > 0) localStorage.setItem(`weights_${currentUser}`, JSON.stringify(cloudData.weights));
        if (cloudData.activities?.length > 0) localStorage.setItem(`activities_${currentUser}`, JSON.stringify(cloudData.activities));
        if (cloudData.goal) localStorage.setItem(`goal_${currentUser}`, JSON.stringify(cloudData.goal));
        if (cloudData.selectedDiet) localStorage.setItem(`diet_${currentUser}`, cloudData.selectedDiet);
        if (cloudData.dailyTracking && Object.keys(cloudData.dailyTracking).length > 0) localStorage.setItem(`dailyTracking_${currentUser}`, JSON.stringify(cloudData.dailyTracking));
        if (cloudData.dailySteps && Object.keys(cloudData.dailySteps).length > 0) localStorage.setItem(`dailySteps_${currentUser}`, JSON.stringify(cloudData.dailySteps));
        if (cloudData.workoutTracking?.completedWorkouts?.length > 0) localStorage.setItem(`workoutTracking_${currentUser}`, JSON.stringify(cloudData.workoutTracking));

        // Aggiorna variabili globali
        if (typeof meals !== 'undefined' && cloudData.meals?.length > 0) meals = cloudData.meals;
        if (typeof weights !== 'undefined' && cloudData.weights?.length > 0) weights = cloudData.weights;
        if (typeof activities !== 'undefined' && cloudData.activities?.length > 0) activities = cloudData.activities;
        if (typeof goal !== 'undefined' && cloudData.goal) goal = cloudData.goal;
        if (typeof selectedDiet !== 'undefined' && cloudData.selectedDiet) selectedDiet = cloudData.selectedDiet;
        if (typeof dailyTracking !== 'undefined' && cloudData.dailyTracking && Object.keys(cloudData.dailyTracking).length > 0) dailyTracking = cloudData.dailyTracking;
        if (typeof dailySteps !== 'undefined' && cloudData.dailySteps && Object.keys(cloudData.dailySteps).length > 0) dailySteps = cloudData.dailySteps;
        if (typeof workoutTracking !== 'undefined' && cloudData.workoutTracking?.completedWorkouts?.length > 0) workoutTracking = cloudData.workoutTracking;

        lastSyncTime = cloudData.lastUpdated?.toDate()?.toISOString() || new Date().toISOString();
        localStorage.setItem(`last_firebase_sync_${currentUser}`, lastSyncTime);

        console.log('✅ Dati profilo', currentUser, 'sincronizzati da cloud');

        if (typeof window.updateCloudSyncUI === 'function' && currentFirebaseUser) {
            window.updateCloudSyncUI(true, currentFirebaseUser.email, lastSyncTime);
        }

        // Ricarica UI
        const uiFunctions = [
            'loadTodayMeals', 'loadTodayCalories', 'loadTodayActivities',
            'loadTodayActivityStats', 'loadCurrentWeight', 'loadWeightChart',
            'loadGoalStatus', 'loadSelectedDiet', 'updateGoalProgress',
            'displayTodaysWorkout', 'loadTodaysPlan', 'updateDailySummary',
            'updateWeeklyChart', 'loadDailySteps', 'updateCharts', 'updateBadges',
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
        if (error.code) alert('❌ Errore Cloud Sync\n\nCodice: ' + error.code);
    }
}

// ========================================
// REAL-TIME SYNC
// ========================================

let unsubscribeSnapshot = null;

function startRealtimeSync() {
    if (!syncEnabled || !currentFirebaseUser) return;
    if (unsubscribeSnapshot) { unsubscribeSnapshot(); unsubscribeSnapshot = null; }

    // Ascolta cambiamenti SOLO per il profilo corrente
    unsubscribeSnapshot = getProfileDoc()
        .onSnapshot((doc) => {
            if (doc.exists) {
                const cloudData = doc.data();
                const cloudTimestamp = cloudData.lastUpdated?.toDate()?.toISOString();
                const localTimestamp = localStorage.getItem(`last_firebase_sync_${currentUser}`);
                if (!localTimestamp || cloudTimestamp > localTimestamp) {
                    console.log('🔄 Aggiornamento da altro dispositivo per profilo:', currentUser);
                    loadDataFromFirestore();
                }
            }
        }, (error) => {
            console.error('Snapshot error:', error);
        });

    console.log('👂 Real-time sync attivo per profilo:', currentUser);
}

function stopRealtimeSync() {
    if (unsubscribeSnapshot) { unsubscribeSnapshot(); unsubscribeSnapshot = null; }
    syncEnabled = false;
    console.log('🛑 Real-time sync fermato');
}

// ========================================
// SAVE TO FIRESTORE
// ========================================

window.syncToFirestore = async function() {
    if (!syncEnabled || !currentFirebaseUser) return;

    try {
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

        await getProfileDoc().set(dataToSync, { merge: true });

        lastSyncTime = new Date().toISOString();
        localStorage.setItem(`last_firebase_sync_${currentUser}`, lastSyncTime);

        console.log('✅ Dati profilo', currentUser, 'salvati su cloud');

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

const originalSaveData = window.saveData;
window.saveData = function() {
    if (originalSaveData) originalSaveData();
    window.syncToFirestore();
};

console.log('🔥 Firebase sync module loaded — profilo:', currentUser);
