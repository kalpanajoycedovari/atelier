/**
 * Atelier — Pattern Engine
 *
 * Pure JavaScript geometry. Drafts sewing patterns from body measurements
 * using published formulas from Aldrich's Metric Pattern Cutting for Women's Wear.
 *
 * No AI involved. Every output is deterministic and verifiable with a ruler.
 *
 * UNITS: All internal math is in CENTIMETRES.
 * Convert to/from inches at the UI layer only.
 */


// ============================================================================
// CONSTANTS — drafting standards
// ============================================================================

// Wearing ease: extra room beyond pure body measurement for comfort and movement.
const HIP_EASE_CM = 1.0;       // standard skirt hip ease
const WAIST_DART_CM = 1.5;     // amount of fabric removed by the front waist dart
const WAIST_BACK_DART_CM = 2.0; // back dart is slightly larger (back body curves more)
const ALINE_FLARE_CM = 5.0;    // how much each side flares out at the hem

// Dart dimensions
const FRONT_DART_LENGTH_CM = 9.0;  // distance from waist down toward the bust
const BACK_DART_LENGTH_CM = 11.0;  // back dart is longer
const DART_POSITION_FROM_CENTRE_RATIO = 1 / 3; // dart sits 1/3 of waist width from centre

// Seam allowance: extra fabric outside the stitching line, standard for home sewing.
const SEAM_ALLOWANCE_CM = 1.5;


// ============================================================================
// DRAFT FUNCTION
// ============================================================================

/**
 * Draft an A-line skirt pattern from body measurements.
 *
 * @param {Object} measurements - All values in CENTIMETRES.
 * @param {number} measurements.waist  - Waist circumference.
 * @param {number} measurements.hips   - Hip circumference.
 * @param {number} measurements.length - Desired skirt length from waist to hem.
 * @param {number} measurements.hipDrop - Distance from waist down to fullest hip.
 *
 * @returns {Object} - Pattern data for front and back pieces.
 */
function draftAlineSkirt(measurements) {
  const { waist, hips, length, hipDrop } = measurements;

  // ---- Derived widths ----
  // Each pattern piece represents HALF the front (or back), because the fabric is folded.
  // The front is half the body, so the piece is 1/4 of the body circumference.
  const hipWidth = (hips / 4) + HIP_EASE_CM;

  // The waist is narrower than the hips. We start at hip width and subtract back to waist width.
  // The "missing" width gets removed by a dart, which is why we add the dart amount.
  const frontWaistWidth = (waist / 4) + WAIST_DART_CM;
  const backWaistWidth = (waist / 4) + WAIST_BACK_DART_CM;

  // A-line flare: the hem sticks out further than the hip.
  const hemWidth = hipWidth + ALINE_FLARE_CM;

  // ---- Build the front piece ----
  const front = buildPanel({
    waistWidth: frontWaistWidth,
    hipWidth: hipWidth,
    hemWidth: hemWidth,
    length: length,
    hipDrop: hipDrop,
    dartLength: FRONT_DART_LENGTH_CM,
    dartWidth: WAIST_DART_CM,
    pieceName: "front",
  });

  // ---- Build the back piece ----
  const back = buildPanel({
    waistWidth: backWaistWidth,
    hipWidth: hipWidth,
    hemWidth: hemWidth,
    length: length,
    hipDrop: hipDrop,
    dartLength: BACK_DART_LENGTH_CM,
    dartWidth: WAIST_BACK_DART_CM,
    pieceName: "back",
  });

  // ---- Compute the actual final piece dimensions for display ----
  const summary = {
    frontWaistWidth: frontWaistWidth - WAIST_DART_CM,  // after the dart closes
    backWaistWidth: backWaistWidth - WAIST_BACK_DART_CM,
    hipWidth: hipWidth,
    hemWidth: hemWidth,
    length: length,
    fabricWidthNeeded: (hemWidth * 2) + (SEAM_ALLOWANCE_CM * 4) + 10,  // rough estimate
    seamAllowance: SEAM_ALLOWANCE_CM,
  };

  return { front, back, summary };
}


/**
 * Build a single panel (front or back) given its specific parameters.
 * The panel is drawn with its centre-fold edge on the LEFT,
 * so coordinates increase to the right and downward.
 *
 * @returns {Object} - { points, dart, sideSeamCurve, labels }
 */
function buildPanel({ waistWidth, hipWidth, hemWidth, length, hipDrop, dartLength, dartWidth, pieceName }) {

  // ---- Key points on the pattern ----
  // (x = horizontal from the centre fold, y = vertical from the waist line)
  const centreFoldTop    = { x: 0, y: 0 };
  const centreFoldBottom = { x: 0, y: length };
  const waistEnd         = { x: waistWidth, y: 0 };
  const hipEnd           = { x: hipWidth, y: hipDrop };
  const hemEnd           = { x: hemWidth, y: length };

  // ---- The dart ----
  // Position: 1/3 of the waist width from the centre fold.
  const dartCentreX = waistWidth * DART_POSITION_FROM_CENTRE_RATIO;
  const dartHalfWidth = dartWidth / 2;
  const dart = {
    leftPoint:   { x: dartCentreX - dartHalfWidth, y: 0 },
    rightPoint:  { x: dartCentreX + dartHalfWidth, y: 0 },
    tipPoint:    { x: dartCentreX, y: dartLength },
  };

  // ---- The side seam curve ----
  // Goes smoothly from waist → hip → hem.
  // We use a quadratic curve through three points.
  const sideSeamCurve = {
    start:   waistEnd,
    control: hipEnd,
    end:     hemEnd,
  };

  // ---- Labels for the UI ----
  const labels = {
    centreFold: "Centre fold — place this edge on the fold of your fabric",
    waist: "Waistline",
    hem: "Hem",
    sideSeam: "Side seam — joins to the other piece here",
    dart: "Dart — sewn closed to shape the fabric over your body",
    grainLine: "Grain line — must run parallel to the fabric's selvedge",
  };

  return {
    pieceName,
    points: {
      centreFoldTop,
      centreFoldBottom,
      waistEnd,
      hipEnd,
      hemEnd,
    },
    dart,
    sideSeamCurve,
    labels,
    // Bounding box for SVG sizing
    boundingBox: {
      width: hemWidth,
      height: length,
    },
  };
}


// ============================================================================
// UNIT CONVERSION HELPERS
// ============================================================================

function cmToInches(cm) {
  return cm / 2.54;
}

function inchesToCm(inches) {
  return inches * 2.54;
}

/**
 * Format a measurement with appropriate precision.
 * cm → 1 decimal, inches → 2 decimals.
 */
function formatMeasurement(cm, unit = "cm") {
  if (unit === "in") {
    return cmToInches(cm).toFixed(2) + " in";
  }
  return cm.toFixed(1) + " cm";
}


// ============================================================================
// EXPORT — expose to global window for testing
// ============================================================================

window.PatternEngine = {
  draftAlineSkirt,
  cmToInches,
  inchesToCm,
  formatMeasurement,
};
