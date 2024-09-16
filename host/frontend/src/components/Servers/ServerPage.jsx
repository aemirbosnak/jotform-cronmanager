import React, { useState, useEffect } from 'react';
import axios from 'axios';
import axiosInstance from '../../axiosConfig';
import ServerForm from './ServerForm';
import ServerView from './ServerView';
import { Spinner } from 'react-bootstrap';

const ServerPage = () => {
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchServers = () => {
        setLoading(true);
        axiosInstance.get('/list/workers')
          .then((res) => {
            console.log('Fetched Servers:', res.data);
            setServers(res.data);
          })
          .catch((error) => {
            console.error("There was an error fetching the servers!", error);
          })
          .finally(() => {
            setLoading(false);
          });
    };

    useEffect(() => {
        fetchServers();
    }, []);

    const handleServerCreated = () => {
        fetchServers();
    };

    const handleServerDeleted = () => {
        fetchServers();
    };

    const handleServerEdited = () => {
        fetchServers();
    };

    return (
        <div>
            <ServerForm onServerCreated={handleServerCreated} />
            {loading ? <Spinner animation="border" /> : <ServerView servers={servers} onServerDeleted={handleServerDeleted} onServerEdited={handleServerEdited} />}
        </div>
    );
};

export default ServerPage;