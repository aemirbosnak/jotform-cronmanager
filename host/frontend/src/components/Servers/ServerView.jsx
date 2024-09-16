import React, { useState, useEffect } from 'react';
import axios from 'axios';
import axiosInstance from '../../axiosConfig';
import { Modal, Button, Form } from 'react-bootstrap';

const ServerView = ({ servers, onServerDeleted, onServerEdited }) => {
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentServer, setCurrentServer] = useState(null);
    const [machineGroups, setMachineGroups] = useState([]);
    const [updatedMachineName, setUpdatedMachineName] = useState('');
    const [updatedMachineGroupId, setUpdatedMachineGroupId] = useState('');

    useEffect(() => {
        // Fetch existing machine group IDs
        axiosInstance.get('/group/')
            .then((res) => {
                setMachineGroups(res.data);
            })
            .catch((error) => {
                console.error("There was an error fetching the machine groups!", error);
            });
    }, []);

    const handleDelete = (id) => {
        axiosInstance.delete('/worker/remove', { data: { id } })
            .then(() => {
                onServerDeleted();
            })
            .catch((error) => {
                console.error("There was an error deleting the server!", error);
            });
    };

    const handleEdit = (server) => {
        setCurrentServer(server);
        setUpdatedMachineName(server.machine_name);
        setUpdatedMachineGroupId(server.machine_group_id);
        setShowEditModal(true);
    };

    const handleSave = () => {
        const updatedServer = {
            id: currentServer.id,
            machine_name: updatedMachineName,
            machine_group_id: updatedMachineGroupId
        };

        axiosInstance.put('/worker/edit', updatedServer)
            .then(() => {
                onServerEdited();
                setShowEditModal(false);
            })
            .catch((error) => {
                console.error("There was an error editing the server!", error);
            });
    };

    return (
        <div>
            {servers.map((server) => (
                <div key={server.id}>
                    <h1>{server.id} - {server.machine_name}</h1>
                    <p>Machine Group ID: {server.machine_group_id}</p>
                    <button onClick={() => handleEdit(server)}>Edit</button>
                    <button onClick={() => handleDelete(server.id)}>Delete</button>
                </div>
            ))}

            <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Server</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group controlId="formMachineName">
                            <Form.Label>Machine Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={updatedMachineName}
                                onChange={(e) => setUpdatedMachineName(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group controlId="formMachineGroupId">
                            <Form.Label>Machine Group ID</Form.Label>
                            <Form.Select
                                value={updatedMachineGroupId}
                                onChange={(e) => setUpdatedMachineGroupId(e.target.value)}
                                className="custom-select"
                            >
                                {machineGroups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.id} - {group.machine_group_name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ServerView;