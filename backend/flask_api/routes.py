from concurrent.futures import ThreadPoolExecutor, as_completed
import queue
import threading
from flask import Blueprint, json, request, jsonify, send_file
from flask_cors import CORS
from flask_api.ocr.ocr_run import ocr_run
from flask_api.ocr.moduls import process_output
# from flask_api.transcript.whisperx_transcript import speech_to_text
from .utils.sort_text import sorting_timestamps
from .utils.clear_photos_folder import clear_photos_folder
from .utils.clear_croped_photos_folder import clear_croped_photos_folder
from .utils.calculate_workers import calculate_workers
from datetime import datetime
import subprocess
import os

routes = Blueprint('routes', __name__)


UPLOAD_FOLDER = "uploaded_videos"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def process_timestamp(timestamp, video_path):
    try:
        # Simulate OCR processing
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
    if not timestamps:
        return jsonify({'error': 'Timestamps not provided'}), 400
    
    try:
        timestamps = json.loads(timestamps)
    except Exception:
        return jsonify({'error': 'Invalid timestamps format. Expected a JSON array.'}), 400

    # Save the uploaded video
    video_path = os.path.join(UPLOAD_FOLDER, 'recording.mp4')
    video.save(video_path)

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
    futures = []
    max_workers = calculate_workers(workload_type='mixed', safety_margin=2)
    # Use a thread pool with a maximum of 3 threads
    with ThreadPoolExecutor(max_workers) as executor:
        # Submit tasks to the thread pool
        for timestamp in timestamps:
            future = executor.submit(process_timestamp, timestamp, video_path)
            futures.append(future)

        # Collect results as they complete
        for future in as_completed(futures):
            timestamp, result = future.result()
            if isinstance(result, dict) and 'error' in result:
                return jsonify({'error': f'Error processing timestamp {timestamp}: {result["error"]}'}), 500
            is_graph_result, text = result
            dic_ocr[timestamp] = text  # Store the result in dic_ocr

    # Generate notes text
    notes_text = sorting_timestamps(timestamps, timestamp_from_whisper, dic_ocr, dic_whisper)
    print("Finished notes: ", notes_text)

    # Write notes to the file
    with open('notes.md', 'w', encoding='utf-8') as f:
        f.write(notes_text)

    # Use ready markdown file to create PDF
    current_date_time = datetime.now()
    formatted_date_time = current_date_time.strftime("%Y.%m.%d_%H-%M-%S")

    process_output.process_markdown(
        md_file='notes.md',  
        images_folder='',         
        output_pdf=f'outputs/Report_{str(formatted_date_time)}.pdf'  
    )

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
    