from flask import Blueprint, jsonify, request, current_app
from datetime import datetime, timedelta
from pymongo import MongoClient
from . import db
import hashlib
from flask_jwt_extended import create_access_token, create_refresh_token, unset_jwt_cookies
import re

auth = Blueprint('auth', __name__)

users_collection = db['users']

@auth.route('/login', methods=['POST'])
def login():
    login_details = request.get_json()
    user_from_db = users_collection.find_one({'email': login_details['email']})

    if user_from_db:
        encrypted_password = hashlib.sha256(login_details['password'].encode('utf-8')).hexdigest()
        if encrypted_password == user_from_db['password']:
            access_token = create_access_token(identity=user_from_db['email'], expires_delta= timedelta(days=7))
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
    if new_user['password'] and new_user['email']:
        email_regex = re.compile('^[\w\-\.]+@([\w-]+\.)+[\w-]{2,4}$')

        if not re.match(email_regex,new_user['email']):
            return jsonify({'msg':'Not valid email provided.'}),400
        if len(new_user['password']) <= 6:
            return jsonify({'msg':'password should not be shorter than 6 characters.'}), 400

        new_user['password'] = hashlib.sha256(new_user['password'].encode('utf-8')).hexdigest()
        doc = users_collection.find_one({'email': new_user["email"]})
        if not doc:
            users_collection.insert_one({
                "email": new_user['email'],
                "password": new_user['password'],
                'date_created': datetime.now()
            })
            return jsonify({'msg': 'User created successfully'}), 201
        else:
            return jsonify({'msg':'User already exists'}), 409
        
    return jsonify({'msg':'no credentials provided.'}), 400

    

