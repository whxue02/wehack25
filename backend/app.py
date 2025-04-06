import os
from flask import Flask
from dotenv import load_dotenv

from flask import Flask, jsonify, request, session, make_response
from flask_cors import CORS

from bson.objectid import ObjectId  # Import ObjectId

from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from datetime import datetime, timezone, timedelta

app = Flask(__name__)

CORS(app, supports_credentials=True)

# get MongoDB URI from .env
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("MONGO_URI is not set")

# create a new client and connect to the server
client = MongoClient(MONGO_URI, server_api=ServerApi('1'))
# users is database name
db = client["users"]
dba = client["albums"]
dbt = client["time"]

# send a ping to confirm a successful connection
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)

# get album details
@app.route("/getAlbumDetails", methods=["GET"])
def getAlbum():
    id = request.args.get("albumID")
    print(id)
    try:
        album = dba["albums"].find_one({"albumID": id}, {"_id": 0})
        if not album:
            return jsonify({"error": "Album not found"}), 404
        return jsonify(album)
    except Exception as e:
        print(f"Error in getAlbum: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500
    
# get all albums for a user by searching in the collaborators array
@app.route("/getAlbums", methods=["GET"])
def getAlbums():
    username = request.args.get("username")
    print(f"Searching for albums with collaborator: {username}")
    
    if not username:
        return jsonify({"error": "Username is required"}), 400
    
    try:
        # Find albums where the username exists in the collaborators array
        albums = list(dba["albums"].find({"collaborators": username}, {"_id": 0}))
        
        # If no albums are found for the username, return a message
        if not albums:
            print("No albums found for this username.")
        
        return jsonify(albums)  # Return the found albums as JSON
    except Exception as e:
        print(f"Error in getAlbums: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

    
# get user time capsules
@app.route("/getTimeCapsules", methods=["GET"])
def getTime():
    username = request.arCgs.get("username")
    print(username)
    try:
        capsules = list(dbt["time"].find({"username": username}, {"_id": 0}))
        return jsonify(capsules)
    except Exception as e:
        print(f"Error in getAlbum: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500
    
# create new album
@app.route("/createAlbum", methods=["POST"])
def createAlbum():
    data = request.get_json()
    print(data)
    try:
        existing_album = dba["albums"].find_one({"albumID": data["albumID"]}, {"_id": 0})
        if existing_album:
            return jsonify({"error": "Album ID already exists"}), 400

        dba["albums"].insert_one(data)
        if "_id" in data:
            del data["_id"]
        return jsonify(data), 201
    except Exception as e:
        print(f"Error in createAlbum: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500
    
# add a picture to an album
@app.route("/addPicture", methods=["POST"])
def addPhoto():
    data = request.get_json()
    print(data)
    try:
        existing_album = dba["albums"].find_one({"albumID": data["albumID"]})
        if not existing_album:
            return jsonify({"error": "Album ID does not exist"}), 400

        dba["albums"].update_one(
            {"albumID": data["albumID"]},
            {"$push": {"pictures": data.get("pictures")}}
        )
        return jsonify({"message": "Photo added successfully"}), 200
    except Exception as e:
        print(f"Error in addPhoto: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500
    
# delete an album
@app.route('/deleteAlbum', methods=["DELETE"])
def deleteAlbum():
    data = request.get_json()
    print(data)
    try:
        existing_album = dba["albums"].find_one({"albumID": data["albumID"]})
        if not existing_album:
            return jsonify({"error": "Album ID does not exist"}), 400

        dba["albums"].delete_one({"albumID": data["albumID"]})
        return jsonify({"message": "Album deleted successfully"}), 200
    except Exception as e:
        print(f"Error in deleteAlbum: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500
    
# delete a picture
@app.route('/deletePicture', methods=["DELETE"])
def deletePhoto():
    data = request.get_json()
    print(data)
    
    try:
        # Find the album by albumID
        existing_album = dba["albums"].find_one({"albumID": data["albumID"]})
        if not existing_album:
            return jsonify({"error": "Album ID does not exist"}), 400

        # Ensure that pictureID is provided
        picture_id = data.get("pictureID")
        if not picture_id:
            return jsonify({"error": "pictureID is required"}), 400
        
        # Pull the picture(s) by matching pictureID
        dba["albums"].update_one(
            {"albumID": data["albumID"]},
            {"$pull": {"pictures": {"pictureID": picture_id}}}
        )
        
        return jsonify({"message": "Photo deleted successfully"}), 200
    except Exception as e:
        print(f"Error in deletePhoto: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500




if __name__ == '__main__':
    app.run(debug=True)