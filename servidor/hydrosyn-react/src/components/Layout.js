import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

export default function Layout() {
    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <main style={{ flexGrow: 1, padding: 20 }}>
                <Outlet />
            </main>
        </div>
    );
}
