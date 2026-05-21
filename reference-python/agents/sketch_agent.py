"""Sketch agent — calls Hugging Face Inference Providers to generate a design sketch.

Uses the modern 2026 Inference Providers API (router.huggingface.co) instead of
the deprecated api-inference.huggingface.co endpoint.
"""

from huggingface_hub import InferenceClient
from PIL import Image

from utils.config import HF_TOKEN, HF_IMAGE_MODEL


# The InferenceClient handles auth, routing, and response parsing.
# provider='auto' lets Hugging Face pick the best available provider for FLUX
# (currently routes to fal-ai, replicate, or similar partners).
_client = InferenceClient(
    api_key=HF_TOKEN,
    provider="auto",
)


def generate_sketch(prompt: str) -> Image.Image:
    """Generate a fashion sketch from a text prompt.

    Args:
        prompt: A refined, descriptive prompt for FLUX.

    Returns:
        A PIL Image object containing the generated sketch.

    Raises:
        Exception: If the API call fails (network, auth, quota, etc.)
    """

    image = _client.text_to_image(
        prompt,
        model=HF_IMAGE_MODEL,
    )

    return image