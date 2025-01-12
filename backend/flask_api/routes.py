from flask import Blueprint, json, request, jsonify, send_file
from flask_cors import CORS
from flask_api.ocr.ocr_run import ocr_run
from flask_api.ocr.moduls import process_output
from flask_api.transcript.whisperx_transcript import speech_to_text
import moviepy.editor as mp
import subprocess
import os

routes = Blueprint('routes', __name__)


UPLOAD_FOLDER = "uploaded_videos"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@routes.route('/process-video', methods=['POST'])
def process_video():
    # check if vide was fetched
    video = request.files.get('video')
    if not video:
        return jsonify({'error': 'Video not fetched by endpoint'}), 400
    
    # check if timestamps were fetched
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

    #video_to_compress = mp.VideoFileClip(video_path)
    #video_to_compress.audio.write_audiofile(os.path.join(UPLOAD_FOLDER,"audio.mp3"))
    #audio_path = os.path.join(UPLOAD_FOLDER, 'audio.mp3')
    

    text = speech_to_text(video_path)

    with open('text.md', 'a', encoding='utf-8') as f:
        for segment in text["segments"]:
            f.write(f"\n{segment['start']}-{segment['end']} {segment['speaker']}: {segment['text']}\n")


    # for every timestamp, run the OCR
    for timestamp in timestamps:
        try:
            ocr_run(timestamp, video_path)
        except Exception as e:
            return jsonify({'error': f'Error processing timestamp {timestamp}: {str(e)}'}), 500


        
    # use ready markdown file to create pdf
    process_output.process_markdown(
        md_file='notes.md',  
        images_folder='',         
        output_pdf='output.pdf', 
        max_width=600     
    )

    # random return
    return jsonify({'message': 'Processing complete', 'status': 'success'})