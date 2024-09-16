import React, { useState } from 'react';
import axios from 'axios';
import axiosInstance from '../../axiosConfig';
import { InputGroup, Form, Button, Spinner } from 'react-bootstrap';

function SGForm({ onGroupCreated }) {
  const [groupName, setGroupName] = useState('');
  const [groupStatus, setGroupStatus] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true); // Start loading when the form is submitted

    const data = {
      machine_group_name: groupName,
      machine_group_status: groupStatus
    };

    axiosInstance.post('/group/add', data)
      .then(response => {
        if (response.status === 201) {
          setSuccessMessage('Machine group created successfully.');
          setErrorMessage('');
          setGroupName('');
          setGroupStatus(0);
          onGroupCreated();  // Notify the parent to refresh the list
        }
      })
      .catch(error => {
        if (error.response && error.response.status === 400) {
          setErrorMessage('Invalid input data or extra field.');
        } else if (error.response && error.response.status === 500) {
          setErrorMessage('Failed to create machine group.');
        } else {
          setErrorMessage('An unexpected error occurred.');
        }
        setSuccessMessage('');
      })
      .finally(() => {
        setLoading(false); // Stop loading after the request is complete
      });
  };

  return (
    <>
      <h1>Server Group Form</h1>
      <Form onSubmit={handleSubmit}>
        <InputGroup className="mb-3">
          <InputGroup.Text id="basic-addon1">@</InputGroup.Text>
          <Form.Control
            placeholder="Machine Group Name"
            aria-label="machine_group_name"
            aria-describedby="basic-addon1"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            disabled={loading} // Disable input when loading
          />
        </InputGroup>

        <Form.Group className="mb-3">
          <Form.Label>Status</Form.Label>
          <Form.Control
            as="select"
            value={groupStatus}
            onChange={(e) => setGroupStatus(parseInt(e.target.value, 10))}
            disabled={loading} // Disable input when loading
          >
            <option value={0}>Inactive</option>
            <option value={1}>Active</option>
          </Form.Control>
        </Form.Group>

        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Submit'}
        </Button>
      </Form>

      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
    </>
  );
}

export default SGForm;