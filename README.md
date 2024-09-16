# Google Pub/Sub CronManager

## Table of Contents

1. Introduction
2. Architecture Overview
    - Host
    - Worker
3. Setup and Installation
    - Prerequisites
    - Host Setup
    - Worker Setup

## Introduction

The **Google Pub/Sub CronManager** is a system designed to manage cronjobs across distributed servers using Google Pub/Sub as the message broker.
The project is split into two main components: **Host** and **Worker**. The Host component handles the backend, API, and frontend for managing cronjobs, while the Worker component is responsible for executing the cronjobs on individual servers.

## Architecture Overview

### Host

The Host component manages the creation, management and sending of cronjobs. It consists of:

- **Backend**: API and logic for managing cronjobs and server groups and interacting with Google Pub/Sub functionalities.
- **Frontend**: Web interface for interacting with the system.
- **Database**: Stores information about cronjobs, servers, and server groups.

### Worker

The Worker component runs on each server and listens for cronjob messages. It performs the following tasks:

- **Message Pulling**: Subscribes to Google Pub/Sub and pulls cronjobs assigned to itself.
- **Cronjob Management**: Adds, updates, or removes cronjobs in the server's crontab based on the received messages.

## Setup and Installation

### Prerequisites

- Docker
- Google Cloud Account with Pub/Sub enabled
- Google Cloud Service Key

### Host Setup

### TODO

1. Clone the repository:

    ```bash
    git clone https://github.com/kirellkekw/cronmanager/cronmanager.git
    cd cronmanager/host
    ```

2. Set up mysql database and database table:

   ```mysql
   CREATE TABLE cronjobmanager;
   SOURCE db_schemas.sql;
   ```

3. Start the backend:

    ```bash
    cd cronmanager/host/api
    php -S 0.0.0.0:8080
    ```

4. Start the frontend:

    ```bash
    cd cronmanager/host/frontend
    npm install
    npm run dev
    ```
    
### Worker Setup

1. Clone the repository:

    ```bash
    mkdir -p /opt/cronmanager && \
    git clone https://github.com/kirellkekw/cronmanager/cronmanager.git /opt/cronmanager && \
    cd /opt/cronmanager/worker
    ```

2. Modify `config.yaml` with the appropriate values, such as api endpoint and project name.

3. Run the setup script:

    ```bash
    chmod +x setup.sh
    ./setup.sh # contains all the necessary steps to setup the worker
    ```

4. All done! The worker is now running and will automatically process messages from Google Pub/Sub.
    - To check the logs, use `journalctl -u cronmanager.service`.
    - You can also use `systemctl` to start, stop, and restart the service, same fashion as any other systemd service.
    - To uninstall the service, use `/opt/cronmanager/worker/uninstall.sh` with elevated privileges.
