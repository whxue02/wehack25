import{useEffect,useState} from 'react'

export default function TimeCapsule() {
    const boxes = Array.from({ length: 18 }, (_, i) => `Box ${i + 1}`);

    const targetDate = new Date('2026-01-01T00:00:00');

    const [timeLeft, setTimeLeft] = useState(getTimeLeft());

    function getTimeLeft() {
    const now = new Date();
    const diff = Math.max(0, targetDate - now); // in ms

    const totalSeconds = Math.floor(diff / 1000);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600) % 24;
    const days = Math.floor(totalSeconds / (3600 * 24)) % 365;
    const years = Math.floor(totalSeconds / (3600 * 24 * 365));

    return { years, days, hours, minutes, seconds };
    }

    useEffect(() => {
    const interval = setInterval(() => {
        setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
    }, []);

    const formatTime = (unit) => unit.toString().padStart(2, '0');
    return(
        <section id="TimeCapsule" className="screen timeBackground">
            <div className="page-container">
                {/* Left side - boxes */}
                <div className="left-side">
                    <div className="box-grid">
                    {boxes.map((box, index) => (
                        <div key={index} className="box-wrapper">
                        <div className="timeBox">🖼️</div>
                        <p className="timeBox-label">{box}</p>
                        </div>
                    ))}
                    </div>
                </div>

                {/* Right side - countdown */}
                <div className="right-side">
                    <h1 className="countdownTitle">Countdown to next Capsule</h1>
                    <div className="countdown-box">
                    <p>
                        {formatTime(timeLeft.years)} : {formatTime(timeLeft.days)} : {formatTime(timeLeft.hours)} : {formatTime(timeLeft.minutes)} : {formatTime(timeLeft.seconds)}
                    </p>
                    </div>
                </div>
            </div>
        </section>
    )
}