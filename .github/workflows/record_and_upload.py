import os
import sys
import subprocess
import logging
from google_drive_upload import retry_recording, authenticate_service_account, upload_file_to_drive, test_stream_url

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("record_and_upload.log"),
        logging.StreamHandler(sys.stdout)
    ]
)

# Pull values from environment variables
output_file = os.environ["OUTPUT_FILE"]
stream_url = os.environ["STREAM_URL"]
duration = int(os.environ["DURATION"])
station_name = os.environ["STATION_NAME"]
folder_id = os.environ["GDRIVE_FOLDER_ID"]

logging.info(f"🎙️ Starting recording for {station_name}")
logging.info(f"📁 Output file: {output_file}")

# Check if stream is alive before wasting time
logging.info("🔍 Testing stream URL...")
if not test_stream_url(stream_url):
    logging.error("❌ Stream URL is not responding. Exiting early.")
    raise Exception("Stream URL is not responding.")

def record_stream():
    """Attempts to record using FFmpeg directly with logging."""
    logging.info("🎧 Launching FFmpeg...")
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
        logging.info("✅ Recording finished.")
        return True
    except subprocess.TimeoutExpired:
        logging.warning("⏱️ FFmpeg timed out.")
        return False
    except subprocess.CalledProcessError:
        logging.warning("⚠️ FFmpeg returned a non-zero exit code. Check ffmpeg_error.log for details.")
        return False
    except Exception as e:
        logging.error(f"❌ Unexpected error during recording: {e}")
        return False

# Prefer this quick direct approach over retry unless needed
success = record_stream()

if not success:
    logging.info("🔁 Trying retry_recording fallback...")
    success = retry_recording(output_file, stream_url, duration, station_name)

if success:
    logging.info("☁️ Authenticating to Google Drive...")
    try:
        service = authenticate_service_account()
        logging.info("📤 Uploading file to Google Drive...")
        upload_file_to_drive(service, output_file, folder_id)
        logging.info("✅ Done uploading.")
    except Exception as e:
        logging.error(f"❌ Failed to upload file to Google Drive: {e}")
        raise Exception("Google Drive upload failed.") from e
else:
    logging.error("❌ Recording failed after all attempts.")
    raise Exception("Recording failed after all attempts.")
