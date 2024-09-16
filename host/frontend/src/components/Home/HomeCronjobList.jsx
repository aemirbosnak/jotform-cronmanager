import React, { useState, useEffect, useRef } from 'react';
import { Card, Spinner, Button } from 'react-bootstrap';
import Polygon from 'react-polygon';
import AddServerModal from './AddServerModal';
import ServerDetailsModal from './ServerDetailsModal';
import axiosInstance from '../../axiosConfig';

function HomeCronjobList() {
    const [cronjobs, setCronjobs] = useState([]);
    const [healthData, setHealthData] = useState([]);
    const [cronjobReceived, setCronjobReceived] = useState([]);
    const [cronjobReceivedNames, setCronjobReceivedNames] = useState([]);
    const [cronjobDeadLetter, setCronjobDeadLetter] = useState([]);
    const [cronjobDeadLetterNames, setCronjobDeadLetterNames] = useState([]);
    const [cronjobDeadLetterObject, setCronjobDeadLetterObject] = useState([]);
    const [cronjobReceivedObject, setCronjobReceivedObject] = useState([]);
    const [commonCronjobs, setCommonCronjobs] = useState([]);
    const [cronjobPublished, setCronjobPublished] = useState([]); // New state
    const [error, setError] = useState(null);
    const [workerNodes, setWorkerNodes] = useState({});
    const [hoveredServer, setHoveredServer] = useState(null);
    const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
    const [showModal, setShowModal] = useState(false);
    const [showServerDetailsModal, setShowServerDetailsModal] = useState(false);
    const [selectedServer, setSelectedServer] = useState(null);
    const [selectedCronjob, setSelectedCronjob] = useState(null);
    const [cronjobReceivedTime, setCronjobReceivedTime] = useState(null);
    const [cronjobDeadLetterTime, setCronjobDeadLetterTime] = useState(null);
    const [polygonColor, setPolygonColor] = useState(null);
    const popupRef = useRef(null);

    

    useEffect(() => {
        fetchCronjobs();
    }, []);

    const handlePolygonClick = async (node, cronjob) => {
        setSelectedServer(node);
        setSelectedCronjob(cronjob);
    
       
        const color = await decideOnColor(cronjob, node);
        setPolygonColor(color);
    
        cronjobReceivedObject.forEach(data => {
            if (data.machine_name === node && data.cronjob_name === cronjob.cronjob_name) {
                setCronjobReceivedTime(data.time);
            }
        });
    
        cronjobDeadLetterObject.forEach(data => {
            if (data.machine_name === node && data.cronjob_name === cronjob.cronjob_name) {
                setCronjobDeadLetterTime(data.time);
            }
        });
    
        // Open the modal only after everything is set
        setShowServerDetailsModal(true);
    };
    

    const handleCloseServerDetailsModal = () => {
        setShowServerDetailsModal(false);
        setSelectedServer(null);
        setSelectedCronjob(null);
        setCronjobReceivedTime(null);
        setCronjobDeadLetterTime(null);
        setPolygonColor(null);
    };

    useEffect(() => {
        const fetchHealthData = async () => {
            try {
                const response = await axiosInstance.get('/list/health');
                setHealthData(response.data);

                const updatedCronjobReceived = response.data.map(data => data.machine_name);
                const updatedCronjobReceivedNames = response.data.map(data => data.cronjob_name);
                const updatedCronjobReceivedObject = response.data;

                setCronjobReceivedNames(updatedCronjobReceivedNames);
                setCronjobReceived(updatedCronjobReceived);
                setCronjobReceivedObject(updatedCronjobReceivedObject);
            } catch (error) {
                console.error('There was an error fetching the health data!', error);
            }
        };

        fetchHealthData();
    }, []);

    const fetchCronjobs = () => {
        axiosInstance.get('/list/cronjobs')
            .then((res) => {
                let cronjob_published = [];
                setCronjobs(res.data);
                res.data.forEach(cronjob => {
                    if (cronjob.cronjob_published) {
                        cronjob_published.push(cronjob.cronjob_name);
                    }
                    const cronjobNameArray = cronjob.machine_group_names.split(",");
                    cronjobNameArray.forEach(group => {
                        fetchWorkerNodes(group);
                    });
                });
                setCronjobPublished(cronjob_published); // Save to state
            })
            .catch((error) => {
                console.error("There was an error fetching the cronjobs!", error);
                setError("There was an error fetching the cronjobs!");
            })
            .then(() => {
        axiosInstance.get('/list/deadLetter')
            .then((res) => {    
                const updatedDeadLetterName = res.data.map(data => data.cronjob_name);
                const updatedDeadLetter = res.data.map(data => data.machine_name);
                const updatedDeadLetterObject = res.data;
                setCronjobDeadLetterObject(updatedDeadLetterObject);
                setCronjobDeadLetter(updatedDeadLetter);
                setCronjobDeadLetterNames(updatedDeadLetterName);
            })
            .catch((error) => {
                console.error("There was an error fetching the cronjobs!", error);
                setError("There was an error fetching the cronjobs!");
            });
            });
    };

    const fetchWorkerNodes = (serverGroupName) => {
        axiosInstance.get(`/group/${serverGroupName}`)
            .then((res) => {
                setWorkerNodes(prevState => ({
                    ...prevState,
                    [serverGroupName]: res.data.worker_nodes
                }));
            })
            .catch((error) => {
                console.error(`There was an error fetching the worker nodes for ${serverGroupName}!`, error);
            });
    };

    // Compare cronjob_published and cronjob_received after both are fetched
    useEffect(() => {
        if (cronjobPublished.length > 0 && cronjobReceived.length > 0) {
            const commonCronjobs = cronjobPublished.filter(job => cronjobReceived.includes(job));
            setCommonCronjobs(commonCronjobs);
            // console.log("Common cronjobs: ", commonCronjobs);
            // console.log("Published cronjobs: ", cronjobPublished);
            // console.log("Received cronjobs: ", cronjobReceived);
        }
    }, [cronjobPublished, cronjobReceived]);

    const handleMouseEnter = (node, event) => {
        const rect = event.target.getBoundingClientRect();
        setHoveredServer(node);
        setHoverPosition({ x: rect.left - 10 + window.scrollX - (popupRef.current ? popupRef.current.offsetWidth : 20), y: rect.top -5 + window.scrollY - 20});
    };

    const handleMouseLeave = () => {
        setHoveredServer(null);
    };

    const handleShowModal = () => setShowModal(true);
    const handleCloseModal = () => setShowModal(false);
    const handleSaveModal = () => {
        fetchCronjobs();
        handleCloseModal();
    };

    const decideOnColor = (cronjob, node) => {
        if(cronjobReceivedNames.includes(cronjob.cronjob_name) && cronjobReceived.includes(node)){
            return "#1ABC9C"; //green
        }else if(cronjobDeadLetter.includes(node) && cronjobDeadLetterNames.includes(cronjob.cronjob_name)){
            return "#C0392B"; //red
        }else if(!cronjob.cronjob_published){
            return "#7F8C8D"; //grey
        }else if(cronjob.cronjob_published && !cronjobReceived.includes(node)){
            return "#F1C40F"; //yellow
        }
        return "#000000"; //There is an error
    };

    return (
        <div>
            <h1 className='cronjobTitle text-center'>CronManager</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div className="d-flex justify-content-end mb-3">
                <Button variant="outline-light" onClick={handleShowModal}>
                    Add Server
                </Button>
            </div>
            {cronjobs.length === 0 ? (
                <Spinner animation="border" />
            ) : (
                <div className='d-flex justify-content-center'>
                        <div className="cronjob-list row d-flex justify-content-between" >
                    {cronjobs.map(cronjob => {
                        const cronjobNameArray = cronjob.machine_group_names.split(",");
                        return (
                            <Card key={cronjob.cronjob_name} className="mb-1 col-lg-4 cronjob_card">
                                <Card.Body>
                                    <Card.Title><span className="cronjobName">{cronjob.cronjob_name}</span></Card.Title>
                                    {cronjobNameArray.map((group, index) => (
                                        <Card key={index} className="mb-3">
                                            <Card.Body>
                                                <Card.Title><span className="sgName">{group}</span></Card.Title>
                                                {workerNodes[group] && (
                                                    <div className="d-flex flex-wrap">
                                                        {workerNodes[group].map((node, nodeIndex) => (
                                                            <div
                                                                key={nodeIndex}
                                                                onMouseEnter={(event) => handleMouseEnter(node, event)}
                                                                onMouseLeave={handleMouseLeave}
                                                                className="polygon-container"
                                                            >
                                                                <Button variant="link" onClick={() => handlePolygonClick(node, cronjob)} className="polygon-button">
                                                                    <Polygon n={6} size={25} fill={decideOnColor(cronjob, node)} />
                                                                </Button>
                                                                
                                                                {/* {console.log("Node: ", node)} */}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    ))}
                                </Card.Body>
                            </Card>
                        );
                    })}
                </div>
                </div>
                
            )}
            {hoveredServer && (
                <div ref={popupRef} className="server-popup" style={{ top: hoverPosition.y, left: hoverPosition.x }}>
                    {hoveredServer}
                </div>
            )}
            <ServerDetailsModal show={showServerDetailsModal} handleClose={handleCloseServerDetailsModal} server={selectedServer} cronjob={selectedCronjob} time={cronjobReceivedTime ?? cronjobDeadLetterTime} color={polygonColor}/>
            <AddServerModal show={showModal} handleClose={handleCloseModal} handleSave={handleSaveModal} />
        </div>
    );
}

export default HomeCronjobList;