import { Outlet } from 'react-router-dom';
import Topbar from '../components/Topbar';
import '../styles/theme.css';

export default function PublicLayout() {
    return (
        <div className="public-layout">
            <Topbar />
            <main className="public-main">
                <div className="public-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}