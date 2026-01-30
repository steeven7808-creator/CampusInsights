import './App.css'
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {Home} from "./pages/Home";
import {Search} from "./pages/Search";

function App() {
  return (
    <BrowserRouter>
        <Routes>
            <Route index element={<Home />} />
            <Route path="/search" element={<Search />} />
        </Routes>
    </BrowserRouter>
  )
}

export default App
