import { useNavigate } from 'react-router-dom';
import useTexts from '../../utils/UseTexts';
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import RenameSystem from '../SettingsComponents/RenameSystem';
import ChangeSecret from '../SettingsComponents/ChangeSecret';
import DeleteSystem from '../SettingsComponents/DeleteSystem';

export default function SettingsAccordion({ systemId }) {
    const navigate = useNavigate();
    const texts = useTexts();

    const [systemName, setSystemName] = useState('');
    const [secret, setSecret] = useState('');

    // Errores separados por Accordion
    const [errors, setErrors] = useState({
        rename: '',
        secret: '',
        delete: ''
    });

    const fetchSystem = async () => {
        try {
            const { data: systemData, error: systemError } = await supabase
                .from('systems')
                .select('name')
                .eq('id', systemId)
                .single();
            if (systemError) throw systemError;
            setSystemName(systemData.name);

            const { data: secretData, error: secretError } = await supabase
                .from('system_secrets')
                .select('code')
                .eq('system', systemId)
                .single();
            if (secretError) throw secretError;
            setSecret(secretData.code);

        } catch (err) {
            console.error(err);
            setErrors(prev => ({ ...prev, rename: 'Error loading system data', secret: 'Error loading system data' }));
        }
    };

    useEffect(() => {
        fetchSystem();
    }, [systemId]);

    // Funciones para actualizar errores de cada Accordion y limpiar los demás
    const setRenameError = (message) => setErrors({ rename: message, secret: '', delete: '' });
    const setSecretError = (message) => setErrors({ rename: '', secret: message, delete: '' });
    const setDeleteError = (message) => setErrors({ rename: '', secret: '', delete: message });

    return (
        <>
            <h2>{texts.systemSettings}</h2>

            <RenameSystem
                systemId={systemId}
                systemName={systemName}
                refresh={fetchSystem}
                error={errors.rename}
                setError={setRenameError}
            />

            <ChangeSecret
                systemId={systemId}
                secret={secret}
                refresh={fetchSystem}
                error={errors.secret}
                setError={setSecretError}
            />

            <DeleteSystem
                systemId={systemId}
                refresh={() => navigate('/dashboard')}
                error={errors.delete}
                setError={setDeleteError}
            />
        </>
    );
}