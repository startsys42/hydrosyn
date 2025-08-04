import { useNavigate } from 'react-router-dom';
import useTexts from '../utils/UseTexts';
import '../styles/theme.css';

export default function Profile() {
    const navigate = useNavigate();
    const texts = useTexts();

    return (
        <div>
            <h2>{texts.profile}</h2>

            <button onClick={() => navigate('/change-password')}>
                {texts.changePassword}
            </button>

            <button onClick={() => navigate('/change-email')} style={{ marginLeft: 10 }}>
                {texts.changeEmail}
            </button>
        </div>
    );
}