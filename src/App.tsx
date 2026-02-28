import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'
import DashboardScreen from './pages/dashboard'
import AuthScreen from "./pages/auth";

function App() {

  return (
    <Router>
      <Routes>
        <Route path='/' element={<AuthScreen/>}/>
        <Route path='/dashboard' element={<DashboardScreen/>}/>
      </Routes>
    </Router>
  )
}

export default App
