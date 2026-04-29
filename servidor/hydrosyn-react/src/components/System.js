
import { useNavigate } from 'react-router-dom';
import useTexts from '../utils/UseTexts';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import UserAccordion from './accordions/UserAccordion';
import NotificationsAccordion from './accordions/NotificationsAccordion';
import SettingsAccordion from './accordions/SettingsAccordion';
import ESP32Accordion from './accordions/ESP32Accordion';
import { useParams } from 'react-router-dom';
import { useOwnerStatus } from '../utils/OwnerContext';
import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRoleSystem } from "../utils/RoleSystemContext";
import TanksAccordion from './accordions/TanksAccordion';
import PumpsAccordion from './accordions/PumpsAccordion';
import LightAccordion from './accordions/LightAccordion';

import RecordsAccordion from './accordions/RecordsAccordion';

import {
    Tabs,
    Tab,
    Box,
    Paper
} from '@mui/material';


import WaterIcon from '@mui/icons-material/Water';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PeopleIcon from '@mui/icons-material/People';
import MemoryIcon from '@mui/icons-material/Memory';
import SettingsIcon from '@mui/icons-material/Settings';
import BuildIcon from '@mui/icons-material/Build';
import HistoryIcon from '@mui/icons-material/History';
import LightbulbIcon from '@mui/icons-material/Lightbulb';


export default function System() {

    const navigate = useNavigate();
    const texts = useTexts();
    const { systemId } = useParams();
    const { role, loading: roleLoading } = useRoleSystem();

    const [selectedTab, setSelectedTab] = useState(0);


    const [system, setSystem] = useState(null);
    const [loadingSystem, setLoadingSystem] = useState(true);

    /*

    const roleOptions = {
        owner: [
            { value: "tanks", label: texts.tanks },
            { value: "notifications", label: texts.notifications },
            { value: "users", label: texts.users },
            { value: "esp32", label: texts.esp32 },
            { value: "settings", label: texts.systemSettings },
            { value: "pumps", label: texts.pumps },
            { value: "records", label: texts.records }
        ],
        member: [


            { value: "records", label: texts.records },
            { value: "pumps", label: texts.pumps }


        ]
    };
      const options = roleOptions[role] || [];
*/

    const tabConfig = {
        owner: [
            { value: "tanks", label: texts.tanks, icon: <WaterIcon />, component: TanksAccordion },
            { value: "notifications", label: texts.notifications, icon: <NotificationsIcon />, component: NotificationsAccordion },
            { value: "users", label: texts.users, icon: <PeopleIcon />, component: UserAccordion },
            { value: "esp32", label: texts.esp32, icon: <MemoryIcon />, component: ESP32Accordion },
            { value: "settings", label: texts.systemSettings, icon: <SettingsIcon />, component: SettingsAccordion },
            { value: "pumps", label: texts.pumps, icon: <BuildIcon />, component: PumpsAccordion },
            { value: "lights", label: texts.lights, icon: <LightbulbIcon />, component: LightAccordion },
            { value: "records", label: texts.records, icon: <HistoryIcon />, component: RecordsAccordion }
        ],
        member: [

            { value: "pumps", label: texts.pumps, icon: <BuildIcon />, component: PumpsAccordion },
            { value: "lights", label: texts.lights, icon: <LightbulbIcon />, component: LightAccordion },
            { value: "records", label: texts.records, icon: <HistoryIcon />, component: RecordsAccordion }
        ]
    };

    const tabs = tabConfig[role] || [];


    useEffect(() => {
        const fetchSystem = async () => {
            setLoadingSystem(true);
            const { data, error } = await supabase
                .from('systems')
                .select('name')
                .eq('id', systemId)
                .single();

            if (error) {

                setSystem(null);
            } else if (data) {
                setSystem(data);
            }
            setLoadingSystem(false);
        };
        fetchSystem();
    }, [systemId]);
    /*
    const handleChange = (e) => {
        setSelected(e.target.value);
    }
    */
    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
    };


    useEffect(() => {
        if (!loadingSystem && !roleLoading) {


            if (!system || role === "none") {

                navigate('/dashboard', { replace: true });
            }
        }
    }, [system, role, loadingSystem, roleLoading, navigate]);


    if (loadingSystem || roleLoading || !system || role === "none") return null;

    const renderTabContent = () => {
        const currentTab = tabs[selectedTab];
        if (!currentTab) return null;

        const Component = currentTab.component;
        return <Component systemId={systemId} />;
    };

    return (
        <Container maxWidth="lg">
            <Paper
                elevation={3}
                sx={{
                    mt: 8,
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    minHeight: 400
                }}
            >

                <Typography variant="h4" component="h1" gutterBottom align="center">
                    {texts.system}: {system.name}
                </Typography>


                <Box
                    sx={{
                        width: '100%',
                        borderBottom: 1,
                        borderColor: 'divider',
                        mt: 2,
                        mb: 3
                    }}
                >
                    <Tabs
                        value={selectedTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                    >
                        {tabs.map((tab) => (
                            <Tab
                                key={tab.value}
                                icon={tab.icon}
                                label={tab.label}
                                iconPosition="start"
                            />
                        ))}
                    </Tabs>
                </Box>


                <Box sx={{ width: '100%', flexGrow: 1 }}>
                    {renderTabContent()}
                </Box>

            </Paper>
        </Container>
        /*
        <div className='div-main-login'>
            <h1>{texts.system}: {system.name}</h1>

            */
            {/*}
            <label htmlFor="options">{texts.options}</label>
            <br />
            <br />
            <select id="options" value={selected} onChange={handleChange}>
                <option value="">--  --</option>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>

            {selected === "tanks" && role === "owner" && <TanksAccordion systemId={systemId} />}
            {selected === "notifications" && role === "owner" && <NotificationsAccordion systemId={systemId} />}
            {selected === "users" && role === "owner" && <UserAccordion systemId={systemId} />}
            {selected === "esp32" && role === "owner" && <ESP32Accordion systemId={systemId} />}
            {selected === "pumps" && <PumpsAccordion systemId={systemId} />}
            {selected === "settings" && role === "owner" && <SettingsAccordion systemId={systemId} />}
            {selected === "records" && <RecordsAccordion systemId={systemId} />}



*/}
    /*
            <div className="tabs-container">
                <Tabs
                    value={selectedTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile


                >
                    {tabs.map((tab, index) => (
                        <Tab
                            key={tab.value}
                            icon={tab.icon}
                            label={tab.label}
                            iconPosition="start"

                        />
                    ))}
                </Tabs>

            </div>


            <div className="tab-content-container">
                {renderTabContent()}
            </div>






        </div>
        */
    );
}
