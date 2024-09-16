import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { InputGroup, Form, Button, Spinner } from 'react-bootstrap';
import axiosInstance from '../../axiosConfig';

const ServerForm = ({ onServerCreated }) => {
    const [machineName, setMachineName] = useState('');
    const [machineGroupId, setMachineGroupId] = useState('');
    const [machineGroups, setMachineGroups] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch existing machine groups
        axiosInstance.get('/group/')
            .then((res) => {
                setMachineGroups(res.data);
            })
            .catch((error) => {
                console.error("There was an error fetching the machine groups!", error);
            });
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        axiosInstance.post('/worker/add', {
            machine_name: machineName,
            machine_group_id: machineGroupId
        })
        .then((res) => {
            console.log('Server added:', res.data);
            onServerCreated();
            setMachineName('');
            setMachineGroupId('');
        })
        .catch((error) => {
            console.error("There was an error adding the server!", error);
        })
        .finally(() => {
            setLoading(false);
        });
    };

    return (
        <Form onSubmit={handleSubmit}>
            <InputGroup className="mb-3">
                <Form.Control
                    placeholder="Machine Name"
                    value={machineName}
                    onChange={(e) => setMachineName(e.target.value)}
                />
            </InputGroup>
            <InputGroup className="mb-3">
                <Form.Select
                    value={machineGroupId}
                    onChange={(e) => setMachineGroupId(e.target.value)}
                >
                    <option value="">Select Machine Group</option>
                    {machineGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                            {group.id} - {group.machine_group_name}
                        </option>
                    ))}
                </Form.Select>
            </InputGroup>
            <Button variant="primary" type="submit" disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : 'Add Server'}
            </Button>
        </Form>
    );
};

export default ServerForm;