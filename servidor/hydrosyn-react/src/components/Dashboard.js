import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import useTexts from '../utils/UseTexts';
import '../styles/theme.css';
import { useAdminStatus } from '../utils/AdminContext';
import { useOwnerStatus } from '../utils/OwnerContext';
import { useNavigate } from 'react-router-dom';
import { TextField, CircularProgress } from '@mui/material';
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


    const fetchSystems = async () => {
        setLoading(true);
        try {
            // Obtener usuario
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (!user) throw userError;
            setUserEmail(user.email);

            // Obtener sistemas donde el usuario es admin/owner
            const { data: adminSystems, error: adminError } = await supabase
                .from('admin_users')
                .select('system(id, name, created_at, systems_users:user_systems!inner(user_id, users:user_id(email)))')
                .eq('user', user.id)
                .eq('is_active', true);

            if (adminError) throw adminError;

            // Obtener sistemas donde el usuario es miembro (pero no owner)
            const { data: userSystems, error: userErrorSys } = await supabase
                .from('systems_users')
                .select('system(id, name, created_at)')
                .eq('user_id', user.id)
                .eq('is_active', true);

            if (userErrorSys) throw userErrorSys;

            // Preparar sistemas donde es owner
            const ownerSystems = adminSystems.map(s => ({
                id: s.system.id,
                name: s.system.name,
                created_at: new Date(s.system.created_at).toLocaleDateString(),
                owner: true,
                // Lista de emails asociados a ese sistema
                emails: s.system.systems_users.map(u => u.users.email).join(', ')
            }));

            // Sistemas donde eres solo usuario (no owner)
            const userOnlySystems = userSystems
                .filter(s => !ownerSystems.some(os => os.id === s.system.id))
                .map(s => ({
                    id: s.system.id,
                    name: s.system.name,
                    created_at: new Date(s.system.created_at).toLocaleDateString(),
                    owner: false,
                    emails: '' // vacío porque no eres owner
                }));

            // Combinar ambos tipos de sistemas
            const combinedSystems = [...ownerSystems, ...userOnlySystems];

            // Aplicar filtros localmente (ya que no estamos usando query de servidor)



            // ESTO SE ELIMINÓ: La lógica de query de servidor que estaba mezclada
            // y no era compatible con el enfoque de fetch de adminSystems/userSystems

            setRows(combinedSystems); // ✅ pasa directo
            setRowCount(combinedSystems.length);

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
    }, [loadingAdmin, loadingOwner, page, pageSize, sortModel]); // Añadido loadingOwner como dependencia

    const columns = [
        { field: 'id', headerName: 'ID', hide: true }, // 👈 ocultar el ID
        { field: 'name', headerName: 'Nombre', flex: 1 },
        { field: 'created_at', headerName: 'Fecha creación', width: 180 },
        { field: 'emails', headerName: 'Usuarios (emails)', flex: 1 },
        {
            field: 'action',
            headerName: 'Acción',
            width: 150,
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
                    onClick={() => navigate(`/system/${params.row.id}`)} // 👈 usa el ID oculto para navegar
                >
                    Ir al sistema
                </button>
            ),
        },
    ];

    // Verificar si el usuario tiene sistemas como owner para habilitar filtro de email
    const hasOwnedSystems = rows.some(row => row.owner === true);
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