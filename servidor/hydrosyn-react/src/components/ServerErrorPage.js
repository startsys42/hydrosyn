import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';


function ServerErrorPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const errorInfo = location.state;

    // Si no hay info (por ejemplo, si recargaron la página), redirige a "/"
    useEffect(() => {
        if (!errorInfo) {
            navigate('/', { replace: true });
        }
    }, [errorInfo, navigate]);

    // Si aún no se ha redirigido
    if (!errorInfo) {
        return null; // O un loader
    }

    const { code, message } = errorInfo;

    return (
        <div style={{ padding: 40, textAlign: 'center' }}>
            <h1>🚨 Error {code || 'Unknown'}</h1>
            <p>{message || 'An unexpected error occurred. Please try again later.'}</p>
            <button onClick={() => navigate('/')}> Back to Home</button>
        </div>
    );
}

export default ServerErrorPage;