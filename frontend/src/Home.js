import "./cheryl.css"
import Landing from "./pages/Landing" 
import Share from "./pages/Share"
import TimeCapsule from "./pages/TimeCapsule"
export default function Home() {
    return (
<div className="app">
      <nav className="navbar">
        <ul>
          <li><a href="#Landing">Home</a></li>
          <li><a href="#Share">Share</a></li>
          <li><a href="#TimeCapsule">Relive</a></li>
        </ul>
      </nav>
      
      <div className="sections">
        <Landing/>

        <Share/>

        
        <TimeCapsule/>
      </div>
    </div>
        
    )
}