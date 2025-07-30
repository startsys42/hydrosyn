import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';

import ServerErrorPage from './components/ServerErrorPage';
import Notifications from './components/Notifications';
import Blacklist from './components/Blacklist';
import IDs from './components/IDs';
import PrivateRouteInfo from './components/route/PrivateRouteInfo';

import ChangePassword from './components/ChangePassword';
import ChangeUsername from './components/ChangeUsername';
import PrivateRoute from './components/route/PrivateRoute';
import RouteDashboard from './components/route/RouteDashboard';
import RecoverPassword from './components/RecoverPassword';
import PasswordPolicy from './components/PasswordPolicy';
import AddBlacklist from './components/AddBlacklist';
import ChangeEmail from './components/ChangeEmail';
import NamePolicy from './components/NamePolicy';
import Users from './components/Users';
import CreateUser from './components/CreateUser';
import Configuration from './components/Configuration';
import EliminateUser from './components/EliminateUser';







function App() {




    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<PrivateRoute> <LoginPage /></PrivateRoute>} />
                <Route path="/recover-password" element={<PrivateRoute> <RecoverPassword /> </PrivateRoute>} />
                <Route path="/dashboard" element={<RouteDashboard> <Dashboard /></RouteDashboard>} />
                <Route path="/change-password" element={<PrivateRouteInfo><ChangePassword /> </PrivateRouteInfo>} />
                <Route path="/change-username" element={<PrivateRouteInfo ><ChangeUsername /></PrivateRouteInfo>} />
                <Route path="/change-email" element={<PrivateRouteInfo ><ChangeUsername /></PrivateRouteInfo>} />
                <Route path="/blacklist" element={<Blacklist />} />
                <Route path="/add-blacklist" element={<AddBlacklist />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/ids" element={<IDs />} />
                <Route path="/users" element={<Users />} />
                <Route path="/create-user" element={<CreateUser />} />
                <Route path="/eliminate-user" element={<EliminateUser />} />
                <Route path="/password-policy" element={<PasswordPolicy />} />
                <Route path="/name-policy" element={<NamePolicy />} />
                <Route path="/config" element={<Configuration />} />
                <Route path="/error" element={<ServerErrorPage />} />
            </Routes>
        </Router>
    );
}



export default App;
