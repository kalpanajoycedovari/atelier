/**
 * Atelier — frontend logic
 *
 * Listens for the Generate button, calls the Cloudflare Worker,
 * displays the resulting sketch, and maintains a session moodboard.
 */


// ============================================================================
// CONFIGURATION
// ============================================================================

const API_URL = "https://atelier-api.dovarikalpanajoyce.workers.dev";


// ============================================================================
// DOM ELEMENT REFERENCES
// ============================================================================

const descriptionInput = document.getElementById("description");
const bodyTypeSelect = document.getElementById("body-type");
const complexionSelect = document.getElementById("complexion");
const aestheticSelect = document.getElementById("aesthetic");
const generateBtn = document.getElementById("generate-btn");
const downloadBtn = document.getElementById("download-btn");

const placeholderEl = document.getElementById("result-placeholder");
const loadingEl = document.getElementById("result-loading");
const displayEl = document.getElementById("result-display");
const errorEl = document.getElementById("result-error");
const resultImage = document.getElementById("result-image");
const resultPrompt = document.getElementById("result-prompt");

const moodboardSection = document.getElementById("moodboard-section");
const moodboardCount = document.getElementById("moodboard-count");
const moodboardGrid = document.getElementById("moodboard-grid");


// ============================================================================
// SESSION STATE
// ============================================================================

const moodboard = [];
let currentImageDataUrl = null;


// ============================================================================
// UI STATE MACHINE
// ============================================================================

function showState(state) {
  // Hide all states first
  placeholderEl.hidden = true;
  loadingEl.hidden = true;
  displayEl.hidden = true;
  errorEl.hidden = true;

  // Show the requested one
  if (state === "placeholder") placeholderEl.hidden = false;
  if (state === "loading") loadingEl.hidden = false;
  if (state === "display") displayEl.hidden = false;
  if (state === "error") errorEl.hidden = false;
}


// ============================================================================
// MAIN GENERATE FLOW
// ============================================================================

async function generateSketch() {
  const description = descriptionInput.value.trim();

  if (!description) {
    showError("Please describe what you want to create.");
    return;
  }

  const payload = {
    description: description,
    body_type: bodyTypeSelect.value,
    complexion: complexionSelect.value,
    aesthetic: aestheticSelect.value,
  };

  // Lock the button so users can't double-submit
  generateBtn.disabled = true;
  generateBtn.textContent = "Sketching...";
  showState("loading");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server returned ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    if (!data.image_base64) {
      throw new Error("No image returned from server.");
    }

    // Convert base64 -> data URL for the <img> tag
    const dataUrl = `data:image/jpeg;base64,${data.image_base64}`;
    currentImageDataUrl = dataUrl;

    resultImage.src = dataUrl;
    resultPrompt.textContent = data.refined_prompt;

    showState("display");

    // Add to moodboard
    addToMoodboard({
      dataUrl: dataUrl,
      description: description,
      bodyType: bodyTypeSelect.value,
      complexion: complexionSelect.value,
      aesthetic: aestheticSelect.value,
    });

  } catch (err) {
    console.error("Sketch generation failed:", err);
    showError(err.message || "Something went wrong. Please try again.");
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "Generate Sketch";
  }
}


function showError(message) {
  errorEl.textContent = message;
  showState("error");
}


// ============================================================================
// MOODBOARD
// ============================================================================

function addToMoodboard(entry) {
  moodboard.unshift(entry);  // newest first
  renderMoodboard();
}


function renderMoodboard() {
  if (moodboard.length === 0) {
    moodboardSection.hidden = true;
    return;
  }

  moodboardSection.hidden = false;
  moodboardCount.textContent = `${moodboard.length} sketch${moodboard.length === 1 ? "" : "es"} this session`;

  // Rebuild grid
  moodboardGrid.innerHTML = "";

  moodboard.forEach((entry, index) => {
    const item = document.createElement("div");
    item.className = "moodboard-item";
    item.setAttribute("role", "button");
    item.setAttribute("tabindex", "0");
    item.setAttribute("aria-label", `View sketch: ${entry.description}`);

    const img = document.createElement("img");
    img.src = entry.dataUrl;
    img.alt = entry.description;
    item.appendChild(img);

    const caption = document.createElement("div");
    caption.className = "moodboard-item-caption";
    caption.textContent = entry.description;
    item.appendChild(caption);

    // Click to re-display this sketch as the current result
    item.addEventListener("click", () => loadFromMoodboard(index));
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        loadFromMoodboard(index);
      }
    });

    moodboardGrid.appendChild(item);
  });
}


function loadFromMoodboard(index) {
  const entry = moodboard[index];
  if (!entry) return;

  resultImage.src = entry.dataUrl;
  resultPrompt.textContent = `${entry.description} — ${entry.bodyType}, ${entry.complexion}, ${entry.aesthetic}`;
  currentImageDataUrl = entry.dataUrl;

  showState("display");

  // Scroll the result section into view
  document.getElementById("result-section").scrollIntoView({ behavior: "smooth" });
}


// ============================================================================
// DOWNLOAD
// ============================================================================

function downloadSketch() {
  if (!currentImageDataUrl) return;

  const link = document.createElement("a");
  link.href = currentImageDataUrl;
  link.download = `atelier-sketch-${Date.now()}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


// ============================================================================
// EVENT WIRING
// ============================================================================

generateBtn.addEventListener("click", generateSketch);
downloadBtn.addEventListener("click", downloadSketch);

// Allow Ctrl+Enter / Cmd+Enter in the textarea to submit
descriptionInput.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    generateSketch();
  }
});

// Initial state
showState("placeholder");
// ============================================================================
// PATTERN-MAKING FEATURE
// ============================================================================

const showPatternBtn = document.getElementById("show-pattern-btn");
const patternColumn = document.getElementById("pattern-column");
const draftPatternBtn = document.getElementById("draft-pattern-btn");
const patternDisplay = document.getElementById("pattern-display");
const frontSvgContainer = document.getElementById("front-svg-container");
const backSvgContainer = document.getElementById("back-svg-container");
const frontExplanation = document.getElementById("front-explanation");
const backExplanation = document.getElementById("back-explanation");
const patternSummary = document.getElementById("pattern-summary");

const measurementCategoriesContainer = document.getElementById("measurement-categories");
const customMeasurementsList = document.getElementById("custom-measurements-list");
const addCustomBtn = document.getElementById("add-custom-btn");

const modeToggleCheckbox = document.getElementById("mode-toggle-checkbox");
const modeToggleText = document.getElementById("mode-toggle-text");
const measurementsHeading = document.getElementById("measurements-heading");
const measurementsSubheading = document.getElementById("measurements-subheading");
const addCustomText = document.getElementById("add-custom-text");

const unitRadios = document.querySelectorAll('input[name="unit"]');


// ============================================================================
// FORM BUILDING — render the measurement form from data
// ============================================================================

function buildMeasurementForm() {
  const savedValues = Measurements.loadMeasurements();
  const unit = getCurrentUnit();

  measurementCategoriesContainer.innerHTML = "";

  Measurements.MEASUREMENT_CATEGORIES.forEach((category) => {
    const categoryEl = document.createElement("div");
    categoryEl.className = "measurement-category";
    categoryEl.dataset.categoryId = category.id;

    // Header (clickable to expand/collapse)
    const header = document.createElement("div");
    header.className = "category-header";

    const title = document.createElement("span");
    title.className = "category-title";
    title.dataset.designer = category.name.designer;
    title.dataset.beginner = category.name.beginner;
    title.textContent = category.name[Vocabulary.getMode()];

    const chevron = document.createElement("span");
    chevron.className = "category-chevron";
    chevron.textContent = "▶";
    if (category.expandedByDefault) chevron.classList.add("expanded");

    header.appendChild(title);
    header.appendChild(chevron);
    categoryEl.appendChild(header);

    // Body (the measurement inputs)
    const body = document.createElement("div");
    body.className = "category-body";
    if (!category.expandedByDefault) body.hidden = true;

    category.measurements.forEach((m) => {
      const row = buildMeasurementRow(m, savedValues[m.key], unit);
      body.appendChild(row);
    });

    categoryEl.appendChild(body);

    // Expand/collapse toggle
    header.addEventListener("click", () => {
      body.hidden = !body.hidden;
      chevron.classList.toggle("expanded", !body.hidden);
    });

    measurementCategoriesContainer.appendChild(categoryEl);
  });
}


function buildMeasurementRow(measurementDef, valueCm, unit) {
  const row = document.createElement("div");
  row.className = "measurement-row";
  row.dataset.measurementKey = measurementDef.key;

  // Top section — label + info button
  const top = document.createElement("div");
  top.className = "measurement-row-top";

  const label = document.createElement("label");
  label.htmlFor = "m-" + measurementDef.key;
  label.dataset.vocabKey = measurementDef.vocabKey;
  label.textContent = Vocabulary.term(measurementDef.vocabKey);

  const infoBtn = document.createElement("button");
  infoBtn.type = "button";
  infoBtn.className = "measurement-info-btn";
  infoBtn.setAttribute("aria-label", "Show explanation");
  infoBtn.textContent = "i";

  top.appendChild(label);
  top.appendChild(infoBtn);
  row.appendChild(top);

  // Tooltip (hidden by default)
  const tooltipEl = document.createElement("div");
  tooltipEl.className = "measurement-tooltip";
  tooltipEl.dataset.vocabKey = measurementDef.vocabKey;
  tooltipEl.textContent = Vocabulary.tooltip(measurementDef.vocabKey) || "";
  tooltipEl.hidden = true;
  row.appendChild(tooltipEl);

  infoBtn.addEventListener("click", () => {
    tooltipEl.hidden = !tooltipEl.hidden;
  });

  // Input
  const input = document.createElement("input");
  input.type = "number";
  input.id = "m-" + measurementDef.key;
  input.dataset.measurementKey = measurementDef.key;
  input.step = unit === "in" ? "0.25" : "0.5";

  const displayValue = unit === "in" ? (valueCm / 2.54).toFixed(2) : valueCm.toFixed(1);
  input.value = displayValue;

  input.addEventListener("change", () => {
    saveAllMeasurements();
  });

  row.appendChild(input);

  return row;
}


function buildCustomMeasurementsList() {
  customMeasurementsList.innerHTML = "";
  const customs = Measurements.loadCustomMeasurements();
  const unit = getCurrentUnit();

  customs.forEach((custom) => {
    const row = document.createElement("div");
    row.className = "custom-row";
    row.dataset.customKey = custom.key;

    const labelInput = document.createElement("input");
    labelInput.type = "text";
    labelInput.placeholder = "Measurement name";
    labelInput.value = custom.label;
    labelInput.addEventListener("change", () => {
      const all = Measurements.loadCustomMeasurements();
      const target = all.find((c) => c.key === custom.key);
      if (target) {
        target.label = labelInput.value;
        Measurements.saveCustomMeasurements(all);
      }
    });

    const valueInput = document.createElement("input");
    valueInput.type = "number";
    valueInput.step = unit === "in" ? "0.25" : "0.5";
    const display = unit === "in" ? (custom.valueCm / 2.54).toFixed(2) : custom.valueCm.toFixed(1);
    valueInput.value = display;
    valueInput.addEventListener("change", () => {
      const raw = parseFloat(valueInput.value) || 0;
      const cm = unit === "in" ? raw * 2.54 : raw;
      Measurements.updateCustomMeasurement(custom.key, cm);
    });

    const unitSpan = document.createElement("span");
    unitSpan.style.fontSize = "0.75rem";
    unitSpan.style.color = "var(--color-text-muted)";
    unitSpan.textContent = unit;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "custom-remove-btn";
    removeBtn.textContent = "×";
    removeBtn.setAttribute("aria-label", "Remove this measurement");
    removeBtn.addEventListener("click", () => {
      Measurements.removeCustomMeasurement(custom.key);
      buildCustomMeasurementsList();
    });

    row.appendChild(labelInput);
    row.appendChild(valueInput);
    row.appendChild(unitSpan);
    row.appendChild(removeBtn);
    customMeasurementsList.appendChild(row);
  });
}


addCustomBtn.addEventListener("click", () => {
  const unit = getCurrentUnit();
  const defaultCm = unit === "in" ? 25.4 : 25;  // 10 inches or 25 cm
  Measurements.addCustomMeasurement("", defaultCm);
  buildCustomMeasurementsList();
});


// ============================================================================
// UNIT TOGGLE
// ============================================================================

function getCurrentUnit() {
  for (const radio of unitRadios) {
    if (radio.checked) return radio.value;
  }
  return "cm";
}


unitRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    // Rebuild the form so all inputs convert at once
    buildMeasurementForm();
    buildCustomMeasurementsList();
  });
});


// ============================================================================
// SAVE ALL CURRENT MEASUREMENT VALUES
// ============================================================================

function saveAllMeasurements() {
  const unit = getCurrentUnit();
  const inputs = document.querySelectorAll('input[data-measurement-key]');
  const values = {};

  inputs.forEach((input) => {
    const key = input.dataset.measurementKey;
    const raw = parseFloat(input.value) || 0;
    values[key] = unit === "in" ? raw * 2.54 : raw;
  });

  Measurements.saveMeasurements(values);
}


// ============================================================================
// MODE TOGGLE — Beginner / Designer
// ============================================================================

function applyMode() {
  const mode = Vocabulary.getMode();

  // Set the checkbox state — checked = beginner, unchecked = designer
  modeToggleCheckbox.checked = (mode === "beginner");
  modeToggleText.textContent = mode === "beginner" ? "Beginner mode" : "Designer mode";

  // Update UI-level strings
  measurementsHeading.textContent = Vocabulary.term("yourMeasurements");
  addCustomText.textContent = Vocabulary.term("addCustomMeasurement");
  draftPatternBtn.textContent = Vocabulary.term("draftMyPattern");

  // Update measurement labels
  document.querySelectorAll('label[data-vocab-key]').forEach((label) => {
    label.textContent = Vocabulary.term(label.dataset.vocabKey);
  });

  // Update tooltips
  document.querySelectorAll('.measurement-tooltip[data-vocab-key]').forEach((el) => {
    el.textContent = Vocabulary.tooltip(el.dataset.vocabKey) || "";
  });

  // Update category titles
  document.querySelectorAll('.category-title').forEach((title) => {
    title.textContent = mode === "beginner" ? title.dataset.beginner : title.dataset.designer;
  });
}


modeToggleCheckbox.addEventListener("change", () => {
  Vocabulary.setMode(modeToggleCheckbox.checked ? "beginner" : "designer");
  applyMode();
});


// ============================================================================
// REVEAL PATTERN COLUMN
// ============================================================================

showPatternBtn.addEventListener("click", () => {
  patternColumn.hidden = false;
  patternColumn.scrollIntoView({ behavior: "smooth", block: "nearest" });
});


// ============================================================================
// DRAFT THE PATTERN
// ============================================================================

draftPatternBtn.addEventListener("click", () => {
  const unit = getCurrentUnit();

  // Read all the form inputs and convert to cm
  saveAllMeasurements();
  const values = Measurements.loadMeasurements();

  const waist = values.waist;
  const hips = values.hips;
  const skirtLength = values.skirtLength;
  const waistToHip = values.waistToHip;

  // Sanity check
  if (!waist || !hips || !skirtLength || !waistToHip) {
    alert("Please fill in waist, hips, skirt length, and waist-to-hip.");
    return;
  }

  if (hips < waist) {
    alert("Hips should usually be larger than waist. Please double-check your measurements.");
    return;
  }

  // Draft the pattern using the existing engine
  const pattern = PatternEngine.draftAlineSkirt({
    waist,
    hips,
    length: skirtLength,
    hipDrop: waistToHip,
  });

  // Render
  renderPatternPiece(frontSvgContainer, pattern.front);
  renderPatternPiece(backSvgContainer, pattern.back);

  frontExplanation.textContent = explainFrontPiece(pattern.front, pattern.summary, unit);
  backExplanation.textContent = explainBackPiece(pattern.back, pattern.summary, unit);

  patternSummary.innerHTML = buildSummaryHTML(pattern.summary, unit);

  patternDisplay.hidden = false;
});


// ============================================================================
// SVG RENDERING (Step E will rewrite this with measurement labels)
// ============================================================================

function renderPatternPiece(container, piece) {
  const PADDING = 12;
  const SCALE = 4;
  const unit = getCurrentUnit();

  const bbWidth = piece.boundingBox.width;
  const bbHeight = piece.boundingBox.height;

  // Extra space on the right for labels that hang off
  const RIGHT_LABEL_SPACE = 8;
  const svgWidth = (bbWidth + PADDING * 2 + RIGHT_LABEL_SPACE) * SCALE;
  const svgHeight = (bbHeight + PADDING * 2) * SCALE;

  function px(x) { return (x + PADDING) * SCALE; }
  function py(y) { return (y + PADDING) * SCALE; }

  const p = piece.points;
  const c = piece.sideSeamCurve;
  const d = piece.dart;

  // --- Compute edge lengths (in cm) ---
  const waistEdgeLength = p.waistEnd.x;
  const foldEdgeLength = bbHeight;
  const hemEdgeLength = p.centreFoldBottom.x === 0 ? c.end.x : (c.end.x - p.centreFoldBottom.x);
  const sideSeamLength = approxCurveLength(p.waistEnd, c.control, c.end);
  const dartLength = d.tipPoint.y;

  // --- Outline path ---
  const outlinePath = [
    `M ${px(p.centreFoldTop.x)} ${py(p.centreFoldTop.y)}`,
    `L ${px(p.waistEnd.x)} ${py(p.waistEnd.y)}`,
    `Q ${px(c.control.x)} ${py(c.control.y)}, ${px(c.end.x)} ${py(c.end.y)}`,
    `L ${px(p.centreFoldBottom.x)} ${py(p.centreFoldBottom.y)}`,
    `Z`,
  ].join(" ");

  // --- Dart path ---
  const dartPath = [
    `M ${px(d.leftPoint.x)} ${py(d.leftPoint.y)}`,
    `L ${px(d.tipPoint.x)} ${py(d.tipPoint.y)}`,
    `L ${px(d.rightPoint.x)} ${py(d.rightPoint.y)}`,
  ].join(" ");

  // --- Grain line (middle of the piece) ---
  const grainLineX = bbWidth / 2;
  const grainLineTop = py(2);
  const grainLineBottom = py(bbHeight - 2);

  // --- Labels (translation-aware) ---
  const foldLabel = Vocabulary.term("centreFold").toUpperCase();
  const grainLabel = Vocabulary.term("grainLine").toUpperCase();

  // --- Edge measurement labels ---
  const fmt = (cm) => PatternEngine.formatMeasurement(cm, unit);

  // Position the measurement text
  const waistMidX = (p.centreFoldTop.x + p.waistEnd.x) / 2;
  const hemMidX = (p.centreFoldBottom.x + c.end.x) / 2;
  const foldMidY = bbHeight / 2;
  const sideMidX = (p.waistEnd.x + c.end.x) / 2 + 2;
  const sideMidY = (p.waistEnd.y + c.end.y) / 2;

  const svg = `
    <svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="${Math.min(svgWidth, 380)}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%;">

      <!-- Outline -->
      <path d="${outlinePath}" fill="#FFFFFF" stroke="#1A1611" stroke-width="1.5" />

      <!-- Centre fold edge (dashed gold) -->
      <line x1="${px(0)}" y1="${py(0)}" x2="${px(0)}" y2="${py(bbHeight)}"
            stroke="#E8B800" stroke-width="2" stroke-dasharray="4 4" />

      <!-- Dart -->
      <path d="${dartPath}" fill="none" stroke="#1A1611" stroke-width="1" />

      <!-- Grain line with arrows -->
      <line x1="${px(grainLineX)}" y1="${grainLineTop}" x2="${px(grainLineX)}" y2="${grainLineBottom}"
            stroke="#E8B800" stroke-width="1.5" />
      <polygon points="${px(grainLineX) - 4},${grainLineTop + 8} ${px(grainLineX) + 4},${grainLineTop + 8} ${px(grainLineX)},${grainLineTop}" fill="#E8B800" />
      <polygon points="${px(grainLineX) - 4},${grainLineBottom - 8} ${px(grainLineX) + 4},${grainLineBottom - 8} ${px(grainLineX)},${grainLineBottom}" fill="#E8B800" />

      <!-- Centre fold edge label (rotated vertically along left edge) -->
      <text x="${px(0) - 4}" y="${py(foldMidY)}"
            font-family="Inter, sans-serif" font-size="8" fill="#5C5547"
            text-anchor="middle"
            transform="rotate(-90 ${px(0) - 4} ${py(foldMidY)})">${foldLabel}</text>

      <!-- Grain line label (positioned above midpoint to avoid colliding with side seam label) -->
      <text x="${px(grainLineX) + 6}" y="${py(foldMidY - 6)}"
            font-family="Inter, sans-serif" font-size="8" fill="#5C5547"
            text-anchor="start">${grainLabel}</text>
      <!-- Top (waist) edge measurement -->
      <text x="${px(waistMidX)}" y="${py(0) - 4}"
            font-family="Inter, sans-serif" font-size="10" font-weight="600" fill="#1A1611"
            text-anchor="middle">${fmt(waistEdgeLength)}</text>

      <!-- Left (fold) edge measurement -->
      <text x="${px(0) - 18}" y="${py(foldMidY)}"
            font-family="Inter, sans-serif" font-size="10" font-weight="600" fill="#1A1611"
            text-anchor="middle"
            transform="rotate(-90 ${px(0) - 18} ${py(foldMidY)})">${fmt(foldEdgeLength)}</text>

      <!-- Bottom (hem) edge measurement -->
      <text x="${px(hemMidX)}" y="${py(bbHeight) + 14}"
            font-family="Inter, sans-serif" font-size="10" font-weight="600" fill="#1A1611"
            text-anchor="middle">${fmt(hemEdgeLength)}</text>

      <!-- Right (slanted) edge measurement -->
      <text x="${px(sideMidX) + 14}" y="${py(sideMidY)}"
            font-family="Inter, sans-serif" font-size="10" font-weight="600" fill="#1A1611"
            text-anchor="start">${fmt(sideSeamLength)}</text>

      <!-- Dart length -->
      <text x="${px(d.tipPoint.x) + 6}" y="${py(d.tipPoint.y / 2)}"
            font-family="Inter, sans-serif" font-size="9" fill="#5C5547"
            text-anchor="start">${fmt(dartLength)}</text>

    </svg>
  `;

  container.innerHTML = svg;
}


// Approximate the length of a quadratic Bezier curve from p0 -> ctrl -> p1
// using a simple polyline approximation. Good enough for label display.
function approxCurveLength(p0, ctrl, p1) {
  let length = 0;
  let prevX = p0.x, prevY = p0.y;
  const steps = 20;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * ctrl.x + t * t * p1.x;
    const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * ctrl.y + t * t * p1.y;
    length += Math.sqrt((x - prevX) ** 2 + (y - prevY) ** 2);
    prevX = x;
    prevY = y;
  }
  return length;
}

// ============================================================================
// EXPLANATIONS
// ============================================================================

function explainFrontPiece(piece, summary, unit) {
  const w = PatternEngine.formatMeasurement(summary.frontWaistWidth, unit);
  const h = PatternEngine.formatMeasurement(summary.hipWidth, unit);
  const hem = PatternEngine.formatMeasurement(summary.hemWidth, unit);

  if (Vocabulary.getMode() === "beginner") {
    return (
      `This is the front of your skirt. The left edge (with the dashed gold line) has to sit on the fold of your fabric — that way you only cut one of these and the fabric is mirrored to make the full front. ` +
      `The small V-shape at the top is a shaping wedge: when you sew it closed, the flat fabric is pulled into a curve so it fits over your hips. ` +
      `The finished piece is ${w} across at the top, ${h} at the widest part, and ${hem} at the bottom.`
    );
  } else {
    return (
      `Front pattern piece — place the centre fold on the fabric fold. ` +
      `Front waist dart shapes the bodice over the hip curve. ` +
      `Finished dimensions: waist ${w}, hip ${h}, hem ${hem}.`
    );
  }
}


function explainBackPiece(piece, summary, unit) {
  const w = PatternEngine.formatMeasurement(summary.backWaistWidth, unit);

  if (Vocabulary.getMode() === "beginner") {
    return (
      `This is the back of your skirt. Same idea as the front, but with a slightly longer shaping wedge — your back curves more than your front, so it needs more pulling-in to fit. ` +
      `The back top edge measures ${w} on the pattern. After you cut both pieces, you sew them together along the slanted right edge (this is the side seam).`
    );
  } else {
    return (
      `Back pattern piece — place the centre fold on the fabric fold. ` +
      `Back dart is longer than the front to accommodate the greater curvature. ` +
      `Back waist measures ${w}. Join to front along the side seam.`
    );
  }
}


function buildSummaryHTML(summary, unit) {
  const hemTotal = PatternEngine.formatMeasurement(summary.hemWidth * 2 + 10, unit);
  const sa = PatternEngine.formatMeasurement(summary.seamAllowance, unit);

  if (Vocabulary.getMode() === "beginner") {
    return `
      <strong>What to do next</strong><br>
      Cut both pattern pieces from your fabric, lining up the dashed edge (left side) with the folded edge of your fabric. ` +
      `You'll need fabric at least ${hemTotal} wide. ` +
      `Pin and sew the small V-shape (wedge) closed on each piece, then sew the two pieces together along the slanted edges (the sides). ` +
      `Fold up and stitch the bottom edge for a clean hem, and attach a waistband at the top.<br><br>
      <strong>Note:</strong> Extra stitching room of ${sa} is already included in these pieces.
    `;
  } else {
    return `
      <strong>Construction steps</strong><br>
      Cut both pieces on the fold. Fabric requirement: ${hemTotal} minimum width. ` +
      `Sew darts closed, join at side seams, hem the lower edge, attach a waistband or facing.<br><br>
      <strong>Seam allowance:</strong> ${sa} included.
    `;
  }
}


// ============================================================================
// INITIALISE THE FORM ON PAGE LOAD
// ============================================================================

buildMeasurementForm();
buildCustomMeasurementsList();
applyMode();