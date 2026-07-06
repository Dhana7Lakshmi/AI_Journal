import os
import httpx
from config.settings import settings

print("Checking environment settings...")
print("HF_TOKEN set:", bool(settings.HF_TOKEN))
if not settings.HF_TOKEN or settings.HF_TOKEN.startswith("hf_YOUR"):
    print("WARNING: HF_TOKEN is not set with a real token! Please set a valid token in the .env file.")
    exit(1)

prompt = "A cozy library cabin in the middle of a golden forest, digital painting style"
API_URL = "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell"
headers = {"Authorization": f"Bearer {settings.HF_TOKEN}"}
payload = {"inputs": prompt}

print(f"Sending request to Hugging Face Inference API for model black-forest-labs/FLUX.1-schnell...")
try:
    response = httpx.post(API_URL, headers=headers, json=payload, timeout=60.0)
    response.raise_for_status()
    
    # Save the resulting image
    output_filename = "test_hf_image.png"
    with open(output_filename, "wb") as f:
        f.write(response.content)
    print(f"Success! Image successfully generated and saved to '{output_filename}'.")
except httpx.HTTPStatusError as exc:
    print(f"Failed! Hugging Face returned status code {exc.response.status_code}.")
    print(f"Response content: {exc.response.text}")
except Exception as e:
    print(f"Failed! An unexpected error occurred: {e}")
