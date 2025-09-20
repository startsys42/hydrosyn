import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import useTexts from '../utils/UseTexts';
import '../styles/theme.css';
import { useAdminStatus } from '../utils/AdminContext';
import { useOwnerStatus } from '../utils/OwnerContext';
import { useNavigate } from 'react-router-dom';
import { TextField, CircularProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import Checkbox from '@mui/material/Checkbox';


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

    const fetchSystems = async () => {
        setLoading(true);
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session || !session.user) throw new Error('Usuario no autenticado');

            const userId = session.user.id;

            // Sistemas donde es owner/admin
            const { data: ownerData, error: ownerErr } = await supabase
                .from('systems')
                .select('id, name, created_at')
                .eq('admin', userId);
            if (ownerErr) throw ownerErr;

            const ownerSystems = (ownerData || []).map(s => ({
                id: s.id,
                name: s.name,
                created_at: new Date(s.created_at).toLocaleDateString(),
                owner: true
            }));

            // Sistemas donde es miembro
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
            console.log(ownerData, memberData);
            setRows([...ownerSystems, ...memberSystems]);
            setRowCount(ownerSystems.length + memberSystems.length);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!loadingAdmin && !loadingOwner) {
            fetchSystems();
        }
    }, [loadingAdmin, loadingOwner]);

    const columns = [
        // { field: 'id', headerName: 'ID', hide: true },
        { field: 'name', headerName: 'Nombre', flex: 1, headerClassName: 'data-grid-header' },
        { field: 'created_at', headerName: 'Fecha creación', width: 180, headerClassName: 'data-grid-header' },
        {
            field: 'owner',
            headerName: 'Es Owner',
            width: 120,
            headerClassName: 'data-grid-header',
            renderCell: (params) => (
                <Checkbox
                    checked={params.value}
                    disabled
                    icon={<CheckBoxOutlineBlank />}
                    checkedIcon={<CheckBox />}
                    sx={{
                        color: 'var(--color-primary)',
                        '&.Mui-checked': {
                            color: 'var(--color-primary)',
                        },
                    }}
                />
            )
        },
        {
            field: 'action',
            headerName: 'Acción',
            width: 150,
            headerClassName: 'data-grid-header',
            sortable: false,
            renderCell: (params) => (
                <button
                    style={{
                        padding: '4px 8px',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                    onClick={() => navigate(`/system/${params.row.id}`)}
                >
                    Ir al sistema
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
                    <h2>{t.systems}</h2>
                    {(isAdmin || isOwner) && (
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

                    <div style={{ height: 500, width: '100%' }}>
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            pagination
                            page={page}
                            pageSize={pageSize}
                            rowCount={rowCount}
                            paginationMode="client" // CAMBIADO de "server" a "client"
                            onPageChange={(newPage) => setPage(newPage)}
                            onPageSizeChange={(newSize) => { setPageSize(newSize); setPage(0); }}
                            sortingMode="client" // CAMBIADO de "server" a "client"
                            sortModel={sortModel}
                            onSortModelChange={setSortModel}
                            disableSelectionOnClick
                            sx={{
                                fontFamily: 'inherit',
                                '& .MuiDataGrid-columnHeaders': {
                                    backgroundColor: 'var(--color-primary)',
                                    color: 'white',
                                },
                                '& .MuiDataGrid-row:hover': {
                                    backgroundColor: 'var(--color-hover)',
                                },
                            }}
                        />
                    </div>
                </>
            )}
        </div>
    );
}