import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PublishList from './PublishList';
import { Spinner, Container, Row, Col } from 'react-bootstrap';
import axiosInstance from '../../axiosConfig';


const PublishPage = () => {
    const [unpublishedCronjobs, setUnpublishedCronjobs] = useState([]);
    const [publishedCronjobs, setPublishedCronjobs] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchCronjobs = () => {
        setLoading(true);
        axiosInstance.get('/list/cronjobs')
            .then((res) => {
                const unpublished = res.data.filter(cronjob => !cronjob.cronjob_published);
                const published = res.data.filter(cronjob => cronjob.cronjob_published);
                setUnpublishedCronjobs(unpublished);
                setPublishedCronjobs(published);
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

    const handleCronjobPublished = (publishedCronjob) => {
        setUnpublishedCronjobs(prev => prev.filter(cronjob => cronjob.cronjob_id !== publishedCronjob.cronjob_id));
        setPublishedCronjobs(prev => [...prev, publishedCronjob]);
    };

    return (
        <Container>
            {loading ? <Spinner animation="border" /> : (
                <Row>
                    <Col md={6}>
                        <h2 className='cronjobText'>Unpublished Cronjobs</h2>
                        <PublishList cronjobs={unpublishedCronjobs} onCronjobPublished={handleCronjobPublished} />
                    </Col>
                    <Col md={6}>
                        <h2 className='cronjobText'>Published Cronjobs</h2>
                        <PublishList cronjobs={publishedCronjobs} published />
                    </Col>
                </Row>
            )}
        </Container>
    );
};

export default PublishPage;