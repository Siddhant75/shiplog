import os
import sys
import json
import urllib.request
import subprocess

# Force UTF-8 stdout/stderr on Windows
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

KOKORO_DIR = os.path.join(os.getcwd(), 'demo-assets', 'kokoro')
VOICEOVER_DIR = os.path.join(os.getcwd(), 'demo-assets', 'voiceover')
DEMO_DIR = os.path.join(os.getcwd(), 'demo-assets')
SCENES_DIR = os.path.join(DEMO_DIR, 'scenes')

MODEL_PATH = os.path.join(KOKORO_DIR, 'kokoro-v1.0.onnx')
VOICES_PATH = os.path.join(KOKORO_DIR, 'voices-v1.0.bin')

MODEL_URL = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx'
VOICES_URL = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin'

os.makedirs(KOKORO_DIR, exist_ok=True)
os.makedirs(VOICEOVER_DIR, exist_ok=True)

def download_file(url, dest_path):
    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 1000:
        print(f"[OK] Already exists: {os.path.basename(dest_path)} ({os.path.getsize(dest_path):,} bytes)")
        return
    print(f"[DOWNLOADING] {os.path.basename(dest_path)} from {url}...")
    
    def report(count, block_size, total_size):
        percent = int(count * block_size * 100 / total_size) if total_size > 0 else 0
        mb = count * block_size / (1024 * 1024)
        total_mb = total_size / (1024 * 1024)
        if count % 1000 == 0 or percent == 100:
            print(f"   [{percent}%] {mb:.1f} MB / {total_mb:.1f} MB", end='\r', flush=True)

    urllib.request.urlretrieve(url, dest_path, reporthook=report)
    print(f"\n[DOWNLOADED] {os.path.basename(dest_path)} ({os.path.getsize(dest_path):,} bytes)")

SCENE_SCRIPTS = [
    {
        "id": 1,
        "name": "01-hero-wispr-pulse",
        "text": "Every day, developers build incredible features. But by evening, our portfolios stay outdated, standups are guesswork, and architectural decisions get lost forever. Typing is the bottleneck. That's why we built ShipLog: speak for 60 seconds hands-free, and an autonomous agent turns your voice recap into verified dev memory."
    },
    {
        "id": 2,
        "name": "02-execution-hud",
        "text": "With one click, our 5-step agent pipeline executes: scrubbing secrets, ingesting git diffs, and grounding every claim against code."
    },
    {
        "id": 3,
        "name": "03-artifacts-diff-inspector",
        "text": "Notice these green verified shields? That's our Code Grounding engine. If an LLM hallucinates buzzwords like Kubernetes that weren't touched in your git diff, ShipLog strikes them through with proof. Click any tag to inspect the exact diff snippet. One click copies our standup directly to Slack."
    },
    {
        "id": 4,
        "name": "04-bento-portfolio-case-study",
        "text": "Now let's explore the Living Portfolio, built with a modern Linear-style Bento Grid. It automatically highlights your flagship verified shipment, telemetry, and tech stack radar. Open any project case study to deep-dive into engineering challenges and syntax-highlighted diff evidence. Your portfolio builds itself every single day you ship."
    },
    {
        "id": 5,
        "name": "05-wiki-vault-splitpane",
        "text": "In the Wiki Vault, we implement the LLM Wiki pattern in a split-pane layout. Raw spoken voice logs are compiled into permanent Architectural Decision Records anchored to code."
    },
    {
        "id": 6,
        "name": "06-resume-sync-studio",
        "text": "Our Resume Sub-Agent transforms verified ships into Google XYZ-formula bullets with an ATS 95 score, plus a Julia Evans quarterly brag doc ready for your next promotion packet."
    },
    {
        "id": 7,
        "name": "07-security-settings",
        "text": "ShipLog runs 100% air-gapped on local Ollama with zero persistent database storage. Stop letting your engineering work stay invisible. Ship your log hands-free."
    }
]

def main():
    print("===========================================================")
    print("[ShipLog] Kokoro TTS AI Voiceover & Video Muxing Pipeline")
    print("===========================================================")

    # 1. Download Model and Voices if needed
    download_file(VOICES_URL, VOICES_PATH)
    download_file(MODEL_URL, MODEL_PATH)

    # 2. Initialize Kokoro
    print("\n[INIT] Initializing Kokoro ONNX Neural TTS Engine...")
    kokoro = Kokoro(MODEL_PATH, VOICES_PATH)
    available_voices = kokoro.get_voices()
    print(f"[VOICES] Loaded Kokoro engine with {len(available_voices)} voices: {', '.join(available_voices[:6])}...")

    # Choose voice: 'am_adam' (American male, confident, professional) or 'af_heart' / 'am_michael'
    voice_name = "am_adam" if "am_adam" in available_voices else available_voices[0]
    print(f"[VOICE SELECTED] '{voice_name}'")

    # 3. Load TIMECODES.json
    timecodes_path = os.path.join(DEMO_DIR, 'TIMECODES.json')
    if not os.path.exists(timecodes_path):
        print(f"[ERROR] TIMECODES.json not found at {timecodes_path}!")
        sys.exit(1)

    with open(timecodes_path, 'r', encoding='utf-8') as f:
        timecodes = json.load(f)

    # Calculate total duration from timecodes
    total_duration_sec = timecodes[-1]["endSec"]
    sample_rate = 24000
    total_samples = int(np.ceil(total_duration_sec * sample_rate))
    master_audio = np.zeros(total_samples, dtype=np.float32)

    print(f"\n[TIMELINE] Master Video Duration: {total_duration_sec:.2f}s ({total_samples:,} samples at {sample_rate}Hz)")

    # 4. Generate Voiceover for each scene
    print("\n[SYNTHESIS] Generating High-Fidelity Kokoro Voiceover Audio...")
    for idx, scene in enumerate(SCENE_SCRIPTS):
        tc = timecodes[idx]
        text = scene["text"]
        print(f"\n   [Scene {idx + 1}/7] {tc['name']} ({tc['durationSec']}s allotted)")
        print(f"   [TEXT] \"{text[:75]}...\"")

        audio, sr = kokoro.create(text, voice=voice_name, speed=1.05, lang="en-us")
        audio_dur = len(audio) / sr
        print(f"   [DONE] Synthesized {audio_dur:.2f}s of speech ({len(audio):,} samples)")

        # Save individual scene audio
        scene_wav_path = os.path.join(VOICEOVER_DIR, f"scene_{idx + 1:02d}.wav")
        sf.write(scene_wav_path, audio, sr)

        # Place into master timeline at startSec + small 0.4s breathing offset
        start_sample = int((tc["startSec"] + 0.4) * sample_rate)
        end_sample = start_sample + len(audio)

        if end_sample > total_samples:
            # Pad master audio if needed
            master_audio = np.pad(master_audio, (0, end_sample - total_samples))
            total_samples = end_sample

        master_audio[start_sample:end_sample] += audio

    # Save Master Audio Track
    master_wav_path = os.path.join(VOICEOVER_DIR, "voiceover-master.wav")
    sf.write(master_wav_path, master_audio, sample_rate)
    print(f"\n[SAVED] Master Voiceover Audio: {master_wav_path} ({len(master_audio)/sample_rate:.2f}s)")

    # 5. Mux Master Video with FFmpeg into 1080p MP4
    master_video_path = os.path.join(DEMO_DIR, 'shiplog-automated-demo.webm')
    final_mp4_path = os.path.join(DEMO_DIR, 'shiplog-final-demo.mp4')

    print(f"\n[FFMPEG] Muxing Master Demo Video + Kokoro Voiceover into {final_mp4_path}...")
    ffmpeg_cmd = [
        'ffmpeg', '-y',
        '-i', master_video_path,
        '-i', master_wav_path,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '18',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest',
        final_mp4_path
    ]
    subprocess.run(ffmpeg_cmd, check=True)
    print(f"[SUCCESS] Final Master Demo Video Created: {final_mp4_path} ({os.path.getsize(final_mp4_path):,} bytes)")

    # 6. Mux Modular Scene Clips with Audio
    print("\n[SCENES] Muxing Audio into Modular Scene Clips in demo-assets/scenes/...")
    for idx, scene in enumerate(SCENE_SCRIPTS):
        scene_base = scene["name"]
        webm_file = os.path.join(SCENES_DIR, f"{scene_base}.webm")
        wav_file = os.path.join(VOICEOVER_DIR, f"scene_{idx + 1:02d}.wav")
        out_mp4 = os.path.join(SCENES_DIR, f"{scene_base}.mp4")

        if os.path.exists(webm_file) and os.path.exists(wav_file):
            scene_cmd = [
                'ffmpeg', '-y',
                '-i', webm_file,
                '-i', wav_file,
                '-c:v', 'libx264',
                '-preset', 'fast',
                '-crf', '18',
                '-pix_fmt', 'yuv420p',
                '-c:a', 'aac',
                '-b:a', '192k',
                out_mp4
            ]
            try:
                subprocess.run(scene_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                print(f"   [Scene {idx + 1}] Created {os.path.basename(out_mp4)}")
            except Exception as e:
                print(f"   [WARNING] Could not mux {out_mp4}: {e}")

    print("\n===========================================================")
    print("[COMPLETE] ALL DEMO ASSETS & KOKORO TTS VOICEOVER PRODUCED")
    print("===========================================================")

if __name__ == '__main__':
    main()
