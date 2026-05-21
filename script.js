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
