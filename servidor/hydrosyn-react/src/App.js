import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';

import ServerErrorPage from './components/ServerErrorPage';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChangePassword from './components/ChangePassword';
import ChangeUsername from './components/ChangeUsername';
import PrivateRoute from './components/PrivateRoute';
import RecoverPassword from './components/RecoverPassword';
import { checkAccess } from './utils/checks';




function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();


    return (
        <Router>
            <Routes>
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
            </Routes>
        </Router>
    );
}



export default App;
