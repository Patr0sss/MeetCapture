from flask import Blueprint, request, jsonify
from . import ocr_run
from ocr.moduls.process_output import process_markdown
import os

ocr_bp = Blueprint('ocr', __name__)

@ocr_bp.route('/timestamps', methods=['POST'])
def timestamps_fetch():
    timestamps = request.get_json()
    if not isinstance(timestamps, list):
        return jsonify({'error': 'Invalid input. Expected a list of timestamps.'}), 400

    for timestamp in timestamps:
        try:
            video_file = os.path.join('ocr', 'test1.mp4')
            ocr_run.run_ocr(timestamp, video_file)
        except Exception as e:
            return jsonify({'error': f'Error processing timestamp {timestamp}: {str(e)}'}), 500

    try:
        process_markdown(
            input_file='notes.md',  
            output_dir='',         
            output_file='output.pdf', 
            max_width=600     
        )
    except Exception as e:
        return jsonify({'error': f'Error generating markdown PDF: {str(e)}'}), 500

    return jsonify({'message': 'Timestamps processed successfully', 'received_values': timestamps})
