import os
from flask import Flask
from dotenv import load_dotenv

from flask import Flask, jsonify, request, session, make_response
from flask_cors import CORS

from bson.objectid import ObjectId  # Import ObjectId

from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from datetime import datetime

import random

def generate_picture_id():
    random_number = random.randint(0, 100000000000000)
    return str(random_number)

app = Flask(__name__, static_folder='uploads')

UPLOAD_FOLDER = 'uploads/'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

CORS(app) 

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


@app.route("/getTimeCapsules", methods=["GET"])
def getTime():
    username = request.args.get("username")
    print(username)
    try:
        capsules = list(dbt["time"].find({"username": username}, {"_id": 0}))
        for capsule in capsules:
            # If date is a string, try to parse it into a datetime object
            if isinstance(capsule["date"], str):
                # Attempt to parse the date string into a datetime object
                capsule["date"] = datetime.fromisoformat(capsule["date"]) if capsule["date"] else None
            # If it's a datetime object, just convert it to an ISO string
            elif isinstance(capsule["date"], datetime):
                capsule["date"] = capsule["date"].isoformat()
        return jsonify(capsules)
    except Exception as e:
        print(f"Error in getTime: {str(e)}")
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
    
@app.route('/addComment', methods=['POST'])
def add_comment():
    data = request.json  # Expecting a JSON body with the albumID, pictureID, and comment
    album_id = data.get("albumID")
    picture_id = data.get("pictureID")
    comment = data.get("comment")
    name = data.get("name")
    
    if not album_id or not picture_id or not comment or not name:
        return jsonify({"error": "Missing required data"}), 400
    
    # Find the album in the database
    album = dba["albums"].find_one({"albumID": album_id})
    if not album:
        return jsonify({"error": "Album not found"}), 404
    
    # Find the specific picture by pictureID
    picture = next((pic for pic in album["pictures"] if pic["pictureID"] == picture_id), None)
    if not picture:
        return jsonify({"error": "Picture not found"}), 404
    
    # Add the comment to the picture's comments array
    new_comment = {
        "name": name,
        "comment": comment,
    }
    
    # Push the new comment to the comments array of the specific picture
    dba["albums"].update_one(
        {"albumID": album_id, "pictures.pictureID": picture_id},
        {"$push": {"pictures.$.comments": new_comment}}
    )
    
    # Return the updated comments for the specific picture
    updated_picture = dba["albums"].find_one({"albumID": album_id, "pictures.pictureID": picture_id})
    updated_comments = updated_picture["pictures"]
    
    return jsonify({"message": "Comment added successfully", "comments": updated_comments}), 200

@app.route('/addTimeCapsule', methods=['POST'])
def add_time_capsule():
    data = request.json  # Expecting a JSON body with the time capsule data
    # Validation: Check for missing required fields
    required_fields = [ "date", "description", "imageID", "username", "imagePath"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Construct the time capsule document to insert into the database
    time_capsule = {
        "capsuleID": generate_picture_id(),
        "date": data["date"],
        "description": data["description"],
        "imageID": data["imageID"],
        "username": data["username"],
        "imagePath": data["imagePath"],
    }
    
    try:
        # Insert the time capsule document into the database
        result = dbt["time"].insert_one(time_capsule)
        
        # Extract the inserted ID and include it in the response
        time_capsule['_id'] = str(result.inserted_id)  # Convert ObjectId to string
        
        # Return the success response
        return jsonify({
            "message": "Time capsule added successfully",
            "timeCapsule": time_capsule
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to add time capsule: {str(e)}"}), 500

    
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

@app.route('/uploadPicture', methods=['POST'])
def upload_picture():
    if 'image' not in request.files:
        return jsonify({"error": "No image part"})
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No selected file"})
    
    # Get the albumID from the form data or request body
    album_id = request.form.get("albumID")  # or request.json.get("albumID") if you are sending JSON data

    if not album_id:
        return jsonify({"error": "No album ID provided"}), 400

    if file and allowed_file(file.filename):
        filename = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filename)
        
        # Simulate the picture data
        picture_data = {
            "pictureID": generate_picture_id(),
            "picturePath": f'http://127.0.0.1:5000/{filename}',  # Ensure this is the correct path
            "comments": [],
        }
        
        # Find the album by albumID
        existing_album = dba["albums"].find_one({"albumID": album_id})
        if not existing_album:
            return jsonify({"error": "Album ID does not exist"}), 400

        # Update the album with the new picture
        dba["albums"].update_one(
            {"albumID": album_id},
            {"$push": {"pictures": picture_data}}
        )

        # Return the new picture data as JSON
        return jsonify({"picture": picture_data})

    return jsonify({"error": "Invalid file type"})



if __name__ == '__main__':
    app.run(debug=True)