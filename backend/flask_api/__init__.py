from flask import Flask

from pymongo import MongoClient
from flask_cors import CORS
import json
from flask_jwt_extended import JWTManager


def create_app():
    global db

    app = Flask(__name__)

    CORS(app, resources={
    r"/*": {
        "origins": ["chrome-extension://*"], 
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
    })
    configure_app(app)
    jwt.init_app(app)
    client = MongoClient(app.config["DB_URI"])
    db = client[app.config["DB"]]
    
    configure_blueprints(app)
    

    return app



def configure_app(app):
    app.config.from_file("./config.json", load=json.load)
    
    

def configure_blueprints(app):
    from . import auth
    from . import routes

    app.register_blueprint(auth.auth)
    app.register_blueprint(routes.routes)


jwt = JWTManager()