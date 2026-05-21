"""Test the full orchestrator pipeline."""

from agents.orchestrator import run_sketchboard

print("Running orchestrator with sample inputs...")
print()

result = run_sketchboard(
    user_description="flowing midi dress with balloon sleeves and a dropped waist",
    body_type="curvy",
    complexion="deep",
    aesthetic="indo-western-fusion",
)

print("--- Refined prompt ---")
print(result["refined_prompt"])
print()

if result.get("error"):
    print(f"ERROR: {result['error']}")
elif result.get("image"):
    result["image"].save("test_sketch.png")
    print(f"Saved test_sketch.png ({result['image'].size[0]}x{result['image'].size[1]} pixels)")
else:
    print("No image and no error — something odd happened.")