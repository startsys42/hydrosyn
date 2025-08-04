import { useLocation, useNavigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
    const location = useLocation();
    const navigate = useNavigate();

    // 1. Verifica si viene de /login y trae los datos necesarios
    if (location.state?.from !== '/login' || !location.state?.token_2fa) {
        // 2. Redirige limpiando el historial (evita volver atrás)
        navigate('/login', { replace: true });
        return null; // No renderiza nada mientras redirige
    }

    // 3. SI pasa la validación, muestra el contenido
    return children;
}