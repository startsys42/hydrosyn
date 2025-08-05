import { Outlet } from 'react-router-dom';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';
import { useAdminStatus } from '../utils/AdminContext';

export default function PrivateLayout() {
    const { loading } = useAdminStatus();

    if (loading) {
        // Puedes poner un loader si quieres
        return null; // o <div>Loading...</div>
    }

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