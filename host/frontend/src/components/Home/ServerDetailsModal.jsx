import React from 'react';
import { Modal, Button, Badge } from 'react-bootstrap';

function ServerDetailsModal({ show, handleClose, server, cronjob, time, color}) {
    let status;
    let sent = true;
    if(color == "#1ABC9C"){
        status = "Success";
    }else if(color == "#C0392B"){
        status = "Failed";
    }else if(color == "#7F8C8D"){
        sent = false;
        status = "Cronjob not sent yet";
    }else if(color == "#F1C40F"){
        status = "No response from this server yet";
    }


    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Server Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {server && (
                    <div>
                        <p><strong>Server Name:</strong> {server}</p>
                        {cronjob && (
                            <>
                                <p><strong>Cronjob Name:</strong> {cronjob.cronjob_name}</p>
                                <p><strong>Cronjob Content:</strong> {cronjob.cronjob_content}</p>
                                <p><strong>Cronjob Status:</strong> {cronjob.cronjob_status}</p>
                                {sent ? <p><strong>Time:</strong> {time ?? " Waiting for a response"}</p> : <></>}
                                <p style={{ color: color }}><strong>Status:</strong>&nbsp;{status}</p>
                            </>
                        )}
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default ServerDetailsModal;