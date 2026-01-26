import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Button, TextField, MenuItem, Autocomplete, Box, CircularProgress } from '@mui/material';
import { supabase } from '../utils/supabaseClient';
import useTexts from '../utils/UseTexts';
import '../styles/theme.css';
import { useNavigate } from 'react-router-dom';

export default function Expenses() {
    const t = useTexts();



    const [systems, setSystems] = useState([]);
    const [tanks, setTanks] = useState([]);
    const [tags, setTags] = useState([]);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [rowCount, setRowCount] = useState(0);
    const navigate = useNavigate();

    // Campos del formulario de añadir/modificar
    const [form, setForm] = useState({
        concept: '',
        date: '',
        amount: '',
        extraAmount: '',
        extraUnits: '',
        system: null,
        tank: null,
        tags: []
    });

    // Fetch inicial de datos
    useEffect(() => {
        fetchData();
        fetchOptions();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('expenses')
                .select('*, system(name), tank(name), tags(name)');
            if (error) throw error;
            setRows(data.map((d, i) => ({ id: d.id, ...d })));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchOptions = async () => {
        // sistemas
        const { data: systemData } = await supabase.from('systems').select('id, name');
        setSystems(systemData || []);

        const { data: tankData } = await supabase.from('tanks').select('id, name');
        setTanks(tankData || []);

        const { data: tagData } = await supabase.from('tags').select('id, name');
        setTags(tagData || []);
    };

    const handleAdd = async () => {
        try {
            const { data, error } = await supabase
                .from('expenses')
                .insert([{
                    concept: form.concept,
                    date: form.date,
                    amount: parseFloat(form.amount),
                    extra_amount: parseFloat(form.extraAmount),
                    extra_units: parseFloat(form.extraUnits),
                    system_id: form.system?.id,
                    tank_id: form.tank?.id,
                    tags: form.tags.map(tag => tag.id)
                }]);
            if (error) throw error;
            fetchData(); // refrescar tabla
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Seguro que quieres borrar este registro?')) return;
        try {
            const { error } = await supabase.from('expenses').delete().eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (row) => {
        setForm({
            concept: row.concept,
            date: row.date,
            amount: row.amount,
            extraAmount: row.extra_amount,
            extraUnits: row.extra_units,
            system: systems.find(s => s.id === row.system_id),
            tank: tanks.find(t => t.id === row.tank_id),
            tags: row.tags || []
        });
    };

    const columns = [
        { field: 'concept', headerName: t?.concept, flex: 1, headerClassName: 'data-grid-header' },
        { field: 'date', headerName: t?.date, flex: 1, headerClassName: 'data-grid-header' },
        { field: 'amount', headerName: t?.amount, flex: 1, headerClassName: 'data-grid-header' },
        { field: 'extra_amount', headerName: t?.extraAmount, flex: 1, headerClassName: 'data-grid-header' },
        { field: 'extra_units', headerName: t?.extraUnits, flex: 1, headerClassName: 'data-grid-header' },
        { field: 'system', headerName: t?.systems, flex: 1, valueGetter: (params) => params.row.system?.name || '', headerClassName: 'data-grid-header' },
        { field: 'tank', headerName: t?.tanks, flex: 1, valueGetter: (params) => params.row.tank?.name || '', headerClassName: 'data-grid-header' },
        { field: 'tags', headerName: t?.tags, flex: 1, valueGetter: (params) => params.row.tags?.map(t => t.name).join(', '), headerClassName: 'data-grid-header' },
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
                    {t.delete}
                </button>
                 <button style={{ padding: '4px 16px' }} onClick={() => navigate(`/system/${params.row.id}`)}>
                    {t.update}
                </button>
            ),
        }
    ];

    return (
        <div className="div-main-login">

            {loading ? (
                <p><CircularProgress /></p>
            ) : (
                <>
                    <h1>{t?.expenses}</h1>

                    <button
                        className='button-right'
                        onClick={() => navigate('/add-expenses')}
                    >
                        {t.addExpenses}
                    </button>
                    <div style={{ clear: 'both', marginBottom: '10px' }}></div>
                    <div style={{ height: 500, width: '100%', minWidth: '1000px', overflowX: 'auto' }}>
                        <DataGrid className='datagrid'
                            rows={rows}
                            columns={columns}
                            pagination
                            //page={page}
                            pageSize={pageSize}

                            // rowCount={rowCount}
                            // paginationMode="client" // CAMBIADO de "server" a "client"
                            // onPageChange={(newPage) => setPage(newPage)}
                            onPageSizeChange={(newSize) => { setPageSize(newSize); setPage(0); }}
                            sortingMode="client" // CAMBIADO de "server" a "client"
                            //sortModel={sortModel}
                            //onSortModelChange={setSortModel}
                            disableSelectionOnClick

                        />

                    </div>
                </>
            )}
        </div>
    );
}