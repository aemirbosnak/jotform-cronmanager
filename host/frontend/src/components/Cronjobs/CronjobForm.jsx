import React, { useState, useEffect } from 'react';
import { Form, Button, Spinner, Alert } from 'react-bootstrap';
import axiosInstance from '../../axiosConfig';

const CronjobForm = ({ onCronjobCreated }) => {
    const [cronjobName, setCronjobName] = useState('');
    const [cronjobContent, setCronjobContent] = useState('');
    const [cronjobStatus, setCronjobStatus] = useState(0);
    const [machineGroups, setMachineGroups] = useState([]);
    const [selectedMachineGroupIds, setSelectedMachineGroupIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAlert, setShowAlert] = useState(false);

    useEffect(() => {
        setLoading(true);
        axiosInstance.get('/group/')
            .then((res) => {
                setMachineGroups(res.data);
            })
            .catch((error) => {
                console.error("There was an error fetching the server groups!", error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const handleCheckboxChange = (groupId) => {
        setSelectedMachineGroupIds((prevSelected) => {
            if (prevSelected.includes(groupId)) {
                return prevSelected.filter(id => id !== groupId);
            } else {
                return [...prevSelected, groupId];
            }
        });
    };

    const handleSelectAll = () => {
        setSelectedMachineGroupIds(machineGroups.map(group => group.id));
    };

    const handleUnselectAll = () => {
        setSelectedMachineGroupIds([]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedMachineGroupIds.length === 0) {
            setShowAlert(true);
            return;
        }

        const newCronjob = {
            cronjob_name: cronjobName,
            cronjob_content: cronjobContent,
            cronjob_status: cronjobStatus,
            machine_group_ids: selectedMachineGroupIds
        };

        axiosInstance.post('/cronjob/create', newCronjob)
            .then(() => {
                onCronjobCreated();
                setCronjobName('');
                setCronjobContent('');
                setCronjobStatus(0);
                setSelectedMachineGroupIds([]);
            })
            .catch((error) => {
                console.error("There was an error creating the cronjob!", error);
            });
    };

    return (
        <Form onSubmit={handleSubmit}>
            {showAlert && <Alert variant="danger" onClose={() => setShowAlert(false)} dismissible>
                Please select at least one server group.
            </Alert>}
            <Form.Group controlId="formCronjobName">
                <Form.Label>Cronjob Name</Form.Label>
                <Form.Control
                    type="text"
                    value={cronjobName}
                    onChange={(e) => setCronjobName(e.target.value)}
                />
            </Form.Group>
            <Form.Group controlId="formCronjobContent">
                <Form.Label>Cronjob Content</Form.Label>
                <Form.Control
                    type="text"
                    value={cronjobContent}
                    onChange={(e) => setCronjobContent(e.target.value)}
                />
            </Form.Group>
            <Form.Group controlId="formCronjobStatus">
                <Form.Label>Cronjob Status</Form.Label>
                <Form.Control
                    type="number"
                    value={cronjobStatus}
                    onChange={(e) => setCronjobStatus(Number(e.target.value))}
                    min="0"
                    max="4"
                />
            </Form.Group>
            <Form.Group controlId="formMachineGroupIds">
                <Form.Label>Server Groups</Form.Label>
                {loading ? <Spinner animation="border" /> : (
                    <div>
                        <Form.Check
                            type="checkbox"
                            label="Select All"
                            checked={selectedMachineGroupIds.length === machineGroups.length}
                            onChange={(e) => e.target.checked ? handleSelectAll() : handleUnselectAll()}
                        />
                        {machineGroups.map((group) => (
                            <Form.Check
                                key={group.id}
                                type="checkbox"
                                label={`${group.id} - ${group.machine_group_name}`}
                                checked={selectedMachineGroupIds.includes(group.id)}
                                onChange={() => handleCheckboxChange(group.id)}
                            />
                        ))}
                    </div>
                )}
            </Form.Group>
            <Button variant="primary" type="submit">
                Create Cronjob
            </Button>
        </Form>
    );
};

export default CronjobForm;