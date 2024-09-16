import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import axiosInstance from '../../axiosConfig';

const AddServerModal = ({ show, handleClose, handleSave }) => {
    const [serverGroups, setServerGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [serverName, setServerName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (show) {
            axiosInstance.get('/list/groups')
                .then((res) => {
                    setServerGroups(res.data);
                })
                .catch((error) => {
                    console.error("There was an error fetching the server groups!", error);
                });
        }
    }, [show]);

    const handleGroupChange = (e) => {
        setSelectedGroup(e.target.value);
    };

    const handleNameChange = (e) => {
        setServerName(e.target.value);
    };

    const handleSaveModal = () => {
        const selectedGroupId = parseInt(selectedGroup);
        if (selectedGroupId && serverName) {
            setIsSaving(true);
            axiosInstance.post('/worker/add', {
                machine_name: serverName,
                machine_group_id: selectedGroupId
            })
            .then((res) => {
                console.log('Server added successfully:', res.data);
                handleSave(); // Call handleSave after successful addition
                handleClose(); // Close the modal after saving
            })
            .catch((error) => {
                console.error("There was an error adding the server!", error);
            })
            .finally(() => {
                setIsSaving(false);
            });
        } else {
            handleClose(); // Close the modal if inputs are invalid
        }
    };

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Add Server</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group controlId="formServerName">
                        <Form.Label>Server Name</Form.Label>
                        <Form.Control type="text" placeholder="Enter server name" value={serverName} onChange={handleNameChange} />
                    </Form.Group>        
                    <Form.Group controlId="formServerGroup">
                        <Form.Label>Server Group</Form.Label>
                        <Form.Control as="select" value={selectedGroup} onChange={handleGroupChange}>
                            <option value="">Select a group</option>
                            {serverGroups.map(group => (
                                <option key={group.id} value={group.id}>{group.machine_group_name}</option>
                            ))}
                        </Form.Control>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose} disabled={isSaving}>
                    Close
                </Button>
                <Button variant="primary" onClick={handleSaveModal} disabled={isSaving}>
                    {isSaving ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Save Changes'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AddServerModal;