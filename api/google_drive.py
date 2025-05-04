import os
import base64
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# Decode the base64 encoded service account key
def get_service_account_credentials():
    # Get the Base64 encoded service account key from Vercel's environment variables
    encoded_credentials = os.getenv('GOOGLE_SERVICE_ACCOUNT_BASE64')
    
    if not encoded_credentials:
        raise ValueError('Google service account credentials not found in environment variables.')

    # Decode the credentials and load the JSON
    decoded_credentials = base64.b64decode(encoded_credentials).decode('utf-8')
    credentials_json = json.loads(decoded_credentials)

    # Use the credentials to create a Google Drive service account credential
    credentials = service_account.Credentials.from_service_account_info(
        credentials_json, scopes=['https://www.googleapis.com/auth/drive.file']
    )

    return credentials

# Function to upload the file to Google Drive
def upload_file_to_drive(file_path):
    """Uploads a file to Google Drive using the service account credentials."""
    credentials = get_service_account_credentials()

    # Build the Google Drive service
    drive_service = build('drive', 'v3', credentials=credentials)

    # Set file metadata and media
    file_metadata = {'name': os.path.basename(file_path)}
    media = MediaFileUpload(file_path, mimetype='audio/mpeg')  # Adjust MIME type if necessary

    # Create the file on Google Drive
    file = drive_service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id'
    ).execute()

    # Return the file ID of the uploaded file
    return file['id']
