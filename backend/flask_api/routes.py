import base64
from googleapiclient.discovery import build
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from concurrent.futures import ThreadPoolExecutor, as_completed
import queue
import threading
from flask import Blueprint, json, request, jsonify, send_file
from flask_cors import CORS
from google.oauth2.credentials import Credentials
from groq import Groq
import requests
from flask_api.ocr.ocr_run import ocr_run
from flask_api.ocr.moduls import process_output
# from flask_api.transcript.whisperx_transcript import speech_to_text
from .utils.sort_text import sorting_timestamps
from .utils.clear_photos_folder import clear_photos_folder
from .utils.clear_croped_photos_folder import clear_croped_photos_folder
from .utils.calculate_workers import calculate_workers
from .utils.create_email import create_email
from datetime import datetime
import subprocess
import os

routes = Blueprint('routes', __name__)


UPLOAD_FOLDER = "uploaded_videos"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def validate_token(token):
    response = requests.get(f'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token={token}')
    if response.status_code == 200:
        return response.json()
    else:
        return None

def process_timestamp(timestamp, video_path):
    try:
        is_graph_result, text = ocr_run(timestamp, video_path, {})
        return timestamp, (is_graph_result, text)
    except Exception as e:
        return timestamp, {'error': str(e)}

@routes.route('/process-video', methods=['POST'])
def process_video():
    # Check if video was fetched
    video = request.files.get('video')
    if not video:
        return jsonify({'error': 'Video not fetched by endpoint'}), 400
    
    # Check if timestamps were fetched
    timestamps = request.form.get('timestamps')
    event_id = request.form.get('eventId')
    email = request.form.get('creatorEmail')
    token = request.form.get('googleAuthToken')
    if not timestamps:
        return jsonify({'error': 'Timestamps not provided'}), 400
    
    try:
        timestamps = json.loads(timestamps)
    except Exception:
        return jsonify({'error': 'Invalid timestamps format. Expected a JSON array.'}), 400

    # Save the uploaded video
    video_path = os.path.join(UPLOAD_FOLDER, 'recording.mp4')
    video.save(video_path)
    # text = speech_to_text(video_path)

    with open('text.md', 'a', encoding='utf-8') as f:
        for segment in text["segments"]:
            f.write(f"{segment['start']}-{segment['end']} {segment['speaker']}: {segment['text']}\n")
            f.write(f"\n{segment['start']}-{segment['end']} {segment['speaker']}: {segment['text']}\n")


    # Potezna prowizorka
    dic_whisper = {}
    timestamp_from_whisper = []
    with open("text.md", "r", encoding='utf-8') as file:
        lines = file.readlines()
        for line in lines:
            if not line.strip():
                continue
            print(line)
            i = 0
            j = 0
            while line[j] != ":":
                if line[j] == "." and i == 0:
                    i = j
                j += 1
            dic_whisper[int(line[:i])] = line
            timestamp_from_whisper.append(int(line[:i]))

    # For every timestamp, run the OCR
    dic_ocr = {}
    # futures = []
    # max_workers = calculate_workers(workload_type='mixed', safety_margin=2)
    # Use a thread pool with a maximum of 3 threads
    # with ThreadPoolExecutor(max_workers) as executor:
    #     # Submit tasks to the thread pool
    #     for timestamp in timestamps:
    #         future = executor.submit(process_timestamp, timestamp, video_path)
    #         futures.append(future)

    #     # Collect results as they complete
    #     for future in as_completed(futures):
    #         timestamp, result = future.result()
    #         if isinstance(result, dict) and 'error' in result:
    #             return jsonify({'error': f'Error processing timestamp {timestamp}: {result["error"]}'}), 500
    #         is_graph_result, text = result
    #         dic_ocr[timestamp] = text  # Store the result in dic_ocr

    # Generate notes text
    notes_text = sorting_timestamps(timestamps, timestamp_from_whisper, dic_ocr, dic_whisper)
    print("Finished notes: ", notes_text)

    client = Groq(
        api_key=os.environ.get("GROQ_API_KEY"),
    )

    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": f"summarize what the conversation is about: {notes_text}"

            }
        ],
        model="llama-3.3-70b-versatile",
        temperature=1,
        max_tokens=1024,
        top_p=1,
        stream=False,
        stop=None,
    )

    # Write notes to the file
    with open('notes.md', 'w', encoding='utf-8') as f:
        f.write(chat_completion.choices[0].message.content)

    # Use ready markdown file to create PDF
    current_date_time = datetime.now()
    formatted_date_time = current_date_time.strftime("%Y.%m.%d_%H-%M-%S")

    process_output.process_markdown(
        md_file='notes.md',  
        images_folder='',         
        output_pdf=f'outputs/Report_{str(formatted_date_time)}.pdf'  
    )

    try:
        # Validate the token
        token_info = validate_token(token)
        if not token_info:
            return jsonify({'error': 'Invalid or expired token'}), 401

        creds = Credentials(token=token, scopes=['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/gmail.send'])

        calendar_service = build('calendar', 'v3', credentials=creds)

        event = calendar_service.events().get(calendarId='primary', eventId=event_id).execute()
        attendees = event.get('attendees', [])
        to_emails = [attendee['email'] for attendee in attendees if 'email' in attendee]

        if not to_emails:
            return jsonify({'error': 'No attendees found for the event'}), 400

        gmail_service = build('gmail', 'v1', credentials=creds)

        subject = f"Meeting Notes for {event.get('summary', 'Event')}"
        body = f"Please find attached the meeting notes for the event: {event.get('summary', 'Event')}\n\n{event.get('description', '')}"
        email = create_email(to_emails, subject, body, f'outputs/Report_{str(formatted_date_time)}.pdf')
        raw_email = base64.urlsafe_b64encode(email.as_bytes()).decode('utf-8')

        result = gmail_service.users().messages().send(
            userId='me',
            body={'raw': raw_email}
        ).execute()

        print('Emails sent successfully:', result)

    except Exception as e:
        return jsonify({'error': 'Failed to send emails', 'details': str(e)}), 500

    # Clear folders
    clear_photos_folder()
    clear_croped_photos_folder()

    # Return success response
    return jsonify({'message': 'Processing complete', 'status': 'success'})

@routes.route('/download-report/<pdf_id>', methods=['GET'])
def download_pdf(pdf_id):

    pdf_path = os.path.abspath(os.path.join('outputs', pdf_id))

    if not os.path.exists(pdf_path):
        return jsonify({
            'error': f'PDF file not found: {pdf_path}',
            'available_files': os.listdir('outputs')
        }), 404

    try:
        return send_file(pdf_path, as_attachment=True)
    except Exception as e:
        return jsonify({'error': f'Failed to send PDF: {str(e)}'}), 500

# multiple pdfs
@routes.route('/list-reports', methods=['GET'])
def list_reports():
    reports_folder = 'outputs'
    try:
        reports = [f for f in os.listdir(reports_folder) if f.endswith('.pdf')]
        if reports:
            return jsonify({'reports': reports}), 200
        else:
            return jsonify({'message': 'No reports found'}), 404
    except Exception as e:
        return jsonify({'error': f'Error listing reports: {str(e)}'}), 500
    