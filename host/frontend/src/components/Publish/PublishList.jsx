import React, { useState } from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import axiosInstance from '../../axiosConfig';


const PublishList = ({ cronjobs, published, onCronjobPublished }) => {
    const [infoMessage, setInfoMessage] = useState('');

    const handlePublish = (cronjob) => {
        setInfoMessage(`Publishing cronjob: ${cronjob.cronjob_name}`);
        axiosInstance.post('/cronjob/publish', { cronjob_name: cronjob.cronjob_name })
            .then((response) => {
                console.log(response.data);
                setInfoMessage(`Successfully published cronjob: ${cronjob.cronjob_name}`);
                onCronjobPublished(cronjob);
            })
            .catch((error) => {
                console.error("There was an error publishing the cronjob!", error);
                setInfoMessage(`Failed to publish cronjob: ${cronjob.cronjob_name}`);
            });
    };

    return (
        <div className='mt-5'>
            {infoMessage && <Alert variant="info">{infoMessage}</Alert>}
            {cronjobs.map((cronjob) => (
                <Card key={cronjob.cronjob_id} className={`mb-3 ${published ? 'published-cronjob' : 'unpublished-cronjob'}`}>
                    <Card.Body>
                        <Card.Title><span className="cronjobText">{cronjob.cronjob_name}</span></Card.Title>
                        <Card.Text>
                            <span className="cronjobText">{cronjob.cronjob_content}</span>
                        </Card.Text>
                        <Card.Text>
                        <span className="cronjobText">Server Groups: {cronjob.machine_group_names}</span>
                        </Card.Text>
                        {!published && <Button onClick={() => handlePublish(cronjob)}>Publish</Button>}
                    </Card.Body>
                </Card>
            ))}
        </div>
    );
};

export default PublishList;