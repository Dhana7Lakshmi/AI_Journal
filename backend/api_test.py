"""
api_test.py — Quick connectivity test for all LifeReel AI integrations.
Run with: .venv\Scripts\python api_test.py
"""
import os
import sys
import json
import httpx
import wave
import struct
import asyncio
import tempfile
from pathlib import Path
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding='utf-8')
load_dotenv()

# Add the parent directory to sys.path so we can import services.voice_pipeline
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

HF_TOKEN = os.getenv("HF_TOKEN", "")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

results = {}

# ──────────────────────────────────────────────────────────────────────────────
# TEST 1: Local Faster-Whisper Transcription
# ──────────────────────────────────────────────────────────────────────────────
print("=" * 55)
print("TEST 1: Local Faster-Whisper Transcription")
print("=" * 55)
try:
    from services.voice_pipeline import init_whisper_model, transcribe_audio_api

    print("  Initializing model ('tiny' on CPU)...")
    init_whisper_model()
    
    print("  Creating a dummy 1-second silent WAV file...")
    temp_dir = tempfile.gettempdir()
    temp_wav = Path(temp_dir) / "test_whisper_silent.wav"
    with wave.open(str(temp_wav), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        # 16000 silent frames (1 second at 16kHz)
        data = struct.pack('<h', 0)
        for _ in range(16000):
            wf.writeframesraw(data)

    print("  Transcribing dummy audio locally...")
    transcript = asyncio.run(transcribe_audio_api(temp_wav))
    
    print(f"  Transcript: '{transcript}'")
    print("  RESULT      : ✓ PASS")
    results["Faster-Whisper"] = "PASS"
    
    # Cleanup
    temp_wav.unlink(missing_ok=True)
except Exception as e:
    print(f"  Exception   : {e}")
    print("  RESULT      : ✗ FAIL")
    results["Faster-Whisper"] = f"FAIL — {e}"

print()

# ──────────────────────────────────────────────────────────────────────────────
# TEST 2: Hugging Face Token Validation
# ──────────────────────────────────────────────────────────────────────────────
print("=" * 55)
print("TEST 2: Hugging Face Token")
print("=" * 55)
try:
    r = httpx.get(
        "https://huggingface.co/api/whoami-v2",
        headers={"Authorization": f"Bearer {HF_TOKEN}"},
        timeout=10
    )
    print(f"  HTTP Status : {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"  Username    : {data.get('name','unknown')}")
        print(f"  Type        : {data.get('type','unknown')}")
        print("  RESULT      : ✓ PASS")
        results["Hugging Face"] = "PASS"
    else:
        print(f"  Error       : {r.text[:200]}")
        print("  RESULT      : ✗ FAIL")
        results["Hugging Face"] = "FAIL"
except Exception as e:
    print(f"  Exception   : {e}")
    print("  RESULT      : ✗ FAIL")
    results["Hugging Face"] = f"FAIL — {e}"

print()

# ──────────────────────────────────────────────────────────────────────────────
# TEST 3: MongoDB Connection
# ──────────────────────────────────────────────────────────────────────────────
print("=" * 55)
print("TEST 3: MongoDB Connection")
print("=" * 55)
if MONGO_URI == "mock":
    print("  Mode        : Mock Mode (In-memory collection)")
    print("  RESULT      : ✓ PASS")
    results["MongoDB"] = "PASS"
else:
    try:
        from pymongo import MongoClient
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10000)
        info = client.admin.command("ping")
        print(f"  Ping result : {info}")
        print(f"  URI         : {MONGO_URI}")
        print("  RESULT      : ✓ PASS")
        results["MongoDB"] = "PASS"
        client.close()
    except Exception as e:
        print(f"  Exception   : {e}")
        print("  RESULT      : ✗ FAIL")
        results["MongoDB"] = f"FAIL — {e}"

print()

# ──────────────────────────────────────────────────────────────────────────────
# TEST 4: FFmpeg binary check
# ──────────────────────────────────────────────────────────────────────────────
print("=" * 55)
print("TEST 4: FFmpeg Binary")
print("=" * 55)
import shutil
import subprocess
ffmpeg_path = shutil.which("ffmpeg")
if ffmpeg_path:
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True, check=True)
        print(f"  Path        : {ffmpeg_path}")
        print("  RESULT      : ✓ PASS")
        results["FFmpeg"] = "PASS"
    except Exception as e:
        print(f"  Exception   : {e}")
        print("  RESULT      : ✗ FAIL")
        results["FFmpeg"] = f"FAIL — {e}"
else:
    try:
        import imageio_ffmpeg
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        subprocess.run([ffmpeg_exe, "-version"], capture_output=True, text=True, check=True)
        print(f"  Path (local): {ffmpeg_exe}")
        print("  RESULT      : ✓ PASS")
        results["FFmpeg"] = "PASS"
    except Exception as e:
        print(f"  Not found   : FFmpeg is not in system PATH or imageio-ffmpeg wrapper")
        print("  RESULT      : ✗ FAIL")
        results["FFmpeg"] = "FAIL — not found"

# ──────────────────────────────────────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────────────────────────────────────
print()
print("=" * 55)
print("SUMMARY")
print("=" * 55)
all_pass = True
for name, status in results.items():
    icon = "✓" if status == "PASS" else "✗"
    print(f"  {icon}  {name:20s}  {status}")
    if status != "PASS":
        all_pass = False

print()
if all_pass:
    print("  🎉 ALL TESTS PASSED — Ready to launch!")
else:
    print("  ⚠  Some tests FAILED — check the errors above.")
print("=" * 55)
