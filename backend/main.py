from flask_cors import CORS
from flask_api import create_app
from flask import Flask, request, jsonify

app = create_app()
CORS(app)

if __name__ == '__main__':
    app.run(debug=True)

