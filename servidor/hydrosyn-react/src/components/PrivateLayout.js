import { Outlet } from 'react-router-dom';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';

export default function PrivateLayout() {
    return (
        <div className="layout">
            <Topbar />
            <div className="content-wrapper">
                <Sidebar />
                <main className="main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}