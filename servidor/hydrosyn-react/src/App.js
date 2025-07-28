import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';

import ServerErrorPage from './components/ServerErrorPage';
import Notifications from './components/Notifications';
import Blacklist from './components/Blacklist';
import IDs from './components/IDs';


import ChangePassword from './components/ChangePassword';
import ChangeUsername from './components/ChangeUsername';
import PrivateRoute from './components/PrivateRoute';
import RecoverPassword from './components/RecoverPassword';
import { checkAccess } from './utils/checks';




function App() {




    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<PrivateRoute checkCondition={checkAccess}> <LoginPage />
                </PrivateRoute>} />

                <Route path="/recover-password" element={<PrivateRoute checkCondition={checkAccess}> <RecoverPassword /> </PrivateRoute>} />

                <Route path="/error" element={<ServerErrorPage />} />
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute checkCondition={checkAccess}>
                            <Dashboard />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/change-password"
                    element={
                        <PrivateRoute checkCondition={checkAccess}>
                            <ChangePassword />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/change-username"
                    element={
                        <PrivateRoute checkCondition={checkAccess}>
                            <ChangeUsername />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/blacklist"
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
            </Routes>
        </Router>
    );
}



export default App;
