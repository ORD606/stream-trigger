import os
import sys

# Include path to the workflow utilities
sys.path.append(".github/workflows")

from google_drive_upload import retry_recording, authenticate_service_account, upload_file_to_drive

# Pull values from environment variables
output_file = os.environ["OUTPUT_FILE"]
stream_url = os.environ["STREAM_URL"]
duration = int(os.environ["DURATION"])
station_name = os.environ["STATION_NAME"]
folder_id = os.environ["GDRIVE_FOLDER_ID"]

print(f"🎙️ Starting recording for {station_name}")
print(f"📁 Output file: {output_file}")

# Run the retry + upload process
if retry_recording(output_file, stream_url, duration, station_name):
    service = authenticate_service_account()
    upload_file_to_drive(service, output_file, folder_id)
    print("✅ Done uploading.")
else:
    raise Exception("❌ Recording failed after all retry attempts.")
