import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const navigate = useNavigate();

    return (
        <div>
            <h2>Perfil de Usuario</h2>

            <button onClick={() => navigate('/change-password')}>
                Cambiar contraseña
            </button>

            <button onClick={() => navigate('/change-email')} style={{ marginLeft: 10 }}>
                Cambiar email
            </button>
        </div>
    );
}