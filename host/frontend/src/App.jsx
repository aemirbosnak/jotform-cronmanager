import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import NavbarBS from './components/NavbarBS';
import ServerGroupsPage from './components/ServerGroups/SGPage';
import ServerPage from './components/Servers/ServerPage';
import HealthPage from './components/Status/HealthPage';
import CronjobPage from './components/Cronjobs/CronjobPage';
import ServerGroupServersPage from './components/ServerGroups/ServerGroupServersPage';
import PublishPage from './components/Publish/PublishPage';
import HomePage from './components/Home/HomePage';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
    return (
        <Router>
            <NavbarBS />
            <Container className='mainPage mt-3 p-3'>
                <Routes>
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/server-groups" element={<ServerGroupsPage />} />
                    <Route path="/server-groups/:groupName" element={<ServerGroupServersPage />} />
                    {/* <Route path="/servers" element={<ServerPage />} /> */}
                    <Route path="/health" element={<HealthPage />} />
                    <Route path="/cronjobs" element={<CronjobPage />} />
                    <Route path="/publish" element={<PublishPage />} />
                    <Route path="*" element={<Navigate to="/home" />} />
                </Routes>
            </Container>
        </Router>
    );
}

export default App;