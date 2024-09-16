<?php

require_once __DIR__ . "/../Models/CronjobList.model.php";
require_once __DIR__ . "/../Config/db.php";
require_once __DIR__ . "/../Config/queries.php";

class CronjobController {
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function readCronjobList()
    {
        try {
            $stmt = $this->db->query(getAllCronjobsQuery(true));
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            header('Content-Type: application/json');
            return json_encode($result);
        }
        catch (PDOException $e) {
            error_log("Error reading cronjob list: " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to get cronjob list."]);
        }
    }

    public function getCronjob($cronjobName)
    {
        header('Content-Type: application/json');

        try {
            $stmt = $this->db->prepare(getCronjobByName(true));
            $stmt->execute([':cronjob_name' => $cronjobName]);
            $cronjob = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($cronjob) {
                $response = [
                    "cronjob_name" => $cronjob['cronjob_name'],
                    "cronjob_content" => $cronjob['cronjob_content'],
                    "cronjob_status" => (int)$cronjob['cronjob_status'],
                    "machine_group_ids" => array_map('intval', explode(',', $cronjob['machine_group_ids'])),
                    "machine_group_names" => explode(',', $cronjob['machine_group_names']),
                ];

                http_response_code(200);
                return json_encode($response);
            } else {
                http_response_code(404);
                return json_encode(["error" => "Cronjob not found"]);
            }
        }
        catch (Exception $e) {
            error_log("Error getting cronjob info: " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to get cronjob data"]);
        }
    }

    public function createCronjob()
    {
        try {
            header('Content-Type: application/json');
            $data = json_decode(file_get_contents("php://input"), true);

            if (!$this->validateCronjobData($data) || count($data) !== 4) {
                http_response_code(400);
                return json_encode(["error" => "Invalid input data or extra field"]);
            }

            // Validate cronjob content
            if (!($validatedCronjobContent = $this->isValidCronjobContent($data['cronjob_content']))) {
                http_response_code(400);
                return json_encode(["error" => "Cronjob content is not in correct format"]);
            }

            $this->db->beginTransaction();
            $stmt = $this->db->prepare(insertCronjobQuery());

            $cronjob = new CronjobList($validatedCronjobContent, $data['cronjob_name'], $data['cronjob_status']);
            $stmt->execute($cronjob->toArray());

            $machine_group_ids = $data['machine_group_ids'];
            $cronjob->id = $this->db->lastInsertId();

            $stmt = $this->db->prepare(registerCronjobMachineGroupQuery());

            foreach ($machine_group_ids as $mg_id) {
                if (is_int($mg_id)) {
                    $stmt->execute([':cronjob_id' => $cronjob->id, ':machine_group_id' => $mg_id]);
                } else {
                    throw new Exception("Invalid machine group id.");
                }
            }
            $this->db->commit();
            http_response_code(201);
            return json_encode(["message" => "Create successful"]);
        }
        catch (Exception $e) {
            $this->db->rollBack();
            error_log("Error creating cronjob: " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to create cronjob."]);
        }
    }

    public function updateCronjob($cronjobName)
    {
        try {
            header('Content-Type: application/json');
            $data = json_decode(file_get_contents("php://input"), true);

            // Get cronjob id
            $stmt = $this->db->prepare(getCronjobByName(aggregate: true));
            $stmt->execute([':cronjob_name' => $cronjobName]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $cronjobId = $result['id'];

            if (!($validatedCronjobContent = $this->isValidCronjobContent($data['cronjob_content']))) {
                http_response_code(400);
                return json_encode(["error" => "Cronjob content is not in correct format"]);
            }

            $cronjob = new CronjobList($validatedCronjobContent, $data['cronjob_name'], $data['cronjob_status']);

            $this->db->beginTransaction();
            $stmt = $this->db->prepare(getExistingMachineIds());
            $stmt->execute([':cronjob_id' => $cronjobId]);
            $existingMachineIds = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $existingMachineIdsArray = [];
            foreach ($existingMachineIds as $item) {
                $existingMachineIdsArray[] = $item['machine_group_id'];
            }

            $incomingMachineIds = $data['machine_group_ids'];

            // Machine Ids that will be added
            $toAdd = array_values(array_diff($incomingMachineIds, $existingMachineIdsArray));
            // Machine Ids that will be deleted
            $toDelete = array_values(array_diff($existingMachineIdsArray, $incomingMachineIds));

            $deleteStmt = $this->db->prepare(deleteSelectedCronjobMachineGroupIdsQuery());
            foreach ($toDelete as $mg_id) {
                $deleteStmt->execute([':cronjob_id' => $cronjobId, ':machine_group_id' => $mg_id]);
            }
            $addStmt = $this->db->prepare(registerCronjobMachineGroupQuery());

            foreach ($toAdd as $mg_id) {
                $addStmt->execute([':cronjob_id' => $cronjobId, ':machine_group_id' => $mg_id]);
            }

            // Update cronjob 
            try {
                $stmt = $this->db->prepare(updateCronjobQuery());
                $stmt->execute(array_merge([':id' => $cronjobId],$cronjob->toArray()));
                $this->db->commit();
                return json_encode(["message" => "Cronjob updated successfully."]);
            }
            catch (Exception $e) {
                error_log("Error updating cronjob: " . $e->getMessage());
                http_response_code(500);
                return json_encode(["error" => "Failed to update cronjob."]);
            }
        } catch(Exception $e) {
            $this->db->rollBack();
            error_log("Error updating cronjob: " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to update cronjob."]);
        }
    }

    public function deleteCronjob()
    {
        header('Content-Type: application/json');
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['cronjob_name'])) {
            http_response_code(400);
            return json_encode(["error" => "Missing cronjob name."]);
        }

        try {
            $this->db->beginTransaction();
            $stmt = $this->db->prepare(setCronjobStatusQuery());
            $stmt->execute([
                ':cronjob_name' => $data['cronjob_name'],
                ':cronjob_status' => 4
            ]);

            (new GCPHelper($this->db))->publishMessage($data['cronjob_name']);

            $stmt = $this->db->prepare(deleteCronjobQuery());
            $stmt->execute([':cronjob_name' => $data['cronjob_name']]);

            $this->db->commit();
            http_response_code(200);
            return json_encode(["message" => "Cronjob deleted successfully."]);
        }
        catch (Exception $e) {
            $this->db->rollBack();
            error_log("Error deleting cronjob: " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to delete cronjob"]);
        }
    }

    public function readCronjobRecieved()
    {
        try {
            $stmt = $this->db->query(getAllCronjobReceivedQuery());
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            header('Content-Type: application/json');
            return json_encode($result);
        }
        catch (PDOException $e) {
            error_log("Error reading cronjob list: " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to get cronjob list."]);
        }
    }

    private function validateCronjobData($data)
    {
        return isset($data['cronjob_name'], $data['cronjob_content'], $data['cronjob_status']);
    }

    private function isValidCronjobContent($cronString)
    {
        // Split the string by spaces to separate the schedule from the command
        $parts = preg_split('/\s+/', $cronString, 6);

        // Check if the cron string has exactly 6 parts (5 time parts + command)
        if (count($parts) !== 6) {
            error_log("[ERROR] Invalid number of parts");
            return false;
        }

        // Extract the cron schedule (first 5 parts) and the command
        $cronSchedule = array_slice($parts, 0, 5);
        $command = $parts[5];

        // Allowed special characters in cron fields
        $allowedSpecialChars = ',*-/';

        // Validate each part of the cron schedule
        foreach ($cronSchedule as $index => $part) {
            // Check for invalid characters
            if (!preg_match('/^[0-9' . preg_quote($allowedSpecialChars, '/') . ']+$/', $part)) {
                error_log("[ERROR] Invalid character in scheduler part $index");
                return false;
            }

            // Convert to numeric values if not special characters
            $values = explode('-', $part); // Handle ranges
            foreach ($values as $value) {
                if ($value !== '*' && !str_contains($value, '/')) {
                    $num = intval($value);
                    // Check if the value is within valid cron ranges for each field
                    switch ($index) {
                        case 0: // Minute: 0-59
                            if ($num < 0 || $num > 59) {
                                error_log("[ERROR] Invalid minute value");
                                return false;
                            }
                            break;
                        case 1: // Hour: 0-23
                            if ($num < 0 || $num > 23) {
                                error_log("[ERROR] Invalid hour value");
                                return false;
                            }
                            break;
                        case 2: // Day of month: 1-31
                            if ($num < 1 || $num > 31) {
                                error_log("[ERROR] Invalid day of month value");
                                return false;
                            }
                            break;
                        case 3: // Month: 1-12
                            if ($num < 1 || $num > 12) {
                                error_log("[ERROR] Invalid month value");
                                return false;
                            }
                            break;
                        case 4: // Day of week: 0-7 (0 and 7 are Sunday)
                            if ($num < 0 || $num > 7) {
                                error_log("[ERROR] Invalid day of week value");
                                return false;
                            }
                            break;
                    }
                }
            }
        }

        // Check if the command is executed as root
        if (!str_starts_with($command, 'root')) {
            error_log("[ERROR] Command must start with root");
            return false;
        }

        return $cronString;
    }
}
