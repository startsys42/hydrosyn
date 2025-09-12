import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import useTexts from '../utils/UseTexts';
import '../styles/theme.css';
import { useAdminStatus } from '../utils/AdminContext';


export default function Dashboard() {
    const t = useTexts();
    const navigate = useNavigate(); // 🔹 Definimos navigate

    const [userEmail, setUserEmail] = useState('');
    const [systems, setSystems] = useState([]);
    const [loading, setLoading] = useState(true); // 🔹 Estado global de carga

    const { isAdmin, loading: loadingAdmin } = useAdminStatus();

    useEffect(() => {
        const fetchUserAndSystems = async () => {
            try {
                // 🔹 Obtener usuario
                const { data: { user }, error } = await supabase.auth.getUser();
                if (!user) {
                    console.error('No se pudo obtener el usuario', error);
                    return;
                }

                setUserEmail(user.email);

                // 🔹 Obtener sistemas según rol
                let systemsData;
                if (isAdmin) {
                    const { data, error } = await supabase.from('systems').select('*');
                    if (error) throw error;
                    systemsData = data;
                } else {
                    const { data, error } = await supabase
                        .from('user_systems')
                        .select('systems(*)')
                        .eq('user_id', user.id);
                    if (error) throw error;

                    systemsData = data.map(row => row.systems);
                }

                setSystems(systemsData);
            } catch (err) {
                console.error('Error obteniendo sistemas', err);
            } finally {
                setLoading(false); // 🔹 Terminamos de cargar todo
            }
        };

        if (!loadingAdmin) fetchUserAndSystems();
    }, [isAdmin, loadingAdmin]);

    return (
        <div className='div-main-login'>
            {loading ? (
                <p></p>
            ) : (
                <>

                    <h1>{t.welcome}</h1>
                    <h2>{t.systems}</h2>
                    {isAdmin && (<button className='button-full' onClick={() => navigate('/new-system')}>
                        {t.createUser}
                    </button>
                    )}
                </>
            )}
        </div>
    );
}