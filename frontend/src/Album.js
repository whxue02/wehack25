import { Link, useParams, useNavigate } from "react-router-dom" 
import { useState, useEffect } from "react" 
import "./cheryl.css" 

export default function Album() {
    // initialize variables
    const { albumID } = useParams() 
    const navigate = useNavigate() 
    const [album, setAlbum] = useState(null) 
    const [showPopup, setShowPopup] = useState(false) 
    const [showUploadPopup, setShowUploadPopup] = useState(false) 
    const [selectedImage, setSelectedImage] = useState(null) 
    const [comments, setComments] = useState([]) 
    const [newComment, setNewComment] = useState('') 
    const [timeCapsuleDate, setTimeCapsuleDate] = useState('') 
    const [capsuleDescription, setCapsuleDescription] = useState('') 
    const [pictureID, setID] = useState("") 
    const [newImage, setNewImage] = useState(null) 

    // get pictures from album
    useEffect(() => {
        const fetchAlbumDetails = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:5000/getAlbumDetails?albumID=${albumID}`) 
                const data = await response.json() 
                if (response.ok) {
                    setAlbum(data) 
                } else {
                    console.error(data.error) 
                }
            } catch (err) {
                console.error("Error fetching album:", err) 
            }
        } 

        fetchAlbumDetails() 
    }, [showPopup, showUploadPopup]) 

    // when user clicks on a picture, get all info about the pic
    const handleBoxClick = (img, pictureComments, id) => {
        console.log(album)
        setSelectedImage(img) 
        setComments(pictureComments || []) 
        setID(id)
        setShowPopup(true) 
        console.log(comments)
    } 

    // handle adding a comment
    const addComment = async (e) => {
        e.preventDefault() 
        if (!newComment.trim()) return 
    
        const commentData = {
            albumID: albumID,  
            comment: newComment,
            name: 'cheryl',
            pictureID: pictureID,
        } 

        console.log(commentData)
    
        try {
            // sent to back
            const response = await fetch('http://127.0.0.1:5000/addComment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(commentData),
            }) 
    
            if (!response.ok) {
                throw new Error('Failed to add comment') 
            }
    
            const data = await response.json() 
    
            // update with the new comment
            setComments([...comments, commentData]) 
            setNewComment('')  
        } catch (error) {
            console.error("Error adding comment:", error) 
        }
    } 
    
    // delete album
    const deleteAlbum = async (e) => {
        e.preventDefault()  
        try {
            const response = await fetch("http://127.0.0.1:5000/deleteAlbum", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ albumID })
            }) 
            const data = await response.json() 
            if (response.ok) {
                alert("Album deleted successfully!") 
                navigate("/") 
            } else {
                alert(data.error || "Error deleting album") 
            }
        } catch (err) {
            console.error("Error deleting album:", err) 
            alert("Error deleting album") 
        }
    } 

    // delete photo by id
    const deletePhoto = async (pictureID) => {
        try {
            const response = await fetch("http://127.0.0.1:5000/deletePicture", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ albumID, pictureID })
            }) 
            const data = await response.json() 
            if (response.ok) {
                setAlbum((prevAlbum) => ({
                    ...prevAlbum,
                    pictures: prevAlbum.pictures.filter((pic) => pic.pictureID !== pictureID)
                })) 
                alert("Photo deleted successfully!") 
                setShowPopup(false)  
            } else {
                alert(data.error || "Error deleting photo") 
            }
        } catch (err) {
            console.error("Error deleting photo:", err) 
            alert("Error deleting photo") 
        }
    } 

    // update file upload information
    const handleFileChange = (e) => {
        setNewImage(e.target.files[0]) 
    } 
    
    // handle submitting new pictire
    const handleUpload = async () => {
        if (!newImage) return 
    
        const formData = new FormData() 
        formData.append("image", newImage) 
        formData.append("albumID", albumID) 
    
        try {
            const response = await fetch("http://127.0.0.1:5000/uploadPicture", {
                method: "POST",
                body: formData,
            }) 
    
            const textResponse = await response.text() 
    
            const data = JSON.parse(textResponse) 

            if (response.ok) {
                alert("Picture uploaded successfully!") 
                setShowUploadPopup(false)  
                setAlbum((prevAlbum) => ({
                    ...prevAlbum,
                    pictures: [...prevAlbum.pictures, data.picture] 
                })) 
            } else {
                alert(data.error || "Error uploading picture") 
            }
        } catch (err) {
            console.error("Error uploading picture:", err) 
            alert("Error uploading picture") 
        }
    } 

    // handles creating a new time capsule
    const handleTimeCapsuleSubmit = async (e) => {
        e.preventDefault() 
    
        if (!timeCapsuleDate || !capsuleDescription) {
            alert("Please fill out both fields.") 
            return 
        }
    
        const timeCapsuleData = {
            date: timeCapsuleDate,
            description: capsuleDescription,
            imageID: pictureID, 
            username: "whxue", // replace with user once auth is there
            imagePath: selectedImage,
        } 
    
        try {
            // send the time capsule data to the backend
            const response = await fetch("http://127.0.0.1:5000/addTimeCapsule", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(timeCapsuleData),
            }) 
    
            if (response.ok) {
                const data = await response.json() 
                alert("Time capsule added successfully!") 
                setShowPopup(false) 
            } else {
                const errorData = await response.json() 
                alert(errorData.error || "Failed to add time capsule.") 
            }
        } catch (err) {
            console.error("Error adding time capsule:", err) 
            alert("Error adding time capsule.") 
        }
    } 
    

    return (
        <div className="albumBackground">
            <nav className="navbar">
                <ul>
                    <li><Link to="/#Landing">Home</Link></li>
                    <li><Link to="/#Share">Share</Link></li>
                    <li><Link to="/#TimeCapsule">Relive</Link></li>
                </ul>
            </nav>

            <div className="page-container">
                <div className="left">
                    <h1 className="shareTitle">Edit Album</h1>
                    <form className="form">
                        <div className="form-group">
                            <label>Album Name</label>
                            <input type="text" defaultValue={album?.name} />
                        </div>
                        <div className="form-group">
                            <label>Collaborator Usernames</label>
                            <input type="text" defaultValue={album?.collaborators?.join(', ')} />
                        </div>
                        <button className="edit-album-submit" type="submit">Change</button>
                        <button onClick={deleteAlbum} className="delete-album-button">
                        Delete Album
                        </button>
                    </form>
                </div>

                <div className="right">
                    <div className="box-grid">
                        {album?.pictures?.map((pic, i) => (
                            <div
                                key={i}
                                className="box-wrapper"
                                onClick={() => handleBoxClick(pic.picturePath, pic.comments, pic.pictureID)}
                            >
                                <div className="albumBox">
                                    <img
                                        src={pic.picturePath || "/images/Default.png"}
                                        alt={`Album Pic ${i + 1}`}
                                        className="albumBox-image"
                                    />
                                </div>
                            </div>
                        ))}

                        {/* upload box */}
                        <div className="box-wrapper" onClick={() => setShowUploadPopup(true)}>
                            <div className="albumBox">
                                <img
                                    src="/images/uploads.png"
                                    alt="Upload New"
                                    className="albumBox-image"
                                />
                            </div>
                            <p className="albumBox-label">Upload New Picture</p>
                        </div>
                    </div>
                </div>

                {/* upload popup */}
                {showUploadPopup && (
                    <div className="modal-overlay" onClick={() => setShowUploadPopup(false)}>
                        <div className="modal-content upload" onClick={(e) => e.stopPropagation()}>
                            <h3 className="uploadTitle">Upload New Picture</h3>
                            <input type="file" onChange={handleFileChange} />
                            <button onClick={handleUpload} className="upload-button">Upload</button>
                            <button onClick={() => setShowUploadPopup(false)} className="cancel-button">Cancel</button>
                        </div>
                    </div>
                )}

                {/* popup for image */}
                {showPopup && (
                    <div className="modal-overlay" onClick={() => setShowPopup(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <img className="modal-image" src={selectedImage} alt="Selected" />
                            <div className="modal-scroll">
                                <div className="comments-section">
                                    <h3>Comments</h3>
                                    {comments.length === 0 ? (
                                        <p>No comments yet.</p>
                                    ) : (
                                        comments.map((c, i) => (
                                            <div key={i} className="comment">
                                                <strong>{c.name}</strong>
                                                <p>{c.comment}</p>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <form className="add-comment-form" onSubmit={addComment}>
                                    <input
                                        type="text"
                                        placeholder="Add a comment..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        className="comment-input"
                                    />
                                    <button className="commentButton" type="submit">Post</button>
                                </form>

                                <form className="time-capsule-form" onSubmit={handleTimeCapsuleSubmit}>
                                <label htmlFor="capsule-date">Add to Time Capsule:</label>
                                <input
                                    type="date"
                                    id="capsule-date"
                                    value={timeCapsuleDate}
                                    onChange={(e) => setTimeCapsuleDate(e.target.value)}
                                />
                                <input
                                    type="text"
                                    id="capsule-description"
                                    placeholder="Enter your description"
                                    value={capsuleDescription}
                                    onChange={(e) => setCapsuleDescription(e.target.value)}
                                />
                                <button className="timeButton" type="submit">Save Date</button>
                            </form>
                                <button onClick={() => deletePhoto(pictureID)} className="delete-photo-button">Delete Photo</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    ) 
}
