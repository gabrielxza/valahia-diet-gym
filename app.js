// ===========================
// AUTH CHECK
// ===========================
const currentUser = localStorage.getItem('diet_user');
const isLoggedIn = localStorage.getItem('diet_logged_in') === 'true';

// Login check disabled - app works without separate login page
// if (!isLoggedIn || !currentUser) {
//     window.location.href = 'login.html';
// }

// ===========================
// DARK MODE
// ===========================
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

window.toggleTheme = function() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
};

// ===========================
// GLOBAL STATE
// ===========================
let meals = JSON.parse(localStorage.getItem(`meals_${currentUser}`) || '[]');
let weights = JSON.parse(localStorage.getItem(`weights_${currentUser}`) || '[]');
let activities = JSON.parse(localStorage.getItem(`activities_${currentUser}`) || '[]');
let goal = JSON.parse(localStorage.getItem(`goal_${currentUser}`) || 'null');
let selectedDiet = localStorage.getItem(`diet_${currentUser}`) || null;
let dailyTracking = JSON.parse(localStorage.getItem(`dailyTracking_${currentUser}`) || '{}');

// ===========================
// WORKOUT PROGRAM TRACKING
// ===========================
let workoutTracking = JSON.parse(localStorage.getItem(`workoutTracking_${currentUser}`) || JSON.stringify({
    currentProgram: null,        // es: 'calisthenics'
    currentProgramName: null,    // es: 'PROGRAMMA CALISTHENICS - MASSA MUSCOLARE'
    currentDayIndex: 0,          // quale giorno del programma (0-based)
    startDate: null,             // quando ha iniziato il programma corrente
    lastWorkoutDate: null,       // ultima volta che ha completato un allenamento
    completedWorkouts: [],       // array di { date: 'YYYY-MM-DD', program: 'calisthenics', dayIndex: 0 }
    programRotation: []          // array di programmi da rotare per variare
}));

// ===========================
// UTILITY FUNCTIONS
// ===========================
function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

function getTodayString() {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
}

function getGoal() {
    return goal;
}

function getAllWeights() {
    return weights;
}

function saveData() {
    localStorage.setItem(`meals_${currentUser}`, JSON.stringify(meals));
    localStorage.setItem(`weights_${currentUser}`, JSON.stringify(weights));
    localStorage.setItem(`activities_${currentUser}`, JSON.stringify(activities));
    if (goal) localStorage.setItem(`goal_${currentUser}`, JSON.stringify(goal));
    if (selectedDiet) localStorage.setItem(`diet_${currentUser}`, selectedDiet);
    localStorage.setItem(`dailyTracking_${currentUser}`, JSON.stringify(dailyTracking));
    localStorage.setItem(`dailySteps_${currentUser}`, JSON.stringify(dailySteps));
    localStorage.setItem(`workoutTracking_${currentUser}`, JSON.stringify(workoutTracking));
}

// ===========================
// WORKOUT PROGRAM SYSTEM (Personal Trainer)
// ===========================

// Ottieni programmi consigliati per utente
function getRecommendedPrograms(userName) {
    const recommendations = {
        'gabriel': [
            { id: 'weight-loss', name: 'Weight Loss - Dimagrimento' },
            { id: 'hiit', name: 'HIIT Fat Burn - Dimagrimento Veloce' },
            { id: 'cardio', name: 'Cardio Endurance - Running' },
            { id: 'fullbody', name: 'Full Body 3-Day - Completo' }
        ],
        'cristina': [
            { id: 'weight-loss', name: 'Weight Loss - Dimagrimento' },
            { id: 'hiit', name: 'HIIT Fat Burn - Cardio Intenso' },
            { id: 'yoga', name: 'Yoga & Flexibility - Mobilità' },
            { id: 'cardio', name: 'Cardio Endurance - Running' }
        ],
        'alex': [
            { id: 'calisthenics', name: 'Calisthenics - Massa Corpo Libero' },
            { id: 'weights', name: 'Weights - Palestra Ipertrofia' },
            { id: 'hybrid', name: 'Hybrid - Mix Completo' },
            { id: 'rings', name: 'Gymnastic Rings - Anelli' },
            { id: 'bands', name: 'Resistance Bands - Elastici' }
        ],
        'diana': [
            { id: 'calisthenics', name: 'Calisthenics - Massa Corpo Libero' },
            { id: 'bands', name: 'Resistance Bands - Elastici' },
            { id: 'performance', name: 'Performance - Esplosività' },
            { id: 'street', name: 'Street Workout - Park Training' },
            { id: 'crossfit', name: 'CrossFit WODs - Allenamento Funzionale' }
        ]
    };

    return recommendations[userName.toLowerCase()] || recommendations['gabriel'];
}

// Inizializza programma per nuovo utente
function initializeUserWorkoutProgram() {
    if (!workoutTracking.currentProgram) {
        const recommended = getRecommendedPrograms(currentUser);
        workoutTracking.currentProgram = recommended[0].id;
        workoutTracking.currentProgramName = recommended[0].name;
        workoutTracking.currentDayIndex = 0;
        workoutTracking.startDate = getTodayString();
        workoutTracking.programRotation = recommended.slice(1, 4).map(p => p.id); // Prossimi 3 programmi
        saveData();
    }
}

// Ottieni il programma corrente completo
function getCurrentProgramData() {
    const programId = workoutTracking.currentProgram;
    if (!programId) return null;

    let program = null;
    switch (programId) {
        case 'calisthenics': program = getCalisthenicsProgram(); break;
        case 'weights': program = getWeightsProgram(); break;
        case 'hybrid': program = getHybridProgram(); break;
        case 'skills': program = getCalisthenicsSkillsProgram(); break;
        case 'strength': program = getStrengthProgram(); break;
        case 'performance': program = getPerformanceProgram(); break;
        case 'weight-loss': program = getWeightLossProgram(); break;
        case 'bands': program = getResistanceBandsProgram(); break;
        case 'rings': program = getGymnasticRingsProgram(); break;
        case 'hiit': program = getHIITFatBurnProgram(); break;
        case 'crossfit': program = getCrossFitWODsProgram(); break;
        case 'fullbody': program = getFullBody3DayProgram(); break;
        case 'core': program = getCoreSpecialistProgram(); break;
        case 'cardio': program = getCardioEnduranceProgram(); break;
        case 'street': program = getStreetWorkoutProgram(); break;
        case 'yoga': program = getYogaFlexibilityProgram(); break;
        case 'olympic': program = getOlympicLiftingProgram(); break;
        default: program = null;
    }

    return program;
}

// Ottieni l'allenamento di oggi
function getTodaysWorkout() {
    const program = getCurrentProgramData();
    if (!program || !program.days || program.days.length === 0) {
        return null;
    }

    // Use actual day of week: Mon=0, Tue=1, ..., Sun=6
    const jsDay = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const weekDay = jsDay === 0 ? 6 : jsDay - 1;
    const dayIndex = weekDay % program.days.length;
    const todayWorkout = program.days[dayIndex];

    return {
        program: program,
        dayIndex: dayIndex,
        totalDays: program.days.length,
        workout: todayWorkout,
        weekNumber: Math.floor(workoutTracking.currentDayIndex / program.days.length) + 1
    };
}

// Completa allenamento e avanza al prossimo
function completeWorkout() {
    const today = getTodayString();

    // Aggiungi a completati
    workoutTracking.completedWorkouts.push({
        date: today,
        program: workoutTracking.currentProgram,
        dayIndex: workoutTracking.currentDayIndex
    });

    workoutTracking.lastWorkoutDate = today;
    workoutTracking.currentDayIndex++;

    const program = getCurrentProgramData();
    if (!program) {
        saveData();
        return;
    }

    // Se ha completato tutte le settimane (es: 4 settimane = 4 cicli completi)
    const cyclesCompleted = Math.floor(workoutTracking.currentDayIndex / program.days.length);

    if (cyclesCompleted >= 4) {
        // Dopo 4 settimane, rotazione automatica al prossimo programma
        if (workoutTracking.programRotation && workoutTracking.programRotation.length > 0) {
            const nextProgram = workoutTracking.programRotation.shift();
            workoutTracking.programRotation.push(workoutTracking.currentProgram); // Metti il vecchio in coda

            workoutTracking.currentProgram = nextProgram;
            workoutTracking.currentDayIndex = 0;
            workoutTracking.startDate = today;

            const recommended = getRecommendedPrograms(currentUser);
            const newProgramInfo = recommended.find(p => p.id === nextProgram);
            workoutTracking.currentProgramName = newProgramInfo ? newProgramInfo.name : nextProgram;

            alert(`🎉 Completato! Nuovo programma: ${workoutTracking.currentProgramName}`);
        } else {
            // Ricomincia dall'inizio
            workoutTracking.currentDayIndex = 0;
            workoutTracking.startDate = today;
        }
    }

    saveData();
    displayTodaysWorkout(); // Ricarica la UI

    // Confetti e notifica
    alert('✅ Allenamento completato! 💪');
}

// Salta al giorno successivo (senza completare)
function skipToNextDay() {
    if (confirm('⏭️ Vuoi saltare al prossimo allenamento senza completare questo?')) {
        workoutTracking.currentDayIndex++;
        saveData();
        displayTodaysWorkout();
    }
}

// Cambia programma manualmente
function changeProgram(programId) {
    if (confirm('🔄 Vuoi cambiare programma? Il progresso attuale verrà salvato.')) {
        workoutTracking.currentProgram = programId;
        workoutTracking.currentDayIndex = 0;
        workoutTracking.startDate = getTodayString();

        const recommended = getRecommendedPrograms(currentUser);
        const newProgramInfo = recommended.find(p => p.id === programId);
        workoutTracking.currentProgramName = newProgramInfo ? newProgramInfo.name : programId;

        saveData();
        displayTodaysWorkout();
        alert('✅ Programma cambiato!');
    }
}

// ===========================
// LOGOUT
// ===========================
function logout() {
    if (confirm('🔄 Vuoi cambiare utente?')) {
        localStorage.removeItem('diet_logged_in');
        localStorage.removeItem('diet_user');
        window.location.reload(); // Reload page instead of redirect to login.html
    }
}

// Close App
function closeApp() {
    if (confirm('✖️ Vuoi chiudere l\'app?')) {
        // Try to close window (works in PWA installed apps)
        window.close();

        // If window.close() doesn't work (in browser), show message
        setTimeout(() => {
            alert('💡 Per chiudere l\'app:\n\n📱 Mobile: Swipe up per chiudere come le altre app\n💻 Desktop: Chiudi la finestra/tab');
        }, 100);
    }
}

// ===========================
// MEALS MANAGEMENT
// ===========================
function loadTodayMeals() {
    const today = getTodayString();
    const todayMeals = meals.filter(m => m.date === today);

    const mealsList = document.getElementById('meals-list');

    if (todayMeals.length === 0) {
        mealsList.innerHTML = '<p class="empty-state">Nessun pasto registrato oggi</p>';
        return;
    }

    const mealIcons = {
        'colazione': '🥐',
        'pranzo': '🍝',
        'cena': '🍖',
        'spuntino': '🍎'
    };

    mealsList.innerHTML = todayMeals.map(meal => `
        <div class="meal-item">
            <div class="meal-info">
                <h3>${mealIcons[meal.type]} ${meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}</h3>
                <p>${meal.description}</p>
                ${meal.calories ? `<span class="meal-calories">${meal.calories} kcal</span>` : ''}
            </div>
            <div class="meal-actions">
                <button class="btn-icon" onclick="deleteMeal('${meal.id}')" title="Elimina">🗑️</button>
            </div>
        </div>
    `).join('');
}

function loadTodayCalories() {
    const today = getTodayString();
    const todayMeals = meals.filter(m => m.date === today);
    const totalCalories = todayMeals.reduce((sum, m) => sum + (parseInt(m.calories) || 0), 0);

    document.getElementById('today-calories').textContent = `${totalCalories} kcal`;

    // Update goal progress and check alerts
    if (typeof checkCalorieAlert === 'function') checkCalorieAlert();
    if (typeof updateGoalProgress === 'function') updateGoalProgress();
}

function showAddMealModal() {
    document.getElementById('modal-add-meal').style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

document.getElementById('form-add-meal').addEventListener('submit', (e) => {
    e.preventDefault();

    const meal = {
        id: Date.now().toString(),
        date: getTodayString(),
        type: document.getElementById('meal-type').value,
        description: document.getElementById('meal-description').value,
        calories: document.getElementById('meal-calories').value || 0,
        timestamp: new Date().toISOString()
    };

    meals.push(meal);
    saveData();

    // Reset form
    e.target.reset();
    closeModal('modal-add-meal');

    // Reload
    loadTodayMeals();
    loadTodayCalories();
});

function deleteMeal(mealId) {
    if (confirm('🗑️ Eliminare questo pasto?')) {
        meals = meals.filter(m => m.id !== mealId);
        saveData();
        loadTodayMeals();
        loadTodayCalories();
    }
}

// ===========================
// WEIGHT MANAGEMENT
// ===========================
function loadCurrentWeight() {
    if (weights.length === 0) {
        document.getElementById('current-weight').textContent = '-- kg';
        return;
    }

    // Sort by date descending
    const sortedWeights = [...weights].sort((a, b) => new Date(b.date) - new Date(a.date));
    const latestWeight = sortedWeights[0];

    document.getElementById('current-weight').textContent = `${latestWeight.weight} kg`;
}

function showWeightModal() {
    document.getElementById('modal-weight').style.display = 'flex';
}

document.getElementById('form-update-weight').addEventListener('submit', (e) => {
    e.preventDefault();

    const weight = {
        id: Date.now().toString(),
        date: document.getElementById('weight-date').value,
        weight: parseFloat(document.getElementById('weight-input').value),
        timestamp: new Date().toISOString()
    };

    // Check if weight for this date already exists
    const existingIndex = weights.findIndex(w => w.date === weight.date);
    if (existingIndex >= 0) {
        // Update existing
        weights[existingIndex] = weight;
    } else {
        // Add new
        weights.push(weight);
    }

    saveData();

    // Reset form
    e.target.reset();
    document.getElementById('weight-date').valueAsDate = new Date();
    closeModal('modal-weight');

    // Reload
    loadCurrentWeight();
    loadWeightChart();
});

function loadWeightChart() {
    const chartContainer = document.getElementById('weight-chart');

    if (weights.length === 0) {
        chartContainer.innerHTML = '<p class="empty-state">Nessun dato disponibile</p>';
        return;
    }

    // Get last 7 days
    const sortedWeights = [...weights]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-7);

    const maxWeight = Math.max(...sortedWeights.map(w => w.weight));
    const minWeight = Math.min(...sortedWeights.map(w => w.weight));
    const range = maxWeight - minWeight || 1;

    chartContainer.innerHTML = sortedWeights.map(w => {
        const height = ((w.weight - minWeight) / range) * 150 + 50; // Min 50px, scale to 200px
        const dateStr = formatDate(w.date);

        return `
            <div class="weight-bar" style="height: ${height}px;">
                ${w.weight} kg
                <small>${dateStr}</small>
            </div>
        `;
    }).join('');
}

// ===========================
// ACTIVITY MANAGEMENT
// ===========================

// Calorie burn rates (kcal per minute per kg body weight)
const ACTIVITY_MET_VALUES = {
    'camminata': { bassa: 2.5, media: 3.5, alta: 4.5 },
    'corsa': { bassa: 7.0, media: 9.0, alta: 11.0 },
    'treadmill': { bassa: 7.0, media: 9.0, alta: 11.0 },
    'bicicletta': { bassa: 4.0, media: 6.0, alta: 8.0 },
    'nuoto': { bassa: 5.0, media: 7.0, alta: 10.0 },
    'palestra': { bassa: 3.0, media: 5.0, alta: 7.0 },
    'yoga': { bassa: 2.5, media: 3.0, alta: 4.0 },
    'altro': { bassa: 3.0, media: 5.0, alta: 7.0 }
};

function calculateCaloriesBurned(activityType, duration, intensity) {
    // Get current user weight
    if (weights.length === 0) {
        // Default estimate if no weight recorded
        return Math.round(duration * 5); // ~5 kcal/min default
    }

    const sortedWeights = [...weights].sort((a, b) => new Date(b.date) - new Date(a.date));
    const currentWeight = sortedWeights[0].weight;

    // MET (Metabolic Equivalent of Task) formula
    // Calories = MET × weight(kg) × duration(hours)
    const met = ACTIVITY_MET_VALUES[activityType]?.[intensity] || 5.0;
    const durationHours = duration / 60;
    const calories = met * currentWeight * durationHours;

    return Math.round(calories);
}

function updateActivityCalorieEstimate() {
    const activityType = document.getElementById('activity-type').value;
    const duration = parseInt(document.getElementById('activity-duration').value) || 0;
    const intensity = document.getElementById('activity-intensity').value;

    if (!activityType || !duration) {
        document.getElementById('activity-calories').value = '';
        document.getElementById('calorie-formula').textContent = '';
        return;
    }

    const calories = calculateCaloriesBurned(activityType, duration, intensity);
    document.getElementById('activity-calories').value = calories;

    // Show formula explanation
    const weight = weights.length > 0 ? [...weights].sort((a, b) => new Date(b.date) - new Date(a.date))[0].weight : '??';
    document.getElementById('calorie-formula').textContent =
        `Basato su: ${duration} min × peso ${weight} kg × intensità ${intensity}`;
}

function loadTodayActivities() {
    const today = getTodayString();
    const todayActivities = activities.filter(a => a.date === today);

    const activitiesList = document.getElementById('activities-list');

    if (todayActivities.length === 0) {
        activitiesList.innerHTML = '<p class="empty-state">Nessuna attività registrata oggi</p>';
        return;
    }

    const activityIcons = {
        'camminata': '🚶',
        'corsa': '🏃',
        'treadmill': '🏃',
        'bicicletta': '🚴',
        'nuoto': '🏊',
        'palestra': '💪',
        'yoga': '🧘',
        'altro': '🏋️'
    };

    activitiesList.innerHTML = todayActivities.map(activity => `
        <div class="activity-item">
            <div class="activity-info">
                <h3>${activityIcons[activity.type]} ${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}</h3>
                <p>${activity.notes || 'Nessuna nota'}</p>
                <div class="activity-meta">
                    <span class="activity-badge duration">⏱️ ${activity.duration} min</span>
                    ${activity.steps ? `<span class="activity-badge steps">👟 ${activity.steps} passi</span>` : ''}
                    <span class="activity-badge calories">🔥 ${activity.calories} kcal</span>
                    <span class="activity-badge">Intensità: ${activity.intensity}</span>
                </div>
            </div>
            <div class="meal-actions">
                <button class="btn-icon" onclick="deleteActivity('${activity.id}')" title="Elimina">🗑️</button>
            </div>
        </div>
    `).join('');
}

function loadTodayActivityStats() {
    const today = getTodayString();
    const todayActivities = activities.filter(a => a.date === today);

    const totalSteps = todayActivities.reduce((sum, a) => sum + (parseInt(a.steps) || 0), 0);
    const totalDuration = todayActivities.reduce((sum, a) => sum + parseInt(a.duration), 0);
    const totalCalories = todayActivities.reduce((sum, a) => sum + parseInt(a.calories), 0);

    document.getElementById('today-steps').textContent = totalSteps.toLocaleString();
    document.getElementById('today-duration').textContent = `${totalDuration} min`;
    document.getElementById('today-burned').textContent = `${totalCalories} kcal`;
}

function showAddActivityModal() {
    document.getElementById('modal-add-activity').style.display = 'flex';
}

document.getElementById('form-add-activity').addEventListener('submit', (e) => {
    e.preventDefault();

    const activity = {
        id: Date.now().toString(),
        date: getTodayString(),
        type: document.getElementById('activity-type').value,
        duration: parseInt(document.getElementById('activity-duration').value),
        steps: parseInt(document.getElementById('activity-steps').value) || 0,
        intensity: document.getElementById('activity-intensity').value,
        calories: parseInt(document.getElementById('activity-calories').value),
        notes: document.getElementById('activity-notes').value,
        timestamp: new Date().toISOString()
    };

    activities.push(activity);
    saveData();

    // Reset form
    e.target.reset();
    closeModal('modal-add-activity');

    // Reload
    loadTodayActivities();
    loadTodayActivityStats();
});

function deleteActivity(activityId) {
    if (confirm('🗑️ Eliminare questa attività?')) {
        activities = activities.filter(a => a.id !== activityId);
        saveData();
        loadTodayActivities();
        loadTodayActivityStats();
    }
}

// ===========================
// GOAL MANAGEMENT
// ===========================

// Calculate TDEE (Total Daily Energy Expenditure) using Mifflin-St Jeor Equation
function calculateTDEE(weight, height, age, gender, activityLevel) {
    let bmr;

    if (gender === 'M') {
        // BMR for men: 10 × weight(kg) + 6.25 × height(cm) - 5 × age(y) + 5
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
        // BMR for women: 10 × weight(kg) + 6.25 × height(cm) - 5 × age(y) - 161
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    // TDEE = BMR × Activity Level
    return Math.round(bmr * activityLevel);
}

// Toggle goal type fields
window.toggleGoalType = function() {
    const goalType = document.getElementById('goal-type').value;

    document.getElementById('weight-loss-fields').style.display = goalType === 'weight-loss' ? 'block' : 'none';
    document.getElementById('muscle-gain-fields').style.display = goalType === 'muscle-gain' ? 'block' : 'none';
    document.getElementById('performance-fields').style.display = goalType === 'performance' ? 'block' : 'none';
};

function showGoalModal() {
    // Pre-fill with current values if goal exists
    if (goal) {
        document.getElementById('goal-type').value = goal.type || 'weight-loss';
        toggleGoalType();

        if (goal.type === 'weight-loss') {
            document.getElementById('goal-weight').value = goal.targetWeight;
            document.getElementById('goal-weekly').value = goal.weeklyGoal;
        } else if (goal.type === 'muscle-gain') {
            document.getElementById('goal-muscle').value = goal.muscleGoal;
            document.getElementById('goal-training-focus').value = goal.trainingFocus;
        } else if (goal.type === 'performance') {
            document.getElementById('goal-performance').value = goal.performanceGoal;
        }

        document.getElementById('goal-activity-level').value = goal.activityLevel;
        document.getElementById('goal-age').value = goal.age;
        document.getElementById('goal-gender').value = goal.gender;
        document.getElementById('goal-height').value = goal.height;
    } else {
        toggleGoalType();
    }

    document.getElementById('modal-goal').style.display = 'flex';
}

document.getElementById('form-set-goal').addEventListener('submit', (e) => {
    e.preventDefault();

    if (weights.length === 0) {
        alert('⚠️ Registra prima il tuo peso attuale!');
        closeModal('modal-goal');
        showWeightModal();
        return;
    }

    const currentWeight = [...weights].sort((a, b) => new Date(b.date) - new Date(a.date))[0].weight;
    const goalType = document.getElementById('goal-type').value;
    const activityLevel = parseFloat(document.getElementById('goal-activity-level').value);
    const age = parseInt(document.getElementById('goal-age').value);
    const gender = document.getElementById('goal-gender').value;
    const height = parseInt(document.getElementById('goal-height').value);

    // Calculate TDEE
    const tdee = calculateTDEE(currentWeight, height, age, gender, activityLevel);

    goal = {
        type: goalType,
        currentWeight,
        activityLevel,
        age,
        gender,
        height,
        tdee,
        startDate: new Date().toISOString()
    };

    // Type-specific settings
    if (goalType === 'weight-loss') {
        const targetWeight = parseFloat(document.getElementById('goal-weight').value);
        const weeklyGoal = parseFloat(document.getElementById('goal-weekly').value);
        const weeklyDeficit = weeklyGoal * 7700;
        const dailyDeficit = Math.round(weeklyDeficit / 7);
        const calorieTarget = tdee - dailyDeficit;

        goal.targetWeight = targetWeight;
        goal.weeklyGoal = weeklyGoal;
        goal.calorieTarget = calorieTarget;

        alert(`✅ Obiettivo Dimagrimento impostato!\n\n🎯 Target: ${targetWeight} kg\n🔥 Calorie giornaliere: ${calorieTarget} kcal`);
    }
    else if (goalType === 'muscle-gain') {
        const muscleGoal = document.getElementById('goal-muscle').value;
        const trainingFocus = document.getElementById('goal-training-focus').value;

        // Surplus calorico per massa
        const surplus = muscleGoal === 'lean' ? 200 : muscleGoal === 'bulk' ? 500 : 0;
        const calorieTarget = tdee + surplus;

        goal.muscleGoal = muscleGoal;
        goal.trainingFocus = trainingFocus;
        goal.calorieTarget = calorieTarget;

        alert(`✅ Obiettivo Massa Muscolare impostato!\n\n💪 Tipo: ${muscleGoal === 'lean' ? 'Clean Bulk' : muscleGoal === 'bulk' ? 'Bulk Rapido' : 'Ricomposizione'}\n🏋️ Focus: ${trainingFocus === 'calisthenics' ? 'Calisthenics' : trainingFocus === 'weights' ? 'Palestra' : 'Ibrido'}\n🔥 Calorie giornaliere: ${calorieTarget} kcal`);
    }
    else if (goalType === 'performance') {
        const performanceGoal = document.getElementById('goal-performance').value;

        goal.performanceGoal = performanceGoal;
        goal.calorieTarget = tdee; // Mantenimento

        alert(`✅ Obiettivo Performance impostato!\n\n🏆 Focus: ${performanceGoal === 'strength' ? 'Forza' : performanceGoal === 'endurance' ? 'Resistenza' : performanceGoal === 'power' ? 'Potenza' : 'Skills Calisthenics'}\n🔥 Calorie mantenimento: ${tdee} kcal`);
    }
    else if (goalType === 'maintenance') {
        goal.calorieTarget = tdee;
        alert(`✅ Obiettivo Mantenimento impostato!\n\n⚖️ Calorie giornaliere: ${tdee} kcal`);
    }

    // Regenerate today's workout plan with new activity level
    const today = getTodayString();
    if (dailyTracking[today]) {
        dailyTracking[today].workout = generateTodayWorkout();
        dailyTracking[today].workoutConfirmed = false;
    } else {
        dailyTracking[today] = {
            meals: generateTodayMeals(),
            workout: generateTodayWorkout(),
            mealsConfirmed: false,
            workoutConfirmed: false,
            actualMeals: [],
            actualWorkout: null
        };
    }

    saveData();
    closeModal('modal-goal');

    loadGoalStatus();
    updateGoalProgress();
    loadTodaysPlan();
});

function loadGoalStatus() {
    if (!goal) {
        document.getElementById('goal-status').textContent = 'Imposta obiettivo';
        document.getElementById('goal-progress-section').style.display = 'none';
        return;
    }

    let statusText = '';

    if (goal.type === 'weight-loss') {
        const remaining = (goal.currentWeight - goal.targetWeight).toFixed(1);
        statusText = `${goal.targetWeight} kg (-${remaining} kg)`;
    } else if (goal.type === 'muscle-gain') {
        const muscleTypes = { lean: 'Clean Bulk', bulk: 'Bulk', recomp: 'Ricomposizione' };
        statusText = `${muscleTypes[goal.muscleGoal] || 'Massa'}`;
    } else if (goal.type === 'performance') {
        const perfTypes = { strength: 'Forza', endurance: 'Resistenza', power: 'Potenza', skills: 'Skills' };
        statusText = `${perfTypes[goal.performanceGoal] || 'Performance'}`;
    } else {
        statusText = 'Mantenimento';
    }

    document.getElementById('goal-status').textContent = statusText;
    document.getElementById('goal-progress-section').style.display = 'block';
}

function updateGoalProgress() {
    if (!goal || weights.length === 0) return;

    const currentWeight = [...weights].sort((a, b) => new Date(b.date) - new Date(a.date))[0].weight;
    const startWeight = goal.currentWeight;
    const targetWeight = goal.targetWeight;

    const totalToLose = startWeight - targetWeight;
    const lost = startWeight - currentWeight;
    const remaining = currentWeight - targetWeight;
    const progress = (lost / totalToLose) * 100;

    // Update stats
    document.getElementById('goal-current-weight').textContent = `${currentWeight} kg`;
    document.getElementById('goal-target-weight').textContent = `${targetWeight} kg`;
    document.getElementById('goal-remaining').textContent = `${remaining.toFixed(1)} kg`;
    document.getElementById('goal-calorie-target').textContent = `${goal.calorieTarget} kcal`;

    // Update progress bar
    const progressBar = document.getElementById('goal-progress-bar');
    const progressText = document.getElementById('goal-progress-text');
    const clampedProgress = Math.min(Math.max(progress, 0), 100);

    progressBar.style.width = `${clampedProgress}%`;
    progressText.textContent = `${clampedProgress.toFixed(1)}% completato`;

    // Generate and display workout plan (normal or advanced)
    if (goal.type === 'muscle-gain' || goal.type === 'performance') {
        generateAdvancedWorkoutPlan();
    } else {
        generateWorkoutPlan();
    }
}

// ===========================
// WORKOUT PLAN GENERATION
// ===========================

function generateWorkoutPlan() {
    if (!goal) return;

    const level = goal.activityLevel || 1.375;
    if (level <= 1.2) {
        const container = document.getElementById('workout-plan-container');
        if (container) container.innerHTML = '<p style="text-align:center;padding:40px;color:var(--text-muted);">😴 Nessun allenamento pianificato.<br>Aumenta il livello di attività nell\'obiettivo per vedere un piano.</p>';
        return;
    }

    // Calculate weekly calorie deficit needed
    const weeklyDeficit = goal.weeklyGoal * 7700; // kcal/week
    const dailyDeficit = weeklyDeficit / 7;

    // Split 60% diet, 40% exercise (typical recommendation)
    const exerciseCaloriesDaily = Math.round(dailyDeficit * 0.4);
    const exerciseCaloriesWeekly = exerciseCaloriesDaily * 5; // 5 days workout

    // Generate 5-day workout plan
    const workoutPlan = [
        {
            day: 'Lunedì',
            icon: '🏃',
            focus: 'Cardio + Gambe',
            exercises: [
                {
                    name: 'Treadmill',
                    duration: Math.round(exerciseCaloriesDaily / 10), // ~10 kcal/min
                    distance: Math.round((exerciseCaloriesDaily / 10) * 0.1), // ~6 km/h
                    calories: exerciseCaloriesDaily,
                    details: 'Velocità 6 km/h, inclinazione 2%'
                },
                {
                    name: 'Leg Press',
                    sets: '3 serie x 12 ripetizioni',
                    rest: '60 sec tra serie',
                    calories: 80
                },
                {
                    name: 'Squat',
                    sets: '3 serie x 15 ripetizioni',
                    rest: '60 sec',
                    calories: 70
                }
            ]
        },
        {
            day: 'Mercoledì',
            icon: '💪',
            focus: 'Parte Superiore',
            exercises: [
                {
                    name: 'Cyclette',
                    duration: Math.round(exerciseCaloriesDaily / 8), // ~8 kcal/min
                    calories: exerciseCaloriesDaily,
                    details: 'Resistenza media, ritmo costante'
                },
                {
                    name: 'Chest Press (Petto)',
                    sets: '3 serie x 12 ripetizioni',
                    rest: '60 sec',
                    calories: 90
                },
                {
                    name: 'Shoulder Press (Spalle)',
                    sets: '3 serie x 10 ripetizioni',
                    rest: '60 sec',
                    calories: 80
                },
                {
                    name: 'Lat Pull Down (Dorsali)',
                    sets: '3 serie x 12 ripetizioni',
                    rest: '60 sec',
                    calories: 85
                }
            ]
        },
        {
            day: 'Venerdì',
            icon: '🚴',
            focus: 'Cardio Intenso',
            exercises: [
                {
                    name: 'Cyclette HIIT',
                    duration: 30,
                    calories: Math.round(exerciseCaloriesDaily * 0.7),
                    details: '30 sec sprint + 30 sec recupero x 20 cicli'
                },
                {
                    name: 'Treadmill Camminata Veloce',
                    duration: 20,
                    distance: 2,
                    calories: Math.round(exerciseCaloriesDaily * 0.3),
                    details: 'Velocità 5-6 km/h, inclinazione 5%'
                }
            ]
        },
        {
            day: 'Sabato',
            icon: '🦵',
            focus: 'Braccia + Core',
            exercises: [
                {
                    name: 'Treadmill',
                    duration: Math.round(exerciseCaloriesDaily / 10),
                    distance: Math.round((exerciseCaloriesDaily / 10) * 0.1),
                    calories: Math.round(exerciseCaloriesDaily * 0.6),
                    details: 'Velocità 6 km/h'
                },
                {
                    name: 'Bicep Curl (Bicipiti)',
                    sets: '3 serie x 12 ripetizioni',
                    rest: '45 sec',
                    calories: 60
                },
                {
                    name: 'Tricep Extension (Tricipiti)',
                    sets: '3 serie x 12 ripetizioni',
                    rest: '45 sec',
                    calories: 60
                },
                {
                    name: 'Plank (Core)',
                    sets: '3 serie x 45 secondi',
                    rest: '30 sec',
                    calories: 50
                }
            ]
        },
        {
            day: 'Domenica',
            icon: '🏋️',
            focus: 'Total Body',
            exercises: [
                {
                    name: 'Cyclette',
                    duration: Math.round(exerciseCaloriesDaily / 8),
                    calories: Math.round(exerciseCaloriesDaily * 0.5),
                    details: 'Resistenza moderata'
                },
                {
                    name: 'Leg Extension (Quadricipiti)',
                    sets: '3 serie x 15 ripetizioni',
                    rest: '60 sec',
                    calories: 70
                },
                {
                    name: 'Leg Curl (Femorali)',
                    sets: '3 serie x 15 ripetizioni',
                    rest: '60 sec',
                    calories: 70
                },
                {
                    name: 'Ab Crunch (Addominali)',
                    sets: '3 serie x 20 ripetizioni',
                    rest: '30 sec',
                    calories: 50
                }
            ]
        }
    ];

    // Add Tue/Thu for 6-7 day schedules
    const martedi = {
        day: 'Martedì', icon: '🏃', focus: 'Cardio Leggero + Core',
        exercises: [
            { name: 'Camminata Veloce', duration: Math.round(exerciseCaloriesDaily / 8), calories: exerciseCaloriesDaily, details: 'Velocità 6-7 km/h' },
            { name: 'Ab Crunch', sets: '4 serie x 20 ripetizioni', rest: '30 sec', calories: 60 },
            { name: 'Plank', sets: '3 serie x 45 secondi', rest: '30 sec', calories: 40 }
        ]
    };
    const giovedi = {
        day: 'Giovedì', icon: '💪', focus: 'Parte Superiore Leggera',
        exercises: [
            { name: 'Cyclette', duration: Math.round(exerciseCaloriesDaily / 10), calories: Math.round(exerciseCaloriesDaily * 0.5), details: 'Ritmo moderato' },
            { name: 'Lat Pull Down', sets: '3 serie x 12 ripetizioni', rest: '60 sec', calories: 85 },
            { name: 'Shoulder Press', sets: '3 serie x 10 ripetizioni', rest: '60 sec', calories: 80 }
        ]
    };
    // Build 7-day plan in correct weekly order: Mon, Tue, Wed, Thu, Fri, Sat, Sun
    const fullPlan = [
        workoutPlan[0], // Lunedì
        martedi,         // Martedì
        workoutPlan[1], // Mercoledì
        giovedi,         // Giovedì
        workoutPlan[2], // Venerdì
        workoutPlan[3], // Sabato
        workoutPlan[4]  // Domenica
    ];

    const daysCount = level <= 1.375 ? 3 : level <= 1.55 ? 5 : level <= 1.725 ? 6 : 7;
    // 3-day plan: Mon, Wed, Fri (non-consecutive for recovery)
    const selectedDays = daysCount === 3
        ? [fullPlan[0], fullPlan[2], fullPlan[4]]
        : fullPlan.slice(0, daysCount);
    displayWorkoutPlan(selectedDays, exerciseCaloriesDaily);
}

function displayWorkoutPlan(plan, dailyTarget) {
    const container = document.getElementById('workout-plan-container');
    if (!container) return;

    let html = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0;">🎯 Obiettivo Settimanale Esercizio</h3>
            <p style="margin: 0; font-size: 24px; font-weight: bold;">${dailyTarget} kcal/giorno × 5 giorni = ${dailyTarget * 5} kcal/settimana</p>
            <small style="opacity: 0.9;">L'esercizio copre ~40% del deficit, la dieta il restante 60%</small>
        </div>

        <div style="display: grid; gap: 16px;">
    `;

    plan.forEach(day => {
        const totalCalories = day.exercises.reduce((sum, ex) => sum + ex.calories, 0);

        html += `
            <div style="background: var(--bg-secondary); border-radius: 12px; padding: 20px; box-shadow: var(--shadow-sm);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <div>
                        <h3 style="margin: 0; color: var(--text-primary);">${day.icon} ${day.day}</h3>
                        <p style="margin: 4px 0 0 0; color: var(--text-secondary); font-size: 14px;">${day.focus}</p>
                    </div>
                    <div style="background: var(--success); color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold;">
                        ${totalCalories} kcal
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 12px;">
        `;

        day.exercises.forEach(ex => {
            html += `
                <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 8px; border-left: 4px solid var(--accent-primary);">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex: 1;">
                            <strong style="color: var(--text-primary);">${ex.name}</strong>
                            ${ex.duration ? `<div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">⏱️ ${ex.duration} minuti${ex.distance ? ` • 📏 ${ex.distance} km` : ''}</div>` : ''}
                            ${ex.sets ? `<div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">💪 ${ex.sets}${ex.rest ? ` • Riposo: ${ex.rest}` : ''}</div>` : ''}
                            ${ex.details ? `<div style="font-size: 12px; color: var(--text-muted); margin-top: 4px; font-style: italic;">${ex.details}</div>` : ''}
                        </div>
                        <div style="background: var(--warning); color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; white-space: nowrap; margin-left: 12px;">
                            ${ex.calories} kcal
                        </div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    html += `
        </div>

        <div style="background: var(--bg-tertiary); border: 2px solid var(--warning); border-radius: 8px; padding: 16px; margin-top: 20px; color: var(--text-primary);">
            <strong style="color: var(--text-primary);">💡 Consigli:</strong>
            <ul style="margin: 8px 0 0 20px; padding: 0; color: var(--text-primary);">
                <li style="color: var(--text-primary);">Riposa Martedì e Giovedì</li>
                <li style="color: var(--text-primary);">Bevi 2-3 litri acqua al giorno</li>
                <li style="color: var(--text-primary);">Stretching 10 min prima e dopo allenamento</li>
                <li style="color: var(--text-primary);">Se dolori muscolari, riposa 1 giorno extra</li>
            </ul>
        </div>
    `;

    container.innerHTML = html;
}

// ===========================
// ADVANCED WORKOUT PROGRAMS
// ===========================

function generateAdvancedWorkoutPlan() {
    if (!goal || goal.type === 'weight-loss') {
        generateWorkoutPlan(); // Use existing for weight loss
        return;
    }

    const container = document.getElementById('workout-plan-container');
    if (!container) return;

    let program = null;

    if (goal.type === 'muscle-gain') {
        if (goal.trainingFocus === 'calisthenics') {
            program = getCalisthenicsProgram();
        } else if (goal.trainingFocus === 'weights') {
            program = getWeightsProgram();
        } else {
            program = getHybridProgram();
        }
    } else if (goal.type === 'performance') {
        if (goal.performanceGoal === 'skills') {
            program = getCalisthenicsSkillsProgram();
        } else if (goal.performanceGoal === 'strength') {
            program = getStrengthProgram();
        } else {
            program = getPerformanceProgram();
        }
    }

    if (program) {
        displayAdvancedWorkoutPlan(program);
    }
}

// Load program from dropdown selector (allows all users to access all 16 programs)
window.loadSelectedProgram = function() {
    const selector = document.getElementById('program-selector');
    const selected = selector.value;

    if (!selected) {
        document.getElementById('workout-plan-container').innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 40px;">Seleziona un programma dal menu sopra</p>';
        return;
    }

    let program = null;

    // Map selection to program function
    switch (selected) {
        // Original 6 programs
        case 'calisthenics':
            program = getCalisthenicsProgram();
            break;
        case 'weights':
            program = getWeightsProgram();
            break;
        case 'hybrid':
            program = getHybridProgram();
            break;
        case 'skills':
            program = getCalisthenicsSkillsProgram();
            break;
        case 'strength':
            program = getStrengthProgram();
            break;
        case 'performance':
            program = getPerformanceProgram();
            break;

        // New 10 programs
        case 'bands':
            program = getResistanceBandsProgram();
            break;
        case 'rings':
            program = getGymnasticRingsProgram();
            break;
        case 'hiit':
            program = getHIITFatBurnProgram();
            break;
        case 'crossfit':
            program = getCrossFitWODsProgram();
            break;
        case 'fullbody':
            program = getFullBody3DayProgram();
            break;
        case 'core':
            program = getCoreSpecialistProgram();
            break;
        case 'cardio':
            program = getCardioEnduranceProgram();
            break;
        case 'street':
            program = getStreetWorkoutProgram();
            break;
        case 'yoga':
            program = getYogaFlexibilityProgram();
            break;
        case 'olympic':
            program = getOlympicLiftingProgram();
            break;

        // Weight loss uses original adaptive plan
        case 'weight-loss':
            generateWorkoutPlan();
            return;

        default:
            console.error('Program not found:', selected);
            return;
    }

    // Display the selected program
    if (program) {
        displayAdvancedWorkoutPlan(program);
    }
};

function getCalisthenicsProgram() {
    return {
        name: '💪 PROGRAMMA CALISTHENICS - MASSA MUSCOLARE',
        description: 'Split 6 giorni: Push/Pull/Legs x 2 con progressioni calisthenics',
        weeks: 'Mesociclo 4 settimane',
        spotify: '🎵 Playlist: https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP (Workout Motivation)',
        days: [
            {
                day: 'LUNEDÌ - PUSH (Spinta)',
                icon: '💪',
                focus: 'Petto, Spalle, Tricipiti',
                warmup: '🔥 RISCALDAMENTO (10 min): Arm circles 3x20 • Scapular push-ups 2x15 • Light push-ups 2x10 • Shoulder dislocations 2x15',
                exercises: [
                    { name: 'Push-Ups (Piegamenti)', sets: '4×15-20', rest: '90s', notes: 'Se facili: usa zavorra o variant più difficile (archer, pseudo-planche)', video: 'https://youtu.be/IODxDxX7oi4' },
                    { name: 'Pike Push-Ups', sets: '4×12-15', rest: '90s', notes: 'Focus spalle. Piedi elevati per più difficoltà', video: 'https://youtu.be/spoSDRVVBfs' },
                    { name: 'Dips alle Parallele', sets: '4×10-15', rest: '2min', notes: 'Zavorra quando raggiungi 15 reps', video: 'https://youtu.be/2z8JmcrW-As' },
                    { name: 'Pseudo-Planche Push-Ups', sets: '3×8-12', rest: '90s', notes: 'Propedeutico planche', video: 'https://youtu.be/sW_CPQF-_wI' },
                    { name: 'Diamond Push-Ups', sets: '3×12-15', rest: '60s', notes: 'Focus tricipiti', video: 'https://youtu.be/J0DnG1_S92I' },
                    { name: 'Core: Plank to Push-Up', sets: '3×10', rest: '60s', video: 'https://youtu.be/L4oFJRDAU4Q' }
                ],
                cooldown: '🧘 DEFATICAMENTO (8 min): Chest stretch 3x30s • Shoulder stretch 3x30s • Tricep stretch 3x30s • Foam rolling petto'
            },
            {
                day: 'MARTEDÌ - PULL (Tirata)',
                icon: '🦾',
                focus: 'Dorsali, Bicipiti',
                warmup: '🔥 RISCALDAMENTO (10 min): Dead hang 3x30s • Scapular pulls 3x10 • Band pull-aparts 3x15 • Cat-cow stretch 2x15',
                exercises: [
                    { name: 'Pull-Ups (Trazioni)', sets: '5×8-12', rest: '2min', notes: 'Zavorra quando raggiungi 12 reps. Varianti: wide, close, neutral grip', video: 'https://youtu.be/eGo4IYlbE5g' },
                    { name: 'Australian Pull-Ups (Rows)', sets: '4×12-15', rest: '90s', notes: 'Piedi elevati per più difficoltà', video: 'https://youtu.be/hXTc1mDnZCw' },
                    { name: 'Chin-Ups (supinazione)', sets: '4×8-12', rest: '90s', notes: 'Focus bicipiti', video: 'https://youtu.be/brhYBMRIDLY' },
                    { name: 'Front Lever Progression', sets: '4×10s hold', rest: '2min', notes: 'Tuck → Advanced Tuck → Straddle → Full', video: 'https://youtu.be/Bwq1LcvVYMI' },
                    { name: 'Bicep Curls (sbarra)', sets: '3×12-15', rest: '60s', notes: 'Isometrico poi curls', video: 'https://youtu.be/soxrZlIl35U' },
                    { name: 'Core: Hanging Leg Raises', sets: '3×12-15', rest: '60s', video: 'https://youtu.be/hdng3Nm1x_E' }
                ],
                cooldown: '🧘 DEFATICAMENTO (8 min): Lat stretch 3x30s • Bicep stretch 3x30s • Upper back foam rolling 5min'
            },
            {
                day: 'MERCOLEDÌ - LEGS (Gambe)',
                icon: '🦵',
                focus: 'Quadricipiti, Femorali, Glutei, Polpacci',
                warmup: '🔥 RISCALDAMENTO (12 min): Leg swings 3x15 • Bodyweight squats 2x20 • Lunges 2x10 per gamba • Glute bridges 2x15',
                exercises: [
                    { name: 'Pistol Squats (assistiti)', sets: '4×8-12 per gamba', rest: '2min', notes: 'Usa supporto se necessario, zavorra quando facili', video: 'https://youtu.be/t7Oj8-8Htyw' },
                    { name: 'Bulgarian Split Squats', sets: '4×12-15 per gamba', rest: '90s', notes: 'Piede posteriore elevato', video: 'https://youtu.be/2C-uNgKwPLE' },
                    { name: 'Nordic Hamstring Curls', sets: '4×6-10', rest: '2min', notes: 'Eccentrico lento (5s). Assistiti se necessario', video: 'https://youtu.be/aFB_2p3kd58' },
                    { name: 'Jump Squats', sets: '3×15-20', rest: '90s', notes: 'Esplosività', video: 'https://youtu.be/A-cFYWvaHr0' },
                    { name: 'Calf Raises (monopodalici)', sets: '4×15-20 per gamba', rest: '60s', notes: 'Su gradino, full ROM', video: 'https://youtu.be/3aA0VmlRHl0' },
                    { name: 'Core: Dragon Flag Progression', sets: '3×8-12', rest: '90s', video: 'https://youtu.be/moyFIvRrurM' }
                ],
                cooldown: '🧘 DEFATICAMENTO (10 min): Quad stretch 3x30s • Hamstring stretch 3x30s • Hip flexor stretch 3x30s • Foam rolling gambe'
            },
            {
                day: 'GIOVEDÌ - PUSH (Spinta) - VOLUME',
                icon: '🔥',
                focus: 'Variante volume alto',
                warmup: '🔥 RISCALDAMENTO (10 min): Band pull-aparts 3x15 • Wall slides 2x15 • Push-up practice 2x10',
                exercises: [
                    { name: 'Archer Push-Ups', sets: '3×10-12 per lato', rest: '90s', notes: 'Propedeutico One-Arm Push-Up', video: 'https://youtu.be/D_cdJib5_Nk' },
                    { name: 'Handstand Push-Ups (HSPU)', sets: '4×8-12', rest: '2min', notes: 'Assistiti o al muro', video: 'https://youtu.be/tQhrk6WMcKw' },
                    { name: 'Dips (Chest Lean)', sets: '4×12-15', rest: '90s', notes: 'Inclinazione avanti per petto', video: 'https://youtu.be/yN6Q1UI_xkE' },
                    { name: 'Decline Push-Ups', sets: '3×15-20', rest: '60s', notes: 'Piedi elevati', video: 'https://youtu.be/SKPab2YC8BE' },
                    { name: 'Tricep Extensions (sbarra)', sets: '3×12-15', rest: '60s', video: 'https://youtu.be/BZfiI0KlNj4' },
                    { name: 'Core: Ab Wheel', sets: '3×10-15', rest: '90s', video: 'https://youtu.be/ZYprBzFl34c' }
                ],
                cooldown: '🧘 DEFATICAMENTO (8 min): Shoulder stretch 3x30s • Chest doorway stretch 3x30s'
            },
            {
                day: 'VENERDÌ - PULL (Tirata) - VOLUME',
                icon: '💥',
                focus: 'Variante volume alto + skills',
                warmup: '🔥 RISCALDAMENTO (12 min): Bar hang 3x30s • Scapular shrugs 3x12 • Negative pull-ups 2x5',
                exercises: [
                    { name: 'Muscle-Ups Progressione', sets: '5×5-8', rest: '3min', notes: 'False grip pull-ups → transition drill → full MU', video: 'https://youtu.be/SD3RRJtovMQ' },
                    { name: 'Weighted Pull-Ups', sets: '4×6-10', rest: '2min', notes: 'Zavorra 5-10kg', video: 'https://youtu.be/tB3X4TjTIes' },
                    { name: 'Typewriter Pull-Ups', sets: '3×8-10', rest: '90s', notes: 'Slide laterale in alto', video: 'https://youtu.be/uX7y3X_c39E' },
                    { name: 'Back Lever Progression', sets: '4×10s hold', rest: '2min', notes: 'Tuck → Advanced → Straddle → Full', video: 'https://youtu.be/N_JDcQuavlE' },
                    { name: 'Face Pulls (bande)', sets: '3×15-20', rest: '60s', notes: 'Deltoidi posteriori', video: 'https://youtu.be/rep-qVOkqgk' },
                    { name: 'Core: Windshield Wipers', sets: '3×10-12', rest: '90s', video: 'https://youtu.be/GP0y6f7innk' }
                ],
                cooldown: '🧘 DEFATICAMENTO (8 min): Lat stretch 3x30s • Thoracic spine mobility 5min'
            },
            {
                day: 'SABATO - LEGS + CORE INTENSO',
                icon: '⚡',
                focus: 'Gambe + Core',
                warmup: '🔥 RISCALDAMENTO (12 min): Jump rope 5min • Leg swings 3x15 • Hip circles 2x10',
                exercises: [
                    { name: 'Shrimp Squats', sets: '4×8-12 per gamba', rest: '2min', notes: 'Variante pistol squat', video: 'https://youtu.be/BWJEwKCUjI4' },
                    { name: 'Glute Ham Raises', sets: '4×8-12', rest: '2min', notes: 'Su panca o con partner', video: 'https://youtu.be/CZitbP5-Z7E' },
                    { name: 'Box Jumps', sets: '4×12-15', rest: '90s', notes: 'Esplosività', video: 'https://youtu.be/_JEHITbTH2k' },
                    { name: 'Walking Lunges', sets: '3×20 passi', rest: '90s', notes: 'Zavorra se possibile', video: 'https://youtu.be/L8fvypPrzzs' },
                    { name: 'Single Leg Calf Raises', sets: '4×20-25', rest: '60s', video: 'https://youtu.be/gwLzBJYoWlI' },
                    { name: 'Core: L-Sit Hold', sets: '5×Max Time', rest: '90s', notes: 'Su parallele o sbarra', video: 'https://youtu.be/IUZJLjjjP-g' },
                    { name: 'Core: Hollow Body Hold', sets: '4×30-60s', rest: '90s', video: 'https://youtu.be/LlDNef_Ztsc' }
                ],
                cooldown: '🧘 DEFATICAMENTO (10 min): Pigeon pose 3x1min • IT band foam roll 5min'
            },
            {
                day: 'DOMENICA - CARDIO LISS + RIPOSO',
                icon: '🏃',
                focus: 'Cardio bassa intensità + Recupero',
                warmup: '🔥 PREP (5 min): Light walking 5min',
                exercises: [
                    { name: 'CARDIO LISS (scelta libera)', sets: '30-45 min', notes: '🏃 Treadmill 5-6 km/h | 🚴 Cyclette resistenza leggera | 🚶 Camminata esterna', video: 'https://youtu.be/brFHyOtTwH4' },
                    { name: 'Frequenza cardiaca target', notes: '60-70% FC max (zona brucia grassi, non interferisce recupero)' },
                    { name: 'Yoga/Stretching', sets: '20-30 min', notes: 'Focus mobilità spalle, anche, polsi', video: 'https://youtu.be/g_tea8ZNk5A' },
                    { name: 'Foam Rolling', sets: '15-20 min', notes: 'Massaggio miofasciale', video: 'https://youtu.be/Y3IablO-II0' }
                ],
                cooldown: '🧘 Meditation 10min + Savasana'
            }
        ],
        notes: [
            '📈 **Progressive Overload**: Ogni settimana aumenta 1-2 ripetizioni o aggiungi zavorra',
            '⏱️ **Riposo tra serie**: Rispetta i tempi. Per forza: 2-3min. Per ipertrofia: 60-90s',
            '🍽️ **Nutrizione**: Surplus calorico 200-500 kcal. Proteine 1.8-2.2g/kg peso corporeo',
            '😴 **Recupero**: 7-8 ore sonno. Idratazione 2.5-3L acqua/giorno',
            '📊 **Tracking**: Annota pesi/ripetizioni per monitorare progressi'
        ]
    };
}

function getWeightsProgram() {
    return {
        name: '🏋️ PROGRAMMA PALESTRA - IPERTROFIA (MASSA)',
        description: 'Split Push/Pull/Legs - 6 giorni/settimana',
        weeks: 'Mesociclo 8 settimane',
        days: [
            {
                day: 'LUNEDÌ - PUSH A',
                icon: '💪',
                focus: 'Petto, Spalle, Tricipiti',
                exercises: [
                    { name: 'Panca Piana Bilanciere', sets: '4×8-12', rest: '2-3min', notes: '70-80% 1RM. Tecnica perfetta' },
                    { name: 'Panca Inclinata Manubri', sets: '4×10-12', rest: '90s', notes: '30-40° inclinazione' },
                    { name: 'Shoulder Press Bilanciere', sets: '4×8-10', rest: '2min', notes: 'In piedi o seduto' },
                    { name: 'Alzate Laterali Manubri', sets: '3×12-15', rest: '60s', notes: 'Focus deltoide laterale' },
                    { name: 'Dips Chest (Panca)', sets: '3×10-12', rest: '90s', notes: 'Zavorra quando possibile' },
                    { name: 'Tricep Pushdown Cavo', sets: '3×12-15', rest: '60s' },
                    { name: 'Overhead Tricep Extension', sets: '3×12-15', rest: '60s' }
                ]
            },
            {
                day: 'MARTEDÌ - PULL A',
                icon: '🦾',
                focus: 'Dorsali, Bicipiti, Trapezio',
                exercises: [
                    { name: 'Stacco da Terra (Deadlift)', sets: '4×6-8', rest: '3min', notes: 'Re degli esercizi. 75-85% 1RM' },
                    { name: 'Trazioni Zavorrate', sets: '4×8-10', rest: '2min', notes: 'Presa prona larga' },
                    { name: 'Rematore Bilanciere', sets: '4×8-12', rest: '90s', notes: 'Pendlay o classico' },
                    { name: 'Lat Machine Presa Stretta', sets: '3×12-15', rest: '60s' },
                    { name: 'Face Pulls Cavo', sets: '3×15-20', rest: '60s', notes: 'Deltoidi posteriori' },
                    { name: 'Curl Bilanciere EZ', sets: '3×10-12', rest: '90s' },
                    { name: 'Hammer Curls Manubri', sets: '3×12-15', rest: '60s' }
                ]
            },
            {
                day: 'MERCOLEDÌ - LEGS A',
                icon: '🦵',
                focus: 'Gambe Complete',
                exercises: [
                    { name: 'Squat Bilanciere', sets: '5×8-10', rest: '3min', notes: 'Profondità almeno parallelo. 75-80% 1RM' },
                    { name: 'Leg Press', sets: '4×12-15', rest: '2min', notes: 'Piedi larghezza spalle' },
                    { name: 'Romanian Deadlift', sets: '4×10-12', rest: '2min', notes: 'Focus femorali' },
                    { name: 'Leg Extension', sets: '3×12-15', rest: '90s', notes: 'Quadricipiti isolamento' },
                    { name: 'Leg Curl', sets: '3×12-15', rest: '90s', notes: 'Femorali isolamento' },
                    { name: 'Calf Raises Macchina', sets: '4×15-20', rest: '60s' },
                    { name: 'Abs: Cable Crunch', sets: '3×15-20', rest: '60s' }
                ]
            },
            {
                day: 'GIOVEDÌ - PUSH B (Variante)',
                icon: '🔥',
                focus: 'Volume e varietà',
                exercises: [
                    { name: 'Panca Inclinata Bilanciere', sets: '4×8-12', rest: '2-3min' },
                    { name: 'Panca Piana Manubri', sets: '4×10-12', rest: '90s' },
                    { name: 'Shoulder Press Manubri', sets: '4×10-12', rest: '90s' },
                    { name: 'Alzate Frontali Disco', sets: '3×12-15', rest: '60s' },
                    { name: 'Pec Deck (Chest Fly)', sets: '3×12-15', rest: '60s' },
                    { name: 'Dips Tricipiti', sets: '3×12-15', rest: '90s' },
                    { name: 'French Press', sets: '3×12-15', rest: '60s' }
                ]
            },
            {
                day: 'VENERDÌ - PULL B (Variante)',
                icon: '💥',
                focus: 'Spessore dorsali',
                exercises: [
                    { name: 'Trazioni Presa Neutra', sets: '4×8-12', rest: '2min' },
                    { name: 'Rematore Manubrio', sets: '4×10-12 per lato', rest: '90s' },
                    { name: 'T-Bar Row', sets: '4×10-12', rest: '90s' },
                    { name: 'Pulley Basso', sets: '3×12-15', rest: '60s' },
                    { name: 'Shrugs Bilanciere', sets: '4×12-15', rest: '90s', notes: 'Trapezio' },
                    { name: 'Curl Manubri Alternati', sets: '3×10-12', rest: '60s' },
                    { name: 'Curl Cavo', sets: '3×15-20', rest: '45s' }
                ]
            },
            {
                day: 'SABATO - LEGS B (Variante)',
                icon: '⚡',
                focus: 'Potenza + Volume',
                exercises: [
                    { name: 'Front Squat', sets: '4×8-10', rest: '2-3min' },
                    { name: 'Bulgarian Split Squat', sets: '4×10-12 per gamba', rest: '90s' },
                    { name: 'Leg Press Monopodalico', sets: '3×12-15 per gamba', rest: '90s' },
                    { name: 'Good Mornings', sets: '3×12-15', rest: '90s' },
                    { name: 'Affondi Camminati Zavorra', sets: '3×20 passi', rest: '90s' },
                    { name: 'Seated Calf Raises', sets: '4×20-25', rest: '60s' },
                    { name: 'Abs: Hanging Leg Raises', sets: '3×12-15', rest: '90s' }
                ]
            },
            {
                day: 'DOMENICA - CARDIO LISS + RECUPERO',
                icon: '🏃',
                focus: 'Cardio leggero + Riposo',
                exercises: [
                    { name: 'CARDIO LISS 30-40 min', notes: '🏃 Treadmill camminata veloce 5-6 km/h | 🚴 Cyclette resistenza bassa | 🏊 Nuoto lento' },
                    { name: 'Zona target', notes: '60-70% FC max - Non interferisce con recupero muscolare' },
                    { name: 'Stretching/Foam Rolling', sets: '30 min' },
                    { name: 'Sauna/Bagno caldo', sets: 'Opzionale' },
                    { name: 'Meal Prep settimana', notes: 'Prepara pasti' }
                ]
            }
        ],
        notes: [
            '📈 **Progressive Overload**: +2.5kg ogni 2 settimane quando raggiungi top range reps',
            '⚖️ **Volume**: 10-20 serie/gruppo muscolare/settimana per ipertrofia',
            '🍗 **Proteine**: 2.0-2.2g/kg. Carboidrati pre/post workout',
            '💤 **Sonno**: 8 ore minimo. Crescita muscolare nel riposo',
            '📊 **Logbook**: Annota TUTTO (peso, reps, sensazioni)'
        ]
    };
}

function getHybridProgram() {
    return {
        name: '⚡ PROGRAMMA IBRIDO - CALISTHENICS + PALESTRA',
        description: 'Combina il meglio di entrambi i mondi',
        weeks: 'Mesociclo 6 settimane',
        days: [
            {
                day: 'LUNEDÌ - SKILLS + PETTO',
                icon: '🎯',
                focus: 'Calisthenics Skills + Massa Petto',
                exercises: [
                    { name: 'Handstand Practice', sets: '10 min', notes: 'Skill work prima dell\'allenamento' },
                    { name: 'Panca Piana Bilanciere', sets: '4×8-10', rest: '2-3min' },
                    { name: 'Dips Zavorrati', sets: '4×8-12', rest: '2min' },
                    { name: 'Pseudo-Planche Push-Ups', sets: '3×10-12', rest: '90s' },
                    { name: 'Cable Crossover', sets: '3×12-15', rest: '60s' }
                ]
            },
            {
                day: 'MARTEDÌ - MUSCLE-UP + DORSALI',
                icon: '💥',
                focus: 'Progressione Muscle-Up + Massa Dorsali',
                exercises: [
                    { name: 'Muscle-Up Practice', sets: '8-10 min', notes: 'Negatives o assistiti' },
                    { name: 'Weighted Pull-Ups', sets: '4×6-8', rest: '2-3min' },
                    { name: 'Rematore Bilanciere', sets: '4×8-10', rest: '2min' },
                    { name: 'Front Lever Tucks', sets: '4×5×5s hold', rest: '90s' },
                    { name: 'Lat Machine', sets: '3×12-15', rest: '60s' }
                ]
            },
            {
                day: 'MERCOLEDÌ - LEGS FORZA',
                icon: '🦵',
                focus: 'Gambe Heavy',
                exercises: [
                    { name: 'Squat Bilanciere', sets: '5×5', rest: '3min', notes: '80-85% 1RM' },
                    { name: 'Romanian Deadlift', sets: '4×8-10', rest: '2min' },
                    { name: 'Pistol Squat Zavorrato', sets: '3×8 per gamba', rest: '2min' },
                    { name: 'Nordic Hamstrings', sets: '3×8-10', rest: '2min' },
                    { name: 'Calf Raises', sets: '4×15-20', rest: '60s' }
                ]
            },
            {
                day: 'GIOVEDÌ - PLANCHE + SPALLE',
                icon: '🔥',
                focus: 'Progressione Planche + Spalle',
                exercises: [
                    { name: 'Planche Lean Practice', sets: '8 min', notes: 'Max lean hold' },
                    { name: 'Shoulder Press', sets: '4×8-10', rest: '2min' },
                    { name: 'Planche Push-Ups Progression', sets: '4×6-10', rest: '2min' },
                    { name: 'Alzate Laterali', sets: '3×12-15', rest: '60s' },
                    { name: 'Face Pulls', sets: '3×15-20', rest: '60s' }
                ]
            },
            {
                day: 'VENERDÌ - FRONT LEVER + BICIPITI',
                icon: '💪',
                focus: 'Skills Pull + Ipertrofia Braccia',
                exercises: [
                    { name: 'Front Lever Practice', sets: '10 min', notes: 'Varie progressioni' },
                    { name: 'Weighted Chin-Ups', sets: '4×8-10', rest: '2min' },
                    { name: 'Curl Bilanciere', sets: '4×10-12', rest: '90s' },
                    { name: 'Typewriter Pull-Ups', sets: '3×8-10', rest: '90s' },
                    { name: 'Hammer Curls', sets: '3×12-15', rest: '60s' }
                ]
            },
            {
                day: 'SABATO - FULL BODY CALISTHENICS',
                icon: '⚡',
                focus: 'Volume Calisthenics',
                exercises: [
                    { name: 'Circuit 1: Pull-Ups + Dips + Push-Ups', sets: '5 rounds', rest: '2min', notes: '10+10+15 reps' },
                    { name: 'Circuit 2: Pistol Squat + L-Sit + Leg Raises', sets: '4 rounds', rest: '90s', notes: '8+20s+12' },
                    { name: 'Core: Dragon Flag', sets: '3×8-12', rest: '90s' }
                ]
            },
            {
                day: 'DOMENICA - RIPOSO ATTIVO',
                icon: '🧘',
                focus: 'Mobilità + Skills Light',
                exercises: [
                    { name: 'Handstand 10-15 min', notes: 'Volume basso' },
                    { name: 'Stretching completo', sets: '30 min' },
                    { name: 'Foam Rolling', sets: '15 min' }
                ]
            }
        ],
        notes: [
            '⚡ **Best of Both**: Combina sviluppo skills con ipertrofia palestra',
            '🎯 **Skills First**: Sempre prima dell\'allenamento pesante',
            '📈 **Progressive Overload**: Su palestra aumenta pesi, su calisthenics aumenta difficoltà/zavorra',
            '🍖 **Nutrizione**: Surplus 300-400 kcal. Proteine 2g/kg',
            '💤 **Recupero Fondamentale**: Skills + pesi = volume alto'
        ]
    };
}

function getCalisthenicsSkillsProgram() {
    return {
        name: '🎯 PROGRAMMA SKILLS CALISTHENICS AVANZATE',
        description: 'Focus: Muscle-Up, Front Lever, Planche, Handstand Push-Up',
        weeks: 'Mesociclo 12 settimane',
        days: [
            {
                day: 'LUNEDÌ - PLANCHE SPECIALIZATION',
                icon: '🔥',
                focus: 'Progressione Planche',
                exercises: [
                    { name: 'Planche Lean (max time)', sets: '5×Max', rest: '3min', notes: 'Obiettivo: 60s totali' },
                    { name: 'Tuck Planche Hold', sets: '5×10-20s', rest: '2min' },
                    { name: 'Pseudo-Planche Push-Ups', sets: '4×10-15', rest: '90s' },
                    { name: 'Planche Push-Ups (assisted)', sets: '4×5-8', rest: '2min' },
                    { name: 'Hollow Body Hold', sets: '4×30-60s', rest: '90s' },
                    { name: 'Wrist Strengthening', sets: '3×15', rest: '60s' }
                ]
            },
            {
                day: 'MARTEDÌ - FRONT LEVER SPECIALIZATION',
                icon: '💥',
                focus: 'Progressione Front Lever',
                exercises: [
                    { name: 'Front Lever Hold (highest progression)', sets: '6×Max', rest: '3min', notes: 'Tuck → Adv Tuck → Straddle' },
                    { name: 'Front Lever Raises', sets: '4×5-8', rest: '2min' },
                    { name: 'Ice Cream Makers', sets: '3×5-8', rest: '2min' },
                    { name: 'Weighted Pull-Ups', sets: '4×6-8', rest: '2min' },
                    { name: 'Skin the Cat', sets: '3×8-10', rest: '90s' },
                    { name: 'Core: Hanging Leg Raises', sets: '4×12-15', rest: '90s' }
                ]
            },
            {
                day: 'MERCOLEDÌ - MUSCLE-UP SPECIALIZATION',
                icon: '💪',
                focus: 'Muscle-Up Volume',
                exercises: [
                    { name: 'Strict Muscle-Ups', sets: '8×3-5', rest: '3min', notes: 'Se non riesci: negatives' },
                    { name: 'Explosive Pull-Ups (chest to bar)', sets: '5×5-8', rest: '2min' },
                    { name: 'Muscle-Up Transitions', sets: '5×5-8', rest: '90s', notes: 'Con banda elastica' },
                    { name: 'Straight Bar Dips', sets: '4×8-12', rest: '90s' },
                    { name: 'False Grip Pull-Ups', sets: '4×8-10', rest: '2min' },
                    { name: 'Core: Toes to Bar', sets: '4×10-12', rest: '90s' }
                ]
            },
            {
                day: 'GIOVEDÌ - HANDSTAND PUSH-UP',
                icon: '🎪',
                focus: 'Verticale e HSPU',
                exercises: [
                    { name: 'Freestanding Handstand Hold', sets: '10 min practice', notes: 'Accumula tempo' },
                    { name: 'Handstand Push-Ups (wall)', sets: '5×5-10', rest: '2min' },
                    { name: 'Pike Push-Ups (elevated)', sets: '4×12-15', rest: '90s' },
                    { name: 'Shoulder Taps (in handstand)', sets: '4×10-20', rest: '90s' },
                    { name: 'Handstand Walk', sets: '5×Max distance', rest: '2min' },
                    { name: 'Wrist Mobility', sets: '10 min' }
                ]
            },
            {
                day: 'VENERDÌ - BACK LEVER + ONE ARM',
                icon: '🦾',
                focus: 'Skills Avanzate',
                exercises: [
                    { name: 'Back Lever Progression', sets: '5×10-15s', rest: '2min' },
                    { name: 'One Arm Pull-Up Progression', sets: '5×3-5 per lato', rest: '2min', notes: 'Assistiti con banda' },
                    { name: 'Archer Pull-Ups', sets: '4×8-10', rest: '90s' },
                    { name: 'One Arm Push-Up Progression', sets: '4×5-8 per lato', rest: '2min' },
                    { name: 'Archer Push-Ups', sets: '4×10-12', rest: '90s' }
                ]
            },
            {
                day: 'SABATO - STAMINA & ENDURANCE',
                icon: '🔋',
                focus: 'Volume e Resistenza',
                exercises: [
                    { name: 'EMOM 20 min: 5 Pull-Ups + 10 Push-Ups + 15 Squats', notes: 'Every Minute On Minute' },
                    { name: 'Max Reps Pull-Ups', sets: '3×Max', rest: '3min' },
                    { name: 'Max Reps Dips', sets: '3×Max', rest: '3min' },
                    { name: 'Max Reps Push-Ups', sets: '3×Max', rest: '2min' },
                    { name: 'Core: L-Sit Hold', sets: '5×Max', rest: '90s' }
                ]
            },
            {
                day: 'DOMENICA - MOBILITÀ & RIPOSO',
                icon: '🧘',
                focus: 'Recupero Attivo',
                exercises: [
                    { name: 'Yoga Flow', sets: '45 min', notes: 'Focus spalle, polsi, anche' },
                    { name: 'Skill Light Practice', sets: '20 min', notes: 'Volume 30% normale' },
                    { name: 'Stretching Passivo', sets: '20 min' }
                ]
            }
        ],
        notes: [
            '🎯 **Skill First**: Le skills richiedono freschezza mentale e fisica',
            '⏱️ **Quality > Quantity**: Forma perfetta sempre. Meglio meno reps ma pulite',
            '📹 **Video Yourself**: Registra per analizzare tecnica',
            '📈 **Progression Path**: Ogni skill ha propedeutici. Non saltare step',
            '💪 **Tendon Conditioning**: Skills stressano tendini. Progressione graduale essenziale'
        ]
    };
}

function getStrengthProgram() {
    return {
        name: '💪 PROGRAMMA FORZA MASSIMALE',
        description: 'Powerbuilding - Forza + Ipertrofia',
        weeks: 'Mesociclo 8 settimane',
        days: [
            {
                day: 'LUNEDÌ - SQUAT HEAVY',
                icon: '🦵',
                focus: 'Squat Focus',
                exercises: [
                    { name: 'Back Squat', sets: '5×3-5', rest: '3-5min', notes: '85-90% 1RM' },
                    { name: 'Front Squat', sets: '4×6-8', rest: '3min', notes: '70-80% 1RM' },
                    { name: 'Romanian Deadlift', sets: '3×8-10', rest: '2min' },
                    { name: 'Bulgarian Split Squat', sets: '3×8 per gamba', rest: '90s' },
                    { name: 'Core: Ab Wheel', sets: '3×10-15', rest: '90s' }
                ]
            },
            {
                day: 'MERCOLEDÌ - BENCH HEAVY',
                icon: '💪',
                focus: 'Panca Focus',
                exercises: [
                    { name: 'Bench Press', sets: '5×3-5', rest: '3-5min', notes: '85-90% 1RM' },
                    { name: 'Overhead Press', sets: '4×6-8', rest: '3min' },
                    { name: 'Panca Inclinata', sets: '3×8-10', rest: '2min' },
                    { name: 'Dips Zavorrati', sets: '3×8-10', rest: '2min' },
                    { name: 'Tricep Work', sets: '3×12-15', rest: '60s' }
                ]
            },
            {
                day: 'VENERDÌ - DEADLIFT HEAVY',
                icon: '🦾',
                focus: 'Stacco Focus',
                exercises: [
                    { name: 'Deadlift', sets: '5×3-5', rest: '3-5min', notes: '85-90% 1RM' },
                    { name: 'Weighted Pull-Ups', sets: '4×6-8', rest: '3min' },
                    { name: 'Rematore Bilanciere', sets: '4×8-10', rest: '2min' },
                    { name: 'Face Pulls', sets: '3×15-20', rest: '60s' },
                    { name: 'Bicep Work', sets: '3×12-15', rest: '60s' }
                ]
            }
        ],
        notes: [
            '🏋️ **Focus Big 3**: Squat, Bench, Deadlift',
            '⏱️ **Rest Lungo**: 3-5 min su heavy sets',
            '📈 **Linear Progression**: +2.5kg ogni settimana se completi tutte le reps',
            '🍖 **Eat Big**: Forza richiede surplus calorico',
            '😴 **Recovery**: Sonno 8+ ore fondamentale'
        ]
    };
}

function getPerformanceProgram() {
    return {
        name: '🏆 PROGRAMMA PERFORMANCE & ATLETISMO',
        description: 'Esplosività, Potenza, Velocità',
        weeks: 'Mesociclo 6 settimane',
        days: [
            {
                day: 'LUNEDÌ - POWER LOWER',
                icon: '⚡',
                focus: 'Esplosività Gambe',
                exercises: [
                    { name: 'Box Jumps', sets: '5×5', rest: '2min', notes: 'Max altezza possibile' },
                    { name: 'Jump Squats', sets: '4×8', rest: '90s', notes: '30% 1RM o bodyweight' },
                    { name: 'Broad Jumps', sets: '4×5', rest: '2min' },
                    { name: 'Sprint 30m', sets: '6×1', rest: '3min', notes: 'Max velocità' },
                    { name: 'Single Leg Hops', sets: '3×10 per gamba', rest: '90s' }
                ]
            },
            {
                day: 'MERCOLEDÌ - POWER UPPER',
                icon: '💥',
                focus: 'Esplosività Upper',
                exercises: [
                    { name: 'Plyometric Push-Ups', sets: '5×8', rest: '2min', notes: 'Clap push-ups' },
                    { name: 'Medicine Ball Slams', sets: '4×10', rest: '90s' },
                    { name: 'Explosive Pull-Ups', sets: '4×6-8', rest: '2min' },
                    { name: 'Battle Ropes', sets: '4×30s', rest: '90s', notes: 'Max intensità' },
                    { name: 'Kettlebell Swings', sets: '4×15', rest: '90s' }
                ]
            },
            {
                day: 'VENERDÌ - SPEED & AGILITY',
                icon: '🏃',
                focus: 'Velocità e Agilità',
                exercises: [
                    { name: 'Sprint 10m', sets: '8×1', rest: '2min', notes: 'Partenza da fermo' },
                    { name: 'Sprint 50m', sets: '5×1', rest: '3min' },
                    { name: 'Shuttle Run', sets: '6×1', rest: '2min', notes: '5-10-5 meters' },
                    { name: 'Lateral Bounds', sets: '4×10', rest: '90s' },
                    { name: 'Ladder Drills', sets: '5×30s', rest: '60s' }
                ]
            }
        ],
        notes: [
            '⚡ **Explosiveness**: Focus su velocità di esecuzione',
            '⏱️ **Full Recovery**: Riposo completo tra serie per max potenza',
            '🔥 **Low Volume, High Intensity**: Qualità > quantità',
            '📊 **Track Times**: Cronometra sprint per misurare progressi',
            '🏃 **Dynamic Warm-Up**: 15-20 min obbligatorio'
        ]
    };
}

// ===========================
// NUOVI PROGRAMMI V10 (15+)
// ===========================

function getResistanceBandsProgram() {
    return {
        name: '🎗️ RESISTANCE BANDS - TOTAL BODY',
        description: 'Allenamento completo con elastici - Ideale per Diana',
        weeks: 'Programma 4 settimane',
        spotify: '🎵 Playlist: https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP (Pop Workout)',
        days: [
            {
                day: 'LUNEDÌ - UPPER BODY',
                icon: '💪',
                focus: 'Petto, Spalle, Braccia',
                warmup: '🔥 RISCALDAMENTO (10 min): Arm circles 2x20 • Shoulder dislocations con banda 2x15 • Push-ups leggeri 2x10',
                exercises: [
                    { name: 'Chest Press (Elastico)', sets: '4×15-20', rest: '60s', notes: 'Fissa elastico dietro, spingi avanti. Video: https://youtu.be/ZhZ9XqPBq0s', video: 'https://youtu.be/ZhZ9XqPBq0s' },
                    { name: 'Shoulder Press', sets: '3×15', rest: '60s', notes: 'Elastico sotto i piedi, pressa sopra testa' },
                    { name: 'Lateral Raises', sets: '3×20', rest: '45s', notes: 'Alzate laterali con banda' },
                    { name: 'Bicep Curls', sets: '3×15', rest: '60s', notes: 'Elastico sotto piedi, curl lenti' },
                    { name: 'Tricep Extensions', sets: '3×15', rest: '60s', notes: 'Overhead, banda dietro testa' },
                    { name: 'Face Pulls', sets: '3×20', rest: '45s', notes: 'Banda fissata, tira verso viso' }
                ],
                cooldown: '🧘 DEFATICAMENTO (8 min): Shoulder stretch 2x30s • Tricep stretch 2x30s • Chest doorway stretch 2x30s'
            },
            {
                day: 'MERCOLEDÌ - LOWER BODY',
                icon: '🦵',
                focus: 'Gambe e Glutei',
                warmup: '🔥 RISCALDAMENTO (10 min): Leg swings 2x15 • Bodyweight squats 2x15 • Glute bridges 2x20',
                exercises: [
                    { name: 'Squats con Banda', sets: '4×20', rest: '90s', notes: 'Banda intorno cosce per resistenza. Video: https://youtu.be/8JCaLq7G9xA', video: 'https://youtu.be/8JCaLq7G9xA' },
                    { name: 'Lateral Band Walks', sets: '3×20 passi per lato', rest: '60s', notes: 'Banda mini intorno caviglie' },
                    { name: 'Glute Kickbacks', sets: '3×20 per gamba', rest: '60s', notes: 'A 4 zampe, banda su piede' },
                    { name: 'Romanian Deadlift', sets: '4×15', rest: '90s', notes: 'Banda sotto piedi, RDL classico' },
                    { name: 'Fire Hydrants', sets: '3×20 per lato', rest: '45s', notes: 'Banda intorno cosce' },
                    { name: 'Calf Raises', sets: '3×25', rest: '60s', notes: 'Banda sotto avampiede' }
                ],
                cooldown: '🧘 DEFATICAMENTO (8 min): Quad stretch 2x30s • Hamstring stretch 2x30s • Pigeon pose 2x60s'
            },
            {
                day: 'VENERDÌ - FULL BODY CIRCUIT',
                icon: '🔥',
                focus: 'Circuito metabolico',
                warmup: '🔥 RISCALDAMENTO (10 min): Jumping jacks 2x30s • Mountain climbers 2x20 • Inchworms 2x10',
                exercises: [
                    { name: 'Circuit (3 round): Squat Press', sets: '15 reps', rest: '30s tra esercizi', notes: 'Squat + overhead press combinato' },
                    { name: 'Circuit: Rows', sets: '20 reps', rest: '30s', notes: 'Banda fissata, rema verso petto' },
                    { name: 'Circuit: Reverse Lunges', sets: '12 per gamba', rest: '30s', notes: 'Banda intorno cosce' },
                    { name: 'Circuit: Chest Fly', sets: '15 reps', rest: '30s', notes: 'Aperture petto con banda' },
                    { name: 'Circuit: Bicycle Crunch', sets: '30 totali', rest: '30s', notes: 'Banda intorno piedi (opzionale)' },
                    { name: '--- Riposo 2 min tra round ---', sets: '', rest: '2min' }
                ],
                cooldown: '🧘 DEFATICAMENTO (10 min): Child pose 2min • Cat-cow 2x15 • Full body stretch 5min'
            }
        ],
        notes: [
            '🎗️ **Resistenza Elastici**: Usa 2-3 bande diverse (leggera, media, pesante)',
            '📹 **Video Tutorial**: Tutti gli esercizi hanno link YouTube embedded',
            '🎵 **Musica**: Playlist Spotify Pop Workout per motivazione',
            '⏱️ **Tempo**: Ogni workout 45-55 minuti totali',
            '📈 **Progressione**: Settimana 1-2 (banda leggera), 3-4 (media), poi pesante'
        ]
    };
}

function getGymnasticRingsProgram() {
    return {
        name: '⭕ GYMNASTIC RINGS - SKILLS & STRENGTH',
        description: 'Progressioni anelli ginnastici - Per Alex & Diana',
        weeks: 'Mesociclo 8 settimane',
        spotify: '🎵 Playlist: https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP (Workout)',
        days: [
            {
                day: 'LUNEDÌ - RING PUSH ELEMENTS',
                icon: '💪',
                focus: 'Spinta e stabilizzazione',
                warmup: '🔥 RISCALDAMENTO (15 min): Wrist mobility 3x10 • Support hold rings 3x20s • Ring rows 2x10 • Scapular push-ups 2x15',
                exercises: [
                    { name: 'Ring Support Hold', sets: '5×30-60s', rest: '2min', notes: 'Braccia tese, RTO (Ring Turn Out). Video: https://youtu.be/gTfSqytoUh8', video: 'https://youtu.be/gTfSqytoUh8' },
                    { name: 'Ring Push-Ups', sets: '4×10-15', rest: '90s', notes: 'Progressione: Piedi a terra → Feet elevated → RTO' },
                    { name: 'Ring Dips Progressione', sets: '5×5-10', rest: '2min', notes: 'Negativa lenta (5s) se non fai positive' },
                    { name: 'L-Sit on Rings', sets: '5×15-30s', rest: '90s', notes: 'Tuck → Straddle → Full L-Sit' },
                    { name: 'Ring Archer Push-Ups', sets: '3×8 per lato', rest: '90s', notes: 'Propedeutico one-arm' },
                    { name: 'Ring Plank Hold', sets: '3×45-60s', rest: '60s', notes: 'Instabilità massima' }
                ],
                cooldown: '🧘 DEFATICAMENTO (10 min): Shoulder stretch 2x60s • Pec stretch 2x60s • Wrist stretches 3min'
            },
            {
                day: 'MERCOLEDÌ - RING PULL ELEMENTS',
                icon: '🦾',
                focus: 'Tirata e Front Lever',
                warmup: '🔥 RISCALDAMENTO (15 min): Dead hang 2x30s • Scapular pulls 3x10 • Hollow body hold 3x30s • Ring rows 2x12',
                exercises: [
                    { name: 'Ring Pull-Ups', sets: '5×8-12', rest: '2min', notes: 'False grip per muscle-up prep. Video: https://youtu.be/4W7vmT9iuaU', video: 'https://youtu.be/4W7vmT9iuaU' },
                    { name: 'Ring Rows (Horizontal)', sets: '4×12-15', rest: '90s', notes: 'Piedi elevati, corpo parallelo' },
                    { name: 'Front Lever Progression', sets: '5×10-15s hold', rest: '2min', notes: 'Tuck → Adv Tuck → One Leg → Straddle → Full' },
                    { name: 'Ring Muscle-Up Transition', sets: '4×5', rest: '3min', notes: 'Kip swing + false grip + transition drill' },
                    { name: 'Back Lever Progression', sets: '4×10s hold', rest: '2min', notes: 'Tuck → Straddle → Full (più facile di front)' },
                    { name: 'Ring Chin-Ups', sets: '3×Max reps', rest: '90s', notes: 'Supination, focus bicipiti' }
                ],
                cooldown: '🧘 DEFATICAMENTO (10 min): Lat stretch 2x60s • Bicep stretch 2x60s • Dead hang relax 2min'
            },
            {
                day: 'VENERDÌ - ADVANCED SKILLS',
                icon: '⭐',
                focus: 'Iron Cross e skills avanzate',
                warmup: '🔥 RISCALDAMENTO (20 min): Joint mobility 5min • Support hold 3x30s • Skin-the-cat 3x5 • German hang 3x10s',
                exercises: [
                    { name: 'Skin-the-Cat', sets: '5×5', rest: '2min', notes: 'Propedeutico per tutti gli skills. Video: https://youtu.be/V8w6WXHMXT4', video: 'https://youtu.be/V8w6WXHMXT4' },
                    { name: 'Iron Cross Progression', sets: '4×8s hold', rest: '3min', notes: 'Assisted con banda → Negativa → Hold parziale' },
                    { name: 'Maltese Lean', sets: '4×10s', rest: '2min', notes: 'Planche lean su anelli' },
                    { name: 'Ring Handstand Progression', sets: '5×20s', rest: '2min', notes: 'Muro assist → Free standing' },
                    { name: 'Victorian Lean', sets: '3×8s', rest: '2min', notes: 'Preparazione Victorian (skill estremo)' },
                    { name: 'Ring Dips Weighted', sets: '4×8-10', rest: '2min', notes: 'Zavorra 5-10kg se comfortable' }
                ],
                cooldown: '🧘 DEFATICAMENTO (15 min): Shoulder mobility 5min • PNF stretching 5min • Massage/foam roll 5min'
            },
            {
                day: 'DOMENICA - BASICS & VOLUME',
                icon: '🔄',
                focus: 'Volume alto, recupero attivo',
                warmup: '🔥 RISCALDAMENTO (10 min): Light cardio 5min • Dynamic stretching 5min',
                exercises: [
                    { name: 'EMOM 20 min (Every Minute On the Minute)', sets: '', notes: 'Minuto 1: 8 Ring Dips | Minuto 2: 10 Ring Rows | Minuto 3: 15s Support Hold | Minuto 4: Riposo' },
                    { name: 'Ring Face Pulls', sets: '4×20', rest: '60s', notes: 'Deltoidi posteriori' },
                    { name: 'Ring Core: Knee Raises', sets: '4×15', rest: '60s', notes: 'Appeso agli anelli' },
                    { name: 'Ring Core: Windshield Wipers', sets: '3×10', rest: '90s', notes: 'Skill avanzato' },
                    { name: 'Stretching Attivo Anelli', sets: '20 min', notes: 'German hang, shoulder stretch, splits' }
                ],
                cooldown: '🧘 DEFATICAMENTO (10 min): Yoga flow 10min con focus spalle'
            }
        ],
        notes: [
            '⭕ **Anelli Wooden**: Preferibili a FIG 28mm diametro',
            '⚠️ **Safety First**: Anelli altezza corretta, materassino sotto',
            '📹 **Tutorial**: GMB Fitness, FitnessFAQs YouTube channels',
            '🎵 **Focus Music**: Playlist Spotify per concentrazione',
            '⏱️ **Riposo Articolare**: 2-3 min tra serie per tendini/legamenti',
            '💪 **Progressione Lenta**: 6-12 mesi per skills avanzati'
        ]
    };
}

function getHIITFatBurnProgram() {
    return {
        name: '🔥 HIIT FAT BURN - DIMAGRIMENTO VELOCE',
        description: 'Allenamento HIIT 30 minuti - Max calorie bruciate',
        weeks: 'Programma 4 settimane',
        spotify: '🎵 Playlist: https://open.spotify.com/playlist/37i9dQZF1DWZd79rJ6a7lp (HIIT)',
        days: [
            {
                day: 'LUNEDÌ - TABATA LOWER BODY',
                icon: '⚡',
                focus: '8 round x 20s lavoro / 10s riposo',
                warmup: '🔥 RISCALDAMENTO (8 min): Jumping jacks 2min • High knees 1min • Butt kicks 1min • Leg swings 2min • Bodyweight squats 2x15',
                exercises: [
                    { name: 'Tabata: Jump Squats', sets: '8×20s', rest: '10s', notes: 'Esplosione massima. Video Tabata: https://youtu.be/2W4ZNSwoW_4', video: 'https://youtu.be/2W4ZNSwoW_4' },
                    { name: '--- Riposo 1 min ---', sets: '', rest: '1min' },
                    { name: 'Tabata: Burpees', sets: '8×20s', rest: '10s', notes: 'Full burpee con push-up' },
                    { name: '--- Riposo 1 min ---', sets: '', rest: '1min' },
                    { name: 'Tabata: Mountain Climbers', sets: '8×20s', rest: '10s', notes: 'Velocità massima' },
                    { name: 'Finisher: Plank Hold', sets: '1×2min', rest: '', notes: 'Core finisher' }
                ],
                cooldown: '🧘 DEFATICAMENTO (8 min): Walk slow 3min • Quad stretch 2x30s • Hamstring stretch 2x30s • Child pose 2min'
            },
            {
                day: 'MERCOLEDÌ - EMOM TOTAL BODY',
                icon: '💥',
                focus: 'Every Minute On Minute - 20 min',
                warmup: '🔥 RISCALDAMENTO (8 min): Jump rope 3min • Arm circles 2x20 • Inchworms 2x8 • Light jog 2min',
                exercises: [
                    { name: 'EMOM 20 minuti - Minuto 1', sets: '12 Burpees', rest: 'riposo per resto minuto' },
                    { name: 'EMOM 20 minuti - Minuto 2', sets: '15 Kettlebell Swings (o Squat Jumps)', rest: 'riposo' },
                    { name: 'EMOM 20 minuti - Minuto 3', sets: '20 Push-Ups', rest: 'riposo' },
                    { name: 'EMOM 20 minuti - Minuto 4', sets: '25 Jumping Lunges (tot)', rest: 'riposo' },
                    { name: 'EMOM 20 minuti - Minuto 5', sets: 'Riposo completo', rest: '60s' },
                    { name: '--- Ripeti 4 round totali ---', notes: 'Round 2-3-4 stessa sequenza' }
                ],
                cooldown: '🧘 DEFATICAMENTO (10 min): Slow walk 5min • Full body stretch 5min'
            },
            {
                day: 'VENERDÌ - CIRCUIT INFERNO',
                icon: '🌶️',
                focus: 'Circuito 45s on / 15s off',
                warmup: '🔥 RISCALDAMENTO (8 min): Dynamic warm-up completo',
                exercises: [
                    { name: 'Station 1: High Knees', sets: '45s', rest: '15s', notes: 'Max velocità' },
                    { name: 'Station 2: Push-Ups', sets: '45s', rest: '15s', notes: 'Quanti ne fai' },
                    { name: 'Station 3: Jump Squats', sets: '45s', rest: '15s' },
                    { name: 'Station 4: Plank Jacks', sets: '45s', rest: '15s' },
                    { name: 'Station 5: Burpees', sets: '45s', rest: '15s' },
                    { name: 'Station 6: Mountain Climbers', sets: '45s', rest: '15s' },
                    { name: 'Station 7: Jump Lunges', sets: '45s', rest: '15s' },
                    { name: 'Station 8: Bicycle Crunch', sets: '45s', rest: '15s' },
                    { name: '--- Riposo 2 min ---', rest: '2min', notes: 'Ripeti circuit 3 volte totali' }
                ],
                cooldown: '🧘 DEFATICAMENTO (10 min): Cooldown walk + stretch completo'
            }
        ],
        notes: [
            '🔥 **Burn Rate**: 400-600 kcal in 30 minuti',
            '⏱️ **Timer App**: Scarica Tabata Timer o Interval Timer app',
            '💦 **Idratazione**: Bevi acqua tra i round',
            '🎵 **BPM Music**: Playlist Spotify 150-170 BPM per ritmo',
            '📈 **Progressione**: Settimana 1-2: 3 round | Settimana 3-4: 4 round',
            '⚠️ **Rest Days**: Minimo 1 giorno riposo tra HIIT sessions'
        ]
    };
}

function getCrossFitWODsProgram() {
    return {
        name: '🏋️‍♂️ CROSSFIT WODs - CLASSIC WORKOUTS',
        description: 'Workout of the Day CrossFit style',
        weeks: 'WODs rotativi',
        spotify: '🎵 Playlist: https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP (CrossFit Motivation)',
        days: [
            {
                day: 'WOD 1: "FRAN"',
                icon: '⚡',
                focus: 'Thrusters + Pull-Ups - 21-15-9',
                warmup: '🔥 RISCALDAMENTO (15 min): Row 500m • Thruster tecnica 3x5 vuoto • Pull-ups practice 10 reps • Mobilità spalle',
                exercises: [
                    { name: '21-15-9 FRAN', notes: 'Round 1: 21 Thrusters (43kg M / 30kg F) + 21 Pull-Ups | Round 2: 15+15 | Round 3: 9+9. Video Fran: https://youtu.be/ECF54d8ZOIU', video: 'https://youtu.be/ECF54d8ZOIU' },
                    { name: 'Thruster (Squat + Push Press)', notes: 'Bilanciere da terra → front squat → push press overhead. Movimento fluido' },
                    { name: 'Pull-Ups', notes: 'Kipping consentito in CrossFit. Strict se sei forte' },
                    { name: 'TIME CAP: 10 minuti', notes: 'Elite time: sotto 3 min. Beginner: 8-10 min' },
                    { name: 'SCALING: Thruster peso ridotto', notes: 'Pull-ups → Jumping pull-ups o ring rows' }
                ],
                cooldown: '🧘 DEFATICAMENTO (10 min): Slow walk 5min • Shoulder/hip stretch 5min'
            },
            {
                day: 'WOD 2: "CINDY"',
                icon: '🔄',
                focus: 'AMRAP 20 minuti - 5-10-15',
                warmup: '🔥 RISCALDAMENTO (10 min): Run 400m • Movements practice 2 round easy',
                exercises: [
                    { name: 'CINDY - AMRAP 20 min', notes: 'As Many Rounds As Possible: 5 Pull-Ups + 10 Push-Ups + 15 Air Squats. Video: https://youtu.be/gCE0BZnNaOo', video: 'https://youtu.be/gCE0BZnNaOo' },
                    { name: 'Target Round: 15-25 round', notes: 'Elite: 25+ rounds. Intermediate: 15-20. Beginner: 10-15' },
                    { name: 'SCALING: Pull-Ups → Jumping', notes: 'Push-Ups → Ginocchia. Squats → Box' },
                    { name: 'No Rest Timing', notes: 'Vai diretto da un esercizio all\'altro' }
                ],
                cooldown: '🧘 DEFATICAMENTO (8 min): Stretch legs + shoulders'
            },
            {
                day: 'WOD 3: "MURPH" (Memorial Day)',
                icon: '🎖️',
                focus: 'Hero WOD - Ultra endurance',
                warmup: '🔥 RISCALDAMENTO (15 min): Run 800m easy • Dynamic stretching • Practice movements',
                exercises: [
                    { name: 'THE MURPH', notes: '1 Mile Run (1.6km) + 100 Pull-Ups + 200 Push-Ups + 300 Air Squats + 1 Mile Run. Video: https://youtu.be/Kb3gM5TbPWg', video: 'https://youtu.be/Kb3gM5TbPWg' },
                    { name: 'RX: Con 10kg weighted vest', notes: 'Elite time: sotto 40 min. Standard: 45-60 min' },
                    { name: 'PARTITION Strategy', notes: 'Dividi in set: 20 round di 5 pull + 10 push + 15 squat' },
                    { name: 'SCALING: No vest', notes: 'Half Murph: tutto dimezzato + 800m run x2' },
                    { name: 'TIME CAP: 90 minuti', notes: 'Questo è un WOD LUNGO' }
                ],
                cooldown: '🧘 DEFATICAMENTO (15 min): Walk 10min • Deep stretch 5min • Foam roll'
            },
            {
                day: 'WOD 4: "ANNIE"',
                icon: '💪',
                focus: 'Double-Unders + Sit-Ups - 50-40-30-20-10',
                warmup: '🔥 RISCALDAMENTO (10 min): Jump rope practice 5min • Sit-ups 2x15 • Wrist mobility',
                exercises: [
                    { name: 'ANNIE - 50-40-30-20-10', notes: 'Round 1: 50 Double-Unders + 50 Sit-Ups | R2: 40+40 | R3: 30+30 | R4: 20+20 | R5: 10+10' },
                    { name: 'Double-Unders', notes: 'Corda passa 2 volte sotto piedi per salto. SCALING: 3x Single-Unders (150-120-90-60-30)' },
                    { name: 'Sit-Ups (AbMat)', notes: 'Full ROM, touch terra dietro testa → touch piedi' },
                    { name: 'Elite time: 5-8 minuti', notes: 'Intermediate: 10-15 min' }
                ],
                cooldown: '🧘 DEFATICAMENTO (8 min): Cool down walk + core stretch'
            }
        ],
        notes: [
            '🏋️ **CrossFit Terminology**: AMRAP (max round), EMOM (every minute), RX (prescritto), SCALING (modificato)',
            '⏱️ **Time Priority**: Finisci il più veloce possibile mantenendo forma',
            '🎥 **CrossFit.com**: WODs giornalieri ufficiali + video tutorial',
            '🎵 **Loud Music**: Playlist Spotify CrossFit per pump',
            '📊 **Log Results**: Annota tempi/round per tracking progresso',
            '⚠️ **Intensity**: Non fare CrossFit ogni giorno - 3-4x settimana max'
        ]
    };
}

function getFullBody3DayProgram() {
    return {
        name: '🏃 FULL BODY 3-DAY - BEGINNER FRIENDLY',
        description: 'Programma total body 3 volte settimana - Ideale principianti',
        weeks: 'Programma 6 settimane',
        spotify: '🎵 Playlist: https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP (Workout Mix)',
        days: [
            {
                day: 'LUNEDÌ - FULL BODY A',
                icon: '💪',
                focus: 'Tutto il corpo - Pattern Push dominante',
                warmup: '🔥 RISCALDAMENTO (10 min): Treadmill 5min • Dynamic stretching 5min',
                exercises: [
                    { name: 'Goblet Squat', sets: '3×12-15', rest: '90s', notes: 'Manubrio/Kettlebell al petto. Video: https://youtu.be/MeHQ02MOq-U', video: 'https://youtu.be/MeHQ02MOq-U' },
                    { name: 'Push-Ups', sets: '3×10-15', rest: '90s', notes: 'Ginocchia se necessario' },
                    { name: 'Romanian Deadlift (RDL)', sets: '3×12', rest: '90s', notes: 'Manubri, focus femorali' },
                    { name: 'Shoulder Press (Manubri)', sets: '3×10-12', rest: '90s', notes: 'Seduto o in piedi' },
                    { name: 'Plank', sets: '3×30-60s', rest: '60s', notes: 'Core stability' },
                    { name: 'Calf Raises', sets: '3×20', rest: '60s', notes: 'Bodyweight o manubri' }
                ],
                cooldown: '🧘 DEFATICAMENTO (10 min): Stretch completo tutti gruppi muscolari'
            },
            {
                day: 'MERCOLEDÌ - FULL BODY B',
                icon: '🦾',
                focus: 'Tutto il corpo - Pattern Pull dominante',
                warmup: '🔥 RISCALDAMENTO (10 min): Cyclette 5min • Arm swings + leg swings 5min',
                exercises: [
                    { name: 'Bulgarian Split Squat', sets: '3×10 per gamba', rest: '90s', notes: 'Manubri ai fianchi' },
                    { name: 'Bent-Over Row (Manubri)', sets: '3×12', rest: '90s', notes: 'Dorsali, schiena piatta' },
                    { name: 'Step-Ups', sets: '3×12 per gamba', rest: '90s', notes: 'Box 40-50cm' },
                    { name: 'Dumbbell Bench Press', sets: '3×10-12', rest: '90s', notes: 'Su panca o pavimento' },
                    { name: 'Bicep Curls', sets: '3×12-15', rest: '60s', notes: 'Manubri' },
                    { name: 'Russian Twists', sets: '3×20 totali', rest: '60s', notes: 'Core rotazione' }
                ],
                cooldown: '🧘 DEFATICAMENTO (10 min): Foam rolling + stretching'
            },
            {
                day: 'VENERDÌ - FULL BODY C',
                icon: '⚡',
                focus: 'Tutto il corpo - Circuito dinamico',
                warmup: '🔥 RISCALDAMENTO (10 min): Jump rope 3min • Bodyweight movements 7min',
                exercises: [
                    { name: 'Circuit 3 round: Kettlebell Swings', sets: '15 reps', rest: '30s tra esercizi', notes: 'Esplosività anche/glutei' },
                    { name: 'Circuit: Dumbbell Thrusters', sets: '12 reps', rest: '30s', notes: 'Squat + press combinato' },
                    { name: 'Circuit: Renegade Rows', sets: '10 per lato', rest: '30s', notes: 'Plank position + row alternato' },
                    { name: 'Circuit: Reverse Lunges', sets: '12 per gamba', rest: '30s', notes: 'Bodyweight o manubri' },
                    { name: 'Circuit: Mountain Climbers', sets: '30 totali', rest: '30s', notes: 'Cardio + core' },
                    { name: '--- Riposo 2 min tra round ---', rest: '2min', notes: 'Respira profondo' }
                ],
                cooldown: '🧘 DEFATICAMENTO (12 min): Walk 5min + stretch lungo 7min'
            }
        ],
        notes: [
            '🔰 **Beginner Friendly**: Perfetto per chi inizia o ritorna dopo pausa',
            '📅 **Schedule**: Lunedì-Mercoledì-Venerdì con 2 giorni riposo tra sessioni',
            '⏱️ **Duration**: Ogni workout 45-60 minuti incluso warm-up/cooldown',
            '📈 **Progression**: Settimana 1-2 (impara movimenti) | 3-4 (aggiungi peso) | 5-6 (aumenta volume)',
            '🎵 **Music Tempo**: Playlist Spotify moderato per focus tecnica',
            '💪 **Form First**: Tecnica perfetta > peso pesante'
        ]
    };
}

function getCoreSpecialistProgram() {
    return {
        name: '💥 CORE SPECIALIST - ADDOMINALI & CORE',
        description: 'Programma specializzato core strength e six-pack',
        weeks: 'Programma 6 settimane',
        spotify: '🎵 Playlist: https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP (Focus Beats)',
        days: [
            {
                day: 'LUNEDÌ - ANTI-EXTENSION',
                icon: '🔥',
                focus: 'Plank variations e stabilità frontale',
                warmup: '🔥 RISCALDAMENTO (8 min): Cat-cow 2x15 • Dead bug 2x10 • Bird dog 2x10 per lato',
                exercises: [
                    { name: 'RKC Plank', sets: '5×30-45s', rest: '90s', notes: 'Max contrazione glutei/core. Video: https://youtu.be/O3bHIgwksLY', video: 'https://youtu.be/O3bHIgwksLY' },
                    { name: 'Ab Wheel Rollouts', sets: '4×10-15', rest: '90s', notes: 'Ginocchia o piedi. Anti-extension king' },
                    { name: 'Plank to Push-Up', sets: '3×12', rest: '60s', notes: 'Alternanza gomiti-mani' },
                    { name: 'Long Lever Plank', sets: '3×20-30s', rest: '60s', notes: 'Mani avanti rispetto spalle' },
                    { name: 'Dead Bug', sets: '3×15', rest: '60s', notes: 'Opposite arm/leg extension' },
                    { name: 'Stir the Pot', sets: '3×10 per direzione', rest: '60s', notes: 'Plank su swiss ball, circular motion' }
                ],
                cooldown: '🧘 DEFATICAMENTO (8 min): Child pose 2min • Cobra stretch 2x30s • Cat-cow 2min'
            },
            {
                day: 'MERCOLEDÌ - ANTI-ROTATION',
                icon: '🌪️',
                focus: 'Stabilità rotazionale',
                warmup: '🔥 RISCALDAMENTO (8 min): Torso twists 2x20 • Quadruped rotations 2x10 • Side plank practice',
                exercises: [
                    { name: 'Pallof Press', sets: '4×12 per lato', rest: '60s', notes: 'Cavo o banda, resist rotation. Video: https://youtu.be/AH_QZLm_0-s', video: 'https://youtu.be/AH_QZLm_0-s' },
                    { name: 'Side Plank', sets: '4×30-45s per lato', rest: '60s', notes: 'Progressione: piedi stack → top leg lift' },
                    { name: 'Landmine Rotations', sets: '3×12 per lato', rest: '60s', notes: 'Full rotation controllo' },
                    { name: 'Copenhagen Plank', sets: '3×20-30s per lato', rest: '90s', notes: 'Adductor plank, top leg su panca' },
                    { name: 'Bird Dog Hold', sets: '4×15s per lato', rest: '45s', notes: 'Opposite arm/leg, no rotation' },
                    { name: 'Suitcase Carry', sets: '3×40m per lato', rest: '60s', notes: 'Manubrio pesante, no lean' }
                ],
                cooldown: '🧘 DEFATICAMENTO (8 min): Oblique stretch 2x30s • Spinal twist 2x60s'
            },
            {
                day: 'VENERDÌ - FLEXION & LOWER ABS',
                icon: '💪',
                focus: 'Crunch, leg raises, abs inferiori',
                warmup: '🔥 RISCALDAMENTO (8 min): Hollow body rocks 2x15 • Leg circles 2x10 • Reverse crunches 2x10',
                exercises: [
                    { name: 'Hanging Leg Raises', sets: '4×12-15', rest: '90s', notes: 'Strict, touch bar con piedi. Toes-to-bar progression. Video: https://youtu.be/hdng3Nm1x_E', video: 'https://youtu.be/hdng3Nm1x_E' },
                    { name: 'Dragon Flag Progression', sets: '4×8-10', rest: '2min', notes: 'Tuck → Single leg → Full' },
                    { name: 'Cable Crunch', sets: '4×15-20', rest: '60s', notes: 'Peso progressivo, crunch completo' },
                    { name: 'Reverse Crunch', sets: '3×20', rest: '60s', notes: 'Focus abs bassi' },
                    { name: 'Garhammer Raise', sets: '3×12-15', rest: '90s', notes: 'Hanging, raise knees verso spalle' },
                    { name: 'Ab Pulse-Ups', sets: '3×15-20', rest: '45s', notes: 'Gambe 90°, pulse hips up' }
                ],
                cooldown: '🧘 DEFATICAMENTO (10 min): Hip flexor stretch 2x60s • Full spinal stretch 5min'
            },
            {
                day: 'DOMENICA - CORE ENDURANCE CIRCUIT',
                icon: '⏱️',
                focus: 'Resistenza core - Time under tension',
                warmup: '🔥 RISCALDAMENTO (8 min): Dynamic core warm-up',
                exercises: [
                    { name: 'Circuit 4 round: Plank', sets: '60s hold', rest: '15s', notes: 'Perfect form' },
                    { name: 'Circuit: Mountain Climbers', sets: '30 reps', rest: '15s', notes: 'Velocità controllata' },
                    { name: 'Circuit: Russian Twists', sets: '40 totali', rest: '15s', notes: 'Con peso 5-10kg' },
                    { name: 'Circuit: Hollow Body Hold', sets: '30-45s', rest: '15s', notes: 'Lower back a terra' },
                    { name: 'Circuit: Bicycle Crunch', sets: '30 totali', rest: '15s', notes: 'Slow and controlled' },
                    { name: 'Circuit: V-Ups', sets: '15 reps', rest: '15s', notes: 'Touch hands to feet' },
                    { name: '--- Riposo 2 min tra round ---', rest: '2min', notes: 'Hydrate!' }
                ],
                cooldown: '🧘 DEFATICAMENTO (10 min): Yoga flow core 10min'
            }
        ],
        notes: [
            '💥 **Core = Stability**: Non solo abs, ma tutto il tronco (obliques, transverse, erectors)',
            '🔄 **Frequency**: 4x settimana per risultati visibili in 6 settimane',
            '🍽️ **Abs Diet**: Core forte ≠ visible. Dieta 70% del risultato (deficit calorico)',
            '📈 **Progressive Overload**: Aggiungi tempo/peso/difficoltà ogni settimana',
            '⏱️ **Breathing**: Respira sempre, no apnea durante esercizi',
            '🎯 **Mind-Muscle**: Concentrazione massima sulla contrazione'
        ]
    };
}

function getCardioEnduranceProgram() {
    return {
        name: '🏃 CARDIO ENDURANCE - RUNNING & CYCLING',
        description: 'Programma resistenza aerobica - 5K to 10K',
        weeks: 'Programma 8 settimane',
        spotify: '🎵 Playlist: https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP (Running Motivation)',
        days: [
            {
                day: 'LUNEDÌ - EASY RUN',
                icon: '🏃',
                focus: 'Corsa ritmo conversazionale - Zone 2',
                warmup: '🔥 RISCALDAMENTO (10 min): Walk 5min • Dynamic leg swings • Butt kicks + high knees 2min',
                exercises: [
                    { name: 'Easy Run - 5-8 km', sets: '30-50 min', notes: 'Ritmo: 65-75% HRmax. Devi riuscire a parlare. Video tecnica running: https://youtu.be/brFHyOtTwH4', video: 'https://youtu.be/brFHyOtTwH4' },
                    { name: 'Cadence Target', notes: '170-180 passi al minuto. Usa metronome app' },
                    { name: 'Breathing: 3-3 pattern', notes: '3 passi inspira, 3 passi espira' },
                    { name: 'Heart Rate Zone 2', notes: '60-70% FCmax. Brucia grassi, build aerobic base' }
                ],
                cooldown: '🧘 DEFATICAMENTO (10 min): Walk 5min • Leg stretches: quad/hamstring/calf 2x30s each'
            },
            {
                day: 'MERCOLEDÌ - INTERVAL TRAINING',
                icon: '⚡',
                focus: 'Intervalli VO2max - Speed work',
                warmup: '🔥 RISCALDAMENTO (15 min): Jog 10min • Strides 4x100m @ 80% speed',
                exercises: [
                    { name: 'Interval Session: 8x400m', sets: '8 intervals', rest: '90s jog recovery', notes: 'Target pace: 5K race pace + 5-10 sec. Video intervals: https://youtu.be/6N_b8pTBOvM', video: 'https://youtu.be/6N_b8pTBOvM' },
                    { name: 'Alternative: 5x1000m', rest: '2min recovery', notes: 'Se preferisci intervalli più lunghi' },
                    { name: 'Alternative: Fartlek 40 min', notes: '2min hard / 2min easy alternato' },
                    { name: 'Effort: 85-90% HRmax', notes: 'Breathing hard, not conversational' }
                ],
                cooldown: '🧘 DEFATICAMENTO (15 min): Jog easy 10min • Deep stretch 5min'
            },
            {
                day: 'VENERDÌ - TEMPO RUN',
                icon: '🔥',
                focus: 'Lactate threshold - Ritmo gara',
                warmup: '🔥 RISCALDAMENTO (15 min): Easy jog 10min • Accelerations 4x50m',
                exercises: [
                    { name: 'Tempo Run - 5-7 km', sets: '25-35 min', notes: 'Ritmo: "comfortably hard". 10K race pace o leggermente più lento. Video: https://youtu.be/hejPSyJzPhs', video: 'https://youtu.be/hejPSyJzPhs' },
                    { name: 'Effort: 80-85% HRmax', notes: 'Puoi dire poche parole, non conversare' },
                    { name: 'Structured: 2km easy + 5km tempo + 1km easy', notes: 'Se preferisci struttura' },
                    { name: 'Breathing: 2-2 pattern', notes: '2 passi inspira, 2 espira (più intenso)' }
                ],
                cooldown: '🧘 DEFATICAMENTO (10 min): Easy jog 5min • Full leg stretch 5min'
            },
            {
                day: 'DOMENICA - LONG SLOW DISTANCE (LSD)',
                icon: '🚶',
                focus: 'Corsa lunga aerobica - Build endurance',
                warmup: '🔥 RISCALDAMENTO (10 min): Walk + jog lento 10min',
                exercises: [
                    { name: 'Long Run - 10-15 km', sets: '60-90 min', notes: 'Pace: Easy run + 10-15 sec/km più lento. Focus: completare distanza, non velocità' },
                    { name: 'Alternative: Cycling 90 min', notes: 'Se ginocchia affaticate, sostituisci con bike' },
                    { name: 'Effort: 60-70% HRmax', notes: 'Conversational pace, enjoy scenery' },
                    { name: 'Hydration Strategy', notes: 'Porta acqua/borraccia. Bevi ogni 15-20 min' },
                    { name: 'Fuel: Gel/Energy', notes: 'Se run > 90 min, prendi carboidrati 45min in' }
                ],
                cooldown: '🧘 DEFATICAMENTO (15 min): Walk 10min • Stretch + foam roll 5min'
            }
        ],
        notes: [
            '🏃 **Progressive Build**: Settimana 1-4: base aerobica | 5-8: increase volume + intensity',
            '📈 **Weekly Mileage**: Start 20-25 km/week → Build to 40-50 km/week',
            '⏱️ **80/20 Rule**: 80% easy pace, 20% hard (intervals/tempo)',
            '👟 **Shoe Rotation**: Cambia scarpe ogni 600-800 km',
            '📊 **Track Progress**: Usa Strava/Garmin per monitorare pace/HR',
            '🎵 **Music BPM**: 150-180 BPM playlist for running rhythm',
            '⚠️ **Injury Prevention**: Se dolore articolazioni, riposa. Meglio perdere 3 giorni che 3 mesi'
        ]
    };
}

function getStreetWorkoutProgram() {
    return {
        name: '🏙️ STREET WORKOUT - PARK TRAINING',
        description: 'Allenamento calisthenics outdoor - Sbarre e parallele',
        weeks: 'Programma 6 settimane',
        spotify: '🎵 Playlist: https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP (Street Workout)',
        days: [
            {
                day: 'GIORNO 1 - PULL DAY (TIRATA)',
                icon: '🦾',
                focus: 'Dorsali, bicipiti, skill trazioni',
                warmup: '🔥 RISCALDAMENTO (12 min): Jog 3min • Jump rope 2min • Scapular pulls 3x8 • Dead hang 2x30s • Arm circles 2x20',
                exercises: [
                    { name: 'Pull-Ups (varie prese)', sets: '5×Max reps', rest: '2min', notes: 'Round 1: wide grip | R2: narrow | R3: neutral | R4-5: choice. Video tutorial: https://youtu.be/eGo4IYlbE5g', video: 'https://youtu.be/eGo4IYlbE5g' },
                    { name: 'Muscle-Up Progression', sets: '5×3-5', rest: '3min', notes: 'Kip swing practice → transition → full MU' },
                    { name: 'Australian Pull-Ups', sets: '4×15-20', rest: '90s', notes: 'Low bar, corpo orizzontale' },
                    { name: 'Typewriter Pull-Ups', sets: '3×8-10', rest: '90s', notes: 'Slide left-right in alto' },
                    { name: 'Front Lever Hold', sets: '5×10s', rest: '2min', notes: 'Tuck o advanced tuck' },
                    { name: 'Hanging Leg Raises', sets: '4×15', rest: '60s', notes: 'Core finisher' }
                ],
                cooldown: '🧘 DEFATICAMENTO (10 min): Dead hang relax 2min • Lat stretch 2x60s • Shoulder mobility'
            },
            {
                day: 'GIORNO 2 - PUSH DAY (SPINTA)',
                icon: '💪',
                focus: 'Petto, spalle, tricipiti',
                warmup: '🔥 RISCALDAMENTO (12 min): Jog 3min • Arm circles 3x20 • Scapular push-ups 3x10 • Light push-ups 2x10',
                exercises: [
                    { name: 'Dips alle Parallele', sets: '5×10-15', rest: '2min', notes: 'Lean forward per petto, upright per tricipiti. Video: https://youtu.be/2z8JmcrW-As', video: 'https://youtu.be/2z8JmcrW-As' },
                    { name: 'Handstand Push-Ups', sets: '4×8-12', rest: '2min', notes: 'Muro assist, vertical push' },
                    { name: 'Decline Push-Ups', sets: '4×15-20', rest: '90s', notes: 'Piedi su panca/parallele' },
                    { name: 'Pseudo-Planche Push-Ups', sets: '4×10-12', rest: '90s', notes: 'Mani livello vita, propedeutico planche' },
                    { name: 'Diamond Push-Ups', sets: '3×15-20', rest: '60s', notes: 'Focus tricipiti' },
                    { name: 'Pike Push-Ups', sets: '3×15', rest: '60s', notes: 'Focus spalle' }
                ],
                cooldown: '🧘 DEFATICAMENTO (10 min): Shoulder/chest stretch completo'
            },
            {
                day: 'GIORNO 3 - LEGS & EXPLOSIVENESS',
                icon: '🦵',
                focus: 'Gambe e pliometria',
                warmup: '🔥 RISCALDAMENTO (12 min): Jog 5min • Leg swings 2x15 • Bodyweight squats 2x20 • Jump rope 3min',
                exercises: [
                    { name: 'Pistol Squats', sets: '4×8-10 per gamba', rest: '2min', notes: 'Assisted con parallele se necessario. Video: https://youtu.be/t7Oj8-8Htyw', video: 'https://youtu.be/t7Oj8-8Htyw' },
                    { name: 'Box Jumps', sets: '5×8-10', rest: '2min', notes: 'Panca/muretto 50-70cm' },
                    { name: 'Bulgarian Split Squat', sets: '4×12 per gamba', rest: '90s', notes: 'Piede posteriore su panca' },
                    { name: 'Jump Squats', sets: '4×15', rest: '90s', notes: 'Esplosività massima' },
                    { name: 'Nordic Hamstring Curls', sets: '4×6-8', rest: '2min', notes: 'Partner holds ankles o fix feet' },
                    { name: 'Calf Raises su step', sets: '4×20-25', rest: '60s', notes: 'Full ROM' }
                ],
                cooldown: '🧘 DEFATICAMENTO (10 min): Leg stretch completo + foam roll'
            },
            {
                day: 'GIORNO 4 - SKILLS & FREESTYLE',
                icon: '⭐',
                focus: 'Tricks, combos, creatività',
                warmup: '🔥 RISCALDAMENTO (15 min): Full body dynamic warm-up',
                exercises: [
                    { name: 'Skill Practice: 360 Pull-Up', sets: '10 min practice', notes: 'Rotation pull. Video tricks: https://youtu.be/JQJ30J-j3W0', video: 'https://youtu.be/JQJ30J-j3W0' },
                    { name: 'Human Flag Progression', sets: '5×8s per lato', rest: '2min', notes: 'On pole: tuck → straddle → full' },
                    { name: 'Clapping Pull-Ups', sets: '4×5-8', rest: '2min', notes: 'Explosive pull + clap' },
                    { name: 'Bar Spin 180°', sets: '10 attempts', rest: '90s', notes: 'Spin around bar' },
                    { name: 'L-Sit to Handstand', sets: '5 attempts', rest: '2min', notes: 'Su parallele' },
                    { name: 'Freestyle Flow', sets: '10 min', notes: 'Combina moves fluidamente, creatività libera' }
                ],
                cooldown: '🧘 DEFATICAMENTO (15 min): Full stretch + cool tricks practice'
            }
        ],
        notes: [
            '🏙️ **Location**: Trova park con sbarra pull-up, parallele, panche',
            '👥 **Community**: Cerca crew street workout locale per motivazione',
            '📹 **Record Progress**: Filma skills per correggere tecnica',
            '🎵 **Speaker**: Porta cassa Bluetooth per musica motivazionale',
            '🌤️ **Weather**: Porta asciugamano se fa caldo, guanti se freddo',
            '⚠️ **Progressione Sicura**: Master basics prima di tricks avanzati',
            '💪 **Ego Check**: Non forzare skills per cui non sei pronto (injury risk)'
        ]
    };
}

function getYogaFlexibilityProgram() {
    return {
        name: '🧘 YOGA & FLEXIBILITY - MOBILITY MASTER',
        description: 'Programma mobilità articolare e stretching profondo',
        weeks: 'Programma 8 settimane',
        spotify: '🎵 Playlist: https://open.spotify.com/playlist/37i9dQZF1DWZqd5JICZI1F (Yoga & Meditation)',
        days: [
            {
                day: 'LUNEDÌ - VINYASA FLOW (UPPER BODY)',
                icon: '🌊',
                focus: 'Mobilità spalle, petto, braccia',
                warmup: '🔥 PREP (5 min): Pranayama (respirazione) 5min',
                exercises: [
                    { name: 'Sun Salutation A', sets: '5 round', notes: 'Surya Namaskar. Flow completo. Video: https://youtu.be/73sjOu0g58M', video: 'https://youtu.be/73sjOu0g58M' },
                    { name: 'Sun Salutation B', sets: '5 round', notes: 'Con Chair pose e Warrior I' },
                    { name: 'Shoulder Sequence', sets: '10 min hold', notes: 'Cow Face Arms → Eagle Arms → Thread the Needle → Puppy Pose' },
                    { name: 'Chest Openers', sets: '10 min', notes: 'Bow Pose → Camel Pose → Fish Pose' },
                    { name: 'Chaturanga to Upward Dog', sets: '10 transitions', notes: 'Strengthen + mobilize' },
                    { name: 'Shavasana (Corpse Pose)', sets: '5-10 min', notes: 'Final relaxation, meditation' }
                ],
                cooldown: '🧘 CHIUSURA: Respirazione profonda 3min'
            },
            {
                day: 'MERCOLEDÌ - YIN YOGA (LOWER BODY)',
                icon: '🌙',
                focus: 'Anche, femorali, flessibilità passiva',
                warmup: '🔥 PREP (5 min): Seated meditation + breathing',
                exercises: [
                    { name: 'Butterfly Pose (Baddha Konasana)', sets: '5 min hold', notes: 'Piedi uniti, ginocchia aperte. Passive stretch. Video Yin: https://youtu.be/T3INxbN6F7g', video: 'https://youtu.be/T3INxbN6F7g' },
                    { name: 'Dragon Pose (Deep Lunge)', sets: '4 min per lato', notes: 'Intense hip flexor stretch' },
                    { name: 'Pigeon Pose', sets: '5 min per lato', notes: 'External hip rotation. Go deep!' },
                    { name: 'Caterpillar (Seated Forward Fold)', sets: '5 min', notes: 'Hamstrings + spine' },
                    { name: 'Sleeping Swan', sets: '4 min per lato', notes: 'Pigeon variation più profondo' },
                    { name: 'Straddle (Wide Leg)', sets: '4 min', notes: 'Adduttori + laterali' },
                    { name: 'Shavasana', sets: '10 min', notes: 'Longer relaxation post deep stretch' }
                ],
                cooldown: '🧘 CHIUSURA: Silent meditation 5min'
            },
            {
                day: 'VENERDÌ - ASHTANGA PRIMARY SERIES (POWER YOGA)',
                icon: '🔥',
                focus: 'Vinyasa intenso - Forza + flessibilità',
                warmup: '🔥 PREP (8 min): 5x Sun Salutation A + 3x Sun Salutation B',
                exercises: [
                    { name: 'Standing Sequence', sets: '20 min', notes: 'Padangusthasana → Padahastasana → Triangle → Warrior → Extended Side Angle' },
                    { name: 'Sitting Sequence', sets: '25 min', notes: 'Dandasana → Paschimottanasana → Purvottanasana → Half Lotus. Video Ashtanga: https://youtu.be/aUgtMaAZzW0', video: 'https://youtu.be/aUgtMaAZzW0' },
                    { name: 'Finishing Sequence', sets: '15 min', notes: 'Shoulderstand → Headstand → Lotus → Fish Pose' },
                    { name: 'Shavasana', sets: '10 min', notes: 'Post-practice integration' }
                ],
                cooldown: '🧘 CHIUSURA: Pranayama + meditation 10min'
            },
            {
                day: 'DOMENICA - RESTORATIVE YOGA + MYOFASCIAL RELEASE',
                icon: '💆',
                focus: 'Recupero profondo, foam rolling',
                warmup: '🔥 PREP (5 min): Gentle breathing, body scan',
                exercises: [
                    { name: 'Supported Child Pose', sets: '5 min', notes: 'Con bolster/cuscino. Total relaxation' },
                    { name: 'Legs Up the Wall', sets: '10 min', notes: 'Viparita Karani. Circolazione + relax' },
                    { name: 'Reclining Bound Angle', sets: '8 min', notes: 'Supta Baddha Konasana con support' },
                    { name: 'Supine Twist', sets: '5 min per lato', notes: 'Spinal detox' },
                    { name: 'Foam Roll Session', sets: '20 min', notes: 'IT band → Quads → Hamstrings → Glutes → Back → Calves' },
                    { name: 'Lacrosse Ball: Trigger Points', sets: '10 min', notes: 'Glutes, feet, shoulders' },
                    { name: 'Extended Shavasana', sets: '15 min', notes: 'Yoga Nidra (yogic sleep)' }
                ],
                cooldown: '🧘 CHIUSURA: Gratitude meditation 5min'
            }
        ],
        notes: [
            '🧘 **Props Needed**: Yoga mat, 2 blocks, strap, bolster (optional), foam roller',
            '⏱️ **Consistency**: 4x settimana per 8 settimane = drammatico miglioramento flessibilità',
            '🌬️ **Breathing**: Ujjayi breath (respiro sonoro) per Ashtanga/Vinyasa',
            '🎵 **Ambience**: Playlist calm, natura sounds, o silenzio per focus',
            '📱 **Apps**: Down Dog, Yoga Studio, Alo Moves per guided sessions',
            '💡 **Benefit Beyond Flexibility**: Stress reduction, better sleep, injury prevention',
            '⚠️ **Never Force**: Flexibility takes time. Dolore ≠ progresso. Rispetta i tuoi limiti'
        ]
    };
}

function getOlympicLiftingProgram() {
    return {
        name: '🏋️ OLYMPIC LIFTING - CLEAN & SNATCH',
        description: 'Sollevamento olimpico: tecnica, potenza, esplosività',
        weeks: 'Mesociclo 10 settimane',
        spotify: '🎵 Playlist: https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP (Weightlifting)',
        days: [
            {
                day: 'LUNEDÌ - SNATCH FOCUS',
                icon: '🥇',
                focus: 'Snatch (Strappo) progressione tecnica',
                warmup: '🔥 RISCALDAMENTO (20 min): Barbell complex 3 round (Snatch deadlift → Hang snatch → OHS × 5) | Wrist/shoulder mobility 10min',
                exercises: [
                    { name: 'Snatch Grip Deadlift', sets: '4×5', rest: '2min', notes: 'Presa larga, pull forte. 80-90% Snatch max. Video Snatch tutorial: https://youtu.be/9xQp2sldyts', video: 'https://youtu.be/9xQp2sldyts' },
                    { name: 'Hang Snatch (above knee)', sets: '5×3', rest: '2min', notes: '70-75% 1RM. Focus triple extension' },
                    { name: 'Snatch Balance', sets: '4×3', rest: '90s', notes: 'Drop under bar fast. 60-70% Snatch max' },
                    { name: 'Overhead Squat (OHS)', sets: '4×5', rest: '2min', notes: '70-80% Snatch max. Stabilità overhead' },
                    { name: 'Snatch Pull', sets: '3×5', rest: '2min', notes: '90-100% Snatch max. Overload pull phase' },
                    { name: 'Core: GHD Sit-Ups', sets: '3×15', rest: '60s', notes: 'Se hai GHD. Altrimenti weighted sit-ups' }
                ],
                cooldown: '🧘 DEFATICAMENTO (10 min): Hip/shoulder mobility flow 10min'
            },
            {
                day: 'MERCOLEDÌ - CLEAN & JERK FOCUS',
                icon: '🥈',
                focus: 'Clean (Slancio) + Jerk tecnica',
                warmup: '🔥 RISCALDAMENTO (20 min): Clean complex 3 round (Clean pull → Hang clean → Front squat × 5) | Ankle/thoracic mobility',
                exercises: [
                    { name: 'Clean Grip Deadlift', sets: '4×5', rest: '2min', notes: 'Presa shoulder width. 90-100% Clean max. Video Clean tutorial: https://youtu.be/KwYJTpQ_x5A', video: 'https://youtu.be/KwYJTpQ_x5A' },
                    { name: 'Hang Clean (above knee)', sets: '5×3', rest: '2min', notes: '70-75% 1RM. Power position pull' },
                    { name: 'Clean & Jerk (full)', sets: '6×2', rest: '3min', notes: '70-80% 1RM. Focus transizione smooth' },
                    { name: 'Front Squat', sets: '4×5', rest: '2min', notes: '80-85% Clean max. Leg strength' },
                    { name: 'Push Press', sets: '4×5', rest: '90s', notes: '75-80% Jerk max. Dip-drive practice' },
                    { name: 'Clean Pull', sets: '3×5', rest: '2min', notes: '95-105% Clean max. Overload' }
                ],
                cooldown: '🧘 DEFATICAMENTO (10 min): Wrist/ankle stretch + upper back massage'
            },
            {
                day: 'VENERDÌ - COMPLEX & ACCESSORY',
                icon: '💪',
                focus: 'Complessi olimpici + accessori',
                warmup: '🔥 RISCALDAMENTO (15 min): EMOM 10 min: Snatch balance 2 + OHS 2 (light weight)',
                exercises: [
                    { name: 'Snatch Complex', sets: '4 round', rest: '3min', notes: '1 Snatch Grip DL + 1 Hang Snatch + 1 Full Snatch + 1 OHS. No drop bar. 60-65% Snatch max' },
                    { name: 'Clean & Jerk Complex', sets: '4 round', rest: '3min', notes: '1 Clean Pull + 1 Hang Clean + 1 Clean + 1 Jerk. 60-65% C&J max' },
                    { name: 'Back Squat', sets: '4×8', rest: '2min', notes: '70-75% 1RM. Leg strength foundation' },
                    { name: 'Romanian Deadlift', sets: '3×10', rest: '90s', notes: 'Hamstring/glute strength' },
                    { name: 'Strict Press', sets: '3×8', rest: '90s', notes: 'Shoulder strength accessory' }
                ],
                cooldown: '🧘 DEFATICAMENTO (12 min): Pigeon pose 2x3min • Thoracic mobility'
            },
            {
                day: 'DOMENICA - MAX EFFORT DAY',
                icon: '🏆',
                focus: 'Build to heavy single - Test day',
                warmup: '🔥 RISCALDAMENTO (25 min): Full warm-up complesso. Practice tecnica 50-60-70% prima di heavy',
                exercises: [
                    { name: 'Week 1-3: Snatch', notes: 'Build to heavy single (90-95% PR). Not true max, technical max' },
                    { name: 'Week 4-6: Clean & Jerk', notes: 'Build to heavy single (90-95% PR)' },
                    { name: 'Week 7-9: Both lifts', notes: 'Snatch + C&J in same session, build moderately heavy (85-90%)' },
                    { name: 'Week 10: COMPETITION SIMULATION', notes: 'Snatch: 3 attempts (opener, safe PR, reach PR) | Clean & Jerk: 3 attempts' },
                    { name: 'IMPORTANT: No accessory work', notes: 'Solo olympic lifts today. Save energy for heavy singles' },
                    { name: 'Video ogni lift', notes: 'Record form per review tecnica' }
                ],
                cooldown: '🧘 DEFATICAMENTO (15 min): Extensive mobility + ice bath se disponibile'
            }
        ],
        notes: [
            '🏋️ **Coach Mandatory**: Olympic lifting richiede coach per tecnica corretta. NON imparare da solo!',
            '📹 **Video Every Rep**: Registra lifts per correzione tecnica continua',
            '⚠️ **Safety**: Bumper plates, piattaforma, collars sempre. Mai lift senza safety',
            '📈 **Progression**: Settimana 1-3 (tecnica 70%) | 4-6 (build 80%) | 7-9 (heavy 85-90%) | 10 (test)',
            '🎵 **Focus Music**: Epic/motivational playlist per max attempt days',
            '💪 **Mobility Priority**: Hip/ankle/shoulder/wrist mobility daily. Non negoziabile',
            '🏆 **Patience**: Olympic lifts take YEARS to master. Celebrate small technical wins'
        ]
    };
}

function displayAdvancedWorkoutPlan(program) {
    const container = document.getElementById('workout-plan-container');
    if (!container) return;

    let html = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0;">${program.name}</h2>
            <p style="margin: 0 0 4px 0; opacity: 0.9;">${program.description}</p>
            <small style="opacity: 0.8;">⏱️ ${program.weeks}</small>
            ${program.spotify ? `<div style="margin-top: 12px; padding: 12px; background: rgba(255,255,255,0.2); border-radius: 8px;"><a href="${program.spotify.split(': ')[1]}" target="_blank" style="color: white; text-decoration: none; font-weight: bold;">🎵 ${program.spotify.split(': ')[0]}: Apri Spotify Playlist</a></div>` : ''}
        </div>

        <div style="display: grid; gap: 20px;">
    `;

    program.days.forEach(day => {
        html += `
            <div style="background: var(--bg-secondary); border-radius: 12px; padding: 24px; box-shadow: var(--shadow-md); border-left: 5px solid var(--success);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                    <div>
                        <h3 style="margin: 0 0 4px 0; color: var(--text-primary); font-size: 18px;">${day.icon} ${day.day}</h3>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">${day.focus}</p>
                    </div>
                </div>

                ${day.warmup ? `
                <div style="background: rgba(255, 159, 64, 0.1); border-left: 4px solid var(--warning); padding: 12px; border-radius: 6px; margin-bottom: 16px;">
                    <strong style="color: var(--text-primary); font-size: 14px;">${day.warmup}</strong>
                </div>
                ` : ''}

                <div style="display: flex; flex-direction: column; gap: 12px;">
        `;

        day.exercises.forEach((ex, idx) => {
            html += `
                <div style="background: var(--bg-tertiary); padding: 14px; border-radius: 8px; border-left: 3px solid var(--accent-primary);">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex: 1;">
                            <strong style="color: var(--text-primary); font-size: 15px;">${idx + 1}. ${ex.name}</strong>
                            <div style="display: flex; gap: 16px; margin-top: 6px; flex-wrap: wrap;">
                                ${ex.sets ? `<span style="font-size: 13px; color: var(--text-secondary);"><strong>📊 ${ex.sets}</strong></span>` : ''}
                                ${ex.rest ? `<span style="font-size: 13px; color: var(--text-secondary);">⏱️ Riposo: ${ex.rest}</span>` : ''}
                            </div>
                            ${ex.notes ? `<div style="font-size: 12px; color: var(--text-muted); margin-top: 6px; font-style: italic;">💡 ${ex.notes}</div>` : ''}
                            ${ex.video ? `<div style="margin-top: 8px;"><a href="${ex.video}" target="_blank" style="color: var(--info); text-decoration: none; font-size: 12px; font-weight: 600;">📹 Guarda Video Tutorial →</a></div>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>

                ${day.cooldown ? `
                <div style="background: rgba(75, 192, 192, 0.1); border-left: 4px solid var(--success); padding: 12px; border-radius: 6px; margin-top: 16px;">
                    <strong style="color: var(--text-primary); font-size: 14px;">${day.cooldown}</strong>
                </div>
                ` : ''}
            </div>
        `;
    });

    html += `
        </div>

        <div style="background: var(--bg-tertiary); border: 2px solid var(--warning); border-radius: 12px; padding: 20px; margin-top: 24px;">
            <h3 style="margin: 0 0 12px 0; color: var(--text-primary);">📝 Note Importanti:</h3>
            <ul style="margin: 0; padding-left: 20px; color: var(--text-secondary); line-height: 1.8;">
                ${program.notes.map(note => `<li style="color: var(--text-primary);">${note}</li>`).join('')}
            </ul>
        </div>
    `;

    container.innerHTML = html;
}

// Mostra l'allenamento di oggi (Personal Trainer)
function displayTodaysWorkout() {
    const container = document.getElementById('workout-plan-container');
    if (!container) return;

    initializeUserWorkoutProgram(); // Inizializza se primo accesso

    const todayData = getTodaysWorkout();
    if (!todayData) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                <p>⚠️ Nessun programma attivo</p>
                <button onclick="document.getElementById('program-selector').scrollIntoView({behavior: 'smooth'})"
                        class="btn btn-primary">
                    Seleziona un programma
                </button>
            </div>
        `;
        return;
    }

    const { program, dayIndex, totalDays, workout, weekNumber } = todayData;
    const progressPercent = ((dayIndex + 1) / totalDays) * 100;

    // Ultimi 3 allenamenti completati
    const recentWorkouts = workoutTracking.completedWorkouts.slice(-3).reverse();

    let html = `
        <!-- Header Programma Corrente -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px; flex-wrap: wrap; gap: 12px;">
                <div>
                    <h2 style="margin: 0 0 8px 0; font-size: 22px;">${program.name}</h2>
                    <p style="margin: 0; opacity: 0.9; font-size: 14px;">${program.description}</p>
                </div>
                <button onclick="openChangeProgramModal()"
                        style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s;"
                        onmouseover="this.style.background='rgba(255,255,255,0.3)'; this.style.transform='scale(1.05)'"
                        onmouseout="this.style.background='rgba(255,255,255,0.2)'; this.style.transform='scale(1)'">
                    🔄 Cambia Programma
                </button>
            </div>

            <!-- Progresso -->
            <div style="margin-top: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 13px; opacity: 0.9;">Giorno ${dayIndex + 1} di ${totalDays} • Settimana ${weekNumber}</span>
                    <span style="font-size: 13px; opacity: 0.9;">${Math.round(progressPercent)}%</span>
                </div>
                <div style="background: rgba(255,255,255,0.3); height: 8px; border-radius: 4px; overflow: hidden;">
                    <div style="background: #FFD700; height: 100%; width: ${progressPercent}%; transition: width 0.5s;"></div>
                </div>
            </div>

            ${program.spotify ? `
            <div style="margin-top: 16px; padding: 12px; background: rgba(255,255,255,0.15); border-radius: 8px;">
                <a href="${program.spotify.split(': ')[1]}" target="_blank"
                   style="color: white; text-decoration: none; font-weight: 600; font-size: 14px;">
                    🎵 ${program.spotify.split(': ')[0]}: Apri Spotify Playlist →
                </a>
            </div>
            ` : ''}
        </div>

        <!-- Allenamento di Oggi -->
        <div style="background: var(--bg-secondary); border-radius: 12px; padding: 24px; box-shadow: var(--shadow-lg); border: 3px solid var(--success); margin-bottom: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 12px 24px; border-radius: 50px; margin-bottom: 12px;">
                    <span style="font-size: 18px; font-weight: bold; color: #000;">🏋️ ALLENAMENTO DI OGGI</span>
                </div>
                <h3 style="margin: 8px 0 4px 0; color: var(--text-primary); font-size: 20px;">${workout.icon} ${workout.day}</h3>
                <p style="margin: 0; color: var(--text-secondary); font-size: 15px;">${workout.focus}</p>
            </div>

            ${workout.warmup ? `
            <div style="background: rgba(255, 159, 64, 0.1); border-left: 4px solid var(--warning); padding: 14px; border-radius: 8px; margin-bottom: 20px;">
                <strong style="color: var(--text-primary); font-size: 14px;">🔥 ${workout.warmup}</strong>
            </div>
            ` : ''}

            <!-- Esercizi -->
            <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
    `;

    workout.exercises.forEach((ex, idx) => {
        html += `
            <div style="background: var(--bg-tertiary); padding: 16px; border-radius: 10px; border-left: 4px solid var(--accent-primary); box-shadow: var(--shadow-sm);">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <strong style="color: var(--text-primary); font-size: 16px;">${idx + 1}. ${ex.name}</strong>
                        <div style="display: flex; gap: 16px; margin-top: 8px; flex-wrap: wrap;">
                            ${ex.sets ? `<span style="font-size: 14px; color: var(--text-secondary);"><strong>📊 ${ex.sets}</strong></span>` : ''}
                            ${ex.rest ? `<span style="font-size: 14px; color: var(--text-secondary);">⏱️ Riposo: ${ex.rest}</span>` : ''}
                        </div>
                        ${ex.notes ? `<div style="font-size: 13px; color: var(--text-muted); margin-top: 8px; font-style: italic; line-height: 1.5;">💡 ${ex.notes}</div>` : ''}
                        ${ex.video ? `<div style="margin-top: 10px;"><a href="${ex.video}" target="_blank" style="color: var(--info); text-decoration: none; font-size: 13px; font-weight: 600;">📹 Guarda Video Tutorial →</a></div>` : ''}
                    </div>
                </div>
            </div>
        `;
    });

    html += `
            </div>

            ${workout.cooldown ? `
            <div style="background: rgba(75, 192, 192, 0.1); border-left: 4px solid var(--success); padding: 14px; border-radius: 8px; margin-bottom: 20px;">
                <strong style="color: var(--text-primary); font-size: 14px;">🧘 ${workout.cooldown}</strong>
            </div>
            ` : ''}

            <!-- Azioni -->
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 24px;">
                <button onclick="completeWorkout()"
                        style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; border: none;
                               padding: 16px 32px; border-radius: 12px; font-size: 16px; font-weight: bold;
                               cursor: pointer; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3); transition: transform 0.2s;"
                        onmouseover="this.style.transform='scale(1.05)'"
                        onmouseout="this.style.transform='scale(1)'">
                    ✅ Completa Allenamento
                </button>
                <button onclick="skipToNextDay()"
                        style="background: var(--bg-tertiary); color: var(--text-primary); border: 2px solid var(--border-color);
                               padding: 16px 24px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer;">
                    ⏭️ Salta
                </button>
            </div>
        </div>

        <!-- Storico Recente -->
        ${recentWorkouts.length > 0 ? `
        <div style="background: var(--bg-secondary); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 16px 0; color: var(--text-primary); font-size: 16px;">📅 Ultimi Allenamenti Completati</h3>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                ${recentWorkouts.map(w => {
                    const date = new Date(w.date);
                    const formattedDate = formatDate(date);
                    return `
                        <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: var(--text-primary); font-size: 14px;">✅ ${formattedDate}</span>
                            <span style="color: var(--text-secondary); font-size: 13px;">Giorno ${w.dayIndex + 1}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        ` : ''}

        <!-- Note Programma -->
        <div style="background: var(--bg-tertiary); border: 2px solid var(--warning); border-radius: 12px; padding: 20px;">
            <h3 style="margin: 0 0 12px 0; color: var(--text-primary); font-size: 16px;">📝 Note Importanti:</h3>
            <ul style="margin: 0; padding-left: 20px; color: var(--text-secondary); line-height: 1.8;">
                ${program.notes.map(note => `<li style="color: var(--text-primary); font-size: 14px; margin-bottom: 8px;">${note}</li>`).join('')}
            </ul>
        </div>
    `;

    container.innerHTML = html;
}

function getWeightLossProgram() {
    return {
        name: '🔥 WEIGHT LOSS - DIMAGRIMENTO EFFICACE',
        description: 'Programma cardio + forza per bruciare grassi e preservare massa muscolare',
        weeks: 'Programma 8 settimane',
        spotify: '🎵 Playlist: https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP (Fat Burn Workout)',
        days: [
            {
                day: 'LUNEDÌ - FULL BODY STRENGTH + CARDIO',
                icon: '💪',
                focus: 'Forza total body + deficit calorico',
                warmup: '🔥 RISCALDAMENTO (10 min): March in place 3min • Arm circles 2x20 • Bodyweight squats 2x15 • Lunges 2x10',
                exercises: [
                    { name: 'Squat (corpo libero o manubri)', sets: '3×15-20', rest: '60s', notes: 'Focus forma perfetta', video: 'https://youtu.be/aclHkVaku9U' },
                    { name: 'Push-Ups (anche su ginocchia)', sets: '3×10-15', rest: '60s', notes: 'Range completo movimento', video: 'https://youtu.be/IODxDxX7oi4' },
                    { name: 'Dumbbell Rows', sets: '3×12 per lato', rest: '60s', notes: 'Può usare bottiglia acqua', video: 'https://youtu.be/pYcpY20QaE8' },
                    { name: 'Plank', sets: '3×30-60s', rest: '60s', notes: 'Core stabile', video: 'https://youtu.be/pSHjTRCQxIw' },
                    { name: 'CARDIO FINALE: Walk/Jog', sets: '20 min', notes: 'Zona 60-70% FCmax. Conversational pace', video: 'https://youtu.be/brFHyOtTwH4' }
                ],
                cooldown: '🧘 DEFATICAMENTO (10 min): Full body stretch 10min'
            },
            {
                day: 'MARTEDÌ - CARDIO LISS + CORE',
                icon: '🏃',
                focus: 'Cardio brucia grassi bassa intensità',
                warmup: '🔥 RISCALDAMENTO (5 min): Light walking 5min',
                exercises: [
                    { name: 'Camminata Veloce o Cyclette', sets: '40-50 min', notes: '🚶 Outdoor walking preferibile. Zona 60-70% FCmax', video: 'https://youtu.be/1J1eKFW5MJQ' },
                    { name: 'Core Circuit (3 giri):', notes: 'Plank 30s + Russian Twists 20 + Bicycle Crunches 20 + Mountain Climbers 30s', video: 'https://youtu.be/2pLT-olgUJs' }
                ],
                cooldown: '🧘 DEFATICAMENTO (8 min): Hamstring + hip flexor stretch'
            },
            {
                day: 'MERCOLEDÌ - UPPER BODY + HIIT BREVE',
                icon: '💥',
                focus: 'Parte alta + metabolico',
                warmup: '🔥 RISCALDAMENTO (8 min): Arm swings 2x20 • Band pull-aparts 3x15 • Light cardio 3min',
                exercises: [
                    { name: 'Dumbbell Chest Press (panca o pavimento)', sets: '3×12-15', rest: '60s', notes: 'Anche bottiglie acqua', video: 'https://youtu.be/VmB1G1K7v94' },
                    { name: 'Dumbbell Shoulder Press', sets: '3×12-15', rest: '60s', video: 'https://youtu.be/qEwKCR5JCog' },
                    { name: 'Tricep Dips (sedia)', sets: '3×10-15', rest: '60s', notes: 'Gambe piegate se difficile', video: 'https://youtu.be/0326dy_-CzM' },
                    { name: 'Bicep Curls', sets: '3×15', rest: '60s', video: 'https://youtu.be/ykJmrZ5v0Oo' },
                    { name: 'HIIT FINALE: Jumping Jacks + Burpees', sets: '10 min', notes: '30s work / 30s rest. Alternate Jumping Jacks e Burpees (anche su ginocchia)', video: 'https://youtu.be/c_Dq_NCzj8M' }
                ],
                cooldown: '🧘 DEFATICAMENTO (8 min): Upper body stretch'
            },
            {
                day: 'GIOVEDÌ - CARDIO ATTIVO + MOBILITÀ',
                icon: '🚴',
                focus: 'Recupero attivo',
                warmup: '🔥 PREP (5 min): Gentle movement 5min',
                exercises: [
                    { name: 'Yoga Flow o Stretching Dinamico', sets: '30 min', notes: 'Focus mobilità + recovery', video: 'https://youtu.be/g_tea8ZNk5A' },
                    { name: 'Camminata Leggera', sets: '20-30 min', notes: 'Easy pace. Può essere outdoor o treadmill', video: 'https://youtu.be/1J1eKFW5MJQ' }
                ],
                cooldown: '🧘 Deep breathing 5min + foam rolling gambe'
            },
            {
                day: 'VENERDÌ - LOWER BODY + CARDIO',
                icon: '🦵',
                focus: 'Gambe + deficit calorico',
                warmup: '🔥 RISCALDAMENTO (10 min): Leg swings 3x15 • Glute bridges 2x15 • Bodyweight squats 2x15',
                exercises: [
                    { name: 'Goblet Squats', sets: '3×15-20', rest: '60s', notes: 'Manubrio o kettlebell al petto', video: 'https://youtu.be/MeHQ02MOq-U' },
                    { name: 'Lunges (alternati)', sets: '3×20 (10 per gamba)', rest: '60s', notes: 'Zavorra opzionale', video: 'https://youtu.be/QOVaHwm-Q6U' },
                    { name: 'Romanian Deadlift', sets: '3×12-15', rest: '60s', notes: 'Manubri o bilanciere', video: 'https://youtu.be/ScVe6C8YWMI' },
                    { name: 'Glute Bridges', sets: '3×20', rest: '60s', notes: 'Squeeze glutei in alto', video: 'https://youtu.be/wPM8icPu6H8' },
                    { name: 'CARDIO FINALE: Intervals', sets: '15 min', notes: '2min walk + 1min jog. Repeat 5x', video: 'https://youtu.be/6N_b8pTBOvM' }
                ],
                cooldown: '🧘 DEFATICAMENTO (10 min): Leg stretch completo'
            },
            {
                day: 'SABATO - HIIT TOTAL BODY',
                icon: '🔥',
                focus: 'Massima combustione calorica',
                warmup: '🔥 RISCALDAMENTO (10 min): Jump rope 3min • High knees 1min • Butt kicks 1min • Dynamic stretching 5min',
                exercises: [
                    { name: 'HIIT Circuit (4 giri):', notes: 'Burpees 30s + Jump Squats 30s + Mountain Climbers 30s + Plank Jacks 30s + REST 60s. Repeat 4x', video: 'https://youtu.be/2W4ZNSwoW_4' },
                    { name: 'Finisher: 100 Reps Challenge', notes: '25 Push-ups + 25 Squats + 25 Sit-ups + 25 Jumping Jacks. Break as needed ma completa tutto', video: 'https://youtu.be/M0uO8X3_tEA' }
                ],
                cooldown: '🧘 DEFATICAMENTO (10 min): Full body stretch + foam rolling'
            },
            {
                day: 'DOMENICA - RIPOSO ATTIVO o CARDIO LISS',
                icon: '🌳',
                focus: 'Recupero attivo',
                warmup: '🔥 PREP (5 min): Gentle mobility',
                exercises: [
                    { name: 'Opzione 1: Riposo completo', notes: '💤 Solo stretching 15min + meditazione' },
                    { name: 'Opzione 2: Camminata lunga', sets: '60-90 min', notes: '🌲 Escursione, passeggiata parco, esplorazione città. Piacevole, non faticosa', video: 'https://youtu.be/1J1eKFW5MJQ' },
                    { name: 'Opzione 3: Attività ricreativa', notes: '🚴 Bici, nuoto, sport con famiglia. Divertimento, non allenamento' }
                ],
                cooldown: '🧘 Evening stretching + preparazione pasti settimana'
            }
        ],
        notes: [
            '🔥 **Deficit Calorico**: Target -300/-500 kcal al giorno. Peso ogni settimana stessa ora',
            '🍽️ **Nutrizione Chiave**: Proteine 1.8g/kg per preservare muscoli. Carboidrati moderati, grassi sani',
            '💧 **Idratazione**: Minimo 2.5L acqua/giorno. Più in giorni HIIT',
            '😴 **Sonno Critico**: 7-9 ore. Deficit sonno = cortisolo alto = grasso addominale',
            '📊 **Tracking**: Foto settimanali + misure (vita, fianchi, cosce). Bilancia può mentire con ritenzione',
            '⚖️ **Progressione**: Settimana 1-2 (adattamento) | 3-4 (intensifica) | 5-6 (peak) | 7-8 (consolidamento)',
            '🎯 **Obiettivo Realistico**: 0.5-1kg/settimana. Più veloce = perdi muscoli',
            '💪 **Forza Priority**: Mantieni i pesi/reps strength work. Se perdi forza, mangi troppo poco'
        ]
    };
}

function checkCalorieAlert() {
    if (!goal) return;

    const today = getTodayString();
    const todayMeals = meals.filter(m => m.date === today);
    const totalCalories = todayMeals.reduce((sum, m) => sum + (parseInt(m.calories) || 0), 0);

    const alertDiv = document.getElementById('calorie-alert');

    if (totalCalories > goal.calorieTarget) {
        const excess = totalCalories - goal.calorieTarget;
        alertDiv.innerHTML = `<strong>⚠️ Attenzione!</strong> Hai superato il target calorico di ${excess} kcal.`;
        alertDiv.style.display = 'block';
    } else {
        alertDiv.style.display = 'none';
    }
}

// ===========================
// DIET MANAGEMENT
// ===========================

const DIET_PLANS = {
    'mediterranea': {
        name: '🥗 Dieta Mediterranea',
        description: 'Bilanciata e sostenibile - ~1800-2000 kcal/giorno',
        macros: { carbs: '50-55%', protein: '15-20%', fat: '25-30%' },
        meals: {
            colazione: [
                '80g Avena integrale',
                '200ml Latte parzialmente scremato',
                '1 Banana (120g)',
                '10g Noci',
                '1 Caffè'
            ],
            pranzo: [
                '80g Pasta integrale (peso crudo)',
                '150g Pomodori freschi',
                '1 cucchiaio Olio d\'oliva (10ml)',
                '30g Parmigiano',
                '200g Insalata mista',
                '1 Mela (150g)'
            ],
            cena: [
                '150g Pesce (salmone/branzino)',
                '200g Verdure grigliate',
                '50g Pane integrale',
                '1 cucchiaio Olio d\'oliva',
                '1 Arancia (200g)'
            ],
            spuntini: [
                '150g Yogurt greco',
                '20g Mandorle',
                '1 Frutto di stagione'
            ]
        }
    },
    'lowcarb': {
        name: '🥩 Low-Carb',
        description: 'Basso contenuto carboidrati - ~1600-1800 kcal/giorno',
        macros: { carbs: '20-30%', protein: '30-35%', fat: '40-45%' },
        meals: {
            colazione: [
                '3 Uova strapazzate',
                '50g Prosciutto crudo',
                '100g Avocado',
                '50g Pomodorini',
                '1 Caffè con panna (20ml)'
            ],
            pranzo: [
                '200g Petto di pollo',
                '150g Broccoli al vapore',
                '100g Zucchine',
                '2 cucchiai Olio d\'oliva',
                '30g Parmigiano'
            ],
            cena: [
                '180g Salmone',
                '200g Insalata verde',
                '100g Asparagi',
                '1 cucchiaio Burro/Olio',
                '30g Noci'
            ],
            spuntini: [
                '50g Formaggio',
                '30g Mandorle',
                '100g Cetrioli'
            ]
        }
    },
    'highprotein': {
        name: '💪 High-Protein',
        description: 'Alto contenuto proteico - ~1900-2100 kcal/giorno',
        macros: { carbs: '30-35%', protein: '35-40%', fat: '25-30%' },
        meals: {
            colazione: [
                '150g Yogurt greco 0%',
                '40g Proteine whey',
                '50g Avena',
                '1 Banana',
                '15g Burro arachidi'
            ],
            pranzo: [
                '200g Petto di tacchino',
                '100g Riso basmati (crudo)',
                '150g Verdure miste',
                '200g Lenticchie',
                '1 cucchiaio Olio'
            ],
            cena: [
                '200g Tonno/Salmone',
                '150g Patate dolci',
                '200g Spinaci',
                '3 Albumi d\'uovo',
                '100g Quinoa'
            ],
            spuntini: [
                '200g Ricotta light',
                '2 Uova sode',
                '30g Noci/Mandorle'
            ]
        }
    },
    'vegetariana': {
        name: '🌱 Vegetariana',
        description: 'Senza carne - ~1800-2000 kcal/giorno',
        macros: { carbs: '50-55%', protein: '15-20%', fat: '25-30%' },
        meals: {
            colazione: [
                '80g Muesli integrale',
                '200ml Latte di soia',
                '1 Mela',
                '20g Semi di chia',
                '1 Caffè'
            ],
            pranzo: [
                '100g Ceci (secchi)',
                '80g Quinoa',
                '200g Verdure grigliate',
                '50g Feta',
                '1 cucchiaio Olio',
                '1 Pera'
            ],
            cena: [
                '150g Tofu',
                '100g Riso integrale',
                '150g Broccoli',
                '100g Carote',
                '30g Anacardi',
                '200g Pomodori'
            ],
            spuntini: [
                '150g Hummus',
                '100g Carote crude',
                '1 Frutto',
                '20g Noci'
            ]
        }
    },
    'intermittent': {
        name: '⏰ Digiuno Intermittente 16/8',
        description: 'Finestra 08:00-16:00 - ~1700-1900 kcal/giorno',
        macros: { carbs: '45-50%', protein: '25-30%', fat: '25-30%' },
        meals: {
            colazione: [
                'PRIMA COLAZIONE alle 08:00 (fine digiuno)',
                'Acqua/Tè/Caffè senza zucchero durante il digiuno'
            ],
            pranzo: [
                '100g Pasta integrale',
                '150g Pollo',
                '200g Verdure',
                '1 cucchiaio Olio',
                '50g Pane',
                '1 Mela'
            ],
            cena: [
                'ULTIMO PASTO entro le 16:00',
                '180g Pesce o 150g Carne',
                '150g Patate o riso',
                '200g Insalata',
                '100g Legumi'
            ],
            spuntini: [
                '(Solo tra 08:00-16:00)',
                '150g Yogurt greco',
                '1 Frutto',
                '20g Mandorle'
            ]
        }
    }
};

function selectDiet(dietType) {
    selectedDiet = dietType;
    saveData();
    closeModal('modal-diet');
    loadSelectedDiet();
    alert(`✅ Hai selezionato: ${DIET_PLANS[dietType].name}`);
}

function loadSelectedDiet() {
    const dietInfo = document.getElementById('selected-diet-info');

    if (!selectedDiet) {
        dietInfo.innerHTML = '<p class="empty-state">Nessuna dieta selezionata. Scegli un piano alimentare!</p>';
        return;
    }

    const diet = DIET_PLANS[selectedDiet];

    dietInfo.innerHTML = `
        <h3>${diet.name}</h3>
        <p><strong>${diet.description}</strong></p>
        <div style="margin: 16px 0;">
            <strong>Macronutrienti:</strong>
            <ul>
                <li>Carboidrati: ${diet.macros.carbs}</li>
                <li>Proteine: ${diet.macros.protein}</li>
                <li>Grassi: ${diet.macros.fat}</li>
            </ul>
        </div>
        <div style="margin-top: 20px;">
            <strong>📋 Piano Pasti Giornaliero:</strong>

            <div style="margin: 16px 0; padding: 12px; background: var(--bg-tertiary); border-left: 4px solid var(--info); border-radius: 4px; color: var(--text-primary);">
                <strong style="color: var(--text-primary);">🥐 COLAZIONE:</strong>
                <ul style="margin-top: 8px; color: var(--text-primary);">
                    ${diet.meals.colazione.map(m => `<li style="color: var(--text-primary);">${m}</li>`).join('')}
                </ul>
            </div>

            <div style="margin: 16px 0; padding: 12px; background: var(--bg-tertiary); border-left: 4px solid var(--warning); border-radius: 4px; color: var(--text-primary);">
                <strong style="color: var(--text-primary);">🍝 PRANZO:</strong>
                <ul style="margin-top: 8px; color: var(--text-primary);">
                    ${diet.meals.pranzo.map(m => `<li style="color: var(--text-primary);">${m}</li>`).join('')}
                </ul>
            </div>

            <div style="margin: 16px 0; padding: 12px; background: var(--bg-tertiary); border-left: 4px solid var(--success); border-radius: 4px; color: var(--text-primary);">
                <strong style="color: var(--text-primary);">🍖 CENA:</strong>
                <ul style="margin-top: 8px; color: var(--text-primary);">
                    ${diet.meals.cena.map(m => `<li style="color: var(--text-primary);">${m}</li>`).join('')}
                </ul>
            </div>

            <div style="margin: 16px 0; padding: 12px; background: var(--bg-tertiary); border-left: 4px solid var(--danger); border-radius: 4px; color: var(--text-primary);">
                <strong style="color: var(--text-primary);">🍎 SPUNTINI:</strong>
                <ul style="margin-top: 8px; color: var(--text-primary);">
                    ${diet.meals.spuntini.map(m => `<li style="color: var(--text-primary);">${m}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

function showDietModal() {
    document.getElementById('modal-diet').style.display = 'flex';
}

// ===========================
// ADAPTIVE SYSTEM - TODAY'S PLAN
// ===========================

function getDayOfWeek() {
    const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    return days[new Date().getDay()];
}

function getWeekStart() {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Lunedì
    return new Date(today.setDate(diff)).toISOString().split('T')[0];
}

function loadTodaysPlan() {
    const section = document.getElementById('today-plan-section');
    if (!section) return;
    section.style.display = 'block';

    // Guard: if anything hides this section, immediately re-show it
    if (!section._visibilityGuard) {
        section._visibilityGuard = new MutationObserver(function() {
            if (section.style.display === 'none') {
                console.warn('[today-plan-section] was hidden by unknown code — re-showing');
                section.style.display = 'block';
            }
        });
        section._visibilityGuard.observe(section, { attributes: true, attributeFilter: ['style'] });
    }

    // Fallback: read goal from localStorage in case global variable was not updated
    const currentGoal = goal || JSON.parse(localStorage.getItem(`goal_${currentUser}`) || 'null');
    if (!currentGoal) {
        // Show message WITHOUT destroying child DOM elements (they're needed when goal is set later)
        const dayName = document.getElementById('today-day-name');
        const workoutContent = document.getElementById('today-workout-content');
        const mealsContent = document.getElementById('today-meals-content');
        if (dayName) dayName.textContent = '';
        if (workoutContent) workoutContent.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-muted);">⚙️ Imposta il tuo obiettivo per vedere il piano di oggi.</div>';
        if (mealsContent) mealsContent.innerHTML = '';
        return;
    }
    // Sync global variable if it was stale
    if (!goal && currentGoal) goal = currentGoal;

    document.getElementById('today-plan-section').style.display = 'block';
    document.getElementById('today-day-name').textContent = getDayOfWeek();

    const today = getTodayString();

    // Check if today's plan already exists
    if (!dailyTracking[today]) {
        dailyTracking[today] = {
            meals: selectedDiet ? generateTodayMeals() : null,
            workout: generateTodayWorkout(),
            mealsConfirmed: false,
            workoutConfirmed: false,
            actualMeals: [],
            actualWorkout: null
        };
        saveData();
    } else if (dailyTracking[today].workout === undefined) {
        // Regenerate workout if missing
        dailyTracking[today].workout = generateTodayWorkout();
        saveData();
    }

    displayTodaysPlan(dailyTracking[today]);
}

function generateTodayMeals() {
    if (!selectedDiet || !DIET_PLANS[selectedDiet]) return null;

    const diet = DIET_PLANS[selectedDiet];
    const targetCalories = goal ? goal.calorieTarget : 2000;

    // Calculate accumulated deficit this week
    const weekDeficit = calculateWeeklyDeficit();
    const daysLeft = 7 - new Date().getDay();
    const compensation = daysLeft > 0 ? Math.round(weekDeficit / daysLeft) : 0;

    // Adjust today's calories
    const adjustedCalories = targetCalories - compensation;

    return {
        colazione: diet.meals.colazione,
        pranzo: diet.meals.pranzo,
        cena: diet.meals.cena,
        spuntini: diet.meals.spuntini,
        totalCalories: adjustedCalories,
        compensation: compensation
    };
}

function generateTodayWorkout() {
    const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

    if (!goal) return { rest: true, day: getDayOfWeek() };

    // Build workout schedule based on activityLevel
    // 1.2 = sedentary, 1.375 = 1-3d, 1.55 = 3-5d, 1.725 = 6-7d, 1.9 = every day
    const level = goal.activityLevel || 1.375;
    let activeDays; // array of JS getDay() values with workouts
    if (level <= 1.2) {
        activeDays = []; // no workouts
    } else if (level <= 1.375) {
        activeDays = [1, 3, 5]; // Mon, Wed, Fri
    } else if (level <= 1.55) {
        activeDays = [1, 2, 4, 5, 6]; // Mon, Tue, Thu, Fri, Sat
    } else if (level <= 1.725) {
        activeDays = [1, 2, 3, 4, 5, 6]; // Mon-Sat
    } else {
        activeDays = [0, 1, 2, 3, 4, 5, 6]; // every day
    }

    // Map active day → workout plan index (0-based within active days)
    const workoutDayNames = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
    const daySlot = activeDays.indexOf(dayOfWeek);

    if (daySlot === -1) {
        return { rest: true, day: getDayOfWeek() };
    }

    // Rotate through workoutPlans using the slot index
    const planIndex = daySlot % 4;
    const workoutDays = [ // keep original structure for plan lookup
        null,
        { day: 'Lunedì', index: 0 },
        null,
        { day: 'Mercoledì', index: 1 },
        null,
        { day: 'Venerdì', index: 2 },
        { day: 'Sabato', index: 3 }
    ];
    const dayLabel = workoutDayNames[dayOfWeek];

    if (!workoutDays[dayOfWeek]) {
        // Day not in original map — use planIndex
        workoutDays[dayOfWeek] = { day: dayLabel, index: planIndex };
    }

    // Get workout from the weekly plan generated earlier
    const exerciseCaloriesDaily = Math.round((goal.weeklyGoal * 7700 * 0.4) / 5);

    const workoutPlans = {
        0: { // Lunedì
            focus: 'Cardio + Gambe',
            exercises: [
                { name: 'Treadmill', duration: 60, distance: 6, calories: exerciseCaloriesDaily },
                { name: 'Leg Press', sets: '3×12', calories: 80 },
                { name: 'Squat', sets: '3×15', calories: 70 }
            ]
        },
        1: { // Mercoledì
            focus: 'Parte Superiore',
            exercises: [
                { name: 'Cyclette', duration: 77, calories: exerciseCaloriesDaily },
                { name: 'Chest Press', sets: '3×12', calories: 90 },
                { name: 'Shoulder Press', sets: '3×10', calories: 80 }
            ]
        },
        2: { // Venerdì
            focus: 'Cardio HIIT',
            exercises: [
                { name: 'Cyclette HIIT', duration: 30, calories: Math.round(exerciseCaloriesDaily * 0.7) },
                { name: 'Treadmill', duration: 20, distance: 2, calories: Math.round(exerciseCaloriesDaily * 0.3) }
            ]
        },
        3: { // Sabato
            focus: 'Braccia + Core',
            exercises: [
                { name: 'Treadmill', duration: 60, distance: 6, calories: Math.round(exerciseCaloriesDaily * 0.6) },
                { name: 'Bicep Curl', sets: '3×12', calories: 60 },
                { name: 'Tricep Extension', sets: '3×12', calories: 60 }
            ]
        }
    };

    const todayWorkout = workoutPlans[workoutDays[dayOfWeek].index];
    if (todayWorkout) {
        todayWorkout.day = workoutDays[dayOfWeek].day;
        todayWorkout.totalCalories = todayWorkout.exercises.reduce((sum, ex) => sum + ex.calories, 0);
    }

    return todayWorkout || { rest: true, day: getDayOfWeek() };
}

function displayTodaysPlan(plan) {
    // Display meals (only if diet is selected)
    if (plan.meals && selectedDiet) {
        const mealsContent = document.getElementById('today-meals-content');
        let html = '';

        if (plan.meals.compensation !== 0) {
            html += `<div style="background: var(--bg-tertiary); border: 2px solid ${plan.meals.compensation < 0 ? 'var(--warning)' : 'var(--success)'}; padding: 12px; border-radius: 6px; margin-bottom: 12px; color: var(--text-primary);">
                <strong style="color: var(--text-primary);">${plan.meals.compensation < 0 ? '⬆️ Compensazione' : '⬇️ Riduci'}:</strong>
                ${Math.abs(plan.meals.compensation)} kcal per bilanciare settimana
            </div>`;
        }

        html += `<p style="margin-bottom: 12px; color: var(--text-primary);"><strong>Target Oggi: ${plan.meals.totalCalories} kcal</strong></p>`;

        ['colazione', 'pranzo', 'cena', 'spuntini'].forEach(tipo => {
            const icon = { colazione: '🥐', pranzo: '🍝', cena: '🍖', spuntini: '🍎' }[tipo];
            html += `<div style="margin: 16px 0; padding: 12px; background: var(--bg-tertiary); border-radius: 6px; color: var(--text-primary);">
                <strong style="color: var(--text-primary);">${icon} ${tipo.toUpperCase()}:</strong>
                <ul style="margin: 8px 0; padding-left: 20px; color: var(--text-primary);">
                    ${plan.meals[tipo].map(m => `<li style="color: var(--text-primary);">${m}</li>`).join('')}
                </ul>
            </div>`;
        });

        mealsContent.innerHTML = html;
        document.getElementById('meal-plan-calories').textContent = `${plan.meals.totalCalories} kcal`;
    }

    // Display workout
    if (plan.workout) {
        const workoutContent = document.getElementById('today-workout-content');

        if (plan.workout.rest) {
            workoutContent.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--success);"><strong>🛌 Giorno di Riposo</strong><br>Recupera le energie!</p>';
            document.getElementById('workout-plan-calories').textContent = '0 kcal';
        } else {
            let html = `<p><strong>${plan.workout.focus}</strong></p><div style="margin-top: 12px;">`;

            plan.workout.exercises.forEach(ex => {
                html += `<div style="margin: 12px 0; padding: 12px; background: var(--bg-tertiary); border-radius: 6px;">
                    <strong style="color: var(--text-primary);">${ex.name}</strong>
                    ${ex.duration ? `<div style="font-size: 14px; color: var(--text-secondary);">⏱️ ${ex.duration} min${ex.distance ? ` • ${ex.distance} km` : ''}</div>` : ''}
                    ${ex.sets ? `<div style="font-size: 14px; color: var(--text-secondary);">💪 ${ex.sets}</div>` : ''}
                    <div style="color: var(--warning); font-weight: bold;">${ex.calories} kcal</div>
                </div>`;
            });

            html += '</div>';
            workoutContent.innerHTML = html;
            document.getElementById('workout-plan-calories').textContent = `${plan.workout.totalCalories} kcal`;
        }
    }
}

function confirmMealPlan() {
    const today = getTodayString();
    if (!dailyTracking[today]) return;

    dailyTracking[today].mealsConfirmed = true;
    dailyTracking[today].actualMeals = dailyTracking[today].meals;
    saveData();

    alert('✅ Pasti confermati! Ottimo lavoro!');
    updateDailySummary();
    updateWeeklyChart();
}

function modifyMealPlan() {
    alert('📝 Usa "Aggiungi Pasto" per registrare cosa hai mangiato.\n\nIl sistema calcolerà automaticamente la differenza!');
    // The existing meal tracking system handles this
}

function confirmWorkoutPlan() {
    const today = getTodayString();
    if (!dailyTracking[today]) return;

    dailyTracking[today].workoutConfirmed = true;
    dailyTracking[today].actualWorkout = dailyTracking[today].workout;
    saveData();

    alert('✅ Allenamento confermato! Ottimo lavoro!');
    updateDailySummary();
    updateWeeklyChart();
}

function modifyWorkoutPlan() {
    alert('📝 Usa "Aggiungi Attività" per registrare cosa hai fatto.\n\nIl sistema calcolerà automaticamente la differenza!');
    // The existing activity tracking system handles this
}

function calculateWeeklyDeficit() {
    const weekStart = getWeekStart();
    let totalDeficit = 0;

    // Calculate deficit for each day of the week
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        if (dailyTracking[dateStr]) {
            const planned = calculatePlannedCalories(dailyTracking[dateStr]);
            const actual = calculateActualCalories(dateStr);
            totalDeficit += (planned - actual);
        }
    }

    return totalDeficit;
}

function calculatePlannedCalories(dayPlan) {
    let total = 0;
    if (dayPlan.meals) total -= dayPlan.meals.totalCalories;
    if (dayPlan.workout && !dayPlan.workout.rest) total += dayPlan.workout.totalCalories;
    return Math.abs(total);
}

function calculateActualCalories(dateStr) {
    // Calculate from actual meals and activities
    const dayMeals = meals.filter(m => m.date === dateStr);
    const dayActivities = activities.filter(a => a.date === dateStr);
    const daySteps = dailySteps[dateStr];

    const consumed = dayMeals.reduce((sum, m) => sum + (parseInt(m.calories) || 0), 0);
    const burned = dayActivities.reduce((sum, a) => sum + (parseInt(a.calories) || 0), 0);
    const stepsBurned = daySteps ? daySteps.calories : 0;

    return consumed - burned - stepsBurned; // Include steps in deficit
}

function updateDailySummary() {
    const today = getTodayString();
    const todayPlan = dailyTracking[today];

    if (!todayPlan) return;

    const planned = calculatePlannedCalories(todayPlan);
    const actual = calculateActualCalories(today);
    const delta = actual - planned;

    document.getElementById('summary-planned').textContent = `${planned} kcal`;
    document.getElementById('summary-actual').textContent = `${actual} kcal`;
    document.getElementById('summary-delta').textContent = `${delta >= 0 ? '+' : ''}${delta} kcal`;

    const deltaStat = document.getElementById('summary-delta-stat');
    if (delta > 0) {
        deltaStat.classList.add('negative');
        deltaStat.classList.remove('positive');
    } else if (delta < 0) {
        deltaStat.classList.add('positive');
        deltaStat.classList.remove('negative');
    }

    // Show compensation message
    const compMessage = document.getElementById('compensation-message');
    if (Math.abs(delta) > 100) {
        compMessage.style.display = 'block';
        if (delta > 0) {
            compMessage.innerHTML = `<strong>⚠️ Oggi hai consumato ${delta} kcal in più.</strong><br>
                Suggerimento: Domani riduci di ${Math.round(delta/2)} kcal o aggiungi ${Math.round(delta/10)} min cardio.`;
        } else {
            compMessage.innerHTML = `<strong>✅ Ottimo! Sei sotto di ${Math.abs(delta)} kcal!</strong><br>
                Continua così, sei sulla strada giusta!`;
        }
    } else {
        compMessage.style.display = 'none';
    }
}

// ===========================
// MOTIVATIONAL MESSAGES
// ===========================

const ENCOURAGEMENT_MESSAGES = {
    excellent: [
        '🏆 Fantastico! Sei un campione! Continua così!',
        '⭐ Eccezionale! I risultati parlano chiaro!',
        '💪 Stai dominando! Questo è il tuo momento!',
        '🔥 Inarrestabile! Sei sulla strada giusta!',
        '🎯 Precisione millimetrica! Obiettivo centrato!',
        '👏 Bravissimo/a! Stai facendo un lavoro incredibile!',
        '🌟 Sei una stella! Questi risultati sono meravigliosi!',
        '💎 Prezioso/a! Ogni giorno dimostri il tuo valore!'
    ],
    good: [
        '✅ Ottimo lavoro! Stai andando benissimo!',
        '😊 Molto bene! Continua su questa strada!',
        '👍 Bravo/a! I progressi si vedono!',
        '💚 Bel ritmo! Stai facendo la differenza!',
        '🌱 Crescita costante! Ogni passo conta!',
        '⚡ Energia positiva! Stai andando alla grande!',
        '🎨 Stai dipingendo il tuo successo, pennellata dopo pennellata!',
        '🚀 Decollo riuscito! Destinazione: obiettivo!'
    ],
    moderate: [
        '💛 Buon inizio! Ora accelera un po\'!',
        '📈 Stai migliorando! Non mollare ora!',
        '🔶 Ritmo sostenibile, ma puoi dare di più!',
        '⚠️ Attenzione al dettaglio! Piccoli aggiustamenti fanno la differenza!',
        '🎯 Riaggiusta la mira! Sei vicino all\'obiettivo!',
        '💡 Serve una spinta in più! Ce la puoi fare!',
        '🌤️ Qualche nuvola, ma il sole è vicino! Continua!',
        '⏰ È il momento di intensificare! Forza!'
    ],
    needsImprovement: [
        '💙 Non scoraggiarti! Domani è un nuovo giorno!',
        '🌟 Ogni grande successo inizia con un passo! Riparti!',
        '💪 Le sfide ti rendono più forte! Non arrenderti!',
        '🔄 Reset e ripartenza! Hai tutto per riuscire!',
        '🌈 Dopo la pioggia viene il sole! Continua a lottare!',
        '🎭 Cambia strategia se serve! Sei in grado di adattarti!',
        '🧭 Ricalibra la rotta! La destinazione è ancora là!',
        '❤️ Credi in te! Hai la forza per farcela!'
    ],
    recovery: [
        '🔥 Recupero fantastico! Ecco la determinazione!',
        '🦅 Come una fenice! Risorto/a più forte di prima!',
        '⚡ Rimonta spettacolare! Questo è spirito vincente!',
        '💥 Boom! Da difficoltà a trionfo!',
        '🌟 Reazione da campione/ssa! Orgoglioso/a di te!',
        '🎯 Inversione perfetta! Questo è carattere!',
        '👑 La caduta del re/regina è solo per rialzarsi più in alto!',
        '🚀 Turbo attivato! Rimonta incredibile!'
    ],
    streak: [
        '🔥 {days} giorni di fila! Sei in fiamme!',
        '⭐ {days} giorni consecutivi! La costanza paga!',
        '💪 Streak di {days} giorni! Inarrestabile!',
        '🎯 {days} giorni perfetti! Questa è disciplina!',
        '👏 {days} giorni di successo! Sei un esempio!',
        '🌟 {days} giorni stellari! Continua la serie!',
        '🏆 {days} giorni da campione! Record personale!',
        '💎 {days} giorni preziosi! Ogni giorno conta!'
    ]
};

function getMotivationalMessage(progress, previousProgress = 0, streak = 0) {
    let messages = [];

    // Streak messages (priority)
    if (streak >= 3) {
        const streakMsg = ENCOURAGEMENT_MESSAGES.streak[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.streak.length)]
            .replace('{days}', streak);
        return streakMsg;
    }

    // Recovery messages (if improving from bad to good)
    if (previousProgress < 50 && progress >= 80) {
        messages = ENCOURAGEMENT_MESSAGES.recovery;
    }
    // Performance-based messages
    else if (progress >= 100) {
        messages = ENCOURAGEMENT_MESSAGES.excellent;
    } else if (progress >= 80) {
        messages = ENCOURAGEMENT_MESSAGES.good;
    } else if (progress >= 50) {
        messages = ENCOURAGEMENT_MESSAGES.moderate;
    } else {
        messages = ENCOURAGEMENT_MESSAGES.needsImprovement;
    }

    return messages[Math.floor(Math.random() * messages.length)];
}

function calculateStreak() {
    if (!goal) return 0;

    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        if (dailyTracking[dateStr] && (dailyTracking[dateStr].mealsConfirmed || dailyTracking[dateStr].workoutConfirmed)) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

function updateWeeklyChart() {
    if (!goal) return;

    const chartContainer = document.getElementById('weekly-deficit-chart');
    const weekStart = getWeekStart();
    const targetWeeklyDeficit = goal.weeklyGoal * 7700;
    const days = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

    let html = '';
    let totalActualDeficit = 0;

    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const dayPlan = dailyTracking[dateStr];

        const plannedDeficit = targetWeeklyDeficit / 7;
        const actualDeficit = dayPlan ? (calculatePlannedCalories(dayPlan) - calculateActualCalories(dateStr)) : 0;

        totalActualDeficit += actualDeficit;

        const actualHeight = Math.min(Math.max((actualDeficit / (targetWeeklyDeficit / 7)) * 80, 15), 100);

        html += `
            <div class="chart-bar">
                <div class="bar-container">
                    <div class="bar-actual" style="height: ${actualHeight}px;"></div>
                </div>
                <div class="bar-label">${days[i]}</div>
            </div>
        `;
    }

    chartContainer.innerHTML = html;

    // Update week summary
    document.getElementById('week-total-deficit').textContent = Math.round(totalActualDeficit);
    document.getElementById('week-target-deficit').textContent = Math.round(targetWeeklyDeficit);

    const progress = (totalActualDeficit / targetWeeklyDeficit) * 100;
    const previousProgress = parseFloat(localStorage.getItem(`previousProgress_${currentUser}`) || '0');
    const streak = calculateStreak();

    const paceMessage = document.getElementById('week-pace-message');
    const motivationalMsg = getMotivationalMessage(progress, previousProgress, streak);

    let color = '#f44336';
    if (progress >= 100) color = '#4CAF50';
    else if (progress >= 80) color = '#4CAF50';
    else if (progress >= 50) color = '#FF9800';

    paceMessage.innerHTML = `<strong>${motivationalMsg}</strong>`;
    paceMessage.style.color = color;

    // Save current progress for next comparison
    localStorage.setItem(`previousProgress_${currentUser}`, progress.toString());
}

// ===========================
// PERSONAL RECORDS (MASSIMALI)
// ===========================

let personalRecords = JSON.parse(localStorage.getItem(`pr_${currentUser}`) || '[]');

window.showPRModal = function() {
    document.getElementById('pr-date').valueAsDate = new Date();
    document.getElementById('modal-pr').style.display = 'flex';
};

window.togglePRFields = function() {
    const type = document.getElementById('pr-type').value;

    document.getElementById('pr-weight-field').style.display = type === 'weight' ? 'block' : 'none';
    document.getElementById('pr-reps-field').style.display = type === 'reps' ? 'block' : 'none';
    document.getElementById('pr-time-field').style.display = type === 'time' ? 'block' : 'none';
};

document.getElementById('form-add-pr')?.addEventListener('submit', (e) => {
    e.preventDefault();

    const exercise = document.getElementById('pr-exercise').value;
    const type = document.getElementById('pr-type').value;
    const date = document.getElementById('pr-date').value;
    const notes = document.getElementById('pr-notes').value;

    let value, unit;
    if (type === 'weight') {
        value = parseFloat(document.getElementById('pr-weight-value').value);
        unit = 'kg';
    } else if (type === 'reps') {
        value = parseInt(document.getElementById('pr-reps-value').value);
        unit = 'reps';
    } else {
        value = parseInt(document.getElementById('pr-time-value').value);
        unit = 's';
    }

    const pr = {
        id: Date.now().toString(),
        exercise,
        type,
        value,
        unit,
        date,
        notes,
        timestamp: new Date().toISOString()
    };

    personalRecords.push(pr);
    localStorage.setItem(`pr_${currentUser}`, JSON.stringify(personalRecords));

    alert(`💪 Nuovo PR registrato!\n\n${getExerciseName(exercise)}: ${value} ${unit}`);

    closeModal('modal-pr');
    document.getElementById('form-add-pr').reset();
    loadPersonalRecords();
});

function getExerciseName(key) {
    const names = {
        'squat': 'Squat',
        'bench': 'Panca Piana',
        'deadlift': 'Stacco',
        'overhead-press': 'Overhead Press',
        'pull-ups': 'Pull-Ups',
        'dips': 'Dips',
        'muscle-ups': 'Muscle-Ups',
        'front-lever': 'Front Lever',
        'planche': 'Planche',
        'handstand': 'Handstand',
        'l-sit': 'L-Sit'
    };
    return names[key] || key;
}

function loadPersonalRecords() {
    const container = document.getElementById('pr-list');
    if (!container) return;

    // Sezione sempre visibile
    const section = document.getElementById('pr-section');
    if (section) section.style.display = 'block';

    if (personalRecords.length === 0) {
        container.innerHTML = '<p class="empty-state">Nessun massimale registrato</p>';
        return;
    }

    // Group by exercise and get latest
    const latestPRs = {};
    personalRecords.forEach(pr => {
        if (!latestPRs[pr.exercise] || new Date(pr.date) > new Date(latestPRs[pr.exercise].date)) {
            latestPRs[pr.exercise] = pr;
        }
    });

    container.innerHTML = Object.values(latestPRs).map(pr => `
        <div class="pr-card">
            <button onclick="deletePR('${pr.id}')" class="pr-card-delete" title="Elimina">🗑️</button>
            <div class="pr-card-header">${getExerciseName(pr.exercise)}</div>
            <div class="pr-card-value">${pr.value} ${pr.unit}</div>
            <div class="pr-card-date">${formatDate(pr.date)}</div>
            ${pr.notes ? `<div style="margin-top: 8px; font-size: 12px; opacity: 0.9;">${pr.notes}</div>` : ''}
        </div>
    `).join('');
}

window.deletePR = function(id) {
    if (confirm('🗑️ Eliminare questo record?')) {
        personalRecords = personalRecords.filter(pr => pr.id !== id);
        localStorage.setItem(`pr_${currentUser}`, JSON.stringify(personalRecords));
        loadPersonalRecords();
    }
};

// ===========================
// PROGRESS PHOTOS
// ===========================

let progressPhotos = JSON.parse(localStorage.getItem(`photos_${currentUser}`) || '[]');
let dailySteps = JSON.parse(localStorage.getItem(`dailySteps_${currentUser}`) || '{}');

window.showPhotoModal = function() {
    document.getElementById('photo-date').valueAsDate = new Date();
    document.getElementById('modal-photo').style.display = 'flex';
};

document.getElementById('form-add-photo')?.addEventListener('submit', (e) => {
    e.preventDefault();

    const fileInput = document.getElementById('photo-file');
    const type = document.getElementById('photo-type').value;
    const date = document.getElementById('photo-date').value;
    const notes = document.getElementById('photo-notes').value;

    if (!fileInput.files[0]) {
        alert('⚠️ Seleziona una foto');
        return;
    }

    const file = fileInput.files[0];
    if (file.size > 5 * 1024 * 1024) {
        alert('⚠️ File troppo grande! Max 5MB');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const photo = {
            id: Date.now().toString(),
            type,
            date,
            notes,
            imageData: event.target.result,
            timestamp: new Date().toISOString()
        };

        progressPhotos.push(photo);
        localStorage.setItem(`photos_${currentUser}`, JSON.stringify(progressPhotos));

        alert('📸 Foto salvata!');
        closeModal('modal-photo');
        document.getElementById('form-add-photo').reset();
        loadProgressPhotos();
    };

    reader.readAsDataURL(file);
});

function loadProgressPhotos() {
    const container = document.getElementById('photos-grid');
    if (!container) return;

    // Sezione sempre visibile
    const section = document.getElementById('photos-section');
    if (section) section.style.display = 'block';

    if (progressPhotos.length === 0) {
        container.innerHTML = '<p class="empty-state">Nessuna foto caricata</p>';
        return;
    }

    // Sort by date descending
    const sortedPhotos = [...progressPhotos].sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = sortedPhotos.map(photo => {
        const typeLabels = {
            'front': '📷 Frontale',
            'side': '📐 Laterale',
            'back': '🔙 Posteriore',
            'other': '📸 Altro'
        };

        return `
            <div class="photo-card">
                <img src="${photo.imageData}" class="photo-card-img" alt="Progress photo">
                <div class="photo-card-body">
                    <div class="photo-card-date">${formatDate(photo.date)}</div>
                    <div class="photo-card-type">${typeLabels[photo.type]}</div>
                    ${photo.notes ? `<div class="photo-card-notes">${photo.notes}</div>` : ''}
                    <div class="photo-card-actions">
                        <button onclick="deletePhoto('${photo.id}')" class="btn-icon" title="Elimina">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

window.deletePhoto = function(id) {
    if (confirm('🗑️ Eliminare questa foto?')) {
        progressPhotos = progressPhotos.filter(p => p.id !== id);
        localStorage.setItem(`photos_${currentUser}`, JSON.stringify(progressPhotos));
        loadProgressPhotos();
    }
};

// ===========================
// DAILY STEPS (ACTIVITY EXTRA)
// ===========================

window.showDailyStepsModal = function() {
    document.getElementById('daily-steps-date').valueAsDate = new Date();

    // Pre-fill if already has data for today
    const today = getTodayString();
    if (dailySteps[today]) {
        document.getElementById('daily-steps-input').value = dailySteps[today].steps;
    }

    document.getElementById('modal-daily-steps').style.display = 'flex';
};

// Calculate steps calories on input
document.addEventListener('DOMContentLoaded', () => {
    const stepsInput = document.getElementById('daily-steps-input');
    if (stepsInput) {
        stepsInput.addEventListener('input', () => {
            updateStepsCaloriesPreview();
        });
    }
});

function updateStepsCaloriesPreview() {
    const steps = parseInt(document.getElementById('daily-steps-input')?.value) || 0;

    if (steps === 0) {
        document.getElementById('steps-calories-preview').textContent = '-- kcal';
        return;
    }

    // Get current weight
    let weight = 70; // default
    if (weights.length > 0) {
        const sortedWeights = [...weights].sort((a, b) => new Date(b.date) - new Date(a.date));
        weight = sortedWeights[0].weight;
    }

    // Formula: steps × weight × 0.04 kcal
    const calories = Math.round(steps * weight * 0.04);
    document.getElementById('steps-calories-preview').textContent = `${calories} kcal`;
}

document.getElementById('form-daily-steps')?.addEventListener('submit', (e) => {
    e.preventDefault();

    const steps = parseInt(document.getElementById('daily-steps-input').value);
    const date = document.getElementById('daily-steps-date').value;

    // Get current weight for calculation
    let weight = 70; // default
    if (weights.length > 0) {
        const sortedWeights = [...weights].sort((a, b) => new Date(b.date) - new Date(a.date));
        weight = sortedWeights[0].weight;
    }

    // Calculate calories (steps × weight × 0.04)
    const calories = Math.round(steps * weight * 0.04);

    dailySteps[date] = {
        steps,
        calories,
        weight,
        timestamp: new Date().toISOString()
    };

    localStorage.setItem(`dailySteps_${currentUser}`, JSON.stringify(dailySteps));

    alert(`✅ Passi registrati!\n\n👟 ${steps.toLocaleString()} passi\n🔥 ${calories} kcal extra bruciate`);

    closeModal('modal-daily-steps');
    loadDailySteps();
    updateDailySummary(); // Update to include steps calories
});

function loadDailySteps() {
    const today = getTodayString();
    const todaySteps = dailySteps[today];

    if (!todaySteps) {
        document.getElementById('daily-steps').textContent = '0 passi';
        document.getElementById('daily-steps-calories').textContent = '0 kcal extra';
        return;
    }

    document.getElementById('daily-steps').textContent = `${todaySteps.steps.toLocaleString()} passi`;
    document.getElementById('daily-steps-calories').textContent = `${todaySteps.calories} kcal extra`;
}

// ===========================
// MODIFY WORKOUT FUNCTIONALITY
// ===========================

window.modifyWorkoutPlan = function() {
    const today = getTodayString();
    if (!dailyTracking[today] || !dailyTracking[today].workout) return;

    const plannedWorkout = dailyTracking[today].workout;

    if (plannedWorkout.rest) {
        alert('📝 È un giorno di riposo!\n\nSe hai fatto allenamento, usa "Aggiungi Attività" per registrarlo.');
        return;
    }

    // Show custom prompt with planned workout
    let message = '🏋️ Allenamento Pianificato:\n\n';
    plannedWorkout.exercises.forEach((ex, idx) => {
        message += `${idx + 1}. ${ex.name}`;
        if (ex.duration) message += ` - ${ex.duration} min`;
        if (ex.sets) message += ` - ${ex.sets}`;
        message += '\n';
    });

    message += '\n📝 Hai fatto un allenamento diverso?\n\n';
    message += 'Usa il pulsante "Aggiungi Attività" sotto per registrare quello che hai fatto realmente.\n\n';
    message += 'Esempio:\n';
    message += '• Programma: 30 min treadmill\n';
    message += '• Reale: 60 min corsa → Registra attività "Corsa - 60 min"\n\n';
    message += 'Il sistema calcolerà automaticamente la differenza e aggiornerà il riepilogo!';

    alert(message);
};

// ===========================
// CLOUD SYNC UI FUNCTIONS
// ===========================

window.enableCloudSync = async function() {
    try {
        // Call Firebase sign-in (defined in firebase-sync.js)
        if (typeof window.signInWithFirebase !== 'function') {
            alert('❌ Errore: modulo Firebase non caricato\n\nRicarica la pagina e riprova.');
            return;
        }

        const success = await window.signInWithFirebase();

        // updateCloudSyncUI already called inside handleFirebaseSignIn with correct timestamp

    } catch (error) {
        console.error('Errore abilitazione Cloud Sync:', error);
        alert('❌ Errore durante l\'attivazione Cloud Sync\n\n' + error.message);
    }
};

window.disableCloudSync = async function() {
    if (!confirm('⚠️ Disabilitare Cloud Sync?\n\nI dati rimarranno salvati localmente, ma non verranno più sincronizzati.')) {
        return;
    }

    try {
        // Call Firebase sign-out (defined in firebase-sync.js)
        if (typeof window.signOutFromFirebase === 'function') {
            await window.signOutFromFirebase();
        }

        updateCloudSyncUI(false);
        alert('✅ Cloud Sync disabilitato');

    } catch (error) {
        console.error('Errore disabilitazione Cloud Sync:', error);
        alert('❌ Errore durante la disabilitazione');
    }
};

window.updateCloudSyncUI = function(enabled, userEmail = null, lastSync = null) {
    const btn = document.getElementById('cloud-sync-btn');
    const status = document.getElementById('cloud-sync-status');
    const emailSpan = document.getElementById('cloud-user-email');
    const lastSyncSpan = document.getElementById('cloud-last-sync');

    if (!btn || !status) return;

    if (enabled) {
        btn.style.display = 'none';
        status.style.display = 'block';

        if (userEmail && emailSpan) {
            emailSpan.textContent = userEmail;
        }

        if (lastSync && lastSyncSpan) {
            lastSyncSpan.textContent = new Date(lastSync).toLocaleString('it-IT');
        } else if (lastSyncSpan) {
            lastSyncSpan.textContent = 'In corso...';
        }
    } else {
        btn.style.display = 'block';
        status.style.display = 'none';
    }
}

// Check Cloud Sync status on load (one-time check, no listener)
window.addEventListener('load', () => {
    setTimeout(() => {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const user = firebase.auth().currentUser;
            if (user) {
                const lastSync = localStorage.getItem(`last_firebase_sync_${currentUser}`);
                updateCloudSyncUI(true, user.email, lastSync);
            }
        }
    }, 1500);
});

// ===========================
// CSV IMPORT/EXPORT
// ===========================

window.exportDataCSV = function() {
    // Create CSV with all data
    let csv = 'Type,Date,Description,Value,Calories,Notes\n';

    // Meals
    meals.forEach(m => {
        csv += `Meal,${m.date},${m.type},${m.description},${m.calories || 0},"${m.timestamp}"\n`;
    });

    // Activities
    activities.forEach(a => {
        csv += `Activity,${a.date},${a.type},${a.duration} min,${a.calories},"${a.notes || ''}"\n`;
    });

    // Weights
    weights.forEach(w => {
        csv += `Weight,${w.date},${w.weight} kg,,,\n`;
    });

    // Personal Records
    personalRecords.forEach(pr => {
        csv += `PR,${pr.date},${pr.exercise},${pr.value} ${pr.unit},,"${pr.notes || ''}"\n`;
    });

    // Download file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VALAHIA_DIET_GYM_${currentUser}_${getTodayString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    alert('📥 Dati esportati!\n\nFile CSV scaricato con tutti i tuoi dati.');
};

window.showImportModal = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            importDataCSV(file);
        }
    };
    input.click();
};

function importDataCSV(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const csv = e.target.result;
        const lines = csv.split('\n');

        let imported = 0;

        lines.forEach((line, index) => {
            if (index === 0 || !line.trim()) return; // Skip header

            const parts = line.split(',');
            const type = parts[0];
            const date = parts[1];

            try {
                if (type === 'Meal') {
                    meals.push({
                        id: Date.now().toString() + imported,
                        date: date,
                        type: parts[2],
                        description: parts[3],
                        calories: parseInt(parts[4]) || 0,
                        timestamp: new Date().toISOString()
                    });
                    imported++;
                } else if (type === 'Activity') {
                    activities.push({
                        id: Date.now().toString() + imported,
                        date: date,
                        type: parts[2],
                        duration: parseInt(parts[3]),
                        calories: parseInt(parts[4]) || 0,
                        notes: parts[5]?.replace(/"/g, '') || '',
                        timestamp: new Date().toISOString()
                    });
                    imported++;
                } else if (type === 'Weight') {
                    weights.push({
                        id: Date.now().toString() + imported,
                        date: date,
                        weight: parseFloat(parts[2]),
                        timestamp: new Date().toISOString()
                    });
                    imported++;
                }
            } catch (err) {
                console.error('Import error line', index, err);
            }
        });

        saveData();
        init(); // Reload all

        alert(`✅ Import completato!\n\n${imported} record importati con successo.`);
    };

    reader.readAsText(file);
}

// ===========================
// INITIALIZE ON LOAD
// ===========================
function init() {
    // Display current user
    const userNames = {
        'gabriel': '👨 Gabriel',
        'cristina': '👩 Cristina',
        'alex': '💪 Alex',
        'diana': '🏃 Diana'
    };
    document.getElementById('current-user').textContent = userNames[currentUser] || currentUser;

    // Display current date
    document.getElementById('current-date').textContent = formatDate(new Date());

    // Set today's date in weight modal
    document.getElementById('weight-date').valueAsDate = new Date();

    // Load data
    loadTodayMeals();
    loadTodayCalories();
    loadTodayActivities();
    loadTodayActivityStats();
    loadCurrentWeight();
    loadWeightChart();
    loadGoalStatus();
    loadSelectedDiet();
    updateGoalProgress();
    checkCalorieAlert();

    // Load today's adaptive plan
    loadTodaysPlan();
    updateDailySummary();
    updateWeeklyChart();

    // Load PR and Photos
    loadPersonalRecords();
    loadProgressPhotos();

    // Load daily steps
    loadDailySteps();

    // Load interactive charts and badges
    initializeCharts();
    initializeBadges();
    updateCharts();

    // Load today's workout (Personal Trainer)
    displayTodaysWorkout();
    updateBadges();

    // Initialize notification system
    initializeNotifications();

    // Initialize new advanced features
    initializeAdvancedFeatures();
    loadBodyMeasurements();
    loadWaterIntake();
    updateMacros();
    updatePerformanceMetrics();

    // Health Connect (Android native app only)
    initHealthConnect();
}

// ========================================
// ADVANCED FEATURES INITIALIZATION
// ========================================

function initializeAdvancedFeatures() {
    // Mostra sempre tutte le sezioni avanzate (non richiedono goal)
    const always = ['timer-section', 'water-section', 'strength-section', 'macros-section',
                    'performance-section', 'measurements-section'];
    always.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'block';
    });
}

// ========================================
// WORKOUT TIMER
// ========================================

let timerInterval = null;
let timerSeconds = 0;
let timerRunning = false;

function setTimer(seconds, label) {
    resetTimer();
    timerSeconds = seconds;
    updateTimerDisplay();
    document.getElementById('timer-label').textContent = label;
}

function setCustomTimer() {
    const minutes = parseInt(document.getElementById('custom-minutes').value) || 0;
    const seconds = parseInt(document.getElementById('custom-seconds').value) || 0;
    const totalSeconds = (minutes * 60) + seconds;

    if (totalSeconds > 0) {
        setTimer(totalSeconds, 'Custom Timer');
    }
}

function startWorkTimer() {
    if (timerRunning) return;

    // Check if timer has time set
    if (timerSeconds <= 0) {
        alert('⚠️ Imposta prima un tempo! Clicca un preset o imposta timer personalizzato.');
        return;
    }

    timerRunning = true;
    document.getElementById('timer-label').textContent = 'In Corso...';

    timerInterval = setInterval(() => {
        timerSeconds--;

        if (timerSeconds <= 0) {
            timerComplete();
        } else {
            updateTimerDisplay();
        }
    }, 1000);
}

function pauseTimer() {
    if (!timerRunning) return;

    timerRunning = false;
    clearInterval(timerInterval);
    document.getElementById('timer-label').textContent = 'In Pausa';
}

function resetTimer() {
    timerRunning = false;
    clearInterval(timerInterval);
    timerSeconds = 0;
    updateTimerDisplay();
    document.getElementById('timer-label').textContent = 'Pronto';
}

function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    document.getElementById('timer-display').textContent =
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function timerComplete() {
    resetTimer();
    document.getElementById('timer-label').textContent = '✅ Completato!';

    // Play sound if enabled
    const soundEnabled = document.getElementById('timer-sound-enabled').checked;
    if (soundEnabled) {
        playTimerSound();
    }

    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⏰ Timer Completato!', {
            body: 'Il tuo timer è terminato',
            icon: 'icon-192.png'
        });
    }

    // Visual alert
    const timerDisplay = document.querySelector('.timer-display');
    timerDisplay.style.animation = 'pulse 0.5s ease 3';
    setTimeout(() => {
        timerDisplay.style.animation = '';
    }, 1500);
}

function playTimerSound() {
    // Create simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

// ========================================
// PERFORMANCE METRICS
// ========================================

function updatePerformanceMetrics() {
    const last7Days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last7Days.push(formatDate(date));
    }

    // Calculate total volume (kg lifted)
    let totalVolume = 0;
    let totalWorkouts = 0;

    last7Days.forEach(date => {
        const activities = getActivitiesByDate(date);
        activities.forEach(activity => {
            // Extract sets x reps x weight from description
            // Example: "Squat 5x5 100kg" -> 5*5*100 = 2500kg
            const match = activity.description.match(/(\d+)\s*x\s*(\d+)\s*x?\s*(\d+\.?\d*)\s*kg/i);
            if (match) {
                const sets = parseInt(match[1]);
                const reps = parseInt(match[2]);
                const weight = parseFloat(match[3]);
                totalVolume += sets * reps * weight;
            }
            totalWorkouts++;
        });
    });

    document.getElementById('total-volume').textContent = totalVolume.toLocaleString() + ' kg';
    document.getElementById('workout-frequency').textContent = totalWorkouts + '/7';

    // Calculate progressive overload (compare with previous week)
    // For simplicity, we'll show a placeholder
    document.getElementById('progressive-overload').textContent = '+12%';
    document.getElementById('avg-intensity').textContent = '75%';
}

// ========================================
// BODY MEASUREMENTS
// ========================================

function loadBodyMeasurements() {
    const measurements = JSON.parse(localStorage.getItem(`measurements_${currentUser}`)) || [];

    if (measurements.length === 0) {
        return;
    }

    // Get latest measurement
    const latest = measurements[measurements.length - 1];

    // Update display
    document.getElementById('biceps-value').textContent = latest.biceps ? latest.biceps + ' cm' : '-- cm';
    document.getElementById('thighs-value').textContent = latest.thighs ? latest.thighs + ' cm' : '-- cm';
    document.getElementById('chest-value').textContent = latest.chest ? latest.chest + ' cm' : '-- cm';
    document.getElementById('waist-value').textContent = latest.waist ? latest.waist + ' cm' : '-- cm';
    document.getElementById('forearms-value').textContent = latest.forearms ? latest.forearms + ' cm' : '-- cm';
    document.getElementById('glutes-value').textContent = latest.glutes ? latest.glutes + ' cm' : '-- cm';

    // Calculate changes if there's a previous measurement
    if (measurements.length >= 2) {
        const previous = measurements[measurements.length - 2];
        updateMeasurementChange('biceps', latest.biceps, previous.biceps);
        updateMeasurementChange('thighs', latest.thighs, previous.thighs);
        updateMeasurementChange('chest', latest.chest, previous.chest);
        updateMeasurementChange('waist', latest.waist, previous.waist);
        updateMeasurementChange('forearms', latest.forearms, previous.forearms);
        updateMeasurementChange('glutes', latest.glutes, previous.glutes);
    }
}

function updateMeasurementChange(part, current, previous) {
    if (!current || !previous) return;

    const change = current - previous;
    const changeEl = document.getElementById(part + '-change');

    if (Math.abs(change) < 0.1) {
        changeEl.textContent = '=';
        changeEl.className = 'measurement-change';
        return;
    }

    if (change > 0) {
        changeEl.textContent = `+${change.toFixed(1)} cm`;
        changeEl.className = 'measurement-change positive';
    } else {
        changeEl.textContent = `${change.toFixed(1)} cm`;
        changeEl.className = 'measurement-change negative';
    }
}

window.showMeasurementsModal = function() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>📏 Aggiungi Misure</h2>
                <button class="btn-close" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <form onsubmit="saveMeasurements(event)" style="padding: 20px;">
                <div class="form-group">
                    <label for="meas-biceps">💪 Bicipiti (cm)</label>
                    <input type="number" id="meas-biceps" step="0.1" min="0">
                </div>
                <div class="form-group">
                    <label for="meas-chest">🫁 Petto (cm)</label>
                    <input type="number" id="meas-chest" step="0.1" min="0">
                </div>
                <div class="form-group">
                    <label for="meas-waist">🔲 Vita (cm)</label>
                    <input type="number" id="meas-waist" step="0.1" min="0">
                </div>
                <div class="form-group">
                    <label for="meas-thighs">🦵 Cosce (cm)</label>
                    <input type="number" id="meas-thighs" step="0.1" min="0">
                </div>
                <div class="form-group">
                    <label for="meas-forearms">🦾 Avambracci (cm)</label>
                    <input type="number" id="meas-forearms" step="0.1" min="0">
                </div>
                <div class="form-group">
                    <label for="meas-glutes">🍑 Glutei (cm)</label>
                    <input type="number" id="meas-glutes" step="0.1" min="0">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">💾 Salva</button>
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">❌ Annulla</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
};

window.saveMeasurements = function(event) {
    event.preventDefault();

    const measurement = {
        date: formatDate(new Date()),
        biceps: parseFloat(document.getElementById('meas-biceps').value) || null,
        chest: parseFloat(document.getElementById('meas-chest').value) || null,
        waist: parseFloat(document.getElementById('meas-waist').value) || null,
        thighs: parseFloat(document.getElementById('meas-thighs').value) || null,
        forearms: parseFloat(document.getElementById('meas-forearms').value) || null,
        glutes: parseFloat(document.getElementById('meas-glutes').value) || null
    };

    const measurements = JSON.parse(localStorage.getItem(`measurements_${currentUser}`)) || [];
    measurements.push(measurement);
    localStorage.setItem(`measurements_${currentUser}`, JSON.stringify(measurements));

    alert('✅ Misure salvate!');
    document.querySelector('.modal').remove();
    loadBodyMeasurements();
};

// ========================================
// MACRO TRACKING
// ========================================

function updateMacros() {
    const goal = getGoal();
    if (!goal) return;

    const todayDate = formatDate(new Date());
    const meals = getMealsByDate(todayDate);

    // Get macro data from meals (if available)
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    let totalCalories = 0;

    meals.forEach(meal => {
        if (meal.macros) {
            totalProtein += meal.macros.protein || 0;
            totalCarbs += meal.macros.carbs || 0;
            totalFats += meal.macros.fats || 0;
        }
        totalCalories += meal.calories;
    });

    // Calculate targets based on TDEE
    const proteinTarget = Math.round((goal.tdee * 0.30) / 4); // 30% from protein (4 kcal/g)
    const carbsTarget = Math.round((goal.tdee * 0.40) / 4);   // 40% from carbs (4 kcal/g)
    const fatsTarget = Math.round((goal.tdee * 0.30) / 9);    // 30% from fats (9 kcal/g)

    // Update display
    document.getElementById('total-kcal-macros').textContent = totalCalories;
    document.getElementById('protein-amount').textContent = `${totalProtein}g / ${proteinTarget}g`;
    document.getElementById('carbs-amount').textContent = `${totalCarbs}g / ${carbsTarget}g`;
    document.getElementById('fats-amount').textContent = `${totalFats}g / ${fatsTarget}g`;

    // Update progress bars
    document.getElementById('protein-progress').style.width = Math.min(100, (totalProtein / proteinTarget) * 100) + '%';
    document.getElementById('carbs-progress').style.width = Math.min(100, (totalCarbs / carbsTarget) * 100) + '%';
    document.getElementById('fats-progress').style.width = Math.min(100, (totalFats / fatsTarget) * 100) + '%';

    // Update donut chart (if Chart.js available)
    updateMacrosChart(totalProtein * 4, totalCarbs * 4, totalFats * 9);
}

function updateMacrosChart(proteinKcal, carbsKcal, fatsKcal) {
    const ctx = document.getElementById('macrosChart');
    if (!ctx) return;

    // Simple canvas drawing for donut chart
    const canvas = ctx.getContext('2d');
    const centerX = 100;
    const centerY = 100;
    const radius = 80;
    const innerRadius = 50;

    const total = proteinKcal + carbsKcal + fatsKcal;
    if (total === 0) return;

    // Clear canvas
    canvas.clearRect(0, 0, 200, 200);

    // Draw segments
    let currentAngle = -Math.PI / 2;

    // Protein (green)
    const proteinAngle = (proteinKcal / total) * 2 * Math.PI;
    drawDonutSegment(canvas, centerX, centerY, radius, innerRadius, currentAngle, currentAngle + proteinAngle, '#4CAF50');
    currentAngle += proteinAngle;

    // Carbs (blue)
    const carbsAngle = (carbsKcal / total) * 2 * Math.PI;
    drawDonutSegment(canvas, centerX, centerY, radius, innerRadius, currentAngle, currentAngle + carbsAngle, '#2196F3');
    currentAngle += carbsAngle;

    // Fats (orange)
    const fatsAngle = (fatsKcal / total) * 2 * Math.PI;
    drawDonutSegment(canvas, centerX, centerY, radius, innerRadius, currentAngle, currentAngle + fatsAngle, '#FF9800');
}

function drawDonutSegment(ctx, x, y, outerRadius, innerRadius, startAngle, endAngle, color) {
    ctx.beginPath();
    ctx.arc(x, y, outerRadius, startAngle, endAngle);
    ctx.arc(x, y, innerRadius, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

// ========================================
// 1RM CALCULATOR
// ========================================

window.calculate1RM = function() {
    const weight = parseFloat(document.getElementById('rm-weight').value);
    const reps = parseInt(document.getElementById('rm-reps').value);

    if (!weight || !reps || reps < 1 || reps > 20) {
        alert('⚠️ Inserisci valori validi (peso > 0, reps 1-20)');
        return;
    }

    // Epley Formula: 1RM = weight * (1 + reps/30)
    const oneRM = weight * (1 + reps / 30);

    // Display results
    document.getElementById('rm-results').style.display = 'block';
    document.getElementById('rm-1rm').textContent = oneRM.toFixed(1) + ' kg';

    // Calculate percentages
    document.getElementById('rm-95').textContent = (oneRM * 0.95).toFixed(1) + ' kg';
    document.getElementById('rm-90').textContent = (oneRM * 0.90).toFixed(1) + ' kg';
    document.getElementById('rm-85').textContent = (oneRM * 0.85).toFixed(1) + ' kg';
    document.getElementById('rm-80').textContent = (oneRM * 0.80).toFixed(1) + ' kg';
    document.getElementById('rm-75').textContent = (oneRM * 0.75).toFixed(1) + ' kg';
    document.getElementById('rm-70').textContent = (oneRM * 0.70).toFixed(1) + ' kg';

    // Scroll to results
    document.getElementById('rm-results').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

// ========================================
// ZEPP/AMAZFIT INTEGRATION
// ========================================

window.connectZepp = function() {
    alert('🚧 Funzionalità in sviluppo!\n\nPer ora puoi:\n1. Esportare dati da Zepp App\n2. Importare manualmente tramite CSV\n\nIntegrazione API Zepp in arrivo nella v2.0');

    // Placeholder for future Zepp API integration
    // Will require Zepp OAuth and API keys
};

window.showZeppImportModal = function() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>⌚ Importa da Zepp</h2>
                <button class="btn-close" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <div style="padding: 20px;">
                <p style="color: var(--text-secondary); margin-bottom: 16px;">
                    Esporta i dati da Zepp App e carica il file CSV qui:
                </p>

                <ol style="color: var(--text-secondary); margin-bottom: 20px; line-height: 1.8;">
                    <li>Apri Zepp App sul telefono</li>
                    <li>Vai in Profilo → Impostazioni → Esporta Dati</li>
                    <li>Seleziona periodo e dati da esportare</li>
                    <li>Salva il file CSV</li>
                    <li>Carica il file qui sotto</li>
                </ol>

                <input type="file" accept=".csv" id="zepp-file-input" class="form-control">

                <div class="form-actions" style="margin-top: 20px;">
                    <button onclick="importZeppData()" class="btn-primary">📤 Importa Dati</button>
                    <button onclick="this.closest('.modal').remove()" class="btn-secondary">❌ Annulla</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.importZeppData = function() {
    const fileInput = document.getElementById('zepp-file-input');
    const file = fileInput.files[0];

    if (!file) {
        alert('⚠️ Seleziona un file CSV');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const csv = e.target.result;
        parseZeppCSV(csv);
    };
    reader.readAsText(file);
};

function parseZeppCSV(csv) {
    // Basic CSV parsing (simplified)
    const lines = csv.split('\n');
    const headers = lines[0].split(',');

    let imported = 0;

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length < 2) continue;

        // Example: parse steps data
        // Format: Date, Steps, HeartRate, Calories, etc.
        const date = values[0];
        const steps = parseInt(values[1]);

        if (steps) {
            // Add to daily steps
            const stepsData = JSON.parse(localStorage.getItem(`dailySteps_${currentUser}`)) || {};
            stepsData[date] = { steps, source: 'zepp' };
            localStorage.setItem(`dailySteps_${currentUser}`, JSON.stringify(stepsData));
            imported++;
        }
    }

    alert(`✅ Importati ${imported} record da Zepp!`);
    document.querySelector('.modal').remove();
    loadDailySteps();
};

// ========================================
// WATER INTAKE TRACKER
// ========================================

function loadWaterIntake() {
    const todayDate = formatDate(new Date());
    const waterData = JSON.parse(localStorage.getItem(`water_${currentUser}`)) || {};
    const todayWater = waterData[todayDate] || 0;
    const target = parseInt(localStorage.getItem(`waterTarget_${currentUser}`)) || 2500;

    document.getElementById('water-amount').textContent = todayWater + ' ml';
    document.getElementById('water-target').textContent = target + ' ml';
    document.getElementById('water-target-slider').value = target;

    // Update fill percentage
    const fillPercentage = Math.min(100, (todayWater / target) * 100);
    document.getElementById('water-fill').style.height = fillPercentage + '%';
}

window.addWater = function(amount) {
    const todayDate = formatDate(new Date());
    const waterData = JSON.parse(localStorage.getItem(`water_${currentUser}`)) || {};
    waterData[todayDate] = (waterData[todayDate] || 0) + amount;
    localStorage.setItem(`water_${currentUser}`, JSON.stringify(waterData));

    loadWaterIntake();

    // Check if target reached
    const target = parseInt(localStorage.getItem(`waterTarget_${currentUser}`)) || 2500;
    if (waterData[todayDate] >= target && waterData[todayDate] - amount < target) {
        showNotification('💧 Obiettivo Idratazione Raggiunto!', 'Ottimo lavoro! Hai bevuto abbastanza acqua oggi.');
    }
};

window.updateWaterTarget = function(value) {
    localStorage.setItem(`waterTarget_${currentUser}`, value);
    loadWaterIntake();
};

window.resetWater = function() {
    if (!confirm('⚠️ Vuoi resettare il conteggio acqua di oggi?')) return;

    const todayDate = formatDate(new Date());
    const waterData = JSON.parse(localStorage.getItem(`water_${currentUser}`)) || {};
    waterData[todayDate] = 0;
    localStorage.setItem(`water_${currentUser}`, JSON.stringify(waterData));

    loadWaterIntake();
};

// ========================================
// SHOPPING LIST
// ========================================

window.generateShoppingList = function() {
    const goal = getGoal();
    if (!goal) return;

    // Customize based on goal type
    const proteins = goal.type === 'muscle-gain'
        ? ['Pollo petto: 2kg', 'Uova: 18 pz', 'Tonno: 6 scatolette', 'Carne rossa magra: 1kg', 'Salmone: 500g']
        : ['Pollo petto: 1kg', 'Uova: 12 pz', 'Tonno: 4 scatolette', 'Ricotta: 500g'];

    const carbs = goal.type === 'muscle-gain'
        ? ['Riso integrale: 2kg', 'Avena: 1kg', 'Pane integrale: 2 pacchi', 'Patate dolci: 2kg', 'Pasta integrale: 1kg']
        : ['Riso integrale: 500g', 'Avena: 500g', 'Pane integrale: 1 pacco', 'Patate dolci: 1kg'];

    document.getElementById('shopping-proteins').innerHTML = proteins.map(item =>
        `<li onclick="toggleChecked(this)">${item}</li>`
    ).join('');

    document.getElementById('shopping-carbs').innerHTML = carbs.map(item =>
        `<li onclick="toggleChecked(this)">${item}</li>`
    ).join('');

    alert('✅ Lista spesa aggiornata in base al tuo obiettivo!');
};

window.toggleChecked = function(element) {
    element.classList.toggle('checked');
};

window.printShoppingList = function() {
    window.print();
};

window.shareShoppingList = function() {
    const proteins = Array.from(document.querySelectorAll('#shopping-proteins li'))
        .map(li => '- ' + li.textContent).join('\n');
    const carbs = Array.from(document.querySelectorAll('#shopping-carbs li'))
        .map(li => '- ' + li.textContent).join('\n');

    const text = `🛒 LISTA SPESA VALAHIA DIET GYM\n\n🥚 PROTEINE:\n${proteins}\n\n🍚 CARBOIDRATI:\n${carbs}`;

    if (navigator.share) {
        navigator.share({
            title: 'Lista Spesa Settimanale',
            text: text
        });
    } else {
        navigator.clipboard.writeText(text);
        alert('✅ Lista copiata negli appunti!');
    }
};

// ========================================
// INTERACTIVE CHARTS WITH CHART.JS
// ========================================

let weightChartInstance = null;
let caloriesChartInstance = null;
let prChartInstance = null;
let activityChartInstance = null;

// Initialize all charts
function initializeCharts() {
    // Mostra sempre grafici e PR chart
    const chartsSection = document.getElementById('charts-section');
    if (chartsSection) chartsSection.style.display = 'block';
    const prChartCard = document.getElementById('pr-chart-card');
    if (prChartCard) prChartCard.style.display = 'block';
}

// Update all charts with latest data
function updateCharts() {
    updateWeightChart();
    updateCaloriesChart();
    updateActivityChart();

    const goal = getGoal();
    if (goal && (goal.type === 'muscle-gain' || goal.type === 'performance')) {
        updatePRChart();
    }
}

// Weight Progress Chart (30 days)
function updateWeightChart() {
    const ctx = document.getElementById('weightChart');
    if (!ctx) return;

    const weights = getAllWeights();
    const goal = getGoal();

    // Get last 30 days
    const last30Days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last30Days.push(formatDate(date));
    }

    // Map weights to dates
    const weightData = last30Days.map(date => {
        const weight = weights.find(w => w.date === date);
        return weight ? weight.weight : null;
    });

    // Goal line
    const goalWeight = goal ? goal.targetWeight : null;
    const goalData = last30Days.map(() => goalWeight);

    // Destroy existing chart
    if (weightChartInstance) {
        weightChartInstance.destroy();
    }

    // Create new chart
    weightChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last30Days.map(date => {
                const d = new Date(date.split('/').reverse().join('-'));
                return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
            }),
            datasets: [
                {
                    label: 'Peso Attuale',
                    data: weightData,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#4CAF50',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                },
                {
                    label: 'Obiettivo',
                    data: goalData,
                    borderColor: '#2196F3',
                    borderDash: [5, 5],
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    callbacks: {
                        label: function(context) {
                            if (context.raw === null) return null;
                            return context.dataset.label + ': ' + context.raw + ' kg';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return value + ' kg';
                        },
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim()
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim(),
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Calorie Deficit Chart (7 days)
function updateCaloriesChart() {
    const ctx = document.getElementById('caloriesChart');
    if (!ctx) return;

    const last7Days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last7Days.push(formatDate(date));
    }

    const intakeData = [];
    const burnedData = [];

    last7Days.forEach(date => {
        const meals = getMealsByDate(date);
        const activities = getActivitiesByDate(date);

        const intake = meals.reduce((sum, meal) => sum + meal.calories, 0);
        const burned = activities.reduce((sum, act) => sum + act.calories, 0);

        intakeData.push(intake);
        burnedData.push(burned);
    });

    if (caloriesChartInstance) {
        caloriesChartInstance.destroy();
    }

    caloriesChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: last7Days.map(date => {
                const d = new Date(date.split('/').reverse().join('-'));
                return d.toLocaleDateString('it-IT', { weekday: 'short' });
            }),
            datasets: [
                {
                    label: 'Calorie Intake',
                    data: intakeData,
                    backgroundColor: 'rgba(255, 152, 0, 0.7)',
                    borderColor: '#FF9800',
                    borderWidth: 2,
                    borderRadius: 8
                },
                {
                    label: 'Calorie Bruciate',
                    data: burnedData,
                    backgroundColor: 'rgba(76, 175, 80, 0.7)',
                    borderColor: '#4CAF50',
                    borderWidth: 2,
                    borderRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.raw + ' kcal';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + ' kcal';
                        },
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim()
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Activity Distribution Chart (7 days)
function updateActivityChart() {
    const ctx = document.getElementById('activityChart');
    if (!ctx) return;

    const last7Days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last7Days.push(formatDate(date));
    }

    const activityMinutes = [];

    last7Days.forEach(date => {
        const activities = getActivitiesByDate(date);
        const totalMinutes = activities.reduce((sum, act) => {
            // Extract minutes from description (e.g., "30 min" -> 30)
            const match = act.description.match(/(\d+)\s*min/i);
            return sum + (match ? parseInt(match[1]) : 0);
        }, 0);
        activityMinutes.push(totalMinutes);
    });

    if (activityChartInstance) {
        activityChartInstance.destroy();
    }

    activityChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days.map(date => {
                const d = new Date(date.split('/').reverse().join('-'));
                return d.toLocaleDateString('it-IT', { weekday: 'short' });
            }),
            datasets: [
                {
                    label: 'Minuti di Attività',
                    data: activityMinutes,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return 'Minuti: ' + context.raw;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + ' min';
                        },
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim()
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// PR Progress Chart (for muscle-gain/performance users)
function updatePRChart() {
    const ctx = document.getElementById('prChart');
    if (!ctx) return;

    const prs = getPersonalRecords();

    if (prs.length === 0) {
        // Show empty state
        if (prChartInstance) {
            prChartInstance.destroy();
            prChartInstance = null;
        }
        return;
    }

    // Group PRs by exercise
    const prByExercise = {};
    prs.forEach(pr => {
        if (!prByExercise[pr.exercise]) {
            prByExercise[pr.exercise] = [];
        }
        prByExercise[pr.exercise].push(pr);
    });

    // Sort each exercise by date
    Object.keys(prByExercise).forEach(exercise => {
        prByExercise[exercise].sort((a, b) => {
            const dateA = new Date(a.date.split('/').reverse().join('-'));
            const dateB = new Date(b.date.split('/').reverse().join('-'));
            return dateA - dateB;
        });
    });

    // Populate selector
    const selector = document.getElementById('pr-chart-selector');
    selector.innerHTML = '<option value="all">Tutti i PR</option>';
    Object.keys(prByExercise).forEach(exercise => {
        const option = document.createElement('option');
        option.value = exercise;
        option.textContent = exercise;
        selector.appendChild(option);
    });

    // Get selected exercise or show all
    const selectedExercise = selector.value;
    const datasets = [];

    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'];
    let colorIndex = 0;

    if (selectedExercise === 'all') {
        // Show all exercises
        Object.keys(prByExercise).forEach(exercise => {
            const data = prByExercise[exercise];
            datasets.push({
                label: exercise,
                data: data.map(pr => ({
                    x: pr.date,
                    y: parseFloat(pr.value)
                })),
                borderColor: colors[colorIndex % colors.length],
                backgroundColor: colors[colorIndex % colors.length] + '33',
                tension: 0.4,
                pointRadius: 4
            });
            colorIndex++;
        });
    } else {
        // Show single exercise
        const data = prByExercise[selectedExercise];
        datasets.push({
            label: selectedExercise,
            data: data.map(pr => ({
                x: pr.date,
                y: parseFloat(pr.value)
            })),
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8
        });
    }

    if (prChartInstance) {
        prChartInstance.destroy();
    }

    prChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'nearest',
                intersect: false
            },
            plugins: {
                legend: {
                    display: selectedExercise === 'all',
                    position: 'top',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.raw.y + ' kg';
                        },
                        title: function(context) {
                            return context[0].raw.x;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return value + ' kg';
                        },
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim()
                    }
                },
                x: {
                    type: 'category',
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    // Add event listener to selector
    selector.onchange = updatePRChart;
}

// Helper functions for chart data
function getMealsByDate(date) {
    const meals = JSON.parse(localStorage.getItem(`meals_${currentUser}`)) || [];
    return meals.filter(meal => meal.date === date);
}

function getActivitiesByDate(date) {
    const activities = JSON.parse(localStorage.getItem(`activities_${currentUser}`)) || [];
    return activities.filter(activity => activity.date === date);
}

function getAllWeights() {
    return JSON.parse(localStorage.getItem(`weights_${currentUser}`)) || [];
}

function getPersonalRecords() {
    return JSON.parse(localStorage.getItem(`pr_${currentUser}`)) || [];
}

// ========================================
// BADGES & ACHIEVEMENTS SYSTEM
// ========================================

const BADGES = [
    // Streak badges
    {
        id: 'streak_3',
        icon: '🔥',
        title: 'Principiante Costante',
        description: 'Completa 3 giorni di fila',
        checkFunction: () => calculateStreak() >= 3,
        progress: () => Math.min(100, (calculateStreak() / 3) * 100)
    },
    {
        id: 'streak_7',
        icon: '⭐',
        title: 'Settimana Perfetta',
        description: 'Completa 7 giorni di fila',
        checkFunction: () => calculateStreak() >= 7,
        progress: () => Math.min(100, (calculateStreak() / 7) * 100)
    },
    {
        id: 'streak_30',
        icon: '👑',
        title: 'Re della Costanza',
        description: 'Completa 30 giorni di fila',
        checkFunction: () => calculateStreak() >= 30,
        progress: () => Math.min(100, (calculateStreak() / 30) * 100)
    },

    // Weight loss badges
    {
        id: 'weight_loss_2',
        icon: '📉',
        title: 'Primo Traguardo',
        description: 'Perdi 2 kg',
        checkFunction: () => {
            const goal = getGoal();
            const weights = getAllWeights();
            if (!goal || weights.length < 2) return false;
            const firstWeight = weights[0].weight;
            const lastWeight = weights[weights.length - 1].weight;
            return firstWeight - lastWeight >= 2;
        },
        progress: () => {
            const goal = getGoal();
            const weights = getAllWeights();
            if (!goal || weights.length < 2) return 0;
            const firstWeight = weights[0].weight;
            const lastWeight = weights[weights.length - 1].weight;
            const lost = firstWeight - lastWeight;
            return Math.min(100, (lost / 2) * 100);
        }
    },
    {
        id: 'weight_loss_5',
        icon: '🎯',
        title: 'In Discesa',
        description: 'Perdi 5 kg',
        checkFunction: () => {
            const goal = getGoal();
            const weights = getAllWeights();
            if (!goal || weights.length < 2) return false;
            const firstWeight = weights[0].weight;
            const lastWeight = weights[weights.length - 1].weight;
            return firstWeight - lastWeight >= 5;
        },
        progress: () => {
            const goal = getGoal();
            const weights = getAllWeights();
            if (!goal || weights.length < 2) return 0;
            const firstWeight = weights[0].weight;
            const lastWeight = weights[weights.length - 1].weight;
            const lost = firstWeight - lastWeight;
            return Math.min(100, (lost / 5) * 100);
        }
    },
    {
        id: 'goal_reached',
        icon: '🏆',
        title: 'Obiettivo Raggiunto!',
        description: 'Raggiungi il tuo peso obiettivo',
        checkFunction: () => {
            const goal = getGoal();
            const weights = getAllWeights();
            if (!goal || weights.length === 0) return false;
            const currentWeight = weights[weights.length - 1].weight;
            return Math.abs(currentWeight - goal.targetWeight) <= 0.5;
        },
        progress: () => {
            const goal = getGoal();
            const weights = getAllWeights();
            if (!goal || weights.length < 2) return 0;
            const startWeight = weights[0].weight;
            const currentWeight = weights[weights.length - 1].weight;
            const targetWeight = goal.targetWeight;
            const totalToLose = Math.abs(startWeight - targetWeight);
            const lost = Math.abs(startWeight - currentWeight);
            return Math.min(100, (lost / totalToLose) * 100);
        }
    },

    // Activity badges
    {
        id: 'workouts_10',
        icon: '💪',
        title: 'Sportivo Attivo',
        description: 'Completa 10 allenamenti',
        checkFunction: () => {
            const activities = JSON.parse(localStorage.getItem(`activities_${currentUser}`)) || [];
            return activities.length >= 10;
        },
        progress: () => {
            const activities = JSON.parse(localStorage.getItem(`activities_${currentUser}`)) || [];
            return Math.min(100, (activities.length / 10) * 100);
        }
    },
    {
        id: 'workouts_50',
        icon: '🏋️',
        title: 'Atleta Dedicato',
        description: 'Completa 50 allenamenti',
        checkFunction: () => {
            const activities = JSON.parse(localStorage.getItem(`activities_${currentUser}`)) || [];
            return activities.length >= 50;
        },
        progress: () => {
            const activities = JSON.parse(localStorage.getItem(`activities_${currentUser}`)) || [];
            return Math.min(100, (activities.length / 50) * 100);
        }
    },
    {
        id: 'workouts_100',
        icon: '🎖️',
        title: 'Campione Assoluto',
        description: 'Completa 100 allenamenti',
        checkFunction: () => {
            const activities = JSON.parse(localStorage.getItem(`activities_${currentUser}`)) || [];
            return activities.length >= 100;
        },
        progress: () => {
            const activities = JSON.parse(localStorage.getItem(`activities_${currentUser}`)) || [];
            return Math.min(100, (activities.length / 100) * 100);
        }
    },

    // PR badges (for muscle-gain/performance users)
    {
        id: 'pr_first',
        icon: '📊',
        title: 'Primo Record',
        description: 'Registra il tuo primo PR',
        checkFunction: () => {
            const prs = getPersonalRecords();
            return prs.length >= 1;
        },
        progress: () => {
            const prs = getPersonalRecords();
            return prs.length >= 1 ? 100 : 0;
        }
    },
    {
        id: 'pr_10',
        icon: '🥇',
        title: 'Collezionista di Record',
        description: 'Registra 10 Personal Records',
        checkFunction: () => {
            const prs = getPersonalRecords();
            return prs.length >= 10;
        },
        progress: () => {
            const prs = getPersonalRecords();
            return Math.min(100, (prs.length / 10) * 100);
        }
    }
];

function initializeBadges() {
    const goal = getGoal();
    if (goal) {
        document.getElementById('badges-section').style.display = 'block';
    }
}

function updateBadges() {
    const container = document.getElementById('badges-grid');
    if (!container) return;

    const unlockedBadges = JSON.parse(localStorage.getItem(`badges_${currentUser}`)) || {};

    container.innerHTML = '';

    BADGES.forEach(badge => {
        const isUnlocked = badge.checkFunction();
        const progress = badge.progress();
        const unlockDate = unlockedBadges[badge.id];

        // Check if badge was just unlocked
        if (isUnlocked && !unlockDate) {
            unlockedBadges[badge.id] = new Date().toISOString();
            localStorage.setItem(`badges_${currentUser}`, JSON.stringify(unlockedBadges));
            showBadgeNotification(badge);
        }

        const badgeCard = document.createElement('div');
        badgeCard.className = `badge-card ${isUnlocked ? '' : 'locked'}`;
        badgeCard.innerHTML = `
            <div class="badge-icon">${badge.icon}</div>
            <div class="badge-title">${badge.title}</div>
            <div class="badge-description">${badge.description}</div>
            ${!isUnlocked && progress < 100 ? `
                <div class="badge-progress">
                    <div class="badge-progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="badge-unlock-date">${Math.round(progress)}% completato</div>
            ` : ''}
            ${isUnlocked ? `
                <div class="badge-unlock-date">Sbloccato ${unlockDate ? new Date(unlockDate).toLocaleDateString('it-IT') : ''}</div>
            ` : ''}
        `;

        container.appendChild(badgeCard);
    });
}

function calculateStreak() {
    const meals = JSON.parse(localStorage.getItem(`meals_${currentUser}`)) || [];
    const activities = JSON.parse(localStorage.getItem(`activities_${currentUser}`)) || [];

    // Get unique dates with either meals or activities
    const activeDates = new Set();
    meals.forEach(meal => activeDates.add(meal.date));
    activities.forEach(activity => activeDates.add(activity.date));

    // Sort dates descending
    const sortedDates = Array.from(activeDates).sort((a, b) => {
        const dateA = new Date(a.split('/').reverse().join('-'));
        const dateB = new Date(b.split('/').reverse().join('-'));
        return dateB - dateA;
    });

    if (sortedDates.length === 0) return 0;

    // Check if today is active
    const today = formatDate(new Date());
    if (sortedDates[0] !== today) return 0;

    // Count consecutive days
    let streak = 1;
    let currentDate = new Date(today.split('/').reverse().join('-'));

    for (let i = 1; i < sortedDates.length; i++) {
        currentDate.setDate(currentDate.getDate() - 1);
        const expectedDate = formatDate(currentDate);

        if (sortedDates[i] === expectedDate) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

function showBadgeNotification(badge) {
    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🏆 Nuovo Traguardo Sbloccato!', {
            body: `${badge.title}: ${badge.description}`,
            icon: 'icon-192.png',
            badge: 'icon-192.png'
        });
    }

    // Show in-app notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
        color: white;
        padding: 20px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideInRight 0.5s ease;
        max-width: 300px;
    `;
    notification.innerHTML = `
        <div style="font-size: 32px; text-align: center; margin-bottom: 8px;">${badge.icon}</div>
        <div style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">Nuovo Traguardo!</div>
        <div style="font-size: 14px; margin-bottom: 4px;">${badge.title}</div>
        <div style="font-size: 12px; opacity: 0.9;">${badge.description}</div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 5000);
}

// Request notification permission on first visit
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// ========================================
// PUSH NOTIFICATIONS & REMINDERS
// ========================================

// Initialize notification system
function initializeNotifications() {
    if (!('Notification' in window)) {
        console.log('Browser does not support notifications');
        return;
    }

    if (Notification.permission === 'granted') {
        scheduleWorkoutReminders();
        scheduleMealReminders();
    } else if (Notification.permission !== 'denied') {
        showNotificationPrompt();
    }
}

// Show custom notification permission prompt
function showNotificationPrompt() {
    const promptDiv = document.createElement('div');
    promptDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        max-width: 320px;
        border: 2px solid var(--accent-primary);
    `;
    promptDiv.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 12px;">🔔</div>
        <div style="font-weight: bold; margin-bottom: 8px;">Attiva i Promemoria</div>
        <div style="font-size: 14px; margin-bottom: 16px; color: var(--text-secondary);">
            Ricevi notifiche giornaliere per rimanere motivato e non perdere gli allenamenti
        </div>
        <div style="display: flex; gap: 8px;">
            <button onclick="enableNotifications()" style="flex: 1; padding: 10px; background: linear-gradient(135deg, #4CAF50, #45a049); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                ✅ Attiva
            </button>
            <button onclick="this.parentElement.parentElement.remove()" style="flex: 1; padding: 10px; background: var(--bg-tertiary); color: var(--text-primary); border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                ❌ Non ora
            </button>
        </div>
    `;
    document.body.appendChild(promptDiv);
}

// Enable notifications
window.enableNotifications = async function() {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        scheduleWorkoutReminders();
        scheduleMealReminders();

        // Remove prompt
        document.querySelectorAll('div').forEach(div => {
            if (div.textContent.includes('Attiva i Promemoria')) {
                div.remove();
            }
        });

        // Show success message
        showNotification('🎉 Notifiche Attivate!', 'Riceverai promemoria giornalieri per i tuoi allenamenti');
    }
};

// Schedule workout reminders
function scheduleWorkoutReminders() {
    const goal = getGoal();
    if (!goal) return;

    // Check if workout reminder is enabled
    const reminderSettings = JSON.parse(localStorage.getItem(`notifications_${currentUser}`)) || {
        workoutEnabled: true,
        workoutTime: '08:00',
        mealEnabled: true,
        mealTimes: ['08:00', '13:00', '20:00']
    };

    if (!reminderSettings.workoutEnabled) return;

    // Schedule daily workout reminder at specified time
    const now = new Date();
    const [hours, minutes] = reminderSettings.workoutTime.split(':');
    const reminderTime = new Date();
    reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // If time has passed today, schedule for tomorrow
    if (reminderTime < now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const timeUntilReminder = reminderTime - now;

    setTimeout(() => {
        checkAndSendWorkoutReminder();
        // Reschedule for next day
        setInterval(checkAndSendWorkoutReminder, 24 * 60 * 60 * 1000);
    }, timeUntilReminder);
}

// Check and send workout reminder
function checkAndSendWorkoutReminder() {
    const todayDate = formatDate(new Date());
    const activities = getActivitiesByDate(todayDate);

    // If no workout done today, send reminder
    if (activities.length === 0) {
        const goal = getGoal();
        const plan = getTodaysPlan();

        showNotification(
            '💪 Ora di Allenarsi!',
            plan && plan.workout
                ? `Oggi: ${plan.workout.name} (${plan.workout.duration})`
                : 'Non dimenticare il tuo allenamento di oggi!',
            () => {
                // On click, scroll to activity section
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        );
    }
}

// Schedule meal reminders
function scheduleMealReminders() {
    const reminderSettings = JSON.parse(localStorage.getItem(`notifications_${currentUser}`)) || {
        mealEnabled: true,
        mealTimes: ['08:00', '13:00', '20:00']
    };

    if (!reminderSettings.mealEnabled) return;

    reminderSettings.mealTimes.forEach(time => {
        const [hours, minutes] = time.split(':');
        const reminderTime = new Date();
        reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const now = new Date();
        let timeUntilReminder = reminderTime - now;

        if (timeUntilReminder < 0) {
            timeUntilReminder += 24 * 60 * 60 * 1000; // Schedule for tomorrow
        }

        setTimeout(() => {
            checkAndSendMealReminder(time);
            setInterval(() => checkAndSendMealReminder(time), 24 * 60 * 60 * 1000);
        }, timeUntilReminder);
    });
}

// Check and send meal reminder
function checkAndSendMealReminder(time) {
    const todayDate = formatDate(new Date());
    const meals = getMealsByDate(todayDate);

    // Determine meal type based on time
    let mealType = '';
    const hour = parseInt(time.split(':')[0]);

    if (hour < 11) mealType = 'colazione';
    else if (hour < 16) mealType = 'pranzo';
    else mealType = 'cena';

    // Check if meal already logged
    const hasMeal = meals.some(meal =>
        meal.meal.toLowerCase().includes(mealType.toLowerCase())
    );

    if (!hasMeal) {
        showNotification(
            `🍽️ Promemoria ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`,
            'Ricordati di registrare il tuo pasto!',
            () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        );
    }
}

// Show notification helper
function showNotification(title, body, onClick) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
    }

    const notification = new Notification(title, {
        body: body,
        icon: 'icon-192.png',
        badge: 'icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'valahia-gym-reminder',
        requireInteraction: false
    });

    if (onClick) {
        notification.onclick = onClick;
    }

    // Auto-close after 10 seconds
    setTimeout(() => notification.close(), 10000);
}

// Notification settings UI
window.showNotificationSettings = function() {
    const reminderSettings = JSON.parse(localStorage.getItem(`notifications_${currentUser}`)) || {
        workoutEnabled: true,
        workoutTime: '08:00',
        mealEnabled: true,
        mealTimes: ['08:00', '13:00', '20:00']
    };

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>🔔 Impostazioni Notifiche</h2>
                <button class="btn-close" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <form onsubmit="saveNotificationSettings(event)" style="padding: 20px;">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="workout-reminder-enabled" ${reminderSettings.workoutEnabled ? 'checked' : ''}>
                        Promemoria Allenamento
                    </label>
                </div>

                <div class="form-group">
                    <label for="workout-time">Orario Allenamento</label>
                    <input type="time" id="workout-time" value="${reminderSettings.workoutTime}">
                </div>

                <div class="form-group">
                    <label>
                        <input type="checkbox" id="meal-reminder-enabled" ${reminderSettings.mealEnabled ? 'checked' : ''}>
                        Promemoria Pasti
                    </label>
                </div>

                <div class="form-group">
                    <label for="meal-times">Orari Pasti (separati da virgola)</label>
                    <input type="text" id="meal-times" value="${reminderSettings.mealTimes.join(', ')}" placeholder="08:00, 13:00, 20:00">
                    <small>Esempio: 08:00, 13:00, 20:00</small>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn-primary">💾 Salva Impostazioni</button>
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">❌ Annulla</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
};

window.saveNotificationSettings = function(event) {
    event.preventDefault();

    const settings = {
        workoutEnabled: document.getElementById('workout-reminder-enabled').checked,
        workoutTime: document.getElementById('workout-time').value,
        mealEnabled: document.getElementById('meal-reminder-enabled').checked,
        mealTimes: document.getElementById('meal-times').value.split(',').map(t => t.trim())
    };

    localStorage.setItem(`notifications_${currentUser}`, JSON.stringify(settings));

    alert('✅ Impostazioni salvate! Le notifiche saranno inviate agli orari specificati.');

    // Reschedule reminders
    scheduleWorkoutReminders();
    scheduleMealReminders();

    // Close modal
    document.querySelector('.modal').remove();
};

// ===========================
// CALORIE TARGET INFO
// ===========================
window.showCalorieTargetInfo = function() {
    const goal = getGoal();

    let message = '🎯 CALORIE TARGET - Cosa significa?\n\n';
    message += '📊 È il tuo budget calorico GIORNALIERO\n';
    message += '= Quante calorie devi MANGIARE oggi\n\n';

    if (goal && goal.type) {
        const calorieTarget = goal.calorieTarget || 0;
        const tdee = Math.round(goal.bmr * goal.activityFactor);

        if (goal.type === 'weight-loss') {
            const deficit = tdee - calorieTarget;
            message += '🔥 DIMAGRIMENTO:\n';
            message += `• Il tuo metabolismo brucia ${tdee} kcal/giorno\n`;
            message += `• Il tuo deficit è -${deficit} kcal/giorno\n`;
            message += `• Mangiando ${calorieTarget} kcal/giorno perderai peso\n\n`;
            message += '✅ Rispetta questo target per dimagrire!';
        }
        else if (goal.type === 'muscle-gain') {
            const surplus = calorieTarget - tdee;
            message += '💪 MASSA MUSCOLARE:\n';
            message += `• Il tuo metabolismo brucia ${tdee} kcal/giorno\n`;
            message += `• Il tuo surplus è +${surplus} kcal/giorno\n`;
            message += `• Mangiando ${calorieTarget} kcal/giorno crescerai\n\n`;
            message += '✅ Rispetta questo target per mettere massa!';
        }
        else if (goal.type === 'maintenance' || goal.type === 'performance') {
            message += '⚖️ MANTENIMENTO:\n';
            message += `• Il tuo metabolismo brucia ${tdee} kcal/giorno\n`;
            message += `• Mangiando ${calorieTarget} kcal/giorno il peso rimane stabile\n\n`;
            message += '✅ Rispetta questo target per mantenere il peso!';
        }

        message += '\n\n━━━━━━━━━━━━━━━━━━━\n';
        message += 'NON È:\n';
        message += '❌ Calorie da perdere alla settimana\n';
        message += '❌ Calorie da bruciare con sport\n';
        message += '❌ Solo deficit calorico\n\n';
        message += 'È:\n';
        message += '✅ Colazione + Pranzo + Cena + Spuntini\n';
        message += '✅ Totale calorie da mangiare oggi\n';
        message += '✅ Budget giornaliero completo';
    } else {
        message += '⚠️ Imposta prima un obiettivo!\n\n';
        message += 'Vai su "Imposta Obiettivo" per calcolare\n';
        message += 'il tuo target calorico personalizzato.\n\n';
        message += '━━━━━━━━━━━━━━━━━━━\n';
        message += 'COSA RAPPRESENTA:\n\n';
        message += '🔥 DIMAGRIMENTO: Mangi MENO del metabolismo\n';
        message += '   → Crei deficit → Perdi peso\n\n';
        message += '💪 MASSA: Mangi PIÙ del metabolismo\n';
        message += '   → Crei surplus → Cresci\n\n';
        message += '⚖️ MANTENIMENTO: Mangi UGUALE al metabolismo\n';
        message += '   → Peso stabile';
    }

    alert(message);
};

// ========================================
// HEALTH CONNECT INTEGRATION (Android native)
// ========================================

// ===========================
// HARDWARE STEP COUNTER
// Uses Android TYPE_STEP_COUNTER sensor (no Health Connect / Play Store needed)
// ===========================

async function initHealthConnect() {
    if (!window.Capacitor || !window.Capacitor.isNativePlatform()) return;

    const SC = window.Capacitor.Plugins.StepCounter;
    if (!SC) return;

    try {
        const { available } = await SC.isAvailable();
        if (!available) return;

        // Check if ACTIVITY_RECOGNITION permission already granted
        const perm = await window.Capacitor.Plugins.Permissions?.query({ name: 'activityRecognition' }).catch(() => null);
        if (perm?.state === 'granted') {
            await SC.startTracking();
            document.getElementById('hc-btn').style.display = 'none';
            document.getElementById('hc-status').style.display = 'block';
            await syncHealthConnectSteps();

            setInterval(() => syncHealthConnectSteps(), 5 * 60 * 1000);
        }
    } catch (error) {
        console.warn('StepCounter init error:', error.message);
    }
}

// Called when user taps "Configura" button
window.setupHealthConnect = async function() {
    if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
        alert('Funzione disponibile solo nell\'app Android.');
        return;
    }

    const SC = window.Capacitor.Plugins.StepCounter;
    if (!SC) {
        alert('Plugin contatore passi non trovato. Ricompila l\'app.');
        return;
    }

    try {
        const { available } = await SC.isAvailable();
        if (!available) {
            alert('Sensore contatore passi non disponibile su questo dispositivo.');
            return;
        }

        // Request ACTIVITY_RECOGNITION permission
        await SC.requestPermissions();

        // Start persistent sensor listener
        await SC.startTracking();

        document.getElementById('hc-btn').style.display = 'none';
        document.getElementById('hc-status').style.display = 'block';
        await syncHealthConnectSteps();

        setInterval(() => syncHealthConnectSteps(), 5 * 60 * 1000);
        alert('✅ Contatore passi attivato!\n\nI passi verranno aggiornati ogni 5 minuti.\n\nCammina un po\' e premi "Sincronizza ora" per vedere subito i passi.');

    } catch (error) {
        alert('Errore: ' + error.message);
    }
};

async function syncHealthConnectSteps() {
    const SC = window.Capacitor?.Plugins?.StepCounter;
    if (!SC) return;

    try {
        const { steps: currentTotal, ready } = await SC.getStepCount();

        // Sensor not yet initialized (user hasn't walked since app started)
        if (!ready || currentTotal < 0) {
            console.log('⏳ Sensore passi in inizializzazione - cammina un po\'');
            return;
        }

        const today = getTodayString();
        const stored = JSON.parse(localStorage.getItem(`stepTracker_${currentUser}`) || '{}');

        let todaySteps = stored.todaySteps || 0;

        if (stored.date !== today) {
            // New day — baseline from previous reading
            // Only use baseline if > 0 (lastTotal:0 means corrupted/old data, not a valid baseline)
            const baseline = stored.lastTotal;
            todaySteps = (baseline !== undefined && baseline > 0)
                ? Math.max(0, currentTotal - baseline)
                : 0;
        } else if (stored.lastTotal !== undefined) {
            const diff = currentTotal - stored.lastTotal;
            if (diff > 0) {
                todaySteps += diff;
            } else if (diff < 0) {
                // Device rebooted: currentTotal is steps since reboot
                todaySteps += currentTotal;
            }
            // diff === 0: no change, keep todaySteps as-is
        }

        localStorage.setItem(`stepTracker_${currentUser}`, JSON.stringify({
            date: today,
            lastTotal: currentTotal,
            todaySteps
        }));

        if (todaySteps <= 0) return;

        let weight = 70;
        if (weights.length > 0) {
            weight = [...weights].sort((a, b) => new Date(b.date) - new Date(a.date))[0].weight;
        }
        const calories = Math.round(todaySteps * weight * 0.04);

        dailySteps[today] = {
            steps: todaySteps,
            calories,
            weight,
            timestamp: new Date().toISOString(),
            source: 'hardware'
        };

        localStorage.setItem(`dailySteps_${currentUser}`, JSON.stringify(dailySteps));
        loadDailySteps();
        updateDailySummary();

        if (typeof window.syncToFirestore === 'function') window.syncToFirestore();

        console.log(`✅ Passi hardware: ${todaySteps.toLocaleString()} oggi (${calories} kcal)`);

    } catch (error) {
        console.warn('StepCounter sync error:', error.message);
    }
}

window.syncHealthConnectSteps = syncHealthConnectSteps;

// Expose for manual refresh button (if needed)
window.syncHealthConnectSteps = syncHealthConnectSteps;

// Fix Android WebView layout after orientation change (landscape → portrait)
window.addEventListener('orientationchange', function() {
    setTimeout(function() {
        const vp = document.querySelector('meta[name=viewport]');
        if (vp) {
            vp.setAttribute('content', 'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
        window.scrollTo(0, 0);
    }, 300);
});

document.addEventListener('DOMContentLoaded', init);
