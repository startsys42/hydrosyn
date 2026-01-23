import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import useTexts from '../utils/UseTexts';
import { useNavigate } from 'react-router-dom';

export default function EmailConfirmation() {
    const [mensajeKey, setMensajeKey] = useState('');
    const [loading, setLoading] = useState(true);
    const texts = useTexts();
    const navigate = useNavigate();

    useEffect(() => {
        let subscription = null;

        const checkAndConfirm = async () => {
            // 1. Verificamos sesión en silencio
            const { data: { user: currentUser }, error } = await supabase.auth.getUser();

            if (error || !currentUser) {
                // Si no hay usuario, redirigimos y no mostramos nada
                navigate('/');
                return;
            }

            // Si hay usuario, dejamos de cargar para mostrar el H1
            setLoading(false);

            // 2. Escuchamos el evento de cambio exitoso
            const { data } = supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'USER_UPDATED') {
                    setMensajeKey('emailChanged');
                }
            });

            subscription = data.subscription;
        };

        checkAndConfirm();

        return () => {
            if (subscription) subscription.unsubscribe();
        };
    }, [navigate]);

    // MIENTRAS DECIDE: No devuelve nada (pantalla limpia)
    if (loading) return null;

    return (
        <div className="div-main-login">
            {/* Solo se mostrará el H1 si el usuario es válido */}
            {mensajeKey && <h1>{texts[mensajeKey]}</h1>}
        </div>
    );
}