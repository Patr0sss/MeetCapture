from flask_cors import CORS
from ocr.moduls.process_output import process_markdown
from ocr.ocr_run import run_ocr
from flask_api import create_app
from flask import Flask, request, jsonify
from ocr.process import process_timestamps

app = create_app()
CORS(app)

@app.route('/timestamps',methods=['POST'])
def timestamps_fetch():
    timestamps = request.get_json()
    print(timestamps)
    # timestamps.append("00:43:11")
    for timestamp in timestamps:
        # if test5.mp4 on the same level as main.py
        run_ocr(timestamp,'test5.mp4')
    process_markdown('notes.md','',"output.pdf",max_width=600)

    return jsonify({'message': 'Received the array', 'received_values': timestamps})

if __name__ == '__main__':
    app.run(debug=True)

