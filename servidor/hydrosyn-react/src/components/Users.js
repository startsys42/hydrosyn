import '../styles/theme.css';
import { useNavigate } from 'react-router-dom';
import useTexts from '../utils/UseTexts';


export default function Users() {
    const navigate = useNavigate();
    const t = useTexts();

    return (
        <div className='div-main-login'>
            <h1>{t.users}</h1>

            <button className='button-full' onClick={() => navigate('/create-user')}>
                {t.createUser}
            </button>

            <button className='button-full' onClick={() => navigate('/activate-user')} >
                {t.activateUser}
            </button>
            <button className='button-full' onClick={() => navigate('/delete-user')} >
                {t.deleteUser}
            </button>
        </div>
    );
}