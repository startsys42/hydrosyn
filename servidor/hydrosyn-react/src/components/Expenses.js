import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Button, TextField, MenuItem, Autocomplete, Box, CircularProgress } from '@mui/material';
import { supabase } from '../utils/supabaseClient';
import useTexts from '../utils/UseTexts';

export default function Expenses() {
    const t = useTexts();

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [systems, setSystems] = useState([]);
    const [tanks, setTanks] = useState([]);
    const [tags, setTags] = useState([]);

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
        { field: 'concept', headerName: t?.concept, flex: 1 },
        { field: 'date', headerName: t?.date, flex: 1 },
        { field: 'amount', headerName: t?.amount, flex: 1 },
        { field: 'extra_amount', headerName: t?.extraAmount, flex: 1 },
        { field: 'extra_units', headerName: t?.extraUnits, flex: 1 },
        { field: 'system', headerName: t?.system, flex: 1, valueGetter: (params) => params.row.system?.name || '' },
        { field: 'tank', headerName: t?.tank, flex: 1, valueGetter: (params) => params.row.tank?.name || '' },
        { field: 'tags', headerName: t?.tags, flex: 1, valueGetter: (params) => params.row.tags?.map(t => t.name).join(', ') },
        {
            field: 'actions',
            headerName: t?.actions,
            flex: 1,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" size="small" onClick={() => handleEdit(params.row)}>Modificar</Button>
                    <Button variant="outlined" size="small" color="error" onClick={() => handleDelete(params.row.id)}>Borrar</Button>
                </Box>
            )
        }
    ];

    return (
        <div className="div-main-login">
            <h1>{t?.expenses}</h1>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField label={t?.concept} value={form.concept} onChange={(e) => setForm({ ...form, concept: e.target.value })} />
                <TextField label={t?.date} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} InputLabelProps={{ shrink: true }} />
                <TextField label={t?.amount} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                <TextField label={t?.extraAmount} type="number" value={form.extraAmount} onChange={(e) => setForm({ ...form, extraAmount: e.target.value })} />
                <TextField label={t?.extraUnits} type="number" value={form.extraUnits} onChange={(e) => setForm({ ...form, extraUnits: e.target.value })} />
                <TextField select label={t?.system} value={form.system?.id || ''} onChange={(e) => setForm({ ...form, system: systems.find(s => s.id === e.target.value) })}>
                    {systems.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </TextField>
                <TextField select label={t?.tank} value={form.tank?.id || ''} onChange={(e) => setForm({ ...form, tank: tanks.find(t => t.id === e.target.value) })}>
                    {tanks.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                </TextField>
                <Autocomplete
                    multiple
                    options={tags}
                    getOptionLabel={(option) => option.name}
                    value={form.tags}
                    onChange={(_, value) => setForm({ ...form, tags: value })}
                    renderInput={(params) => <TextField {...params} label={t?.tags} />}
                />
                <Button variant="contained" onClick={handleAdd}>{t?.add}</Button>
            </Box>

            {loading ? <CircularProgress /> : (
                <div style={{ height: 500, width: '100%' }}>
                    <DataGrid rows={rows} columns={columns} pageSize={10} rowsPerPageOptions={[10, 20]} />
                </div>
            )}
        </div>
    );
}
