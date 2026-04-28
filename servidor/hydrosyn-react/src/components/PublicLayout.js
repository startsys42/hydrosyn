import { Outlet } from 'react-router-dom';
import Topbar from '../components/Topbar';
//import '../styles/themeo.css';

export default function PublicLayout() {
    return (
        <div >
            <Topbar />
            <main >
                <Outlet />
            </main>
        </div>
    );
}