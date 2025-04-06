import { Link, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./cheryl.css";

export default function Home() {
    const { albumID } = useParams();
    const navigate = useNavigate();
    const [album, setAlbum] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [timeCapsuleDate, setTimeCapsuleDate] = useState('');
    const [pictureID, setID] = useState("");

    useEffect(() => {
        const fetchAlbumDetails = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:5000/getAlbumDetails?albumID=${albumID}`);
                const data = await response.json();
                if (response.ok) {
                    setAlbum(data);
                } else {
                    console.error(data.error);
                }
            } catch (err) {
                console.error("Error fetching album:", err);
            }
        };

        fetchAlbumDetails();
    }, [albumID]);

    const handleBoxClick = (img, pictureComments, id) => {
        setSelectedImage(img);
        setComments(pictureComments || []);
        setID(id)
        setShowPopup(true);
    };

    const addComment = (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setComments([...comments, { user: 'You', text: newComment }]);
        setNewComment('');
    };

    const deleteAlbum = async (e) => {
        e.preventDefault(); 
        try {
            const response = await fetch("http://127.0.0.1:5000/deleteAlbum", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ albumID })
            });
            const data = await response.json();
            if (response.ok) {
                alert("Album deleted successfully!");
                navigate("/"); // Redirect to homepage or other page after deletion
            } else {
                alert(data.error || "Error deleting album");
            }
        } catch (err) {
            console.error("Error deleting album:", err);
            alert("Error deleting album");
        }
    };

    const deletePhoto = async (pictureID) => {
        try {
            const response = await fetch("http://127.0.0.1:5000/deletePicture", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ albumID, pictureID })
            });
            const data = await response.json();
            if (response.ok) {
                setAlbum((prevAlbum) => ({
                    ...prevAlbum,
                    pictures: prevAlbum.pictures.filter((pic) => pic.pictureID !== pictureID)
                }));
                alert("Photo deleted successfully!");
            } else {
                alert(data.error || "Error deleting photo");
            }
        } catch (err) {
            console.error("Error deleting photo:", err);
            alert("Error deleting photo");
        }
    };

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
                                <p className="albumBox-label">Picture {pic.pictureID || i + 1}</p>
                            </div>
                        ))}
                    </div>
                </div>

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

                                <form className="time-capsule-form">
                                    <label htmlFor="capsule-date">Add to Time Capsule:</label>
                                    <input
                                        type="date"
                                        id="capsule-date"
                                        value={timeCapsuleDate}
                                        onChange={(e) => setTimeCapsuleDate(e.target.value)}
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
    );
}
