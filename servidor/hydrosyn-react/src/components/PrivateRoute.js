import { Navigate, useLocation } from 'react-router-dom';


const PrivateRoute = ({ isLoggedIn, children }) => {
    const location = useLocation();

    if (!isLoggedIn) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return children;
};

export default PrivateRoute; // Debe coincidir con tu import