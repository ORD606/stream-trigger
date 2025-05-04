import os
import sys
sys.path.append('.github/workflows')

from google_drive_upload import retry_recording, authenticate_service_account, upload_file_to_drive

output_file = os.environ["OUTPUT_FILE"]
stream_url = os.environ["STREAM_URL"]
duration = int(os.environ["DURATION"])
station_name = os.environ["STATION_NAME"]
gdrive_folder_id = os.environ["GDRIVE_FOLDER_ID"]

print(f"📤 Uploading {output_file} to Google Drive...")

success = retry_recording(output_file, stream_url, duration, station_name)
if success:
    service = authenticate_service_account()
    upload_file_to_drive(service, output_file, gdrive_folder_id)
else:
    raise Exception("Recording failed after all retry attempts.")
