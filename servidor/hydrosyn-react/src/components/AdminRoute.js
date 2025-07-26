import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ isLoggedIn, isAdmin, children }) => {
    return (
        <PrivateRoute isLoggedIn={isLoggedIn}>
            {isAdmin ? children : <Navigate to="/no-permission" />}
        </PrivateRoute>
    );
};

export default AdminRoute;