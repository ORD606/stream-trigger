import os
import sys
import subprocess
import time
from google_drive_upload import retry_recording, authenticate_service_account, upload_file_to_drive, test_stream_url

# Pull values from environment variables
output_file = os.environ["OUTPUT_FILE"]
stream_url = os.environ["STREAM_URL"]
duration = int(os.environ["DURATION"])
station_name = os.environ["STATION_NAME"]
folder_id = os.environ["GDRIVE_FOLDER_ID"]

print(f"🎙️ Starting recording for {station_name}")
print(f"📁 Output file: {output_file}")

# Check if stream is alive before wasting time
print("🔍 Testing stream URL...")
if not test_stream_url(stream_url):
    raise Exception("❌ Stream URL is not responding. Exiting early.")

def record_stream():
    """Attempts to record using FFmpeg directly with logging."""
    print("🎧 Launching FFmpeg...")
    command = [
        "ffmpeg",
        "-y",
        "-loglevel", "info",  # Use 'debug' for even more verbose logs
        "-i", stream_url,
        "-t", str(duration),
        "-c:a", "libmp3lame",
        "-b:a", "192k",
        output_file,
    ]
    try:
        with open("ffmpeg_error.log", "wb") as err_log:
            subprocess.run(command, stdout=subprocess.DEVNULL, stderr=err_log, timeout=duration + 30, check=True)
        print("✅ Recording finished.")
        return True
    except subprocess.TimeoutExpired:
        print("⏱️ FFmpeg timed out.")
        return False
    except subprocess.CalledProcessError:
        print("⚠️ FFmpeg returned a non-zero exit code.")
        return False

# Prefer this quick direct approach over retry unless needed
success = record_stream()

if not success:
    print("🔁 Trying retry_recording fallback...")
    success = retry_recording(output_file, stream_url, duration, station_name)

if success:
    print("☁️ Authenticating to Google Drive...")
    service = authenticate_service_account()
    print("📤 Uploading file to Google Drive...")
    upload_file_to_drive(service, output_file, folder_id)
    print("✅ Done uploading.")
else:
    raise Exception("❌ Recording failed after all attempts.")
