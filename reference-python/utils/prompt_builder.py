"""Prompt builder — converts user choices into FLUX-friendly prompt fragments.

Body type descriptors emphasise silhouette proportions rather than feature sizes
to avoid AI-generated caricature. Complexion descriptors use South Asian skin
tone vocabulary. Composition cues enforce a single-figure illustration to
prevent FLUX's tendency to produce design-plate style duplicates.
"""


# --- Body type vocabulary ---
BODY_TYPES = {
    "slim": "slim slender build, lean frame, narrow waist and hips, willowy proportions",
    "average": "average natural build, balanced proportions, moderate frame",
    "curvy": "curvy hourglass build with a defined waist and proportionally wider hips, soft natural curves, realistic body proportions",
    "plus-size": "plus-size body with soft natural curves, fuller frame, broader hips and shoulders, realistic generous proportions",
    "athletic": "athletic toned build, defined frame, strong shoulders, lean musculature",
}


# --- Complexion vocabulary ---
COMPLEXIONS = {
    "fair": "very fair Indian skin, light ivory complexion with cool undertones",
    "light": "light Indian wheatish skin, warm light beige complexion",
    "medium": "medium wheatish Indian skin tone, warm golden beige complexion, natural Indian skin",
    "tan": "tan dusky Indian skin tone, warm caramel complexion, sun-kissed brown",
    "deep": "deep dusky Indian skin tone, rich warm brown complexion, dark Indian skin",
}


# --- Aesthetic vocabulary ---
AESTHETICS = {
    "indian-traditional": "traditional Indian fashion, drape, embroidery, ethnic silhouette, mehendi-style detailing",
    "indo-western-fusion": "Indo-western fusion fashion, modern silhouette with Indian elements, contemporary drape",
    "western-contemporary": "contemporary western fashion, modern minimal silhouette",
    "minimalist": "minimalist clean fashion, refined silhouette, understated elegance",
    "maximalist": "maximalist bold fashion, dramatic silhouette and detailing, statement piece",
}


# --- Universal FLUX styling instructions ---
# Composition cues are explicit and repeated to enforce single-figure output.
# We avoid the word 'croquis' which sometimes triggers multi-pose design plates.
STYLE_SUFFIX = (
    "fashion design illustration, single full-body sketch, "
    "one woman only, solo portrait, centered composition, "
    "clean line drawing on plain white background, "
    "elegant pose, realistic proportions, dignified pose, modest styling, "
    "no duplicate figures, no shadow copies, no secondary sketches, "
    "no design plate, no multiple poses, isolated subject"
)


def build_sketch_prompt(
    description: str,
    body_type: str,
    complexion: str,
    aesthetic: str,
) -> str:
    """Assemble a complete FLUX prompt from user inputs."""

    body_fragment = BODY_TYPES.get(body_type, "average natural build")
    complexion_fragment = COMPLEXIONS.get(complexion, "medium wheatish Indian skin tone")
    aesthetic_fragment = AESTHETICS.get(aesthetic, "contemporary fashion")

    full_prompt = (
        f"A single Indian woman, {body_fragment}, {complexion_fragment}, "
        f"wearing {description}, "
        f"{aesthetic_fragment}, "
        f"{STYLE_SUFFIX}"
    )

    return full_prompt