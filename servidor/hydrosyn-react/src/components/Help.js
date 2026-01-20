import { useNavigate } from 'react-router-dom';
import useTexts from '../utils/UseTexts';
import '../styles/theme.css';

export default function Help() {
    const navigate = useNavigate();
    const texts = useTexts();

    return (
        <div className='div-main-login'>
            <h1>{texts.guide}</h1>
            <p>{texts.manualContent}</p>

        </div>
    );
}