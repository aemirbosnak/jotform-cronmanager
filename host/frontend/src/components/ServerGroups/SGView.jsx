import React from 'react';
import { Spinner, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEdit, faEye } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const SGView = ({ serverGroups, onDelete, deleteLoading }) => {
    const navigate = useNavigate();

    const handleViewServers = (groupName) => {
        navigate(`/server-groups/${groupName}`);
    };

    return (
        <div>
            {serverGroups.map((serverGroup) => (
                <div key={serverGroup.id} className="d-flex justify-content-between align-items-center mb-3 p-3 border rounded cardSG-orange">
                    <div className="d-flex align-items-center">
                        <h5 className="mb-0 mr-2">{serverGroup.machine_group_name}</h5> {/* Increased margin */}
                        <p className="mb-0 ml-2" style={{ color: serverGroup.machine_group_status === 1 ? 'green' : 'red' }}> {/* Increased margin */}
                            {serverGroup.machine_group_status === 1 ? 'Active' : 'Inactive'}
                        </p>
                    </div>
                    <div>
                        <Button variant="danger" onClick={() => onDelete(serverGroup.machine_group_name)} disabled={deleteLoading[serverGroup.id]}>
                            {deleteLoading[serverGroup.id] ? <Spinner animation="border" size="sm" /> : <FontAwesomeIcon icon={faTrash} />}
                        </Button>
                        <Button variant="primary" className="ml-2" onClick={() => handleViewServers(serverGroup.machine_group_name)}>
                            <FontAwesomeIcon icon={faEye} /> View Servers
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default SGView;