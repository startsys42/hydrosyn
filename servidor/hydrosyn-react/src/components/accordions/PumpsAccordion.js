






import { useNavigate } from 'react-router-dom';
import useTexts from '../../utils/UseTexts';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
//import '../../styles/themeo.css';
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

import ListCalibrate from '../PumpComponents/ListCalibrate';
import CreateProgrammingPump from '../PumpComponents/CreateProgrammingPump';

import ListProgrammingPumps from '../PumpComponents/ListProgrammingPumps';


export default function PumpsAccordion({ systemId }) {
    const navigate = useNavigate();
    const texts = useTexts();
    const { role } = useRoleSystem();

    const [pumpList, setPumpList] = useState([]);
    const [calibrateList, setCalibrateList] = useState([]);
    const [calibrationList, setCalibrationList] = useState([]);
    const [recordPumpList, setRecordPumpList] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [programmingList, setProgrammingList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);



    const [errors, setErrors] = useState({
        create: "",
        update: "",
        delete: "",
        calibrate: "",
        calibration: "",
        record: "",
        program: "",
        programUpdate: "",
        programList: "",
        calibrateList: "",
        calibrationList: "",
        recordList: ""
    });

    const setComponentError = (component, msg) => {
        setErrors({
            create: "",
            update: "",
            delete: "",
            calibrate: "",
            calibration: "",
            record: "",
            program: "",
            programUpdate: "",
            programList: "",
            calibrateList: "",
            calibrationList: "",
            recordList: "",
            [component]: msg
        });
    };

    useEffect(() => {
        const fetchUser = async () => {

            const { data } = await supabase.auth.getUser();

            setCurrentUserId(data?.user?.id);
            setInitialLoading(false);
        };
        fetchUser();
    }, []);


    useEffect(() => {
        if (!currentUserId) {

            return;
        }


        fetchPumps();
    }, [currentUserId]);


    useEffect(() => {
        if (!currentUserId || !systemId) return;


        fetchCalibrateList();
        fetchCalibrationList();
        fetchRecordsPump();
        fetchProgrammingList();
    }, [currentUserId, systemId]);


    const refreshCalibrations = async () => {
        await fetchCalibrateList();
        await fetchCalibrationList();
    };
    const fetchPumps = async () => {
        setLoading(true);
        setErrors({ create: "", update: "", delete: "", calibrate: "", calibration: "", record: "", program: "", calibrateList: "", calibrationList: "", recordList: "", programList: "", programUpdate: "" });
        try {

            const { data, error } = await supabase.rpc('get_pumps_for_system', {
                p_system_id: systemId,
                p_current_user: currentUserId
            });

            if (error) throw error;


            const formatted = (data || []).map(p => ({
                id: p.id,
                name: p.name,
                gpio: p.gpio,
                system: p.system_id,
                origin: { id: p.origin_id, name: p.origin_name },
                destination: { id: p.destination_id, name: p.destination_name },
                esp32: { id: p.esp32_id, name: p.esp32_name }
            }));

            setPumpList(formatted);
        } catch (err) {
            console.error(err);
            setErrors({ create: err.message || "Error", update: err.message || "Error", delete: err.message || "Error", calibrate: err.message || "Error", calibration: err.message || "Error", record: err.message || "Error", program: err.message || "Error", calibrateList: err.message || "Error", calibrationList: err.message || "Error", recordList: err.message || "Error", programList: err.message || "Error", programUpdate: err.message || "Error" });
        } finally {
            setLoading(false);
        }
    };
    const fetchCalibrateList = async () => {
        setLoading(true);
        setErrors({ create: "", update: "", delete: "", calibrate: "", calibration: "", record: "", program: "", calibrateList: "", calibrationList: "", recordList: "", programList: "", programUpdate: "" });

        try {


            const { data, error } = await supabase.rpc('get_calibrates_for_system', {
                p_system_id: systemId,
                p_current_user: currentUserId
            });

            if (error) throw error;

            setCalibrateList(data || []);
        } catch (err) {
            setErrors({ create: err.message || "Error", update: err.message || "Error", delete: err.message || "Error", calibrate: err.message || "Error", calibration: err.message || "Error", record: err.message || "Error", program: err.message || "Error", calibrateList: err.message || "Error", calibrationList: err.message || "Error", recordList: err.message || "Error", programList: err.message || "Error", programUpdate: err.message || "Error" });
        }
        finally {
            setLoading(false);
        }
    };
    const fetchCalibrationList = async () => {

        setLoading(true);
        setErrors({ create: "", update: "", delete: "", calibrate: "", calibration: "", record: "", program: "", calibrateList: "", calibrationList: "", recordList: "", programList: "", programUpdate: "" });

        try {


            const { data, error } = await supabase.rpc('get_calibrations_for_system', {
                p_system_id: systemId,
                p_current_user: currentUserId
            });

            if (error) throw error;

            setCalibrationList(data || []);


        } catch (err) {
            setErrors({ create: err.message || "Error", update: err.message || "Error", delete: err.message || "Error", calibrate: err.message || "Error", calibration: err.message || "Error", record: err.message || "Error", program: err.message || "Error", calibrateList: err.message || "Error", calibrationList: err.message || "Error", recordList: err.message || "Error", programList: err.message || "Error", programUpdate: err.message || "Error" });

        }
        finally {
            setLoading(false);
        }
    };
    const fetchProgrammingList = async () => {


        setLoading(true);

        try {
            const pumpIds = pumpList.map(p => p.id);

            const { data, error } = await supabase.rpc('get_programming_pumps_for_system', {
                p_system_id: systemId,
                p_current_user: currentUserId
            });

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

        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_records_pumps_for_system', {
                p_system_id: systemId,
                p_current_user: currentUserId
            });

            if (error) throw error;


            const formatted = (data || []).map(r => ({
                id: r.id,
                volume: r.volume,
                success: r.success,
                created_at: r.created_at,
                pump_name: r.pump_name,
                user_email: r.user_email
            }));

            setRecordPumpList(formatted);
        } catch (err) {
            setErrors(prev => ({ ...prev, record: err.message || "Error al cargar registros" }));
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (!currentUserId) return;

        const channel = supabase
            .channel('pumps-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'pumps' },
                () => fetchPumps()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUserId, systemId]);
    useEffect(() => {
        if (!currentUserId || !systemId) return;




        const calibrateSub = supabase
            .channel('calibrates-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'calibrate',
                    filter: `system_id=eq.${systemId}`
                },
                (payload) => {

                    fetchCalibrateList();
                }
            )
            .subscribe();


        const calibrationSub = supabase
            .channel('calibrations-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'calibration',
                    filter: `system_id=eq.${systemId}`
                },
                (payload) => {

                    fetchCalibrationList();
                }
            )
            .subscribe();


        const recordsSub = supabase
            .channel('records-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'records_pumps'
                },
                (payload) => {

                    fetchRecordsPump();
                }
            )
            .subscribe();


        const programmingSub = supabase
            .channel('programming-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'programming_pumps'
                },
                (payload) => {

                    fetchProgrammingList();
                }
            )
            .subscribe();



        return () => {

            supabase.removeChannel(calibrateSub);
            supabase.removeChannel(calibrationSub);
            supabase.removeChannel(recordsSub);
            supabase.removeChannel(programmingSub);
        };

    }, [currentUserId, systemId]);

    return (
        <>
            <div style={{ maxWidth: 800 }}>
                <h2>{texts.pumps}</h2>
                {role === 'owner' && (
                    <>

                        <CreatePump
                            systemId={systemId}
                            pumpList={pumpList}
                            refresh={fetchPumps}
                            error={errors.create}
                            setError={(msg) => setComponentError("create", msg)}
                        />

                        <UpdatePump
                            systemId={systemId}
                            pumpList={pumpList}
                            refresh={fetchPumps}
                            error={errors.update}
                            setError={(msg) => setComponentError("update", msg)}
                        />


                        <DeletePump
                            systemId={systemId}
                            pumpList={pumpList}
                            refresh={fetchPumps}
                            loading={loading}
                            error={errors.delete}
                            setError={(msg) => setComponentError("delete", msg)} />
                    </>
                )}


                <CalibratePump

                    systemId={systemId}
                    pumpList={pumpList}
                    refresh={refreshCalibrations}
                    error={errors.calibrate}
                    setError={(msg) => setComponentError("calibrate", msg)}
                />

                <ListCalibrate
                    systemId={systemId}
                    calibrateList={calibrateList}
                    refresh={fetchCalibrateList}
                    userRole={role}
                    error={errors.calibrateList}
                    setError={(msg) => setComponentError("calibrateList", msg)}
                />

                <ListCalibration
                    systemId={systemId}
                    calibrationList={calibrationList}
                    refresh={fetchCalibrationList}
                    userRole={role}
                    error={errors.calibration}
                    setError={(msg) => setComponentError("calibration", msg)}
                />

                <InsertPumping
                    systemId={systemId}
                    pumpList={pumpList}
                    refresh={fetchRecordsPump}
                    error={errors.record}
                    setError={(msg) => setComponentError("record", msg)}
                />


                <ListRecordsPump
                    systemId={systemId}
                    recordPumpList={recordPumpList}
                    refresh={fetchRecordsPump}
                    userRole={role}
                    error={errors.recordList}
                    setError={(msg) => setComponentError("recordList", msg)}

                />


                {role === 'owner' && (
                    <>
                        <CreateProgrammingPump
                            pumpList={pumpList}
                            programmingList={programmingList}
                            refresh={fetchProgrammingList}
                            error={errors.program}
                            setError={(msg) => setComponentError("program", msg)}
                        />


                    </>
                )}

                <ListProgrammingPumps
                    pumpList={pumpList}
                    programmingList={programmingList}
                    refresh={fetchProgrammingList}
                    error={errors.programList}
                    setError={(msg) => setComponentError("programList", msg)}
                    userRole={role}
                />

            </div>


        </>

    );
}