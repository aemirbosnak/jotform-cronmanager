<?php
function getCronjobByName($aggregate = false) {
    if ($aggregate) {
        return "SELECT  cl.id, cronjob_name, cronjob_content, cronjob_status,
                        GROUP_CONCAT(DISTINCT cmg.machine_group_id ORDER BY cmg.machine_group_id ASC) AS machine_group_ids,
                        GROUP_CONCAT(DISTINCT mg.machine_group_name ORDER BY mg.machine_group_name ASC) AS machine_group_names
                FROM cronjob_list cl 
                JOIN cronjob_machine_group cmg ON cl.id = cmg.cronjob_id 
                JOIN machine_groups mg ON mg.id = cmg.machine_group_id 
                WHERE cl.cronjob_name = :cronjob_name
                GROUP BY cl.cronjob_name, cl.cronjob_content, cl.cronjob_status";
    } else {
        return "SELECT  cl.id, cronjob_name, cronjob_content, cronjob_status,
                        machine_group_id, machine_group_name
                FROM cronjob_list cl 
                JOIN cronjob_machine_group cmg ON cl.id = cmg.cronjob_id 
                JOIN machine_groups mg ON mg.id = cmg.machine_group_id 
                WHERE cl.cronjob_name = :cronjob_name";
    }
}

function getCronjobsInMachineGroup() {
    return "SELECT cl.id AS cronjob_id, cl.cronjob_name, cl.cronjob_content,
                   cl.cronjob_status, cl.cronjob_published,
                   mg.id AS machine_group_id, mg.machine_group_name
            FROM cronjob_list cl
            JOIN cronjob_machine_group cmg ON cl.id = cmg.cronjob_id
            JOIN machine_groups mg ON cmg.machine_group_id = mg.id
            WHERE mg.id = :machine_group_id";
}

function getExistingMachineIds(){
    return "SELECT cronjob_id, machine_group_id
            FROM cronjob_machine_group
            WHERE cronjob_id = :cronjob_id";
}

function insertCronjobQuery() {
    return "INSERT INTO cronjob_list (cronjob_name, cronjob_content, cronjob_status) 
            VALUES (:cronjob_name, :cronjob_content, :cronjob_status)";
}

function setCronjobStatusQuery() {
    return "UPDATE cronjob_list
            SET cronjob_status = :cronjob_status
            WHERE cronjob_name = :cronjob_name";
}

function deleteSelectedCronjobMachineGroupIdsQuery() {
    return "DELETE FROM cronjob_machine_group 
            WHERE cronjob_id = :cronjob_id AND machine_group_id = :machine_group_id";
}

function registerCronjobMachineGroupQuery() {
    return "INSERT INTO cronjob_machine_group (cronjob_id, machine_group_id) 
            VALUES (:cronjob_id, :machine_group_id)";
}

function updateCronjobQuery() {
    return "UPDATE cronjob_list 
            SET cronjob_content = :cronjob_content, cronjob_name = :cronjob_name, cronjob_status = :cronjob_status
            WHERE id = :id";
}

function deleteCronjobQuery() {
    return "DELETE FROM cronjob_list 
            WHERE cronjob_name = :cronjob_name";
}

function getMachineNamesFromMachineGroup() {
    return "SELECT machine_group_name
            FROM worker_nodes wn
            JOIN machine_groups mg ON (wn.machine_group_id = mg.id)
            WHERE machine_group_id = :machine_group_id";
}

function getMachineGroupNameFromMachineName() {
    return "SELECT machine_group_name
            FROM worker_nodes wn
            JOIN machine_groups mg ON (wn.machine_group_id = mg.id)
            WHERE machine_name = :machine_name";
}

function getMachineGroupName(){
    return "SELECT machine_group_name
            FROM machine_groups
            WHERE id = :machine_group_id";
}

function insertReceivedCronjob(){
    return "INSERT INTO cronjob_received (cronjob_id, machine_id, cronjob_status, operation_status)
    VALUES (:cronjob_id, :machine_id, :cronjob_status, :operation_status)";
}

/* WorkerNodes Queries */
function insertWorkerNodeQuery() {
    return "INSERT INTO worker_nodes (machine_name, machine_group_id) 
            VALUES (:machine_name, :machine_group_id)";
}

function updateWorkerNodeQuery() {
    return "UPDATE worker_nodes 
            SET machine_name = :machine_name, machine_group_id = :machine_group_id 
            WHERE id = :id";
}

function deleteWorkerNodeQuery() {
    return "DELETE FROM worker_nodes 
            WHERE machine_name = :machine_name";
}

function newWorkerNodeInsertedPublishQuery() {
    return "UPDATE cronjob_list cl
            JOIN cronjob_machine_group c ON cl.id = c.cronjob_id
            JOIN machine_groups mg ON c.machine_group_id = mg.id
            JOIN worker_nodes w ON mg.id = w.machine_group_id
            SET cl.cronjob_published = 0
            WHERE cl.cronjob_published = 1
            AND w.machine_name = :machine_name";
}

function getInfoFromWorkerNameQuery() {
    return "SELECT w.id worker_node_id, m.machine_group_name, m.id machine_group_id 
            FROM worker_nodes w 
            JOIN machine_groups m on(w.machine_group_id = m.id) 
            WHERE w.machine_name = :machine_name";
}

function getWorkerNodesForMachine() {
    return "SELECT id, machine_name, machine_group_id
            FROM worker_nodes
            WHERE machine_group_id = :machine_group_id";
}


/* MachineGroups Queries */
function getMachineGroupWithId() {
    return "SELECT id, machine_group_name, machine_group_status
            FROM machine_groups
            WHERE id = :id";
}

function getMachineGroupWithName() {
    return "SELECT id, machine_group_name, machine_group_status
            FROM machine_groups
            WHERE machine_group_name = :machine_group_name";
}

function createMachineGroupQuery() {
    return "INSERT INTO machine_groups (machine_group_name, machine_group_status) 
            VALUES (:machine_group_name, :machine_group_status)";
}

function updateMachineGroupQuery() {
    return "UPDATE machine_groups 
            SET machine_group_name = :machine_group_name, machine_group_status = :machine_group_status 
            WHERE id = :id";
}

function deleteMachineGroupQuery() {
    return "DELETE FROM machine_groups 
            WHERE machine_group_name = :machine_group_name";
}

/* List Queries */
function getAllCronjobsQuery($aggregate = false) {
    if ($aggregate) {
        return "SELECT  cl.id AS cronjob_id, 
                        cronjob_name, 
                        cronjob_content, 
                        cronjob_status,
                        cronjob_published,
                        GROUP_CONCAT(DISTINCT mg.machine_group_name ORDER BY mg.machine_group_name ASC) AS machine_group_names,
                        GROUP_CONCAT(DISTINCT mg.machine_group_status ORDER BY mg.machine_group_status ASC) AS machine_group_statuses
                FROM cronjob_list cl 
                JOIN cronjob_machine_group cmg ON cl.id = cmg.cronjob_id 
                JOIN machine_groups mg ON mg.id = cmg.machine_group_id 
                GROUP BY cl.id, cronjob_name, cronjob_content, cronjob_status";
    } else {
        return "SELECT  cl.id AS cronjob_id, 
                        cronjob_name, 
                        cronjob_content, 
                        cronjob_status, 
                        mg.machine_group_name,
                        mg.machine_group_status
                FROM cronjob_list cl 
                JOIN cronjob_machine_group cmg ON cl.id = cmg.cronjob_id 
                JOIN machine_groups mg ON mg.id = cmg.machine_group_id";
    }
}

function getAllWorkersQuery() {
    return "SELECT id, machine_name, machine_group_id
            FROM worker_nodes";
}

function getAllMachineGroupQuery() {
    return "SELECT id, machine_group_name, machine_group_status
            FROM machine_groups";
}

function getAllCronjobReceivedQuery() {
    return "SELECT cl.id, cl.time, cl.cronjob_name, cl.cronjob_content, cr.cronjob_status, cr.operation_status, cr.machine_id, wn.machine_name
            FROM cronjob_received cr
            JOIN cronjob_list cl ON (cr.cronjob_id = cl.id)
            JOIN worker_nodes wn ON (cr.machine_id = wn.id)";
}

function setCronjobPublishedQuery(){
    return "UPDATE cronjob_list
            SET cronjob_published = NOT cronjob_published
            WHERE cronjob_name = :cronjob_name;";
}
/* Dead letter table queries */
function insertIntoDeadLetter()
{
    return "INSERT INTO dead_letter (time, cronjob_id, cronjob_name, cronjob_content, machine_id, machine_name) 
            VALUES (:publish_time, :cronjob_id, :cronjob_name, :cronjob_content, :machine_id, :machine_name)
            ON DUPLICATE KEY UPDATE
            cronjob_name = VALUES(cronjob_name),
            cronjob_content = VALUES(cronjob_content),
            machine_name = VALUES(machine_name)";
}

function listDeadLettersQuery()
{
    return "SELECT cronjob_id, cronjob_name, cronjob_content, 
                   machine_id, machine_name, time
            FROM dead_letter";
}

function deleteFromDeadLetterQuery()
{
    return "DELETE FROM dead_letter
            WHERE cronjob_name = :cronjob_name";
}

/* Dead letter health table queries */
function insertIntoDeadLetterHealth()
{
    return "INSERT INTO dead_letter_health (time, machine_id, machine_name) 
            VALUES (:publish_time, :machine_id, :machine_name)";
}

function listDeadLetterHealthQuery()
{
    return "SELECT destination_machine, time
            FROM dead_letter_health";
}

function deleteFromCronjobReceived()
{
    return "DELETE FROM cronjob_received
            WHERE cronjob_id = :cronjob_id";
}
?>