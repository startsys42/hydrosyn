

//crear bomba eliminar bomba asociar bomba pines nombre, calibrar programar dar datos




import { useNavigate } from 'react-router-dom';
import useTexts from '../../utils/UseTexts';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import '../../styles/theme.css';
import CreatePump from '../PumpComponents/CreatePump';
import UpdatePump from '../PumpComponents/UpdatePump';
import DeletePump from '../PumpComponents/DeletePump';

import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import { CompassCalibrationRounded } from '@mui/icons-material';
import { List } from '@mui/material';


import { useRoleSystem } from "../../utils/RoleSystemContext";
import CalibratePump from '../PumpComponents/CalibratePump';
import ListCalibration from '../PumpComponents/ListCalibration';
import ListRecordsPump from '../PumpComponents/ListRecordsPump';
import InsertPumping from '../PumpComponents/InsertPumping';
import ProgrammingPump from '../PumpComponents/ProgrammingPump';
import CalendarPump from '../PumpComponents/CalendarPump';
import ListCalibrate from '../PumpComponents/ListCalibrate';


export default function PumpsAccordion({ systemId }) {
    const navigate = useNavigate();
    const texts = useTexts();
    const { role } = useRoleSystem();

    const [pumpList, setPumpList] = useState([]);
    const [calibrateList, setCalibrateList] = useState([]);
    const [calibrationList, setCalibrationList] = useState([]);
    const [recordPumpList, setRecordPumpList] = useState([]);
    const [programmingList, setProgrammingList] = useState([]);
    const [loading, setLoading] = useState(false);

    const [errors, setErrors] = useState({
        create: "",
        update: "",
        delete: "",
        calibrate: "",
        calibration: "",
        record: "",
        program: "",
        calibrateList: "",
        calibrationList: "",
        recordList: ""
    });

    const setCreateError = (msg) => setErrors({ create: msg, update: "", delete: "", calibrate: "", calibration: "", record: "", program: "", calibrateList: "", calibrationList: "", recordList: "" });
    const setUpdateError = (msg) => setErrors({ create: "", update: msg, delete: "", calibrate: "", calibration: "", record: "", program: "", calibrateList: "", calibrationList: "", recordList: "" });
    const setDeleteError = (msg) => setErrors({ create: "", update: "", delete: msg, calibrate: "", calibration: "", record: "", program: "", calibrateList: "", calibrationList: "", recordList: "" });
    const setCalibrateError = (msg) => setErrors({ create: "", update: "", delete: "", calibrate: msg, calibration: "", record: "", program: "", calibrateList: "", calibrationList: "", recordList: "" });
    const setCalibrationError = (msg) => setErrors({ create: "", update: "", delete: "", calibrate: "", calibration: msg, record: "", program: "", calibrateList: "", calibrationList: "", recordList: "" });
    const setRecordError = (msg) => setErrors({ create: "", update: "", delete: "", calibrate: "", calibration: "", record: msg, program: "", calibrateList: "", calibrationList: "", recordList: "" });
    const setProgramError = (msg) => setErrors({ create: "", update: "", delete: "", calibrate: "", calibration: "", record: "", program: msg, calibrateList: "", calibrationList: "", recordList: "" });
    const setCalibrateListError = (msg) => setErrors({ create: "", update: "", delete: "", calibrate: "", calibration: "", record: "", program: "", calibrateList: msg, calibrationList: "", recordList: "" });
    const setCalibrationListError = (msg) => setErrors({ create: "", update: "", delete: "", calibrate: "", calibration: "", record: "", program: "", calibrateList: "", calibrationList: msg, recordList: "" });
    const setRecordListError = (msg) => setErrors({ create: "", update: "", delete: "", calibrate: "", calibration: "", record: "", program: "", calibrateList: "", calibrationList: "", recordList: msg, });


    const refreshCalibrations = async () => {
        await fetchCalibrateList();     // refresca la lista de Calibrate
        await fetchCalibrationList();   // refresca la lista de Calibration
    };
    const fetchPumps = async () => {
        setLoading(true);
        setErrors({ create: "", update: "", delete: "", calibrate: "", calibration: "", record: "", program: "", calibrateList: "", calibrationList: "" });
        try {
            const { data, error } = await supabase
                .from('pumps')
                .select(`
    id,
    name,
    gpio,
    system,
    origin (
      id,
      name
    ),
    destination (
      id,
      name
    ),
    esp32 (
      id,
      name
    )
  `)
                .eq('system', systemId);

            if (error) throw error;

            setPumpList(data || []);
        } catch (err) {
            console.error(err);
            setErrors({ create: err.message || "Error", update: err.message || "Error", delete: err.message || "Error", calibrate: err.message || "Error", calibration: err.message || "Error", record: err.message || "Error", program: err.message || "Error", calibrateList: err.message || "Error", calibrationList: err.message || "Error" });
        } finally {
            setLoading(false);
        }
    };


    const fetchCalibrateList = async () => {
        setLoading(true);
        setErrors({ create: "", update: "", delete: "", calibrate: "", calibration: "", record: "", program: "", calibrateList: "", calibrationList: "" });
        if (pumpList.length === 0) return;
        try {

            const pumpIds = pumpList.map(p => p.id);
            const { data, error } = await supabase
                .from("calibrate")
                .select(`
                id,
                volume,
                created_at,
                pump (
                    id,
                    name
                ),
                user (
                    id,
                    email
                )
            `)
                .in("pump", pumpIds);


            if (error) throw error;

            setCalibrateList(data || []);
        } catch (err) {
            setErrors({ create: err.message || "Error", update: err.message || "Error", delete: err.message || "Error", calibrate: err.message || "Error", calibration: err.message || "Error", record: err.message || "Error", program: err.message || "Error", calibrateList: err.message || "Error", calibrationList: "" });
        }
        finally {
            setLoading(false);
        }
    };

    const fetchCalibrationList = async () => {
        if (pumpList.length === 0) return;
        setLoading(true);
        setErrors({ create: "", update: "", delete: "", calibrate: "", calibration: "", record: "", program: "", calibrateList: "", calibrationList: "" });

        try {
            const pumpIds = pumpList.map(p => p.id);

            const { data, error } = await supabase
                .from("calibration")
                .select(`
    id,
    success,
    created_at,
    pump (
      id,
      name
    ),
    user (
      id,
      email
    )
  `)
                .in("pump", pumpIds);

            if (error) throw error;

            setCalibrationList(data || []);
        } catch (err) {
            setErrors({ create: err.message || "Error", update: err.message || "Error", delete: err.message || "Error", calibrate: err.message || "Error", calibration: err.message || "Error", record: err.message || "Error", program: err.message || "Error", calibrateList: err.message || "Error", calibrationList: err.message || "Error" });

        }
        finally {
            setLoading(false);
        }
    };
    const fetchProgrammingList = async () => {
        if (pumpList.length === 0) return;

        setLoading(true);

        try {
            const pumpIds = pumpList.map(p => p.id);

            const { data, error } = await supabase
                .from("programming_pumps")
                .select(`
                id,
                start_time,
                end_time,
                pump (
                    id,
                    name
                )
            `)
                .in("pump", pumpIds);

            if (error) throw error;

            setProgrammingList(data || []);
        } catch (err) {
            setErrors(prev => ({
                ...prev,
                program: err.message || "Error al cargar programación"
            }));
        } finally {
            setLoading(false);
        }
    };
    const fetchRecordsPump = async () => {
        if (pumpList.length === 0) return;
        setLoading(true);
        try {
            const pumpIds = pumpList.map(p => p.id);
            const { data, error } = await supabase
                .from("records_pumps")
                .select(`
        id,
        volume,
        success,
        created_at,
        pump (
          id,
          name
        ),
        user (
          id,
          email
        )
      `)
                .in("pump", pumpIds)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setRecordPumpList(data || []);
        } catch (err) {
            setErrors(prev => ({ ...prev, record: err.message || "Error al cargar registros" }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (pumpList.length > 0) {
            fetchCalibrateList();
            fetchCalibrationList();
            fetchRecordsPump();
            fetchProgrammingList();
        }
    }, [pumpList]);

    return (
        <>
            <h2>{texts.pumps}</h2>
            {role === 'owner' && (
                <>

                    <CreatePump
                        systemId={systemId}
                        pumpList={pumpList}
                        refresh={fetchPumps}
                        error={errors.create}
                        setError={setCreateError}
                    />

                    <UpdatePump
                        systemId={systemId}
                        pumpList={pumpList}
                        refresh={fetchPumps}
                        error={errors.update}
                        setError={setUpdateError}
                    />


                    <DeletePump
                        systemId={systemId}
                        pumpList={pumpList}
                        refresh={fetchPumps}
                        loading={loading}
                        error={errors.delete}
                        setError={setDeleteError} />
                </>
            )}


            <CalibratePump

                systemId={systemId}
                pumpList={pumpList}
                refresh={refreshCalibrations}
                error={errors.calibrate}
                setError={setCalibrateError}
            />

            <ListCalibrate
                systemId={systemId}
                calibrateList={calibrateList}
                refresh={fetchCalibrateList}  // Solo para refrescar después de eliminar
                userRole={role}
                error={errors.calibrateList}  // ← Error específico para calibraciones
                setError={setCalibrateListError}  // ← Setter específico para calibraciones
            />

            <ListCalibration
                systemId={systemId}
                calibrationList={calibrationList}
                refresh={fetchCalibrationList}  // Solo para refrescar después de eliminar
                userRole={role}
                error={errors.calibration}  // ← Error específico para calibraciones
                setError={setCalibrationError}  // ← Setter específico para calibraciones
            />
            <InsertPumping
                systemId={systemId}
                pumpList={pumpList}
                refresh={fetchRecordsPump}
                error={errors.record}
                setError={setRecordError}
            />


            <ListRecordsPump
                systemId={systemId}
                recordPumpList={recordPumpList}
                refresh={fetchRecordsPump}  // Solo para refrescar después de eliminar
                userRole={role}
                error={errors.recordList}  // ← Error específico para registros de bombas
                setError={setRecordListError}  // ← Setter específico para registros de bombas


            />



            {role === 'owner' && (
                <>
                    <ProgrammingPump

                        systemId={systemId}
                        programmingList={programmingList}
                        refresh={fetchProgrammingList}
                        error={errors.program}  // ← Error específico para registros de bombas
                        setError={setProgramError}  // ← Setter específico para registros de bombas

                    />
                </>
            )}
            <CalendarPump
                systemId={systemId}
                calibrateList={calibrateList}
                calibrationList={calibrationList}
                recordPumpList={recordPumpList}


                loading={loading} />


        </>
    );
}