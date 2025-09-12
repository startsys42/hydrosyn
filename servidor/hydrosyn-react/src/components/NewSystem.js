import { useNavigate } from 'react-router-dom';
import useTexts from '../utils/UseTexts';
import '../styles/theme.css';

export default function NewSystem() {
    const navigate = useNavigate();
    const texts = useTexts();

    return (
        <div className='div-main-login'>
            <h1>{texts.profile}</h1>

            <button className='button-full' onClick={() => navigate('/change-password')}>
                {texts.changePassword}
            </button>

            <button className='button-full' onClick={() => navigate('/change-email')} >
                {texts.changeEmail}
            </button>
        </div>
    );
}