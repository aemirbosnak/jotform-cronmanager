import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Spinner, Table, Alert } from 'react-bootstrap';
import axiosInstance from '../../axiosConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

const CronjobList = ({ cronjobs, onCronjobDeleted, onCronjobEdited }) => {
    const [editingCronjob, setEditingCronjob] = useState(null);
    const [loading, setLoading] = useState(false);
    const [cronjobName, setCronjobName] = useState('');
    const [cronjobContent, setCronjobContent] = useState('');
    const [cronjobStatus, setCronjobStatus] = useState(0);
    const [machineGroups, setMachineGroups] = useState([]);
    const [selectedMachineGroups, setSelectedMachineGroups] = useState([]);
    const [showAlert, setShowAlert] = useState(false);

    useEffect(() => {
        // Fetch all machine groups
        axiosInstance.get('/list/groups')
            .then((res) => {
                setMachineGroups(res.data);
            })
            .catch((error) => {
                console.error("There was an error fetching the server groups!", error);
            });
    }, []);

    const handleDelete = (cronjobId, cronjobName) => {
        axiosInstance.delete('/cronjob/remove', {
            data: {
                id: cronjobId,
                cronjob_name: cronjobName
            }
        })
        .then(() => {
            onCronjobDeleted();
        })
        .catch((error) => {
            console.error("There was an error deleting the cronjob!", error);
        });
    };

    const handleEdit = (cronjob) => {
        setLoading(true);
        axiosInstance.get(`/cronjob/${cronjob.cronjob_name}`)
            .then((res) => {
                const cronjobData = res.data;
                setEditingCronjob(cronjob);
                setCronjobName(cronjobData.cronjob_name);
                setCronjobContent(cronjobData.cronjob_content);
                setCronjobStatus(cronjobData.cronjob_status);
                setSelectedMachineGroups(cronjobData.machine_group_ids || []);
            })
            .catch((error) => {
                console.error("There was an error fetching the cronjob details!", error);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const handleSaveEdit = () => {
        if (selectedMachineGroups.length === 0) {
            setShowAlert(true);
            return;
        }

        setLoading(true);

        axiosInstance.put(`/cronjob/edit/${cronjobName}`, {
            id: editingCronjob.cronjob_id,
            cronjob_name: cronjobName,
            cronjob_content: cronjobContent,
            cronjob_status: cronjobStatus,
            machine_group_ids: selectedMachineGroups
        })
        .then(() => {
            onCronjobEdited();
            setEditingCronjob(null);
        })
        .catch((error) => {
            console.error("There was an error editing the cronjob!", error);
        })
        .finally(() => {
            setLoading(false);
        });
    };

    const handleCancelEdit = () => {
        setEditingCronjob(null);
    };

    const handleMachineGroupChange = (groupId) => {
        setSelectedMachineGroups((prevSelected) => {
            if (prevSelected.includes(groupId)) {
                return prevSelected.filter((id) => id !== groupId);
            } else {
                return [...prevSelected, groupId];
            }
        });
    };

    const handleSelectAll = () => {
        setSelectedMachineGroups(machineGroups.map(group => group.id));
    };

    const handleUnselectAll = () => {
        setSelectedMachineGroups([]);
    };

    return (
        <div>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Content</th>
                        <th>Status</th>
                        <th>Server Groups</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {cronjobs.map((cronjob) => (
                        <tr key={cronjob.cronjob_id}>
                            <td>{cronjob.cronjob_name}</td>
                            <td>{cronjob.cronjob_content}</td>
                            <td>{cronjob.cronjob_status}</td>
                            <td>{cronjob.machine_group_names.join(', ')}</td>
                            <td>
                                <Button variant="primary" onClick={() => handleEdit(cronjob)}>
                                    <FontAwesomeIcon icon={faEdit} />
                                </Button>
                                <Button variant="danger" onClick={() => handleDelete(cronjob.cronjob_id, cronjob.cronjob_name)}>
                                    <FontAwesomeIcon icon={faTrash} />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            {editingCronjob && (
                <Modal show={true} onHide={handleCancelEdit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Edit Cronjob</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {showAlert && <Alert variant="danger" onClose={() => setShowAlert(false)} dismissible>
                            Please select at least one server group.
                        </Alert>}
                        <Form>
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
                            <Form.Group controlId="formMachineGroups">
                                <Form.Label>Server Groups</Form.Label>
                                {Array.isArray(machineGroups) && machineGroups.length > 0 ? (
                                    <div>
                                        <Form.Check
                                            type="checkbox"
                                            label="Select All"
                                            checked={selectedMachineGroups.length === machineGroups.length}
                                            onChange={(e) => e.target.checked ? handleSelectAll() : handleUnselectAll()}
                                        />
                                        {machineGroups.map((group) => (
                                            <Form.Check
                                                key={group.id}
                                                type="checkbox"
                                                label={group.machine_group_name}
                                                checked={selectedMachineGroups.includes(group.id)}
                                                onChange={() => handleMachineGroupChange(group.id)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p>No Server groups available</p>
                                )}
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCancelEdit}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSaveEdit} disabled={loading}>
                            {loading ? <Spinner animation="border" size="sm" /> : 'Save Changes'}
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}
        </div>
    );
};

export default CronjobList;