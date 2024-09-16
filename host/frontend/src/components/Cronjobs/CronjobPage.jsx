import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosConfig';
import CronjobForm from './CronjobForm';
import CronjobList from './CronjobList';
import { Spinner, Container, Row, Col, InputGroup, FormControl, Button, Modal } from 'react-bootstrap';

const CronjobPage = () => {
    const [cronjobs, setCronjobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const cronjobsPerPage = 8;

    const fetchCronjobs = () => {
        setLoading(true);
        axiosInstance.get('/list/cronjobs')
            .then((res) => {
                const updatedCronjobs = res.data.map(cronjob => ({
                    ...cronjob,
                    machine_group_names: cronjob.machine_group_names.split(',')
                }));
                setCronjobs(updatedCronjobs);
            })
            .catch((error) => {
                console.error("There was an error fetching the cronjobs!", error);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchCronjobs();
    }, []);

    const handleCronjobCreated = () => {
        fetchCronjobs();
        setShowModal(false); // Close the modal after creating a cronjob
    };

    const handleCronjobDeleted = () => {
        fetchCronjobs();
    };

    const handleCronjobEdited = () => {
        fetchCronjobs();
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page on search
    };

    const filteredCronjobs = cronjobs.filter(cronjob =>
        cronjob.cronjob_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastCronjob = currentPage * cronjobsPerPage;
    const indexOfFirstCronjob = indexOfLastCronjob - cronjobsPerPage;
    const currentCronjobs = filteredCronjobs.slice(indexOfFirstCronjob, indexOfLastCronjob);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <Container>
            <Row className="my-4">
                <Col>
                    <InputGroup>
                        <FormControl
                            type="text"
                            placeholder="Search cronjobs..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            
                        />
                    </InputGroup>
                </Col>
                <Col className="text-right">
                    <Button variant="primary" onClick={() => setShowModal(true)}>
                        + Create Cronjob
                    </Button>
                </Col>
            </Row>
            <Row>
                <Col>
                    {loading ? <Spinner animation="border" /> : (
                        <CronjobList
                            cronjobs={currentCronjobs}
                            onCronjobDeleted={handleCronjobDeleted}
                            onCronjobEdited={handleCronjobEdited}
                        />
                    )}
                </Col>
            </Row>
            <Row className="my-4">
                <Col className="d-flex justify-content-between">
                    <Button
                        disabled={currentPage === 1}
                        onClick={() => paginate(currentPage - 1)}
                    >
                        &lt; Previous
                    </Button>
                    <Button
                        disabled={indexOfLastCronjob >= filteredCronjobs.length}
                        onClick={() => paginate(currentPage + 1)}
                    >
                        Next &gt;
                    </Button>
                </Col>
            </Row>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Create Cronjob</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <CronjobForm onCronjobCreated={handleCronjobCreated} />
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default CronjobPage;