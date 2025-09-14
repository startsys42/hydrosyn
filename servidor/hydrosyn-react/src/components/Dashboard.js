import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import useTexts from '../utils/UseTexts';
import '../styles/theme.css';
import { useAdminStatus } from '../utils/AdminContext';
import { useNavigate } from 'react-router-dom';
import { TextField, CircularProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';


export default function Dashboard() {
    const t = useTexts();
    const navigate = useNavigate();

    const { isAdmin, loading: loadingAdmin } = useAdminStatus();
    const [userEmail, setUserEmail] = useState('');
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [rowCount, setRowCount] = useState(0);
    const [sortModel, setSortModel] = useState([]);
    const [filters, setFilters] = useState({
        name: '',
        email: '',
        dateFrom: '',  // fecha inicio del rango
        dateTo: ''     // fecha fin del rango
    });

    const fetchSystems = async () => {
        setLoading(true);
        try {
            // Obtener usuario
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (!user) throw userError;
            setUserEmail(user.email);

            let query;

            if (isAdmin) {
                query = supabase
                    .from('systems')
                    .select(`
            id,
            name,
            created_at,
            systems_users (
              user_id,
              users: user_id (
                email
              )
            )
          `, { count: 'exact' });
            } else {
                query = supabase
                    .from('user_systems')
                    .select(`
            systems(
              id,
              name,
              created_at,
              systems_users:user_systems!inner(
                user_id,
                users:user_id(
                  email
                )
              )
            )
          `, { count: 'exact' })
                    .eq('user_id', user.id);
            }

            // FILTROS
            if (filters.name) query = query.ilike('name', `%${filters.name}%`);
            if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
            if (filters.dateTo) query = query.lte('created_at', filters.dateTo);
            if (!isAdmin && filters.email) {
                query = query.ilike('systems_users.users.email', `%${filters.email}%`);
            }

            // ORDEN
            if (sortModel.length > 0) {
                query = query.order(sortModel[0].field, { ascending: sortModel[0].sort === 'asc' });
            }

            // PAGINACIÓN
            const from = page * pageSize;
            const to = from + pageSize - 1;
            query = query.range(from, to);

            const { data, count, error } = await query;
            if (error) throw error;

            let systemsData = isAdmin ? data : data.map(row => row.systems);

            const preparedRows = systemsData.map(sys => ({
                id: sys.id,
                name: sys.name,
                created_at: new Date(sys.created_at).toLocaleDateString(),
                emails: sys.systems_users && sys.systems_users.length > 0
                    ? sys.systems_users.map(su => su.users?.email).join(', ')
                    : '—', // o '' si quieres dejar vacío
            }));
            if (filters.email && isAdmin) {
                preparedRows = preparedRows.filter(row =>
                    row.emails.toLowerCase().includes(filters.email.toLowerCase())
                );
            }
            setRows(preparedRows);
            setRowCount(count || 0);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!loadingAdmin) fetchSystems();
    }, [loadingAdmin, page, pageSize, sortModel, filters]);

    const columns = [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'name', headerName: 'Nombre', flex: 1 },
        { field: 'created_at', headerName: 'Fecha creación', width: 180 },
        { field: 'emails', headerName: 'Usuarios (emails)', flex: 1 },
    ];

    return (
        <div className='div-main-login'>
            {loading ? (
                <p><CircularProgress /></p>
            ) : (
                <>

                    <h1>{t.welcome}</h1>
                    <h2>{t.systems}</h2>
                    {isAdmin && (
                        <>
                            <button className='button-right' onClick={() => navigate('/new-system')}>
                                {t.newSystem}
                            </button>
                            <div style={{ clear: 'both' }}></div> {/* ✅ Aquí el estilo es un objeto */}
                        </>
                    )}
                    <div className='filter-container'>
                        <TextField
                            label="Nombre"
                            value={filters.name}
                            onChange={e => setFilters({ ...filters, name: e.target.value })}
                        />
                        <TextField
                            label="Email"
                            value={filters.email}
                            onChange={e => setFilters({ ...filters, email: e.target.value })}
                        />
                        <TextField
                            label="Fecha desde"
                            type="date"
                            value={filters.dateFrom}
                            onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
                        />
                        <TextField
                            label="Fecha hasta"
                            type="date"
                            value={filters.dateTo}
                            onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
                        />
                    </div>
                    <div style={{ height: 500, width: '100%' }}>
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            pagination
                            page={page}
                            pageSize={pageSize}
                            rowCount={rowCount}
                            paginationMode="server"
                            onPageChange={(newPage) => setPage(newPage)}
                            onPageSizeChange={(newSize) => { setPageSize(newSize); setPage(0); }}
                            sortingMode="server"
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

            

            
              
            )}
        </div>
    );
}