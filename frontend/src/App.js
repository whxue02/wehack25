import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './Home'
import Album from './Album'

function App() {
  return (
    <div className="App">
        <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/album/:albumID' element={<Album />} />
        </Routes>
        </BrowserRouter>
    </div>
  );
}

export default App;
