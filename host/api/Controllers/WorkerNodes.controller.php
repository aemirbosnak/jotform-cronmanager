<?php
require_once __DIR__ . "/../Config/db.php";
require_once __DIR__ . "/../Config/queries.php";
require_once __DIR__ . "/../Models/WorkerNodes.model.php";

set_time_limit(300);

class WorkerNodesController {
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function readWorkerNodesList()
    {
        try {
            $stmt = $this->db->query(getAllWorkersQuery());
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            header('Content-Type: application/json');
            return json_encode($result);
        }
        catch (PDOException $e) {
            error_log("Error reading worker nodes list: " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to get worker nodes list."]);
        }
    }

   public function createWorkerNodes()
   {
        try {
            header('Content-Type: application/json');
            $data = json_decode(file_get_contents("php://input"), true);

            if (!$this->validateCronjobData($data) || count($data) !== 2) {
                http_response_code(400);
                return json_encode(["error" => "Invalid input data or extra field"]);
            }
            $this->db->beginTransaction();
            $stmt = $this->db->prepare(insertWorkerNodeQuery());
            if ($stmt->execute((new WorkerNodes($data['machine_name'], $data['machine_group_id']))->toArray())) {
                (new GCPHelper($this->db))->createSubscription($data['machine_name'], $data['machine_group_id']);
                $this->db->commit();
                http_response_code(201);

                $this->db->beginTransaction();
                $stmt = $this->db->prepare(newWorkerNodeInsertedPublishQuery());
                try {
                    $stmt->execute(["machine_name" => $data['machine_name']]);
                    error_log("Cronjob Publish to 0");
                    $this->db->commit();
                } catch (Exception $e) {
                    $this->db->rollBack();
                    error_log("Error publishing new worker node: " . $e->getMessage());
                }

                return json_encode(["message" => "Worker node inserted successfully."]);
            } else {
                $this->db->rollBack();
                throw new Exception("Failed to execute insert received cronjob");
            }
        }
        catch (Exception $e) {
            $this->db->rollBack();
            error_log("Error inserting worker node: " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to insert worker node."]);
        }
   }

   public function editWorkerNodes($machineName)
   {
        try {
            header('Content-Type: application/json');
            $data = json_decode(file_get_contents("php://input"), true);
            if (!$this->validateCronjobData($data) || count($data) !== 2) {
                http_response_code(400);
                return json_encode(["error" => "Invalid input data or missing ID."]);
            }

            // Get machine id
            $stmt = $this->db->prepare(getInfoFromWorkerNameQuery());
            $stmt->execute([':machine_name' => $machineName]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $machineId = $result['worker_node_id'];
            $oldMachineGroupName = $result['machine_group_name'];
            $oldMachineGroupId = $result['machine_group_id'];

            // Change cronjobs related to this machine to unpublished if the server's group changed
            if ($oldMachineGroupId != $data['machine_group_id']) {
                $stmt = $this->db->prepare(getCronjobsInMachineGroup());
                $stmt->execute([':machine_group_id' => $data['machine_group_id']]);
                $cronjobs = $stmt->fetchAll(PDO::FETCH_ASSOC);

                foreach ($cronjobs as $cronjob) {
                    if ($cronjob['cronjob_published'] == 1) {
                        try {
                            $this->db->beginTransaction();
                            $stmt = $this->db->prepare(setCronjobPublishedQuery());
                            $stmt->execute([':cronjob_name' => $cronjob['cronjob_name']]);
                            $this->db->commit();
                        }
                        catch (Exception $e) {
                            $this->db->rollBack();
                            error_log("Error when changing cronjob_publish status: " . $e->getMessage());
                        }
                    }
                }
            }

            $this->db->beginTransaction();
            $params = array_merge([':id' => $machineId], (new WorkerNodes($data['machine_name'], $data['machine_group_id']))->toArray());
            $stmt = $this->db->prepare(updateWorkerNodeQuery());

            if ($stmt->execute($params)) {
                try {
                    if (strcmp($machineName, $data['machine_name']) != 0 || $oldMachineGroupId != $data['machine_group_id']) {
                        (new GCPHelper($this->db))->deleteSubscription($oldMachineGroupName, $machineName);
                        (new GCPHelper($this->db))->createSubscription($data['machine_name'], $data['machine_group_id']);
                        $this->db->commit();
                    }
                }
                catch (Exception $e) {
                    $this->db->rollBack();
                    error_log("GCP error: " . $e->getMessage());
                    http_response_code(500);
                    return json_encode(["error" => "Failed to update worker node."]);
                }
                http_response_code(200);
                return json_encode(["message" => "Worker node updated successfully."]);
            } else {
                throw new Exception("Failed to execute update worker node.");
            }
        }
        catch (Exception $e) {
            error_log("Error updating worker node: " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to update worker node."]);
        }
   }

   public function deleteWorkerNodes()
   {
        try {
            header('Content-Type: application/json');
            $data = json_decode(file_get_contents("php://input"), true);

            
            if (!isset($data['machine_name'])) {
                http_response_code(400);
                return json_encode(["error" => "Invalid machine name."]);
            }

            $stmt = $this->db->prepare(getMachineGroupNameFromMachineName());
            $stmt->execute([':machine_name' => $data['machine_name']]);
            $machine = $stmt->fetch(PDO::FETCH_ASSOC);
            $machineGroupName = $machine['machine_group_name'];

            $this->db->beginTransaction();
            $stmt = $this->db->prepare(deleteWorkerNodeQuery());
            $stmt->execute([":machine_name" => $data['machine_name']]);

            (new GCPHelper($this->db))->deleteSubscription($machineGroupName, $data['machine_name']);

            $this->db->commit();
            http_response_code(200);
            return json_encode(["message" => "Machine deleted successfully."]);
        }
        catch (Exception $e) {
            $this->db->rollBack();
            error_log("Error deleting worker node: " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to delete worker node."]);
        }
   }

   public function createHealthCheck()
   {
        try {
            $data = json_decode(file_get_contents("php://input"), true);
            if (!$this->validateReceivedCronjobData($data) || count($data) !== 4) {
                http_response_code(400);
                return json_encode(["error" => "Invalid input data or extra field"]);
            }
            $this->db->beginTransaction();
            $stmt = $this->db->prepare(insertReceivedCronjob());
            $params = [
                ':cronjob_id' => $data['cronjob_id'],
                ':machine_id' => $data['machine_id'],
                ':cronjob_status' => $data['cronjob_status'],
                ':operation_status' => $data['operation_status']
            ];
            $stmt->execute($params);
            $this->db->commit();
            return json_encode(["message" => "Create successful"]);
        }
        catch (Exception $e) {
            $this->db->rollBack();
            error_log("Error creating cronjob: " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to create cronjob."]);
        }
    }

    public function getInfoFromWorkerName($machineName)
    {
        $stmt = $this->db->prepare(getInfoFromWorkerNameQuery());
        $stmt->execute([':machine_name' => $machineName]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        header('Content-Type: application/json');
        return json_encode($result);
    }

    private function validateCronjobData($data)
    {
        return isset($data['machine_name'], $data['machine_group_id']);
    }

    private function validateReceivedCronjobData($data)
    {
        return isset($data['cronjob_status'], $data['cronjob_id'], $data['operation_status'], $data['machine_id']);
    }
}