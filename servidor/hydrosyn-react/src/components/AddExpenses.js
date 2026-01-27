import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import useTexts from '../utils/UseTexts';
import { useNavigate } from 'react-router-dom';
import {
    TextField,
    Button,
    CircularProgress,
    Autocomplete,
    Box
} from '@mui/material';

export default function AddExpenses() {
    const t = useTexts();
    const navigate = useNavigate();

    const [systems, setSystems] = useState([]);
    const [tanks, setTanks] = useState([]);
    const [tags, setTags] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        concept: '',
        amount: '',
        extraAmount: '',
        extraUnits: '',
        systems: [],
        tanks: [],
        tags: []
    });

    // Fetch opciones (systems, tanks, tags)
    useEffect(() => {
        const fetchOptions = async () => {
            setLoading(true);
            try {
                const { data: systemData } = await supabase.from('systems').select('id, name');
                setSystems(systemData || []);

                const { data: tankData } = await supabase.from('tanks').select('id, name');
                setTanks(tankData || []);

                const { data: tagData } = await supabase.from('tags').select('name');
                setTags(tagData || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchOptions();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!form.concept || !form.amount) {
            alert('Concepto y cantidad son obligatorios');
            return;
        }

        setSaving(true);
        try {
            // 1️⃣ Insertar en tabla principal
            const { data: expenseData, error: expenseError } = await supabase
                .from('expenses')
                .insert([{
                    user: supabase.auth.user()?.id, // usuario actual
                    concepts: form.concept,
                    amount: parseFloat(form.amount),
                    extra_amount: form.extraAmount ? parseFloat(form.extraAmount) : null,
                    extra_units: form.extraUnits || null
                }])
                .select(); // Para obtener el id

            if (expenseError) throw expenseError;
            const expenseId = expenseData[0].id;

            // 2️⃣ Insertar sistemas relacionados
            if (form.systems.length > 0) {
                const systemsInsert = form.systems.map(s => ({
                    expense_id: expenseId,
                    system_id: s.id
                }));
                await supabase.from('expenses_systems').insert(systemsInsert);
            }

            // 3️⃣ Insertar tanques relacionados
            if (form.tanks.length > 0) {
                const tanksInsert = form.tanks.map(t => ({
                    expense_id: expenseId,
                    tank_id: t.id
                }));
                await supabase.from('expenses_tanks').insert(tanksInsert);
            }

            // 4️⃣ Insertar tags
            if (form.tags.length > 0) {
                const tagsInsert = form.tags.map(tag => ({
                    expense_id: expenseId,
                    tag: tag
                }));
                await supabase.from('expenses_tags').insert(tagsInsert);
            }

            alert('Gasto agregado correctamente!');
            navigate('/expenses'); // regresar al listado

        } catch (err) {
            console.error(err);
            alert('Error agregando gasto');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <CircularProgress />;

    return (
        <Box sx={{ maxWidth: 600, margin: 'auto', p: 2 }}>
            <h1>{t.addExpenses}</h1>

            <TextField
                label={t.concept}
                name="concept"
                value={form.concept}
                onChange={handleChange}
                fullWidth
                margin="normal"
            />

            <TextField
                label={t.amount}
                name="amount"
                type="number"
                value={form.amount}
                onChange={handleChange}
                fullWidth
                margin="normal"
            />

            <TextField
                label={t.extraAmount}
                name="extraAmount"
                type="number"
                value={form.extraAmount}
                onChange={handleChange}
                fullWidth
                margin="normal"
            />

            <TextField
                label={t.extraUnits}
                name="extraUnits"
                value={form.extraUnits}
                onChange={handleChange}
                fullWidth
                margin="normal"
            />

            <Autocomplete
                multiple
                options={systems}
                getOptionLabel={(option) => option.name}
                value={form.systems}
                onChange={(e, newValue) => setForm(prev => ({ ...prev, systems: newValue }))}
                renderInput={(params) => <TextField {...params} label={t.systems} margin="normal" />}
            />

            <Autocomplete
                multiple
                options={tanks}
                getOptionLabel={(option) => option.name}
                value={form.tanks}
                onChange={(e, newValue) => setForm(prev => ({ ...prev, tanks: newValue }))}
                renderInput={(params) => <TextField {...params} label={t.tanks} margin="normal" />}
            />

            <Autocomplete
                multiple
                freeSolo
                options={tags.map(t => t.name)}
                value={form.tags}
                onChange={(e, newValue) => setForm(prev => ({ ...prev, tags: newValue }))}
                renderInput={(params) => <TextField {...params} label={t.tags} margin="normal" />}
            />

            <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={saving}
                sx={{ mt: 2 }}
            >
                {saving ? 'Guardando...' : t.addExpenses}
            </Button>
        </Box>
    );
}
