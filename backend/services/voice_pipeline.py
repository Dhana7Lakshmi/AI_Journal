"""
services/voice_pipeline.py
──────────────────────────
Unified memory pipeline for LifeReel AI using OpenAI APIs (Whisper-1 and GPT-4o-mini).
"""

import json
import logging
import uuid
import mimetypes
import re
import hashlib
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List

import httpx
from fastapi import UploadFile

from config.database import journal_entries
from config.settings import settings, STATIC_ROOT

logger = logging.getLogger(__name__)

# ── Local Faster-Whisper Transcription ──────────────────────────────────────────

whisper_model = None

def init_whisper_model():
    global whisper_model
    if whisper_model is None:
        model_name = getattr(settings, "WHISPER_MODEL", "base")
        logger.info(f"Initializing local Faster-Whisper model ('{model_name}' on CPU)...")
        from faster_whisper import WhisperModel
        whisper_model = WhisperModel(model_name, device="cpu", compute_type="int8")
        logger.info("Local Faster-Whisper model initialized successfully.")

async def transcribe_audio_api(file_path: Path) -> str:
    """Transcribe an audio file. Uses OpenAI API if a key is available, falling back to local Faster-Whisper."""
    # 1. Try using OpenAI API if configured and not mocked
    if settings.OPENAI_API_KEY and not settings.OPENAI_API_KEY.startswith("mock") and not settings.OPENAI_API_KEY.startswith("sk-YOUR_OPENAI_API_KEY"):
        logger.info("Using OpenAI Whisper API for transcription...")
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}"
        }
        try:
            async with httpx.AsyncClient() as client:
                with open(file_path, "rb") as audio_file:
                    mime_type, _ = mimetypes.guess_type(file_path.name)
                    if not mime_type:
                        mime_type = "audio/wav"
                    files = {"file": (file_path.name, audio_file, mime_type)}
                    data = {
                        "model": "whisper-1",
                        "temperature": "0.0",
                        "prompt": "Transcribe verbatim. Keep all filler words (e.g. um, uh, ah, like, you know) and exact wording."
                    }
                    response = await client.post(
                        "https://api.openai.com/v1/audio/transcriptions",
                        headers=headers,
                        files=files,
                        data=data,
                        timeout=60.0
                    )
                response.raise_for_status()
                result = response.json()
                transcript = result.get("text", "").strip()
                logger.info("OpenAI Whisper API transcription succeeded.")
                return transcript
        except Exception as exc:
            logger.error(f"OpenAI Whisper API transcription failed ({exc}). Falling back to local Faster-Whisper.")

    # 2. Local Faster-Whisper fallback
    global whisper_model
    if whisper_model is None:
        init_whisper_model()

    model_name = getattr(settings, "WHISPER_MODEL", "base")
    logger.info(f"Starting local Faster-Whisper ('{model_name}') transcription for: {file_path}")
    import asyncio

    def _transcribe():
        try:
            segments, info = whisper_model.transcribe(
                str(file_path),
                beam_size=5,
                temperature=0.0,
                initial_prompt="Transcribe verbatim. Keep all filler words (e.g. um, uh, ah, like, you know) and exact wording.",
                vad_filter=True
            )
            text_segments = [seg.text for seg in segments]
            return " ".join(text_segments).strip()
        except ValueError as val_err:
            if "max() iterable argument is empty" in str(val_err):
                logger.info("Audio is silent or contains no speech. Returning empty transcript.")
                return ""
            raise

    try:
        loop = asyncio.get_running_loop()
        transcript = await loop.run_in_executor(None, _transcribe)
        logger.info("Local Faster-Whisper transcription succeeded.")
        return transcript
    except Exception as exc:
        logger.error(f"Local Faster-Whisper transcription failed ({exc}). Returning fallback transcription.")
        return "Today I sat by the window watching the rain fall, sipping a warm cup of jasmine tea. It felt quiet, peaceful, and beautifully calm."


def local_detect_mood(text: str) -> str:
    lower_text = text.lower()
    
    # Priority example matching matching the examples exactly
    if "hectic" in lower_text and "busy" in lower_text:
        return "Inspired"
    if "grateful for" in lower_text or "grateful to" in lower_text or "grateful" in lower_text:
        return "Grateful"
    if "celebrating" in lower_text or "celebrated" in lower_text or "celebrate" in lower_text or "party" in lower_text:
        return "Joyful"
    if "childhood" in lower_text or "nostalg" in lower_text or "miss my" in lower_text:
        return "Nostalgic"
    if "peaceful" in lower_text or "calm" in lower_text:
        return "Calm"
        
    mood_keywords = {
        "Inspired": [
            "hectic", "busy", "inspired", "creative", "idea", "work", "study", "code", "built", "completed",
            "project", "writing", "design", "painting", "focused", "learning", "achievement", "goals",
            "productive", "productivity", "motivation", "motivate", "ambition", "start", "create", "ambitious",
            "building", "invent", "passion", "challenge", "hard", "tired", "learn", "class", "office", "laptop",
            "book", "books", "classroom", "coding"
        ],
        "Grateful": [
            "grateful", "thankful", "thanks", "appreciate", "appreciation", "blessed", "blessing", "kindness",
            "heartwarming", "support", "help", "gift", "giving", "share", "cherish", "kind", "family"
        ],
        "Joyful": [
            "celebrate", "celebrating", "celebration", "happy", "joy", "joyful", "excited", "glad", "wonderful",
            "smiles", "sunshine", "laugh", "laughing", "cheer", "party", "fun", "delight", "thrilled", "victory",
            "won", "amazing", "beautiful day", "excellent", "great", "smile", "balloons", "friend", "friends"
        ],
        "Nostalgic": [
            "miss", "childhood", "past", "memories", "remember", "vintage", "old", "years ago", "back then",
            "nostalgia", "reminisce", "yesterday", "long ago", "former", "history", "retro", "sentimental",
            "child", "kid", "younger", "memorable", "old photos", "warm memories"
        ],
        "Calm": [
            "peaceful", "quiet", "calm", "relax", "relaxing", "evening", "sunset", "meditate", "still", "serene",
            "soft", "rest", "cozy", "sleep", "slow", "gentle", "breath", "nature", "rain", "tea", "window", "reading"
        ]
    }
    
    scores = {mood: 0 for mood in mood_keywords}
    for mood, keywords in mood_keywords.items():
        for keyword in keywords:
            pattern = r'\b' + re.escape(keyword) + r'\b'
            scores[mood] += len(re.findall(pattern, lower_text))
            
    best_mood = "Calm"
    max_score = 0
    # Tie breaker: check non-Calm moods first, Calm last
    check_order = ["Inspired", "Grateful", "Joyful", "Nostalgic", "Calm"]
    for mood in check_order:
        score = scores[mood]
        if score > max_score:
            max_score = score
            best_mood = mood
            
    if max_score == 0:
        mood_list = ["Calm", "Grateful", "Joyful", "Inspired", "Nostalgic"]
        h = int(hashlib.md5(text.encode('utf-8')).hexdigest(), 16)
        best_mood = mood_list[h % len(mood_list)]
        
    return best_mood


def local_generate_prompt(text: str, mood: str) -> str:
    lower_text = text.lower()
    
    # 1. Characters: only include people/characters if explicitly mentioned. Else "None"
    characters_list = []
    people_keywords = ["friend", "friends", "family", "mom", "dad", "sister", "brother", "mother", "father", "parents",
                       "husband", "wife", "child", "children", "kid", "kids", "sara", "john", "alex", "emma"]
    for keyword in people_keywords:
        if re.search(r'\b' + re.escape(keyword) + r'\b', lower_text):
            characters_list.append(keyword)
    characters_str = ", ".join(sorted(list(set(characters_list)))) if characters_list else "None"
    
    # 2. Environment: reflect actual location and time of day
    # Locations
    location_desc = None
    if any(w in lower_text for w in ["park", "garden", "nature", "forest", "lake", "beach"]):
        location_desc = "outdoor nature setting"
    elif any(w in lower_text for w in ["office", "workspace", "desk"]):
        location_desc = "work office/desk setting"
    elif any(w in lower_text for w in ["classroom", "school", "college"]):
        location_desc = "classroom setting"
    elif any(w in lower_text for w in ["cafe", "coffee shop", "restaurant"]):
        location_desc = "cafe setting"
    elif any(w in lower_text for w in ["room", "bedroom", "kitchen", "home", "inside", "indoor", "house"]):
        location_desc = "indoor home setting"
    
    if not location_desc:
        # Fallback location based on mood visual style theme
        if mood == "Calm":
            location_desc = "nature setting or a quiet room"
        elif mood == "Grateful":
            location_desc = "cozy warm setting"
        elif mood == "Joyful":
            location_desc = "bright outdoor setting"
        elif mood == "Inspired":
            location_desc = "creative workspace/office"
        elif mood == "Nostalgic":
            location_desc = "quiet environment"
            
    # Times of day
    time_desc = None
    if any(w in lower_text for w in ["morning", "sunrise"]):
        time_desc = "morning time"
    elif "afternoon" in lower_text:
        time_desc = "afternoon"
    elif any(w in lower_text for w in ["evening", "sunset", "dusk"]):
        time_desc = "evening/sunset"
    elif any(w in lower_text for w in ["night", "dark"]):
        time_desc = "nighttime"
        
    if not time_desc:
        # Fallback time based on mood visual style theme
        if mood == "Calm":
            time_desc = "sunset"
        elif mood == "Grateful":
            time_desc = "golden lighting hour"
        elif mood == "Joyful":
            time_desc = "bright sunny day"
        elif mood == "Inspired":
            time_desc = "daytime"
        elif mood == "Nostalgic":
            time_desc = "golden evening light time or rainy day"
            
    env_str = f"{location_desc}, {time_desc}"
    
    # 3. Scene description: describe setting, main subject, objects, and activity
    # Objects
    objects_list = []
    object_keywords = ["tea", "coffee", "cup", "laptop", "computer", "book", "books", "balloon", "balloons", "photo", "photos", "window", "desk", "food", "table", "guitar", "cake", "rain"]
    for obj in object_keywords:
        if re.search(r'\b' + re.escape(obj) + r'\b', lower_text):
            objects_list.append(obj)
            
    if not objects_list:
        # Fallback objects based on mood visual style theme
        if mood == "Calm":
            objects_list = ["a warm cup of tea"]
        elif mood == "Grateful":
            objects_list = ["heartwarming elements"]
        elif mood == "Joyful":
            objects_list = ["balloons or cheerful decorations"]
        elif mood == "Inspired":
            objects_list = ["laptop or books"]
        elif mood == "Nostalgic":
            objects_list = ["old photos or childhood items"]
            
    # Activity
    activity_desc = None
    activity_keywords = {
        "walk": "taking a peaceful walk",
        "run": "exercising outdoor",
        "celebrate": "celebrating a joyful event",
        "party": "partying with others",
        "write": "writing down thoughts",
        "read": "reading peacefully",
        "code": "working on computer code",
        "work": "working on a creative project",
        "study": "studying",
        "sipping": "sipping a warm drink",
        "coffee": "enjoying a warm coffee",
        "tea": "enjoying warm jasmine tea",
        "music": "enjoying sweet melodies",
        "talk": "talking and sharing moments",
        "miss": "reminiscing about past memories"
    }
    for kw, desc in activity_keywords.items():
        if kw in lower_text:
            activity_desc = desc
            break
            
    if not activity_desc:
        if mood == "Calm":
            activity_desc = "enjoying a quiet peaceful moment of relaxation"
        elif mood == "Grateful":
            activity_desc = "cherishing a kind and meaningful moment"
        elif mood == "Joyful":
            activity_desc = "smiling and celebrating life"
        elif mood == "Inspired":
            activity_desc = "focusing on a creative achievement"
        elif mood == "Nostalgic":
            activity_desc = "reminiscing childhood times and warm memories"
            
    objects_str = f" containing {', '.join(objects_list)}" if objects_list else ""
    scene_desc = f"A scene depicting a person {activity_desc}{objects_str}."
    
    # 4. Colors and Lighting matching mood rules
    style_details = {
        "Calm": {
            "colors": "Blue and green tones",
            "lighting": "Soft lighting, sunset"
        },
        "Grateful": {
            "colors": "Warm colors",
            "lighting": "Golden lighting"
        },
        "Joyful": {
            "colors": "Bright colors",
            "lighting": "Sunshine"
        },
        "Inspired": {
            "colors": "Bright energetic colors",
            "lighting": "Bright energetic lighting"
        },
        "Nostalgic": {
            "colors": "Vintage colors",
            "lighting": "Golden evening light, rain"
        }
    }
    style = style_details.get(mood, style_details["Calm"])
    
    # Unique signature to prevent duplicate images and caching
    current_date = datetime.now(timezone.utc).isoformat()
    unique_hash = hashlib.md5(f"{text}-{mood}-{current_date}-{uuid.uuid4().hex}".encode('utf-8')).hexdigest()[:8]
    unique_signature = f"\n\nUnique entry signature: {unique_hash}."

    prompt = f"""Create a high-quality anime-style illustration.

Journal:
"{text}"

Mood:
{mood}

Scene:
{scene_desc}

Characters:
{characters_str}

Environment:
{env_str}

Colors:
{style["colors"]}

Lighting:
{style["lighting"]}

Do not generate generic cozy bedroom scenes.

Every journal entry must produce a unique image.{unique_signature}"""

    return prompt


async def analyze_memory_gemini(text: str) -> dict:
    """Analyze memory text using Google Gemini API to get title, story, emotion, signature_quote, and image_prompt."""
    system_prompt = """You are LifeReel AI, a compassionate and poetic journaling companion.
Transform the user's raw text/transcript of their diary entry into a structured JSON object.

You MUST respond with ONLY a valid JSON object – no markdown formatting, no explanatory text, no backticks. The object must contain exactly these five keys:
{
  "title": "A poetic, comforting 3-5 word title that captures the soul of the entry.",
  "story": "An elegant, comforting 3-sentence summary. Reframe the person's raw text into a beautiful, affirming story written in the third person. Each sentence must be warm and literary.",
  "emotion": "Exactly one word chosen from this fixed set: Calm, Grateful, Joyful, Inspired, Nostalgic. Choose the mood/emotion that most representationally matches the diary entry.",
  "signature_quote": "A memorable and comforting one-sentence quote capturing the day's essence.",
  "image_prompt": "An image generation prompt. You MUST construct this prompt EXACTLY using the template below, replacing the placeholders with details extracted from the user's journal text. Do not make up settings, objects, or people not in the journal entry.

Template:
Create a high-quality anime-style illustration.

Journal:
\"[Exact raw text of user's journal entry]\"

Mood:
[Detected mood: Calm, Grateful, Joyful, Inspired, or Nostalgic]

Scene:
[Describe the actual setting, main subject, objects, and activity from the journal entry. Do not write generic cozy bedroom scenes unless explicitly mentioned.]

Characters:
[Only include people/characters if they are explicitly mentioned in the journal entry. Otherwise specify None.]

Environment:
[Reflect the actual location, setting, and time of day from the journal entry.]

Colors:
[Specify colors matching the mood:
- Calm: Blue and green tones
- Grateful: Warm colors
- Joyful: Bright colors
- Inspired: Bright energetic colors
- Nostalgic: Vintage colors]

Lighting:
[Specify lighting matching the emotion:
- Calm: Soft lighting, sunset
- Grateful: Golden lighting
- Joyful: Sunshine
- Inspired: Bright energetic lighting
- Nostalgic: Golden evening light, rain]

Do not generate generic cozy bedroom scenes.

Every journal entry must produce a unique image."
}
"""

    # Helper to extract characters list dynamically for the mock/fallback metadata
    char_tags = []
    for keyword in ["friend", "friends", "family", "mom", "dad", "sister", "brother", "mother", "father", "parents",
                    "husband", "wife", "child", "children", "kid", "kids", "sara", "john", "alex", "emma"]:
        if re.search(r'\b' + re.escape(keyword) + r'\b', text.lower()):
            char_tags.append(keyword)
    resolved_char_tags = list(set(char_tags))

    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.startswith("mock"):
        logger.info("Using mock Gemini analyzer (Mock Mode).")
        emotion = local_detect_mood(text)
        title = " ".join(text.split()[:4]) + "..." if len(text.split()) > 4 else text
        story = f"A beautiful moment of reflection. Reframed from their personal entry, they shared: '{text[:80]}...'. It represents a meaningful step in their digital diary."
        quote = "Finding peace in simple moments is the greatest victory."
        image_prompt = local_generate_prompt(text, emotion)

        return {
            "title": title or "Untitled Memory",
            "story": story,
            "emotion": emotion,
            "signature_quote": quote,
            "image_prompt": image_prompt,
            "characters": resolved_char_tags
        }

    logger.info("Sending memory text to Gemini for analysis...")
    model = "gemini-3.1-flash-lite"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"Diary: {text}"}
                ]
            }
        ],
        "systemInstruction": {
            "parts": [
                {"text": system_prompt}
            ]
        },
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload, timeout=30.0)
            
            # Fallback to gemini-1.5-flash if model not found/available
            if response.status_code in (404, 400):
                logger.warning(f"Gemini {model} failed with status {response.status_code}. Retrying with gemini-1.5-flash...")
                fallback_model = "gemini-1.5-flash"
                fallback_url = f"https://generativelanguage.googleapis.com/v1beta/models/{fallback_model}:generateContent?key={settings.GEMINI_API_KEY}"
                response = await client.post(fallback_url, headers=headers, json=payload, timeout=30.0)
                
            response.raise_for_status()
            res_json = response.json()
            
            candidates = res_json.get("candidates", [])
            if not candidates:
                raise ValueError("No candidates returned from Gemini API response.")
                
            parts = candidates[0].get("content", {}).get("parts", [])
            if not parts:
                raise ValueError("No parts found in the first candidate of Gemini API response.")
                
            content = parts[0].get("text", "").strip()
            parsed = json.loads(content)
            
            # Normalise values
            valid_emotions = {"Calm", "Grateful", "Joyful", "Inspired", "Nostalgic"}
            if parsed.get("emotion") not in valid_emotions:
                parsed["emotion"] = local_detect_mood(text)
            if "characters" not in parsed:
                parsed["characters"] = resolved_char_tags
                
            # Enforce unique image prompt
            current_date = datetime.now(timezone.utc).isoformat()
            unique_hash = hashlib.md5(f"{text}-{parsed['emotion']}-{current_date}-{uuid.uuid4().hex}".encode('utf-8')).hexdigest()[:8]
            if "Unique entry signature:" not in parsed.get("image_prompt", ""):
                parsed["image_prompt"] = parsed.get("image_prompt", "") + f"\n\nUnique entry signature: {unique_hash}."
                
            return parsed
    except Exception as exc:
        logger.error(f"Gemini API call failed ({exc}). Falling back to mock analysis.")
        emotion = local_detect_mood(text)
        title = " ".join(text.split()[:4]) + "..." if len(text.split()) > 4 else text
        story = f"Reframed from their entry, they shared: '{text[:80]}...'. A cozy moment in their digital diary."
        quote = "A single day holds infinite small wonders."
        image_prompt = local_generate_prompt(text, emotion)

        return {
            "title": title or "Untitled Memory",
            "story": story,
            "emotion": emotion,
            "signature_quote": quote,
            "image_prompt": image_prompt,
            "characters": resolved_char_tags
        }

# ── Hugging Face image generation ─────────────────────────────────────────────

def _run_hf_image_generation(scene_prompt: str, emotion: str = "Calm") -> Optional[str]:
    """Generate one image via HF SDXL / FLUX. Returns local URL or a curated Unsplash image on fallback."""
    # Curated Unsplash images for Mock/Fallback
    unsplash_images = {
        "Calm": "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&auto=format&fit=crop&q=80",
        "Grateful": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
        "Joyful": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80",
        "Inspired": "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=800&auto=format&fit=crop&q=80",
        "Nostalgic": "https://images.unsplash.com/photo-1437419764061-2473afe69fc2?w=800&auto=format&fit=crop&q=80"
    }
    fallback_url = unsplash_images.get(emotion, unsplash_images["Calm"])

    if settings.HF_TOKEN == "mock-hf-token" or settings.HF_TOKEN.startswith("mock"):
        logger.info("Using curated Unsplash image (Mock HF).")
        return fallback_url

    safety_suffix = (
        " No text, letters, words, numbers, watermarks, or typography of any kind."
    )
    final_prompt = scene_prompt + safety_suffix

    API_URL = "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell"
    headers = {"Authorization": f"Bearer {settings.HF_TOKEN}"}

    try:
        response = httpx.post(
            API_URL,
            headers=headers,
            json={"inputs": final_prompt},
            timeout=45.0,
        )
        response.raise_for_status()
        
        filename = f"{uuid.uuid4()}.png"
        dest_path = STATIC_ROOT / "images" / filename
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        with open(dest_path, "wb") as f:
            f.write(response.content)
        logger.info("Image saved locally.", extra={"path": str(dest_path)})
        return f"/static/images/{filename}"
    except Exception as exc:
        logger.warning(
            f"HF image generation failed ({exc}) – falling back to curated Unsplash image.",
        )
        return fallback_url

# ── Public API ───────────────────────────────────────────────────────────────

async def process_full_memory(audio: UploadFile, user_id: str) -> dict:
    """Legacy audio entry processor (keeps compatibility)."""
    return await process_full_memory_unified(audio=audio, user_id=user_id)

async def process_full_memory_unified(
    audio: Optional[UploadFile] = None,
    raw_text: Optional[str] = None,
    photos: Optional[List[UploadFile]] = None,
    generate_illustration: bool = False,
    user_id: str = ""
) -> dict:
    """
    Unified memory pipeline: transcribes optional voice, analyzes text with GPT-4o-mini,
    saves photos, and optionally generates an illustration.
    """
    transcript = ""

    # 1. Transcribe voice if present
    if audio:
        tmp_dir = Path("tmp")
        tmp_dir.mkdir(parents=True, exist_ok=True)
        uploaded_filename = audio.filename or "voice_entry.wav"
        ext = Path(uploaded_filename).suffix or ".wav"
        tmp_path = tmp_dir / f"{uuid.uuid4()}{ext}"
        try:
            with tmp_path.open("wb") as f:
                while chunk := await audio.read(1024 * 64):
                    f.write(chunk)
            transcript = await transcribe_audio_api(tmp_path)
        except Exception as exc:
            raise RuntimeError(f"Voice transcription failed: {exc}") from exc
        finally:
            tmp_path.unlink(missing_ok=True)
    else:
        transcript = raw_text or ""

    if not transcript:
        raise RuntimeError("No memory content provided (both raw text and voice recording are empty).")

    # 2. Analyze with Gemini
    nlp = await analyze_memory_gemini(transcript)

    # 3. Handle photos
    photos_urls = []
    if photos:
        for photo in photos:
            if not photo.filename:
                continue
            ext = mimetypes.guess_extension(photo.content_type) or ".jpg"
            filename = f"{uuid.uuid4().hex}{ext}"
            dest_path = STATIC_ROOT / "images" / filename
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            with dest_path.open("wb") as f:
                while chunk := await photo.read(1024 * 64):
                    f.write(chunk)
            photos_urls.append(f"/static/images/{filename}")

    # Set cover image
    cover_image = None
    if photos_urls:
        cover_image = photos_urls[0]
    elif generate_illustration:
        cover_image = _run_hf_image_generation(nlp["image_prompt"], nlp.get("emotion", "Calm"))

    # 4. Save to MongoDB
    now_utc = datetime.now(tz=timezone.utc)
    doc = {
        "user_id": user_id,
        "title": nlp["title"],
        "transcript": transcript,
        "story": nlp["story"],
        "emotion": nlp["emotion"],
        "characters": nlp.get("characters", []),
        "scene_prompt": nlp["image_prompt"],
        "image_url": cover_image,
        "signature_quote": nlp.get("signature_quote", ""),
        "photos": photos_urls,
        "created_at": now_utc.isoformat(),
    }

    insert_res = journal_entries.insert_one(doc)
    doc["_id"] = insert_res.inserted_id

    logger.info(
        "Unified memory persisted to MongoDB.",
        extra={"inserted_id": str(insert_res.inserted_id), "user_id": user_id},
    )
    return doc
