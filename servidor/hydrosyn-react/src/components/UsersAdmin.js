import '../styles/theme.css';
import { useNavigate } from 'react-router-dom';
import useTexts from '../utils/UseTexts';


export default function UsersAdmin() {
    const navigate = useNavigate();
    const t = useTexts();

    return (
        <div className='div-main-login'>
            <h1>{t.users}</h1>

            <button className='button-full' onClick={() => navigate('/create-user-admin')}>
                {t.createUser}
            </button>

            <button className='button-full' onClick={() => navigate('/activate-delete-user-admin')} >
                {t.activateDeleteUser}
            </button>

        </div>
    );
}