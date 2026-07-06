"""
services/ai_engine.py
─────────────────────
AI orchestration layer for text (typed) diary entries in LifeReel AI.
Uses GPT-4o-mini and HF image generation models.
"""

import logging
import asyncio
from services.voice_pipeline import analyze_memory_gemini, _run_hf_image_generation, local_generate_prompt

logger = logging.getLogger(__name__)

async def process_voice_diary_async(raw_text: str) -> dict:
    """
    Full AI pipeline for typed text: NLP analysis + image generation.
    """
    nlp_payload = await analyze_memory_gemini(raw_text)
    image_url = _run_hf_image_generation(nlp_payload["image_prompt"], nlp_payload.get("emotion", "Calm"))

    result = {
        **nlp_payload,
        "transcript": raw_text,
        "image_url": image_url,
    }

    logger.info(
        "AI pipeline (text) completed successfully.",
        extra={
            "title": result.get("title"),
            "emotion": result.get("emotion"),
            "image_url": image_url,
        },
    )

    return result


def process_voice_diary(raw_text: str) -> dict:
    """
    Legacy synchronous wrapper (keeps compatibility).
    """
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(process_voice_diary_async(raw_text))


def generate_artwork(transcript: str, emotion: str = "Calm") -> str | None:
    """
    Public utility to generate artwork based on a diary transcript and emotion.
    Runs GPT-4o-mini NLP to get a structured scene prompt, then calls Hugging Face.
    """
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    async def _run():
        try:
            nlp_payload = await analyze_memory_gemini(transcript)
            scene_prompt = nlp_payload.get("image_prompt", f"A cozy drawing representing {emotion.lower()} feelings")
        except Exception as exc:
            logger.warning(f"Failed to generate scene prompt for artwork regeneration: {exc}")
            scene_prompt = local_generate_prompt(transcript, emotion)
        return _run_hf_image_generation(scene_prompt, emotion)
        
    return loop.run_until_complete(_run())
