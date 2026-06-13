/**
 * Atelier — Vocabulary System
 *
 * Single source of truth for all fashion terms used across Atelier.
 * Each term has two forms: a "designer" version (the proper fashion word)
 * and a "beginner" version (plain English a non-fashion person understands).
 *
 * The current mode is stored in localStorage so it persists across visits.
 */

const VOCABULARY = {
  // Pattern piece labels
  centreFold: {
    designer: "Centre fold",
    beginner: "Fold edge",
    tooltip: "This edge is placed on the folded edge of your fabric, so the piece is mirrored when you cut it.",
  },
  grainLine: {
    designer: "Grain line",
    beginner: "Fabric direction",
    tooltip: "This arrow shows which way the fabric threads should run — always along the length of your fabric for the garment to hang properly.",
  },
  dart: {
    designer: "Dart",
    beginner: "Shaping wedge",
    tooltip: "A V-shaped piece you sew closed. It pulls flat fabric into a curve so it fits over your body's curves.",
  },
  seamAllowance: {
    designer: "Seam allowance",
    beginner: "Extra stitching room",
    tooltip: "Extra fabric beyond the actual garment edge — that's where you stitch the pieces together.",
  },
  hem: {
    designer: "Hem",
    beginner: "Bottom edge",
    tooltip: "The bottom edge of the garment, usually folded up and stitched to give a clean finish.",
  },
  sideSeam: {
    designer: "Side seam",
    beginner: "Side join",
    tooltip: "The line where the front piece meets the back piece on the sides of your body.",
  },
  waistline: {
    designer: "Waistline",
    beginner: "Waist edge",
    tooltip: "The top edge of the skirt that sits at your waist.",
  },
  bodice: {
    designer: "Bodice",
    beginner: "Top half",
    tooltip: "The part of a garment that covers the body from the shoulders to the waist.",
  },
  notch: {
    designer: "Notch",
    beginner: "Matching mark",
    tooltip: "A small mark on the edge of a pattern piece. When you sew pieces together, you line up the matching marks so everything fits correctly.",
  },
  ease: {
    designer: "Ease",
    beginner: "Comfort room",
    tooltip: "A little extra room added beyond your body measurement so the garment isn't skin-tight and you can move comfortably.",
  },

  // Measurement labels — plain language by default
  bust: {
    designer: "Bust circumference",
    beginner: "Around the chest",
    tooltip: "Measure the fullest part of your chest, all the way around. Keep the tape level.",
  },
  waist: {
    designer: "Waist circumference",
    beginner: "Around the waist",
    tooltip: "Measure the narrowest part of your torso, usually just above the belly button.",
  },
  hips: {
    designer: "Hip circumference",
    beginner: "Around the hips",
    tooltip: "Measure the fullest part of your hips and bottom, usually about 20 cm below your waist.",
  },
  shoulderWidth: {
    designer: "Shoulder width",
    beginner: "Across the shoulders",
    tooltip: "Measure from the tip of one shoulder, across the back, to the tip of the other shoulder.",
  },
  armLength: {
    designer: "Arm length",
    beginner: "Length of arm",
    tooltip: "From the tip of your shoulder, down a slightly bent arm, to your wrist bone.",
  },
  wristCircumference: {
    designer: "Wrist circumference",
    beginner: "Around the wrist",
    tooltip: "Measure around the narrowest part of your wrist, just below the hand.",
  },
  thighCircumference: {
    designer: "Thigh circumference",
    beginner: "Around the thigh",
    tooltip: "Measure around the fullest part of your upper leg.",
  },
  neckCircumference: {
    designer: "Neck circumference",
    beginner: "Around the neck",
    tooltip: "Measure around the base of your neck where a collar would sit.",
  },
  waistToHip: {
    designer: "Waist to hip",
    beginner: "Waist down to hip",
    tooltip: "From your waistline straight down to the fullest part of your hip — usually around 18-22 cm.",
  },
  waistToFloor: {
    designer: "Waist to floor",
    beginner: "Waist down to ground",
    tooltip: "From your waistline straight down to the floor, measured on the outside of your leg.",
  },
  hipToFloor: {
    designer: "Hip to floor",
    beginner: "Hip down to ground",
    tooltip: "From the fullest part of your hip straight down to the floor.",
  },
  inseam: {
    designer: "Inseam (crotch to floor)",
    beginner: "Inside-leg length",
    tooltip: "From the inside top of your leg straight down to the floor — the length of the inside seam of trousers.",
  },
  skirtLength: {
    designer: "Skirt length",
    beginner: "How long you want the skirt",
    tooltip: "Measure from your waistline down to where you want the bottom of the skirt to end.",
  },

  // UI labels
  yourMeasurements: {
    designer: "Your Measurements",
    beginner: "Your Body Measurements",
    tooltip: null,
  },
  draftMyPattern: {
    designer: "Draft my pattern",
    beginner: "Make my pattern",
    tooltip: null,
  },
  yourPattern: {
    designer: "Your Pattern",
    beginner: "Your Pattern Pieces",
    tooltip: null,
  },
  frontPiece: {
    designer: "Front piece",
    beginner: "Front piece",
    tooltip: null,
  },
  backPiece: {
    designer: "Back piece",
    beginner: "Back piece",
    tooltip: null,
  },
  addCustomMeasurement: {
    designer: "Add a custom measurement",
    beginner: "Add your own measurement",
    tooltip: null,
  },
};


// ============================================================================
// MODE MANAGEMENT
// ============================================================================

const MODE_STORAGE_KEY = "atelier-vocabulary-mode";

function getMode() {
  return localStorage.getItem(MODE_STORAGE_KEY) || "beginner";
}

function setMode(mode) {
  if (mode !== "beginner" && mode !== "designer") return;
  localStorage.setItem(MODE_STORAGE_KEY, mode);
}


// Get the display text for a term in the current mode
function term(key) {
  const entry = VOCABULARY[key];
  if (!entry) {
    console.warn(`Vocabulary key not found: ${key}`);
    return key;
  }
  return entry[getMode()] || entry.designer;
}


// Get the tooltip (explanation) for a term
function tooltip(key) {
  const entry = VOCABULARY[key];
  return entry ? entry.tooltip : null;
}


// ============================================================================
// EXPORT
// ============================================================================

window.Vocabulary = {
  VOCABULARY,
  getMode,
  setMode,
  term,
  tooltip,
};
