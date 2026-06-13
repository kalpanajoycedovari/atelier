/**
 * Atelier — Measurement Library
 *
 * Defines all standard body measurements organised by region.
 * The UI reads this to render the measurement form, and the pattern
 * engine reads measurement VALUES to draft patterns.
 *
 * Each measurement has:
 *   key:        unique identifier
 *   vocabKey:   reference into vocabulary.js for the label and tooltip
 *   defaultCm:  pre-filled value (rough adult averages)
 *   minCm:      minimum reasonable value (for validation)
 *   maxCm:      maximum reasonable value (for validation)
 *
 * Categories group measurements by body region.
 */


// ============================================================================
// STANDARD MEASUREMENT LIBRARY
// ============================================================================

const MEASUREMENT_CATEGORIES = [
  {
    id: "torso",
    name: { designer: "Torso", beginner: "Body" },
    expandedByDefault: true,
    measurements: [
      { key: "bust",        vocabKey: "bust",                defaultCm: 90,  minCm: 60,  maxCm: 150 },
      { key: "waist",       vocabKey: "waist",               defaultCm: 72,  minCm: 50,  maxCm: 140 },
      { key: "hips",        vocabKey: "hips",                defaultCm: 96,  minCm: 70,  maxCm: 160 },
      { key: "neck",        vocabKey: "neckCircumference",   defaultCm: 35,  minCm: 25,  maxCm: 50 },
    ],
  },
  {
    id: "lengths",
    name: { designer: "Lengths", beginner: "Distances" },
    expandedByDefault: true,
    measurements: [
      { key: "skirtLength", vocabKey: "skirtLength",         defaultCm: 60,  minCm: 20,  maxCm: 120 },
      { key: "waistToHip",  vocabKey: "waistToHip",          defaultCm: 20,  minCm: 14,  maxCm: 28 },
      { key: "waistToFloor", vocabKey: "waistToFloor",       defaultCm: 105, minCm: 70,  maxCm: 140 },
      { key: "hipToFloor",  vocabKey: "hipToFloor",          defaultCm: 85,  minCm: 50,  maxCm: 120 },
    ],
  },
  {
    id: "arms",
    name: { designer: "Arms", beginner: "Arms" },
    expandedByDefault: false,
    measurements: [
      { key: "shoulderWidth", vocabKey: "shoulderWidth",     defaultCm: 38,  minCm: 28,  maxCm: 55 },
      { key: "armLength",     vocabKey: "armLength",         defaultCm: 58,  minCm: 40,  maxCm: 75 },
      { key: "wrist",         vocabKey: "wristCircumference", defaultCm: 16, minCm: 12,  maxCm: 25 },
    ],
  },
  {
    id: "legs",
    name: { designer: "Legs", beginner: "Legs" },
    expandedByDefault: false,
    measurements: [
      { key: "thigh",  vocabKey: "thighCircumference", defaultCm: 56, minCm: 40,  maxCm: 90 },
      { key: "inseam", vocabKey: "inseam",             defaultCm: 78, minCm: 55,  maxCm: 95 },
    ],
  },
];


// ============================================================================
// MEASUREMENT STORE — manages user values and persistence
// ============================================================================

const MEASUREMENTS_STORAGE_KEY = "atelier-measurements";
const CUSTOM_MEASUREMENTS_KEY = "atelier-custom-measurements";


function loadMeasurements() {
  // Start with defaults from the library
  const values = {};
  MEASUREMENT_CATEGORIES.forEach((category) => {
    category.measurements.forEach((m) => {
      values[m.key] = m.defaultCm;
    });
  });

  // Override with any saved values from localStorage
  try {
    const saved = localStorage.getItem(MEASUREMENTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(values, parsed);
    }
  } catch (e) {
    console.warn("Could not load saved measurements:", e);
  }

  return values;
}


function saveMeasurements(values) {
  try {
    localStorage.setItem(MEASUREMENTS_STORAGE_KEY, JSON.stringify(values));
  } catch (e) {
    console.warn("Could not save measurements:", e);
  }
}


function loadCustomMeasurements() {
  // Returns an array of { key, label, valueCm }
  try {
    const saved = localStorage.getItem(CUSTOM_MEASUREMENTS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn("Could not load custom measurements:", e);
  }
  return [];
}


function saveCustomMeasurements(customs) {
  try {
    localStorage.setItem(CUSTOM_MEASUREMENTS_KEY, JSON.stringify(customs));
  } catch (e) {
    console.warn("Could not save custom measurements:", e);
  }
}


function addCustomMeasurement(label, valueCm) {
  const customs = loadCustomMeasurements();
  const key = "custom-" + Date.now();
  customs.push({ key, label, valueCm });
  saveCustomMeasurements(customs);
  return key;
}


function removeCustomMeasurement(key) {
  const customs = loadCustomMeasurements().filter((c) => c.key !== key);
  saveCustomMeasurements(customs);
}


function updateCustomMeasurement(key, valueCm) {
  const customs = loadCustomMeasurements();
  const target = customs.find((c) => c.key === key);
  if (target) {
    target.valueCm = valueCm;
    saveCustomMeasurements(customs);
  }
}


// ============================================================================
// VALIDATION
// ============================================================================

function validateMeasurement(measurementDef, valueCm) {
  if (valueCm <= 0) {
    return { valid: false, reason: "Measurement must be positive." };
  }
  if (valueCm < measurementDef.minCm) {
    return {
      valid: false,
      reason: `That seems very small (under ${measurementDef.minCm} cm). Please double-check.`,
    };
  }
  if (valueCm > measurementDef.maxCm) {
    return {
      valid: false,
      reason: `That seems very large (over ${measurementDef.maxCm} cm). Please double-check.`,
    };
  }
  return { valid: true };
}


// ============================================================================
// EXPORT
// ============================================================================

window.Measurements = {
  MEASUREMENT_CATEGORIES,
  loadMeasurements,
  saveMeasurements,
  loadCustomMeasurements,
  saveCustomMeasurements,
  addCustomMeasurement,
  removeCustomMeasurement,
  updateCustomMeasurement,
  validateMeasurement,
};
