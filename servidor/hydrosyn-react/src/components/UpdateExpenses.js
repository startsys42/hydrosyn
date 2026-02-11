import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import useTexts from '../utils/UseTexts';
import { TextField, Button, Autocomplete, Box, CircularProgress } from '@mui/material';
import dayjs from 'dayjs';
import '../styles/theme.css';

export default function UpdateExpense() {
    const t = useTexts();
    const { expenseId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [systems, setSystems] = useState([]);
    const [tanks, setTanks] = useState([]);
    const [tags, setTags] = useState([]);

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

    // Cargar opciones (sistemas, tanques, tags)
    useEffect(() => {
        const fetchOptions = async () => {
            const { data: systemsData } = await supabase.from('systems').select('id, name');
            setSystems(systemsData || []);

            const { data: tanksData } = await supabase.from('tanks').select('id, name');
            setTanks(tanksData || []);

            const { data: tagsData } = await supabase.from('tags').s
