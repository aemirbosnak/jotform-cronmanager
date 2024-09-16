import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SGForm from './SGForm';
import SGView from './SGView';
import axiosInstance from '../../axiosConfig';
import { Spinner, Button, InputGroup, FormControl, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import ReactPaginate from 'react-paginate';

const SGPage = () => {
    const [serverGroups, setServerGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);

    const itemsPerPage = 5;

    const fetchServerGroups = () => {
        setLoading(true);
        axiosInstance.get('/list/groups')
            .then((res) => {
                setServerGroups(res.data);
            })
            .catch((error) => {
                console.error("There was an error fetching the server groups!", error);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchServerGroups();
    }, []);

    const handleGroupCreated = () => {
        fetchServerGroups();
        setShowAddModal(false);
    };

    const handleDeleteGroup = (machine_group_name) => {
        setErrorMessage('');
        setGroupToDelete(machine_group_name);
        setShowDeleteModal(true);

        // Fetch the server group details to check for existing servers
        axiosInstance.get(`/group/${machine_group_name}`)
            .then((res) => {
                if (res.data.worker_nodes.length > 0) {
                    setErrorMessage('Cannot delete group. It contains servers.');
                    setShowDeleteModal(false);
                    setShowErrorModal(true);
                    setGroupToDelete(null);
                } else {
                    // Proceed with deletion if no servers are found
                    setDeleteLoading((prev) => ({ ...prev, [machine_group_name]: true }));
                    axiosInstance.delete(`/group/remove`, { data: { machine_group_name } })
                        .then(() => {
                            fetchServerGroups();
                        })
                        .catch((error) => {
                            console.error("There was an error deleting the server group!", error);
                        })
                        .finally(() => {
                            setDeleteLoading((prev) => ({ ...prev, [machine_group_name]: false }));
                            setShowDeleteModal(false);
                            setGroupToDelete(null);
                        });
                }
            })
            .catch((error) => {
                console.error("There was an error fetching the server group details!", error);
                setShowDeleteModal(false);
                setShowErrorModal(true);
                setGroupToDelete(null);
            });
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handlePageClick = (data) => {
        setCurrentPage(data.selected);
    };

    const filteredGroups = serverGroups.filter(group =>
        group.machine_group_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pageCount = Math.ceil(filteredGroups.length / itemsPerPage);
    const displayedGroups = filteredGroups.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

    return (
        <div>
            <InputGroup className="mb-3">
                <FormControl
                    placeholder="Search Server Groups"
                    value={searchTerm}
                    onChange={handleSearch}
                />
                <Button variant="primary" onClick={() => setShowAddModal(true)}>
                    <FontAwesomeIcon icon={faPlus} /> Add Group
                </Button>
            </InputGroup>

            {loading ? <Spinner animation="border" /> : (
                <div>
                    <SGView serverGroups={displayedGroups} onDelete={handleDeleteGroup} deleteLoading={deleteLoading} />
                    <ReactPaginate
                        previousLabel={'<'}
                        nextLabel={'>'}
                        breakLabel={'...'}
                        breakClassName={'break-me'}
                        pageCount={pageCount}
                        marginPagesDisplayed={2}
                        pageRangeDisplayed={5}
                        onPageChange={handlePageClick}
                        containerClassName={'pagination'}
                        activeClassName={'active'}
                    />
                </div>
            )}

            <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Add New Group</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <SGForm onGroupCreated={handleGroupCreated} />
                </Modal.Body>
            </Modal>

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} backdrop="static" keyboard={false}>
                <Modal.Header>
                    <Modal.Title>Removing Group</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="status-messages">
                        <p>Removing group...</p>
                        <Spinner animation="border" />
                    </div>
                </Modal.Body>
            </Modal>

            <Modal show={showErrorModal} onHide={() => setShowErrorModal(false)} backdrop="static" keyboard={false}>
                <Modal.Header closeButton>
                    <Modal.Title>Error</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="status-messages">
                        <p>{errorMessage}</p>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowErrorModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default SGPage;