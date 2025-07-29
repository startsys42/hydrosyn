import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';

import ServerErrorPage from './components/ServerErrorPage';
import Notifications from './components/Notifications';
import Blacklist from './components/Blacklist';
import IDs from './components/IDs';
import PrivateRouteInfo from './components/PrivateRouteInfo';

import ChangePassword from './components/ChangePassword';
import ChangeUsername from './components/ChangeUsername';
import PrivateRoute from './components/PrivateRoute';
import RecoverPassword from './components/RecoverPassword';





function App() {




    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<PrivateRoute> <LoginPage /></PrivateRoute>} />
                <Route path="/recover-password" element={<PrivateRoute> <RecoverPassword /> </PrivateRoute>} />
                <Route path="/dashboard" element={<PrivateRoute> <Dashboard /></PrivateRoute>} />
                <Route path="/change-password" element={<PrivateRouteInfo><ChangePassword /> </PrivateRouteInfo>} />
                <Route path="/change-username" element={<PrivateRouteInfo ><ChangeUsername /></PrivateRouteInfo>} />
                <Route path="/blacklist"
                    element={<Blacklist />}  // Correcto en v6+
                />
                <Route
                    path="/notifications"
                    element={<Notifications />}
                />
                <Route
                    path="/ids"
                    element={<IDs />}
                />
                <Route path="/error" element={<ServerErrorPage />} />
            </Routes>
        </Router>
    );
}



export default App;
