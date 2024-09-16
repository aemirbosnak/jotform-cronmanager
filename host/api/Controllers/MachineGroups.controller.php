<?php
require_once __DIR__ . "/../Config/db.php";
require_once __DIR__ . "/../Config/queries.php";
require_once __DIR__ . "/../Models/MachineGroups.model.php";



class MachineGroupsController {
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function readMachineGroupsList ()
    {
        try {
            header('Content-Type: application/json');
            $stmt = $this->db->prepare(getAllMachineGroupQuery());
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return json_encode($result);
        } catch (Exception $e) {
            error_log("Error retrieving machine groups: " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to retrieve machine groups."]);
        }
    }

    public function createMachineGroup()
    {
        ini_set('max_execution_time', '120');
        header('Content-Type: application/json');
        $data = json_decode(file_get_contents("php://input"), true);

        if (!$this->validateMachineGroupData($data) || count($data) !== 2) {
            http_response_code(400);
            return json_encode(["error" => "Invalid input data or extra field"]);
        }

        $this->db->beginTransaction();
        $stmt = $this->db->prepare(createMachineGroupQuery());
        if ($stmt->execute((new MachineGroups($data['machine_group_name'], $data['machine_group_status']))->toArray())) {
            try {
                (new GCPHelper($this->db))->createTopic($data['machine_group_name']);
                $this->db->commit();
                http_response_code(201);
                return json_encode(["message" => "Machine group created successfully."]);
            }
            catch (Exception $e) {
                $this->db->rollBack();
                error_log("Error creating GCP topics: " . $e->getMessage());
                http_response_code(500);
                return json_encode(["error" => "Failed to create machine group"]);
            }
        }
        else {
            throw new Exception("Failed to execute insert machine group");
        }
    }

    public function deleteMachineGroup()
    {
        header('Content-Type: application/json');
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['machine_group_name'])) {
            http_response_code(400);
            return json_encode(["error" => "Missing machine group name."]);
        }

        try {
            // Remove from database
            $this->db->beginTransaction();
            $stmt = $this->db->prepare(deleteMachineGroupQuery());
            $stmt->execute([':machine_group_name' => $data['machine_group_name']]);

            // Remove machine group from GCP
            (new GCPHelper($this->db))->deleteTopic($data['machine_group_name']);

            $this->db->commit();
            http_response_code(200);
            return json_encode(["message" => "Machine group deleted successfully."]);
        }
        catch (PDOException $e) {
            // Check if there are cronjobs connected to this machine group
            if ($e->getCode() === '23000') { // 23000 is the SQLSTATE code for integrity constraint violation
                http_response_code(409); // 409 Conflict
                return json_encode(["error" => "Cannot delete machine group. There are cronjobs or servers associated with this group."]);
            }
            $this->db->rollBack();
            error_log("Database error while deleting machine group: " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Database error occurred while deleting machine group."]);
        }
        catch (Exception $e) {
            $this->db->rollBack();
            error_log("Error deleting machine group from GCP: " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to delete machine group"]);
        }
    }

    public function getMachineGroup($machineGroupName)
    {
        header('Content-Type: application/json');

        try {
            $stmt = $this->db->prepare(getMachineGroupWithName());
            $stmt->execute([':machine_group_name' => $machineGroupName]);
            $machineGroup = $stmt->fetch(PDO::FETCH_ASSOC);

            $stmt = $this->db->prepare(getWorkerNodesForMachine());
            $stmt->execute([':machine_group_id' => $machineGroup['id']]);
            $machines = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $workerNodes = [];
            foreach ($machines as $machine) {
                $workerNodes[] = $machine['machine_name'];
            }

            $data = [
                "machine_group_id" => $machineGroup['id'],
                "worker_nodes" => $workerNodes
            ];

            http_response_code(200);
            return json_encode($data);
        }
        catch (Exception $e) {
            error_log("Error getting machine group info: " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to get machine group data"]);
        }
    }

    /** PRIVATE HELPER FUNCTIONS */
    private function validateMachineGroupData($data)
    {
        return isset($data['machine_group_name'], $data['machine_group_status']);
    }
}