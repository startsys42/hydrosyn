import '../styles/theme.css';
import { useNavigate } from 'react-router-dom';
import useTexts from '../utils/UseTexts';


export default function Users() {
    const navigate = useNavigate();
    const t = useTexts();

    return (
        <div>
            <h2>{t.users}</h2>

            <button onClick={() => navigate('/create-user')}>
                Cambiar contraseña
            </button>

            <button onClick={() => navigate('/activate-user')} style={{ marginLeft: 10 }}>
                Activar usuario
            </button>
        </div>
    );
}