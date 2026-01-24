import { useNavigate } from 'react-router-dom';
import useTexts from '../../utils/UseTexts';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import '../../styles/theme.css';
import { DataGrid } from '@mui/x-data-grid';
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';

export default function NotificationsAccordion({ systemId }) {

    const texts = useTexts();


    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(0);


    useEffect(() => {
        const fetchLoginAttempts = async () => {
            try {
                setLoading(true);

                const { data: { session } } = await supabase.auth.getSession();
                if (!session || !session.user) throw new Error('User not authenticated');
                const userId = session.user.id;


                const { data, error } = await supabase.rpc(
                    'get_login_attempts_with_user_email',
                    {
                        p_user_id: userId,
                        p_system_id: systemId
                    }
                );
                if (error) {
                    throw error;
                }

                setAttempts(data || []);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLoginAttempts();
    }, [systemId]);

    const translateReason = (reason) => {

        let translationKey;

        if (reason === 'Login attempt with a deactivated user') {
            translationKey = 'loginDisabled';
        } else if (reason === 'Password recovery attempt for an inactive user') {
            translationKey = 'recoveryDisabled';
        } else if (reason === 'Invalid password') {
            translationKey = 'invalidPassword';

        } else {
            return reason;
        }


        return texts[translationKey];
    };

    const columns = [
        { field: 'user_email', headerName: 'Email', flex: 1, minWidth: 220 },
        {
            field: 'reason', headerName: texts.reason, flex: 1, minWidth: 220, renderCell: (params) => {
                return translateReason(params.value);
            }
        },
        {
            field: 'attempt_created_at',
            headerName: texts.dateTime,
            minWidth: 150,
            flex: 1,
            renderCell: (params) => {
                if (!params.value) {
                    return '--';
                }
                try {
                    const date = new Date(params.value);
                    console.log('JS Date object:', date);
                    console.log('ISO String:', date.toISOString());
                    console.log('UTC Hours:', date.getUTCHours(), 'UTC Minutes:', date.getUTCMinutes());
                    if (isNaN(date.getTime())) {
                        return 'Date invalid';
                    }
                    return date.toLocaleString(undefined, {
                        timeZone: 'UTC',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });
                } catch (error) {

                    return 'Error date';
                }
            }
        },
    ];

    return (
        <>
            <h2>{texts.notifications}</h2>


            {/* <div style={{ height: 500, width: '100%' }}> */}
            <DataGrid className="datagrid"
                rows={attempts.map((a, index) => ({ id: index, ...a }))}
                columns={columns}
                loading={loading}
                pagination
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                sortingMode="client"


                disableSelectionOnClick
            />
            {/*   </div>*/}

            {error && <p style={{ color: 'red' }}>{error}</p>}

        </>

    );
}