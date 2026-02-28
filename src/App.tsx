import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'
import DashboardScreen from './pages/dashboard'
import AuthScreen from "./pages/auth";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import { AuthProvider } from "./contexts/AuthContext";
import StockScreen from "./pages/stock";
import FinanceScreen from "./pages/finance";
import ReportPage from "./pages/report";
import VenteScreen from "./pages/ventes";
import RHScreen from "./pages/rh";

function App() {

  return (
    <Provider store={store}>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path='/' element={<AuthScreen />} />
            <Route path='/dashboard' element={<DashboardScreen />} />
            <Route path='/stock' element={<StockScreen />} />
            <Route path='/finance' element={<FinanceScreen />} />
            <Route path='/report' element={<ReportPage />} />
            <Route path='/vente' element={<VenteScreen />} />
            <Route path='/rh' element={<RHScreen />} />
          </Routes>
        </AuthProvider>
      </Router>
    </Provider>
  )
}

export default App
