from flask import Blueprint, jsonify, request, current_app
from datetime import datetime, timedelta
from pymongo import MongoClient
from . import db
import hashlib
from flask_jwt_extended import create_access_token, create_refresh_token, unset_jwt_cookies

auth = Blueprint('auth', __name__)

users_collection = db['users']

@auth.route('/login', methods=['POST'])
def login():
    login_details = request.get_json()
    user_from_db = users_collection.find_one({'email': login_details['email']})

    if user_from_db:
        encrypted_password = hashlib.sha256(login_details['password'].encode('utf-8')).hexdigest()
        if encrypted_password == user_from_db['password']:
            access_token = create_access_token(identity=user_from_db['email'], expires_delta= timedelta(hours=2))
            return jsonify(
                {
                "message":"Logged In",
                "tokens": {
                    "access": access_token
                }
                }), 200
    
    return jsonify({'msg': 'Wrong Credentials'}), 400




@auth.route('/logout', methods=['POST'])
def logout():
    response = jsonify({'msg':'logout succesful'}) 
    unset_jwt_cookies(response)
    return response,200


@auth.route('/register',methods=['POST'])
def register():
    new_user = request.get_json()
    new_user['password'] = hashlib.sha256(new_user['password'].encode('utf-8')).hexdigest()
    doc = users_collection.find_one({'email': new_user["email"]})
    if not doc:
        users_collection.insert_one(new_user)
        return jsonify({'msg': 'User created successfully'}), 201
    else:
        return jsonify({'msg':'User already exists'}), 409
