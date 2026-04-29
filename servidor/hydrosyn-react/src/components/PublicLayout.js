import { Outlet } from 'react-router-dom';
import Topbar from '../components/Topbar';


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