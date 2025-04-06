import { useState, useEffect } from "react" 

export default function TimeCapsule() {
    const [timeCapsules, setTimeCapsules] = useState([]) 
    const [selectedCapsule, setSelectedCapsule] = useState(null) 
    const [countdown, setCountdown] = useState("") 
    const username = "whxue"   // change after auth

    useEffect(() => {
        const fetchTimeCapsules = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:5000/getTimeCapsules?username=${username}`) 
                const data = await response.json() 
                if (response.ok) {
                    // sort by chronological
                    const sortedCapsules = data.sort((a, b) => new Date(a.date) - new Date(b.date)) 
                    setTimeCapsules(sortedCapsules) 
                    updateCountdown(sortedCapsules) 
                } else {
                    console.error(data.error || "Failed to fetch time capsules") 
                }
            } catch (err) {
                console.error("Error fetching time capsules:", err) 
            }
        } 

        fetchTimeCapsules() 

        // countdown by one second every second
        const intervalId = setInterval(() => {
            updateCountdown(timeCapsules) 
        }, 1000) 

        return () => clearInterval(intervalId) 
    }, [timeCapsules]) 

    const getImage = (date) => {
        const currentDate = new Date() 
        const capsuleDate = new Date(date) 
        return capsuleDate <= currentDate ? "/images/done.png" : "/images/wait.png" 
    } 

    const formatDate = (date) => {
        const formattedDate = new Date(date) 
        return formattedDate.toLocaleDateString()  
    } 

    const handleCapsuleClick = (capsule) => {
        if (getImage(capsule.date) === "/images/done.png") {
            setSelectedCapsule(capsule) 
        }
    } 

    const closeModal = () => {
        setSelectedCapsule(null) 
    } 

    const updateCountdown = (capsules) => {
        const currentDate = new Date() 

        // adjust the current date to ct
        const centralTime = currentDate.toLocaleString("en-US", { timeZone: "America/Chicago" }) 
        const currentCT = new Date(centralTime) 

        const upcomingCapsule = capsules.find(capsule => new Date(capsule.date) > currentCT) 
        
        if (upcomingCapsule) {
            const capsuleDate = new Date(upcomingCapsule.date) 

            // adjust capsule date to ct
            const capsuleCT = new Date(capsuleDate.toLocaleString("en-US", { timeZone: "America/Chicago" })) 

            const timeDifference = capsuleCT - currentCT 

            if (timeDifference > 0) {
                // calculate years, months, days, hours, minutes, and seconds
                const years = Math.floor(timeDifference / (1000 * 60 * 60 * 24 * 365)) 
                const months = Math.floor((timeDifference % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30)) 
                const days = Math.floor((timeDifference % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24)) 
                const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) 
                const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60)) 
                const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000) 

                setCountdown(`${years.toString().padStart(2, '0')}.${months.toString().padStart(2, '0')}.${days.toString().padStart(2, '0')}.${hours.toString().padStart(2, '0')}.${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`) 
            } else {
                setCountdown("Capsule is open!") 
            }
        } else {
            setCountdown("No upcoming capsules.") 
        }
    } 

    return (
        <section id="TimeCapsule" className="screen timeBackground">
            <div className="page-container">
                {/* left side */}
                <div className="left-side">
                    <div className="box-grid">
                        {timeCapsules.map((capsule, index) => (
                            <div key={index} className="box-wrapper" onClick={() => handleCapsuleClick(capsule)}>
                                <div className="albumBox">
                                    <img src={getImage(capsule.date)} alt="Time Capsule" className="albumBox-image" />
                                </div>
                                <p className="timeBox-label">Opens on: {formatDate(capsule.date)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* right side*/}
                <div className="right-side">
                    <h1 className="countdownTitle">Countdown to next Capsule</h1>
                    <div className="countdown-box">
                        <p>{countdown}</p>
                    </div>
                </div>
            </div>

            {/* popup for capsule */}
            {selectedCapsule && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content capsule" onClick={(e) => e.stopPropagation()}>
                        <img src={selectedCapsule.imagePath} alt="Time Capsule Content" className="modal-image" />
                        <div className="modal-scroll">
                            <p><strong>Description:</strong> {selectedCapsule.description}</p>
                        </div>
                        <button className="capsule-button" onClick={closeModal}>Close</button>
                    </div>
                </div>
            )}
        </section>
    ) 
}
