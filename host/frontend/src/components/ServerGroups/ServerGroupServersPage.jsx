import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosConfig';
import { useParams, Link } from 'react-router-dom';
import { Spinner, Button, Form, Modal, InputGroup, FormControl } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faSearch } from '@fortawesome/free-solid-svg-icons';
import './ServerGroupServersPage.css'; // Import the CSS file
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const ServerGroupServersPage = () => {
    const { groupName } = useParams();
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newServerName, setNewServerName] = useState('');
    const [editServerName, setEditServerName] = useState('');
    const [serverToEdit, setServerToEdit] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false); // State to control add server modal visibility
    const [machineGroupId, setMachineGroupId] = useState(null);
    const [editServerGroupId, setEditServerGroupId] = useState(''); // State for selected server group in edit form
    const [serverGroups, setServerGroups] = useState([]); // State for server groups
    const [addServerLoading, setAddServerLoading] = useState(false); // State for add server loading
    const [statusMessages, setStatusMessages] = useState([]); // State for status messages
    const [showDeleteModal, setShowDeleteModal] = useState(false); // State to control delete server modal visibility
    const [deleteServerLoading, setDeleteServerLoading] = useState(false); // State for delete server loading
    const [serverToDelete, setServerToDelete] = useState(null); // State to store the server to be deleted
    const [currentPage, setCurrentPage] = useState(1); // State for current page
    const [searchTerm, setSearchTerm] = useState(''); // State for search term
    const [editServerLoading, setEditServerLoading] = useState(false); // State for edit server loading

    const serversPerPage = 8; // Number of servers per page

    const fetchServers = () => {
        setLoading(true);
        axiosInstance.get(`/group/${groupName}`)
            .then((res) => {
                setServers(res.data.worker_nodes);
                setMachineGroupId(res.data.machine_group_id);
            })
            .catch((error) => {
                console.error("There was an error fetching the servers!", error);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const fetchServerGroups = () => {
        axiosInstance.get('/list/groups')
            .then((res) => {
                setServerGroups(res.data);
            })
            .catch((error) => {
                console.error("There was an error fetching the server groups!", error);
            });
    };

    useEffect(() => {
        fetchServers();
        fetchServerGroups();
    }, [groupName]);

    const handleAddServer = () => {
        setAddServerLoading(true);
        setStatusMessages([...statusMessages, 'Adding server...']);
        axiosInstance.post('/worker/add', {
            machine_name: newServerName,
            machine_group_id: machineGroupId
        })
        .then(() => {
            setStatusMessages([...statusMessages, '']);
            fetchServers();
            setNewServerName('');
            setShowAddModal(false); // Close the add server modal
        })
        .catch((error) => {
            setStatusMessages([...statusMessages, 'Error adding server: ' + error.message]);
            console.error("There was an error adding the server!", error);
        })
        .finally(() => {
            setAddServerLoading(false);
        });
    };

    const handleDeleteServer = (machineName) => {
        setServerToDelete(machineName);
        setShowDeleteModal(true);
        setDeleteServerLoading(true);
        axiosInstance.delete('/worker/remove', { data: { machine_name: machineName, machine_group_id: machineGroupId } })
            .then(() => {
                fetchServers();
                setShowDeleteModal(false); // Close the delete server modal
            })
            .catch((error) => {
                console.error("There was an error deleting the server!", error);
            })
            .finally(() => {
                setDeleteServerLoading(false);
            });
    };

    const handleEditServer = (machineName) => {
        setEditServerLoading(true);
        setStatusMessages([...statusMessages, 'Editing server...']);
        axiosInstance.get('/list/workers')
            .then((res) => {
                const server = res.data.find(s => s.machine_name === machineName && s.machine_group_id === machineGroupId);
                if (server) {
                    setStatusMessages([...statusMessages, '']);
                    setServerToEdit(server);
                    setEditServerName(server.machine_name);
                    setEditServerGroupId(server.machine_group_id); // Set the selected server group
                    setShowEditModal(true);
                } else {
                    console.error("Server not found!");
                }
            })
            .catch((error) => {
                console.error("There was an error fetching the server list!", error);
            })
            .finally(() => {
                setEditServerLoading(false);
            });
    };

    const handleSaveChanges = () => {
        setEditServerLoading(true);
        axiosInstance.put(`/worker/edit/${serverToEdit.machine_name}`, {
            machine_name: editServerName,
            machine_group_id: editServerGroupId 
        })
        .then(() => {
            setStatusMessages([...statusMessages, '']);
            fetchServers();
            setShowEditModal(false);
            setServerToEdit(null);
            setEditServerName('');
            setEditServerGroupId(''); // Reset the selected server group
        })
        .catch((error) => {
            setStatusMessages([...statusMessages, 'Error editing server: ' + error.message]);
            console.error("There was an error editing the server!", error);
        })
        .finally(() => {
            setEditServerLoading(false);
        });
    };

    const cancelEditServer = () => {
        setServerToEdit(null);
        setEditServerName('');
        setEditServerGroupId(''); // Reset the selected server group
        setShowEditModal(false);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page on new search
    };

    const filteredServers = servers.filter(server =>
        server.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastServer = currentPage * serversPerPage;
    const indexOfFirstServer = indexOfLastServer - serversPerPage;
    const currentServers = filteredServers.slice(indexOfFirstServer, indexOfLastServer);

    const totalPages = Math.ceil(filteredServers.length / serversPerPage);

    return (
        <div className="server-group-page">
            <h1>Servers in Group: {groupName}</h1>
            <Button className="add-server-button" onClick={() => setShowAddModal(true)}>+ Add Server</Button>
            <InputGroup className="search-bar">
                <FormControl
                    placeholder="Search servers"
                    value={searchTerm}
                    onChange={handleSearch}
                />
            </InputGroup>
            {loading ? <Spinner animation="border" /> : (
                <ul className="server-list">
                    {currentServers.map((server, index) => (
                        <li key={index} className="server-list-item">
                            <p className="server-name">{server}</p>
                            <div>
                                <Button variant="primary" onClick={() => handleEditServer(server)}>
                                    <FontAwesomeIcon icon={faEdit} />
                                </Button>
                                <Button variant="danger" onClick={() => handleDeleteServer(server)}>
                                    <FontAwesomeIcon icon={faTrash} />
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            <div className="pagination-controls">
                <Button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    <FontAwesomeIcon icon={faChevronLeft} />
                </Button>
                <span>{currentPage} / {totalPages}</span>
                <Button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    <FontAwesomeIcon icon={faChevronRight} />
                </Button>
            </div>

            <Link to="/server-groups" className="go-back-button">
                <Button>Go Back to Server Groups</Button>
            </Link>

            <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Add Server</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group controlId="formNewServerName">
                            <Form.Label>New Server Name</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter server name"
                                value={newServerName}
                                onChange={(e) => setNewServerName(e.target.value)}
                            />
                        </Form.Group>
                    </Form>
                    <div className="status-messages">
                        {statusMessages.map((message, index) => (
                            <p key={index}>{message}</p>
                        ))}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={addServerLoading}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleAddServer} disabled={addServerLoading}>
                        {addServerLoading ? <Spinner animation="border" size="sm" /> : 'Add Server'}
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showEditModal} onHide={cancelEditServer}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Server</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                {editServerLoading ? (
                    <div className="editing-status">
                        <Spinner animation="border" />
                        <span className="editing-message">       Editing server...</span>
                    </div>
                ) : (
                        <Form>
                            <Form.Group controlId="formEditServerName">
                                <Form.Label>Edit Server Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={editServerName}
                                    onChange={(e) => setEditServerName(e.target.value)}
                                />
                            </Form.Group>
                            <Form.Group controlId="formEditServerGroup">
                                <Form.Label>Edit Server Group</Form.Label>
                                <Form.Control
                                    as="select"
                                    value={editServerGroupId}
                                    onChange={(e) => setEditServerGroupId(e.target.value)}
                                >
                                    <option value="">Select a group</option>
                                    {serverGroups.map((group) => (
                                        <option key={group.id} value={group.id}>
                                            {group.machine_group_name}
                                        </option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Form>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={cancelEditServer} disabled={editServerLoading}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleSaveChanges} disabled={editServerLoading}>
                        {editServerLoading ? <Spinner animation="border" size="sm" /> : 'Save Changes'}
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showDeleteModal} onHide={() => {}} backdrop="static" keyboard={false}>
                <Modal.Header>
                    <Modal.Title>Removing Server</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="status-messages">
                        <p>Deleting server...</p>
                        <Spinner animation="border" />
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default ServerGroupServersPage;