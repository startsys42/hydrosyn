import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import useTexts from '../utils/UseTexts';
import '../styles/theme.css';
import { useAdminStatus } from '../utils/AdminContext';
import { useOwnerStatus } from '../utils/OwnerContext';
import { useNavigate } from 'react-router-dom';
import { TextField, CircularProgress } from '@mui/material';

import { CheckBox, CheckBoxOutlineBlank, Padding } from '@mui/icons-material';
import Checkbox from '@mui/material/Checkbox';

import { DataGrid } from '@mui/x-data-grid';



export default function Dashboard() {
    const t = useTexts();
    const navigate = useNavigate();

    const { isAdmin, loading: loadingAdmin } = useAdminStatus();
    const { isOwner, loading: loadingOwner } = useOwnerStatus();
    const [userEmail, setUserEmail] = useState('');
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [rowCount, setRowCount] = useState(0);
    const [sortModel, setSortModel] = useState([]);
    const [isMember, setIsMember] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState('');
    const [exportSuccess, setExportSuccess] = useState('');


    const fetchSystems = async () => {
        setLoading(true);
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session || !session.user) throw new Error('User not authenticated');

            const userId = session.user.id;


            const { data: ownerData, error: ownerErr } = await supabase
                .from('systems')
                .select(`
    id,
    name,
    created_at,
    admin_users!inner (
      user,
      is_active
    )
  `)
                .eq('admin', userId)
                .eq('admin_users.is_active', true);


            if (ownerErr) throw ownerErr;

            const ownerSystems = (ownerData || []).map(s => ({
                id: s.id,
                name: s.name,
                created_at: new Date(s.created_at).toLocaleDateString(),
                owner: true
            }));


            const { data: memberData, error: memberErr } = await supabase
                .from('systems_users')
                .select('system(id, name, created_at)')
                .eq('user_id', userId)
                .eq('is_active', true);
            if (memberErr) throw memberErr;

            const memberSystems = (memberData || [])
                .filter(s => s.system && !ownerSystems.some(os => os.id === s.system.id))
                .map(s => ({
                    id: s.system.id,
                    name: s.system.name,
                    created_at: new Date(s.system.created_at).toLocaleDateString(),
                    owner: false
                }));
            setIsMember(memberSystems.length > 0);

            setRows([...ownerSystems, ...memberSystems]);
            setRowCount(ownerSystems.length + memberSystems.length);

        } catch (err) {

        } finally {
            setLoading(false);
        }
    };
    const exportData = async () => {
        setExportError('');
        setExportSuccess('');
        setExporting(true);

        try {
            const { data, error } = await supabase.functions.invoke('exportData', { method: 'POST' });


            if (error) {
                setExportError("errorExporting" || error.message);
            } else {
                setExportSuccess("exportSuccess");
            }

        } catch (err) {

            setExportError("Error" || err.message);
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => {
        if (!loadingAdmin && !loadingOwner) {
            fetchSystems();
        }
    }, [loadingAdmin, loadingOwner]);

    const columns = [

        { field: 'name', headerName: t.system, flex: 1, minWidth: 200, headerClassName: 'data-grid-header' },
        { field: 'created_at', headerName: t.date, flex: 1, minWidth: 120, headerClassName: 'data-grid-header' },
        {
            field: 'owner',
            headerName: t.owner,
            flex: 1, minWidth: 100,
            filterable: false,
            headerClassName: 'data-grid-header',
            renderCell: (params) => (
                <Checkbox
                    checked={params.value}
                    disabled
                    icon={<CheckBoxOutlineBlank />}
                    checkedIcon={<CheckBox />}


                />
            )
        },
        {
            field: 'action',
            headerName: () => null,
            flex: 1, minWidth: 150,
            filterable: false,
            headerClassName: 'data-grid-header',
            sortable: false,
            disableColumnMenu: true,
            renderCell: (params) => (
                <button style={{ padding: '4px 16px' }} onClick={() => navigate(`/system/${params.row.id}`)}>
                    {t.enter}
                </button>
            ),
        },
    ];

    return (
        <div className='div-main-login'>
            {loading ? (
                <p><CircularProgress /></p>
            ) : (
                <>

                    <h1>{t.welcome}</h1>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                        {isOwner && (
                            <button onClick={exportData}>{t.export}</button>
                        )}


                    </div>
                    <div>
                        {exportError && <p style={{ color: 'red', margin: 0 }}>{t[exportError]}</p>}
                        {exportSuccess && <p style={{ color: 'green', margin: 0 }}>{t[exportSuccess]}</p>}

                    </div>
                    <h2>{t.systems}</h2>
                    {(isOwner) && (
                        <>
                            <button
                                className='button-right'
                                onClick={() => navigate('/create-system')}
                            >
                                {t.newSystem}
                            </button>
                            <div style={{ clear: 'both', marginBottom: '10px' }}></div>
                        </>
                    )}

                    <div style={{ height: 500, width: 'auto' }}>
                        <DataGrid className='datagrid'
                            rows={rows}
                            columns={columns}
                            pagination

                            pageSize={pageSize}


                            onPageSizeChange={(newSize) => { setPageSize(newSize); setPage(0); }}
                            sortingMode="client"

                            disableSelectionOnClick

                        />
                    </div>
                </>
            )}
        </div>
    );
}