import React from 'react';
import { Spinner, Card, Container, Row, Col, Table } from 'react-bootstrap';

const HealthView = ({ healthData, deadLetterHealthLogs, loading }) => {
    if (loading) {
        return <Spinner animation="border" />;
    }

    if (!healthData && healthData.length === 0 && deadLetterHealthLogs && deadLetterHealthLogs.length === 0) {
        return <div>No health data available.</div>;
    }

    return (
        <Container>
            <h1 className="my-4 cronjobText">Health Status</h1>
            <Row>
                {healthData.map((data) => (
                    <Col key={data.id} sm={12} md={6} lg={4} className="mb-4">
                        <Card className="cardStatus">
                            <Card.Body>
                                <Card.Title><span className='cronjobText'>{data.cronjob_name}</span></Card.Title>
                                <Card.Text>
                                    <span className='cronjobText'><strong>Cronjob Content:</strong> {data.cronjob_content}</span>
                                </Card.Text>
                                <Card.Text>
                                    <span className='cronjobText'><strong>Cronjob Status:</strong> {data.cronjob_status}</span>
                                </Card.Text>
                                <Card.Text>
                                    <span className='cronjobText'><strong>Operation Status:</strong> {data.operation_status}</span>
                                </Card.Text>
                                <Card.Text>
                                    <span className='cronjobText'><strong>Machine ID:</strong> {data.machine_id}</span>
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
            <h2 className="my-4 cronjobText">Dead Letter Health Logs</h2>
            <Row>
                <Col sm={12}>
                    {deadLetterHealthLogs.length === 0 ? (
                        <div>No dead letter health logs available.</div>
                    ) : (
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Destination Machine</th>
                                    <th>Log</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deadLetterHealthLogs.sort((a, b) => new Date(b.time) - new Date(a.time)).map((log, index) => (
                                    <tr key={index}>
                                        <td>{log.time}</td>
                                        <td>{log.destination_machine}</td>
                                        <td>Error in destination machine <strong>{log.destination_machine}</strong> at <strong>{log.time}</strong></td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Col>
            </Row>
        </Container>
    );
}

export default HealthView;