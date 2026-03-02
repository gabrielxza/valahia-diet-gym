# 📝 Changelog - Diet Tracker PWA

## V1.1 - Modulo Obiettivi e Dieta (2026-03-01)

### 🎯 **Nuove Funzionalità LIGHT**

#### 1. **Sistema Obiettivi Peso**
- ✅ Imposta peso target
- ✅ Scegli velocità dimagrimento (0.25-1 kg/settimana)
- ✅ Calcolo automatico TDEE (Total Daily Energy Expenditure)
- ✅ Calcolo target calorico giornaliero personalizzato
- ✅ Progress bar visuale verso obiettivo
- ✅ Statistiche in tempo reale

**Formula TDEE (Mifflin-St Jeor)**:
```
Uomo: BMR = 10 × peso + 6.25 × altezza - 5 × età + 5
Donna: BMR = 10 × peso + 6.25 × altezza - 5 × età - 161
TDEE = BMR × Livello Attività
```

**Calcolo Deficit**:
```
1 kg grasso = ~7700 kcal
Deficit settimanale = kg/settimana × 7700
Deficit giornaliero = Deficit settimanale / 7
Calorie Target = TDEE - Deficit giornaliero
```

**Esempio**:
- Gabriel: 80kg, 175cm, 35 anni, attività moderata
- Obiettivo: -1 kg/settimana
- BMR = 10×80 + 6.25×175 - 5×35 + 5 = 1693 kcal
- TDEE = 1693 × 1.55 = 2624 kcal
- Deficit = 7700/7 = 1100 kcal/giorno
- **Target: 1524 kcal/giorno**

---

#### 2. **5 Piani Dieta Pre-Compilati**

**🥗 Dieta Mediterranea**
- Carbs: 50-55% | Protein: 15-20% | Fat: 25-30%
- Focus: Verdure, frutta, cereali integrali, pesce, olio d'oliva
- Ideale per: Salute cardiovascolare, sostenibilità

**🥩 Low-Carb**
- Carbs: 20-30% | Protein: 30-35% | Fat: 40-45%
- Focus: Carne, pesce, uova, verdure non amidacee
- Ideale per: Controllo glicemia, sazietà

**💪 High-Protein**
- Carbs: 30-35% | Protein: 35-40% | Fat: 25-30%
- Focus: Pollo, pesce, uova, legumi, yogurt greco
- Ideale per: Mantenere massa muscolare durante dimagrimento

**🌱 Vegetariana**
- Carbs: 50-55% | Protein: 15-20% | Fat: 25-30%
- Focus: Verdure, legumi, uova, latticini, noci
- Ideale per: Fibre, antiossidanti, etica

**⏰ Digiuno Intermittente 16/8**
- Finestra alimentare: 8 ore (es: 12:00-20:00)
- Digiuno: 16 ore
- Focus: Controllo calorie facilitato
- Ideale per: Disciplina oraria, autofagia

---

#### 3. **Alert Calorie Automatici**
- ⚠️ Notifica in tempo reale se superi target calorico
- Calcolo surplus calorico
- Aggiornamento automatico ad ogni pasto registrato

---

#### 4. **Dashboard Obiettivi**
- 📊 4 statistiche chiave:
  - Peso attuale
  - Peso target
  - Kg da perdere
  - Calorie target giornaliere
- 📈 Progress bar con % completamento
- 🎯 Visibilità progresso verso obiettivo

---

### 🔧 **Come Usare**

#### **Setup Obiettivo**:
1. Clicca "⚙️ Configura" nella card Obiettivo
2. Inserisci:
   - Peso target (kg)
   - Velocità dimagrimento (-0.5 kg/sett consigliato)
   - Livello attività (sedentario/leggero/moderato/attivo)
   - Età, sesso, altezza
3. Salva → **Calorie target calcolate automaticamente!** 🎯

#### **Scegli Dieta**:
1. Clicca "📋 Scegli Dieta"
2. Seleziona piano preferito
3. Segui alimenti consigliati

#### **Tracking Quotidiano**:
1. Registra pasti con calorie
2. Registra attività fisica
3. App mostra automaticamente:
   - Calorie consumate vs target
   - Alert se superi limite
   - Progresso verso obiettivo

---

### 📊 **Modifiche Tecniche**

**File Modificati**:
- `index.html`: Aggiunte sezioni goal, progress, diet plan + 2 nuovi modali
- `style.css`: Aggiunti stili goal-section, progress-bar, diet-card, alert
- `app.js`: Aggiunte funzioni TDEE, goal tracking, diet selection

**Nuovo Storage LocalStorage**:
- `goal_${user}`: Obiettivo peso e parametri metabolici
- `diet_${user}`: Piano dieta selezionato

**Nuove Funzioni JavaScript**:
- `calculateTDEE()`: Formula Mifflin-St Jeor
- `updateGoalProgress()`: Aggiorna progress bar
- `checkCalorieAlert()`: Controlla superamento target
- `selectDiet()`: Salva piano dieta
- `loadSelectedDiet()`: Visualizza piano attivo

---

### 🚀 **Prossimi Passi (V2)**

Funzionalità future (se richieste):
- [ ] Foto riconoscimento cibo (AI)
- [ ] Database alimenti esteso (10.000+)
- [ ] Generazione automatica menu settimanali
- [ ] Grafici trend calorie/macros
- [ ] Export PDF report progresso
- [ ] Notifiche promemoria pasti
- [ ] Integrazione fitness tracker (Garmin, Fitbit)

---

**Autore**: Sviluppato per Dr. Gabriel Georgescu & Cristina
**Versione**: 1.1.0 LIGHT
**Data**: 2026-03-01
**Licenza**: Uso personale
