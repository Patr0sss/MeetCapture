from flask_cors import CORS
from ocr.moduls.process_output import process_markdown
from ocr.ocr_run import run_ocr
from flask_api import create_app
from flask import Flask, request, jsonify
from ocr.process import process_timestamps

app = create_app()
CORS(app)

if __name__ == '__main__':
    app.run(debug=True)

