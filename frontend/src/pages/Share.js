import React, { useState, useEffect } from 'react' 
import { useNavigate } from 'react-router-dom' 

export default function Share() {
    // initialize variables
    const [albums, setAlbums] = useState([])   
    const [albumName, setAlbumName] = useState('') 
    const [collaborators, setCollaborators] = useState('') 
    const navigate = useNavigate() 

    // get albums of user
    useEffect(() => {
        const fetchAlbums = async () => {
            const username = 'whxue'  // will replace with user when auth is implemented
            const response = await fetch(`http://127.0.0.1:5000/getAlbums?username=${username}`) 
            const data = await response.json() 
            if (Array.isArray(data)) {  // make sure that data is an array
                setAlbums(data) 
            } else {
                setAlbums([])   // empty array else
            }
        } 

        fetchAlbums() 
    }, []) 

    // create new album
    const handleSubmit = async (e) => {
        e.preventDefault() 

        // get collaborators from input
        const collaboratorList = collaborators.split(',').map((user) => user.trim()) 

        // make a new album object
        const newAlbum = {
            albumID: albumName.toLowerCase().replace(' ', '_'), // Example albumID generation
            name: albumName,
            pictures: [],
            collaborators: collaboratorList
        } 


        // send request to create a new album
        const response = await fetch('http://127.0.0.1:5000/createAlbum', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newAlbum)
        }) 

        if (response.ok) {
            const data = await response.json() 
            const addedAlbum = data.album
            setAlbums((prevAlbums) => [...prevAlbums, newAlbum])   
            console.log(albums)
        } else {
            const errorData = await response.json() 
            alert(errorData.error) 
        }
    } 

    // handle clicking on a box to go to the album page
    const handleBoxClick = (albumID) => {
        navigate(`/album/${albumID}`)  // navigate to album page
    } 

    return (
        <section id="Share" className="screen shareBackground">
            <div className="sharecontainer">
                {/* left side */}
                <div className="left">
                    <h1 className="shareTitle">New Album</h1 >
                    <form className="form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Album Name</label>
                            <input 
                                type="text" 
                                value={albumName}
                                onChange={(e) => setAlbumName(e.target.value)} 
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Collaborator Usernames (comma separated)</label>
                            <input 
                                type="text" 
                                value={collaborators}
                                onChange={(e) => setCollaborators(e.target.value)} 
                                required
                            />
                        </div>
                        <button type="submit">Submit</button>
                    </form>
                </div>

                {/* right side  */}
                <div className="right">
                    <div className="box-grid">
                        {albums && Array.isArray(albums) && albums.map((album, index) => (
                            <div key={index} className="box-wrapper" onClick={() => handleBoxClick(album.albumID)}>
                                <div className="albumBox">
                                <img className="albumBox-image" 
                                    src={album?.pictures?.[0]?.picturePath || '/images/Default.png'} 
                                />
                                </div>
                                <p className="albumBox-label">{album?.name || 'Loading Name...'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    ) 
}
