import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosConfig';
import HealthView from './HealthView';
import { Spinner } from 'react-bootstrap';

const HealthPage = () => {
    const [healthData, setHealthData] = useState([]);
    const [deadLetterHealthLogs, setDeadLetterHealthLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchHealthData = () => {
        setLoading(true);
        axiosInstance.get('/list/health')
            .then((res) => {
                console.log('Fetched Health Data:', res.data);
                setHealthData(res.data);
            })
            .catch((error) => {
                console.error("There was an error fetching the health data!", error);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const fetchDeadLetterHealthLogs = () => {
        setLoading(true);
        axiosInstance.get('/list/deadLetterHealth')
            .then((res) => {
                console.log('Fetched Dead Letter Health Logs:', res.data);
                setDeadLetterHealthLogs(res.data);
            })
            .catch((error) => {
                console.error("There was an error fetching the dead letter health logs!", error);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchHealthData();
        fetchDeadLetterHealthLogs();
    }, []);

    return (
        <div>
            <HealthView healthData={healthData} deadLetterHealthLogs={deadLetterHealthLogs} loading={loading} />
        </div>
    );
};

export default HealthPage;