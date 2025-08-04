import { Outlet } from 'react-router-dom';
import Topbar from '../components/Topbar';

export default function PublicLayout() {
    return (
        <div className="layout">
            <Topbar />
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}