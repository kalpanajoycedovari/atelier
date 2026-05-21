"""Configuration loader for Atelier.

Reads API keys from .env and exposes them as Python variables.
Fails loudly if a required key is missing — better to crash at startup
than to discover the key was never set five minutes into a user session.
"""

import os
from dotenv import load_dotenv

# Load .env file from the project root into os.environ
load_dotenv()

# Read the keys we need
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
HF_TOKEN = os.getenv("HF_TOKEN")

# Validate they exist — fail fast with a clear message if not
if not GROQ_API_KEY:
    raise ValueError(
        "GROQ_API_KEY not found. Check your .env file exists and contains "
        "GROQ_API_KEY=gsk_..."
    )

if not HF_TOKEN:
    raise ValueError(
        "HF_TOKEN not found. Check your .env file exists and contains "
        "HF_TOKEN=hf_..."
    )

# Model identifiers — kept here so they're easy to swap later
GROQ_MODEL = "llama-3.3-70b-versatile"
HF_IMAGE_MODEL = "black-forest-labs/FLUX.1-schnell"