// Storage keys
const STORAGE_KEYS = {
  entries: 'ct.entries',
  workouts: 'ct.workouts',
  weight: 'ct.weight',
  weightUnit: 'ct.weightUnit',
  height: 'ct.height',
  heightUnit: 'ct.heightUnit',
};

// Utils
function formatDateKey(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function safeParseFloat(value) {
  const n = parseFloat(String(value).replace(/,/g, '.'));
  return Number.isFinite(n) ? n : NaN;
}

function toKilograms(weight, unit) {
  if (!Number.isFinite(weight)) return NaN;
  return unit === 'lb' ? weight * 0.45359237 : weight;
}

function toMeters(height, unit) {
  if (!Number.isFinite(height)) return NaN;
  if (unit === 'in') return height * 0.0254;
  if (unit === 'cm') return height / 100;
  return height; // assume meters if ever added
}

function calculateBmi(weightValue, weightUnit, heightValue, heightUnit) {
  const kg = toKilograms(weightValue, weightUnit);
  const m = toMeters(heightValue, heightUnit);
  if (!(kg > 0) || !(m > 0)) return { bmi: null, category: 'Enter weight and height' };
  const bmi = kg / (m * m);
  let category = 'Normal weight';
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25) category = 'Normal weight';
  else if (bmi < 30) category = 'Overweight';
  else category = 'Obesity';
  return { bmi, category };
}

// DOM refs
const dateInput = document.getElementById('dateInput');
const entryForm = document.getElementById('entryForm');
const foodNameInput = document.getElementById('foodName');
const caloriesInput = document.getElementById('calories');
const entryList = document.getElementById('entryList');
const emptyState = document.getElementById('emptyState');
const totalCaloriesEl = document.getElementById('totalCalories');

const weightInput = document.getElementById('weightInput');
const weightUnitSelect = document.getElementById('weightUnit');
const heightInput = document.getElementById('heightInput');
const heightUnitSelect = document.getElementById('heightUnit');
const bodyForm = document.getElementById('bodyForm');
const bmiValueEl = document.getElementById('bmiValue');
const bmiCategoryEl = document.getElementById('bmiCategory');

// Workout DOM refs
const workoutForm = document.getElementById('workoutForm');
const workoutNameInput = document.getElementById('workoutName');
const workoutTypeSelect = document.getElementById('workoutType');
const workoutMinutesInput = document.getElementById('workoutMinutes');
const workoutList = document.getElementById('workoutList');
const emptyWorkouts = document.getElementById('emptyWorkouts');
const totalMinutesEl = document.getElementById('totalMinutes');

// State
let entriesByDate = {};
let workoutsByDate = {};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.entries);
    entriesByDate = raw ? JSON.parse(raw) : {};
  } catch {
    entriesByDate = {};
  }
  try {
    const rawW = localStorage.getItem(STORAGE_KEYS.workouts);
    workoutsByDate = rawW ? JSON.parse(rawW) : {};
  } catch {
    workoutsByDate = {};
  }
  const w = localStorage.getItem(STORAGE_KEYS.weight);
  const wu = localStorage.getItem(STORAGE_KEYS.weightUnit);
  const h = localStorage.getItem(STORAGE_KEYS.height);
  const hu = localStorage.getItem(STORAGE_KEYS.heightUnit);
  if (w !== null) weightInput.value = w;
  if (wu) weightUnitSelect.value = wu;
  if (h !== null) heightInput.value = h;
  if (hu) heightUnitSelect.value = hu;
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(entriesByDate));
}

function saveWorkouts() {
  localStorage.setItem(STORAGE_KEYS.workouts, JSON.stringify(workoutsByDate));
}

function saveBody()
{
  localStorage.setItem(STORAGE_KEYS.weight, weightInput.value);
  localStorage.setItem(STORAGE_KEYS.weightUnit, weightUnitSelect.value);
  localStorage.setItem(STORAGE_KEYS.height, heightInput.value);
  localStorage.setItem(STORAGE_KEYS.heightUnit, heightUnitSelect.value);
}

function ensureDate(dateKey) {
  if (!entriesByDate[dateKey]) entriesByDate[dateKey] = [];
  if (!workoutsByDate[dateKey]) workoutsByDate[dateKey] = [];
}

function renderEntries(dateKey) {
  ensureDate(dateKey);
  const list = entriesByDate[dateKey];
  entryList.innerHTML = '';
  if (!list || list.length === 0) {
    emptyState.hidden = false;
    totalCaloriesEl.textContent = '0';
    return;
  }
  emptyState.hidden = true;
  let total = 0;
  list.forEach((item, idx) => {
    total += item.calories;
    const li = document.createElement('li');
    li.className = 'entry-item';
    li.innerHTML = `
      <div class="entry-food">${item.food}</div>
      <div class="entry-cal">${item.calories} kcal</div>
      <div class="entry-actions">
        <button class="icon-btn delete" aria-label="Delete entry">✕</button>
      </div>
    `;
    li.querySelector('.delete').addEventListener('click', () => {
      entriesByDate[dateKey].splice(idx, 1);
      saveEntries();
      renderEntries(dateKey);
    });
    entryList.appendChild(li);
  });
  totalCaloriesEl.textContent = String(total);
}

function renderWorkouts(dateKey) {
  ensureDate(dateKey);
  const list = workoutsByDate[dateKey];
  workoutList.innerHTML = '';
  if (!list || list.length === 0) {
    emptyWorkouts.hidden = false;
    totalMinutesEl.textContent = '0';
    return;
  }
  emptyWorkouts.hidden = true;
  let total = 0;
  list.forEach((item, idx) => {
    total += item.minutes;
    const li = document.createElement('li');
    li.className = 'entry-item';
    li.innerHTML = `
      <div class="entry-food">${item.name} <span style="color:#aab1d6">· ${item.type}</span></div>
      <div class="entry-cal">${item.minutes} min</div>
      <div class="entry-actions">
        <button class="icon-btn delete" aria-label="Delete workout">✕</button>
      </div>
    `;
    li.querySelector('.delete').addEventListener('click', () => {
      workoutsByDate[dateKey].splice(idx, 1);
      saveWorkouts();
      renderWorkouts(dateKey);
    });
    workoutList.appendChild(li);
  });
  totalMinutesEl.textContent = String(total);
}

function rerenderBmi() {
  const weightVal = safeParseFloat(weightInput.value);
  const heightVal = safeParseFloat(heightInput.value);
  const { bmi, category } = calculateBmi(weightVal, weightUnitSelect.value, heightVal, heightUnitSelect.value);
  if (bmi == null) {
    bmiValueEl.textContent = 'BMI: --';
    bmiCategoryEl.textContent = category;
  } else {
    bmiValueEl.textContent = `BMI: ${bmi.toFixed(1)}`;
    bmiCategoryEl.textContent = category;
  }
}

// Handlers
entryForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const food = foodNameInput.value.trim();
  const cal = safeParseFloat(caloriesInput.value);
  if (!food || !(cal >= 0)) return;
  const key = formatDateKey(dateInput.value || new Date());
  ensureDate(key);
  entriesByDate[key].unshift({ food, calories: Math.round(cal) });
  saveEntries();
  renderEntries(key);
  entryForm.reset();
  foodNameInput.focus();
});

dateInput.addEventListener('change', () => {
  const key = formatDateKey(dateInput.value || new Date());
  renderEntries(key);
  renderWorkouts(key);
});

// Persist body inputs on change and update BMI live
[weightInput, weightUnitSelect, heightInput, heightUnitSelect].forEach((el) => {
  el.addEventListener('input', () => {
    saveBody();
    rerenderBmi();
  });
  el.addEventListener('change', () => {
    saveBody();
    rerenderBmi();
  });
});

bodyForm.addEventListener('submit', (e) => {
  e.preventDefault();
  saveBody();
  rerenderBmi();
});

workoutForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = workoutNameInput.value.trim();
  const type = workoutTypeSelect.value;
  const minutesNum = Math.max(0, Math.round(safeParseFloat(workoutMinutesInput.value)));
  if (!name || !Number.isFinite(minutesNum)) return;
  const key = formatDateKey(dateInput.value || new Date());
  ensureDate(key);
  workoutsByDate[key].unshift({ name, type, minutes: minutesNum });
  saveWorkouts();
  renderWorkouts(key);
  workoutForm.reset();
  workoutNameInput.focus();
});

// Init
function init() {
  const todayKey = formatDateKey(new Date());
  dateInput.value = todayKey;
  loadState();
  renderEntries(formatDateKey(dateInput.value || new Date()));
  renderWorkouts(formatDateKey(dateInput.value || new Date()));
  rerenderBmi();
}

document.addEventListener('DOMContentLoaded', init);

// Easter egg: 5% chance fried chicken button that triggers jumpscare
(function setupEasterEgg(){
  const params = new URLSearchParams(location.search);
  const forceEgg = params.get('egg') === '1' || localStorage.getItem('ct.forceEgg') === '1';
  const chance = Math.random();
  if (!forceEgg && chance > 0.05) return;
  const btn = document.createElement('button');
  btn.className = 'easter-egg-btn';
  btn.title = 'what’s this?';
  btn.setAttribute('aria-label', 'fried chicken');
  btn.innerHTML = '<span>🍗</span>';
  btn.addEventListener('click', async () => {
    const overlay = document.createElement('div');
    overlay.className = 'jumpscare-overlay';
    const img = document.createElement('img');
    img.alt = 'Ahh!';
    img.src = 'https://i.postimg.cc/wMd6xN9S/IMG-20250723-WA0005.jpg';
    overlay.appendChild(img);
    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
    try {
      const audio = new Audio('https://www.myinstants.com/media/sounds/rahhh.mp3');
      audio.volume = 1.0;
      await audio.play();
    } catch (e) {
      // ignore autoplay restrictions; user initiated click should allow
    }
  });
  document.body.appendChild(btn);
})();

