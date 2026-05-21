"""Orchestrator — LangGraph state machine that coordinates the sketchboard flow.

Current graph:
    START -> build_prompt_node -> generate_sketch_node -> END

Future expansion: add intent classification + conditional edges to route
between specialist agents (silhouette, fabric, pattern, trend).
"""

from typing import TypedDict, Optional
from PIL import Image
from langgraph.graph import StateGraph, START, END

from agents.sketch_agent import generate_sketch
from utils.prompt_builder import build_sketch_prompt


# --- State definition ---
# TypedDict gives us type-safe access to state fields. LangGraph reads this
# to know what fields exist and what types they should hold.
class AtelierState(TypedDict):
    # Inputs (set by the caller before invoking the graph)
    user_description: str
    body_type: str
    complexion: str
    aesthetic: str

    # Outputs (filled in by nodes as the graph runs)
    refined_prompt: Optional[str]
    image: Optional[Image.Image]
    error: Optional[str]


# --- Node 1: Build the refined FLUX prompt ---
def build_prompt_node(state: AtelierState) -> dict:
    """Convert raw user inputs into a FLUX-ready prompt.

    Reads: user_description, body_type, complexion, aesthetic
    Writes: refined_prompt
    """
    try:
        prompt = build_sketch_prompt(
            description=state["user_description"],
            body_type=state["body_type"],
            complexion=state["complexion"],
            aesthetic=state["aesthetic"],
        )
        return {"refined_prompt": prompt}
    except Exception as e:
        return {"error": f"Prompt building failed: {e}"}


# --- Node 2: Generate the sketch via FLUX ---
def generate_sketch_node(state: AtelierState) -> dict:
    """Call the sketch agent with the refined prompt.

    Reads: refined_prompt
    Writes: image (or error if generation fails)
    """
    # Short-circuit if a previous node failed
    if state.get("error"):
        return {}

    try:
        image = generate_sketch(state["refined_prompt"])
        return {"image": image}
    except Exception as e:
        return {"error": f"Sketch generation failed: {e}"}


# --- Build the graph ---
def build_atelier_graph():
    """Construct and compile the Atelier orchestration graph."""
    graph = StateGraph(AtelierState)

    # Register nodes
    graph.add_node("build_prompt", build_prompt_node)
    graph.add_node("generate_sketch", generate_sketch_node)

    # Define the flow: START -> build_prompt -> generate_sketch -> END
    graph.add_edge(START, "build_prompt")
    graph.add_edge("build_prompt", "generate_sketch")
    graph.add_edge("generate_sketch", END)

    return graph.compile()


# Compile the graph once at module load time.
# This is the object the Streamlit app will use.
atelier_graph = build_atelier_graph()


# --- Convenience function for the UI to call ---
def run_sketchboard(
    user_description: str,
    body_type: str,
    complexion: str,
    aesthetic: str,
) -> dict:
    """Run the full sketchboard flow and return the final state.

    Args:
        user_description: User's free-text design description.
        body_type: Key from BODY_TYPES dict.
        complexion: Key from COMPLEXIONS dict.
        aesthetic: Key from AESTHETICS dict.

    Returns:
        Final state dict containing refined_prompt, image, and/or error.
    """
    initial_state: AtelierState = {
        "user_description": user_description,
        "body_type": body_type,
        "complexion": complexion,
        "aesthetic": aesthetic,
        "refined_prompt": None,
        "image": None,
        "error": None,
    }

    final_state = atelier_graph.invoke(initial_state)
    return final_state