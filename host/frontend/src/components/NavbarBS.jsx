import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faServer, faUsers, faClock, faHeartbeat, faUpload } from '@fortawesome/free-solid-svg-icons';
import { LinkContainer } from 'react-router-bootstrap';
import JotformLogoDark from '../assets/jotform-logo-transparent-W-800x400.png';

function NavbarBS() {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand href="/home" style={{ color: '#61dafb' }}>CronManager</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <LinkContainer to="/server-groups">
              <Nav.Link>
                <FontAwesomeIcon icon={faUsers} /> Server Groups
              </Nav.Link>
            </LinkContainer>

            <LinkContainer to="/health">
              <Nav.Link>
                <FontAwesomeIcon icon={faHeartbeat} /> Health
              </Nav.Link>
            </LinkContainer>

            <LinkContainer to="/cronjobs">
              <Nav.Link>
                <FontAwesomeIcon icon={faClock} /> Cronjobs
              </Nav.Link>
            </LinkContainer>

            <LinkContainer to="/publish">
              <Nav.Link>
                <FontAwesomeIcon icon={faUpload} /> Publish
              </Nav.Link>
            </LinkContainer>
          </Nav>
          <Nav className="ms-auto" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <div className='navbarJotform'>
              <img src={JotformLogoDark} alt="Jotform Logo" style={{ height: '25px' }} />
              <div className='divJotform'>
                |
              </div>
              <div className='divEnterprise'>
                <span style={{color: '#ffffff', fontSize:'20px'}}>Enterprise</span>
              </div>
              
            </div>
          </Nav>

        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavbarBS;