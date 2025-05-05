from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
import logging
import os
import time
import subprocess
from threading import Thread
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Define the scopes for accessing Google Drive
SCOPES = ['https://www.googleapis.com/auth/drive.file']

# Configure logging
logging.basicConfig(
    filename='recording.log',
    level=logging.INFO,
    format='%(asctime)s %(levelname)s: %(message)s'
)

# Retry configuration
RETRY_LIMIT = int(os.getenv("RETRY_LIMIT", 5))
RETRY_DELAY = int(os.getenv("RETRY_DELAY", 10))  # seconds

# Recording directory
RECORDINGS_DIR = "./recordings"
os.makedirs(RECORDINGS_DIR, exist_ok=True)

# Periodic status update flag
keep_logging_status = True


def authenticate_service_account():
    try:
        creds = Credentials.from_service_account_file('service_account.json', scopes=SCOPES)
        logging.info("✅ Authenticated with Google Service Account.")
        return build('drive', 'v3', credentials=creds)
    except FileNotFoundError:
        logging.error("❌ 'service_account.json' not found.")
        exit(1)
    except Exception as e:
        logging.error(f"❌ Failed to authenticate: {e}")
        exit(1)


def upload_file_to_drive(service, file_path, folder_id=None):
    if not os.path.exists(file_path):
        logging.error(f"❌ Cannot upload. File does not exist: {file_path}")
        return None

    file_metadata = {'name': os.path.basename(file_path)}
    if folder_id:
        file_metadata['parents'] = [folder_id]

    media = MediaFileUpload(file_path, resumable=True)
    try:
        uploaded_file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id'
        ).execute()
        logging.info(f"✅ Uploaded '{file_path}' to Drive. File ID: {uploaded_file.get('id')}")
        return uploaded_file.get('id')
    except Exception as e:
        logging.error(f"❌ Upload error: {e}")
        return None


def test_stream_url(url):
    try:
        command = ["ffmpeg", "-v", "info", "-i", url, "-f", "null", "-t", "1", "-"]
        result = subprocess.run(command, stderr=subprocess.PIPE, stdout=subprocess.PIPE)
        stderr_output = result.stderr.decode('utf-8')

        if result.returncode == 0:
            metadata_lines = [line for line in stderr_output.split('\n') if "Stream #" in line or "bitrate:" in line]
            for line in metadata_lines:
                logging.info(f"ℹ️ Stream Metadata: {line.strip()}")
            logging.info(f"✅ Stream URL is valid: {url}")
            return True
        else:
            logging.error(f"❌ Invalid stream URL: {url}")
            return False
    except Exception as e:
        logging.error(f"❌ Failed to validate stream URL: {e}")
        return False


def periodic_status_update(station_name, duration, interval=60):
    global keep_logging_status
    elapsed_time = 0
    while elapsed_time < duration and keep_logging_status:
        logging.info(f"⏳ Recording {station_name}... {elapsed_time}/{duration} seconds.")
        time.sleep(interval)
        elapsed_time += interval


def record_stream(output_file, stream_url, duration, station_name):
    global keep_logging_status
    keep_logging_status = True
    try:
        logging.info(f"🎙️ Starting recording: {station_name}")
        logging.info(f"➡️ Output: {output_file}")
        logging.info(f"⏳ Duration: {duration} seconds")

        status_thread = Thread(target=periodic_status_update, args=(station_name, duration), daemon=True)
        status_thread.start()

        command = [
            "ffmpeg",
            "-y",
            "-i", stream_url,
            "-c:a", "libmp3lame",
            "-b:a", "320k",
            "-t", str(duration),
            output_file
        ]

        result = subprocess.run(command, stderr=subprocess.PIPE, stdout=subprocess.PIPE)
        keep_logging_status = False

        if result.returncode == 0:
            logging.info(f"✅ Recording finished: {output_file}")
            return True
        else:
            logging.error(f"❌ FFmpeg failed: {result.stderr.decode('utf-8')}")
            return False
    except Exception as e:
        keep_logging_status = False
        logging.error(f"❌ Exception during recording: {e}")
        return False


def retry_recording(output_file, stream_url, duration, station_name, retries=RETRY_LIMIT):
    for attempt in range(1, retries + 1):
        if test_stream_url(stream_url):
            success = record_stream(output_file, stream_url, duration, station_name)
            if success:
                return True
        logging.warning(f"⚠️ Retrying in {RETRY_DELAY}s... (Attempt {attempt}/{retries})")
        time.sleep(RETRY_DELAY)
    logging.error(f"❌ All recording attempts failed: {station_name}")
    return False
