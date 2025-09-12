// ver calendario diseño, añadir eliminar esp32, añadir eliminar bomba, luces, suuarios

import { useNavigate } from 'react-router-dom';
import useTexts from '../utils/UseTexts';
import '../styles/theme.css';

export default function Systems() {
    const navigate = useNavigate();
    const texts = useTexts();

    return (
        <div className='div-main-login'>
            <h1>{texts.systems}</h1>

            <button className='button-full' onClick={() => navigate('/design')}>
                {texts.changePassword}
            </button>

            <button className='button-full' onClick={() => navigate('/change-email')} >
                {texts.changeEmail}
            </button>
        </div>
    );
}