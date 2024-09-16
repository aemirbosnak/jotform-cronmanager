<?php
use Google\Cloud\PubSub\MessageBuilder;
use Google\Cloud\PubSub\PubSubClient;
use Google\Protobuf\Duration;

require_once __DIR__ . "/../Config/db.php";
require_once __DIR__ . "/../Config/queries.php";

class GCPHelper {
    private PubSubClient $pubsub;
    private $deadLetterTopicMain = "dlq-main";
    private $deadLetterTopicHealth = "dlq-health";
    private $deadLetterTopicServiceAccount;

    private $db;

    public function __construct($db)
    {
        putenv("GOOGLE_APPLICATION_CREDENTIALS=../../google-api-key.json");
        $this->pubsub = new PubSubClient([
            'projectId' => "jotform-cronmanager",
        ]);
        $this->db =$db;

        $deadLetterTopic = $this->pubsub->topic($this->deadLetterTopicMain);
        $policy = $deadLetterTopic->iam()->policy();
        $this->deadLetterTopicServiceAccount = $policy['bindings'][0]['members'][0];
    }

    public function publishMessage($cronjobName)
    {
        try {
            // Delete the cronjob from dead_letter if it exists
            $this->db->beginTransaction();
            $stmt = $this->db->prepare(deleteFromDeadLetterQuery());
            $stmt->execute([':cronjob_name' => $cronjobName]);
            $this->db->commit();

            $stmt = $this->db->prepare(getCronjobByName());
            $stmt->execute([':cronjob_name' => $cronjobName]);
            $cronjobs = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($cronjobs as $cronjob) {
                $machineGroupId = $cronjob['machine_group_id'];
                $this->publishToAllMachines($cronjob, $machineGroupId);

                // remove from cronjob_received if exists
                $this->db->beginTransaction();
                $stmt = $this->db->prepare(deleteFromCronjobReceived());
                $stmt->execute([':cronjob_id' => $cronjob['id']]);
                $this->db->commit();

                // Cronjob publish status is set to 1
                try {
                    $this->db->beginTransaction();
                    $setCronjobPublishStatus = $this->db->prepare(setCronjobPublishedQuery());
                    $setCronjobPublishStatus->execute([':cronjob_name' => $cronjobName]);
                    $this->db->commit();
                }
                catch (Exception $e) {
                    error_log("Error setting cronjob publish status: " . $e->getMessage());
                }
                catch (PDOException $e) {
                    $this->db->rollBack();
                    error_log("Error setting cronjob publish status: " . $e->getMessage());
                }
            }

            http_response_code(200);
            return json_encode(["message" => "Cronjob successfully published: " . $cronjobName]);
        }
        catch (Exception $e) {
            error_log("Error fetching: " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to fetch cronjob"]);
        }
    }

    public function createTopic($machineGroupName) : void
    {
        // Create the main topic
        error_log("[INFO] Creating topic: " . $machineGroupName . '-main');
        $this->pubsub->createTopic($machineGroupName . '-main', [
            'messageRetentionDuration' => new Duration(['seconds' => 86400]) // 1 day = 86400 seconds
        ]);
        error_log("[INFO] Topic created: " . $machineGroupName . '-main');

        // Create the healthcheck topic
        error_log("[INFO] Creating topic: " . $machineGroupName . '-health');
        $this->pubsub->createTopic($machineGroupName . '-health', [
            'messageRetentionDuration' => new Duration(['seconds' => 86400]) // 1 day = 86400 seconds
        ]);
        error_log("[INFO] Topic created: " . $machineGroupName . '-health');
    }

    public function deleteTopic($machineGroupName) : void
    {
        // Delete main topic (topic for sending cronjobs)
        error_log("[INFO] Deleting topic: " . $machineGroupName . '-main');
        $mainTopic = $this->pubsub->topic($machineGroupName . '-main');
        $mainTopic->delete();
        error_log("[INFO] Topic deleted: " . $machineGroupName . '-main');

        // Delete healthchek topic
        error_log("[INFO] Deleting topic: " . $machineGroupName . '-health');
        $healthTopic = $this->pubsub->topic($machineGroupName . '-health');
        $healthTopic->delete();
        error_log("[INFO] Topic deleted: " . $machineGroupName . '-health');
    }

    public function createSubscription($machineName, $machineGroupId) : void
    {
        $stmt = $this->db->prepare(getMachineGroupWithId());
        $stmt->execute([':id' => $machineGroupId]);
        $machineGroup = $stmt->fetch(PDO::FETCH_ASSOC);
        $machineGroupName = $machineGroup['machine_group_name'];

        # Create main task subscription
        $topicId = $machineGroupName . '-main';
        $topic = $this->pubsub->topic($topicId);
        $deadLetterTopic = $this->pubsub->topic($this->deadLetterTopicMain);
        $subscriptionMain = $machineGroupName . '-' . $machineName . '-main';

        error_log("[INFO] Creating subscription: " . $subscriptionMain . " for topic: " . $topicId);
        $subscription = $topic->subscription($subscriptionMain);
        $subscription->create([
            'ackDeadlineSeconds' => 600,
            'messageRetentionDuration' => "86400s", // 1 day = 86400 seconds
            'deadLetterPolicy' => [
                'deadLetterTopic' => $deadLetterTopic
            ],
            'retryPolicy' => [
                'minimumBackoff' => "10s",
                'maximumBackoff' => "600s"
            ]
        ]);
        $this->setPolicyRole($subscription, "subscriber");
        error_log("[INFO] Subscription created: " . $subscription->name() . " for topic: " . $topicId);

        # Create healthcheck subscription
        $topicId = $machineGroupName . '-health';
        $topic = $this->pubsub->topic($topicId);
        $deadLetterTopic = $this->pubsub->topic($this->deadLetterTopicHealth);
        $subscriptionHealth = $machineGroupName . '-' . $machineName . '-health';

        error_log("[INFO] Creating subscription: " . $subscriptionHealth . " for topic: " . $topicId);
        $subscription = $topic->subscription($subscriptionHealth);
        $subscription->create([
            'ackDeadlineSeconds' => 60,
            'messageRetentionDuration' => "86400s", // 1 day = 86400 seconds
            'deadLetterPolicy' => [
                'deadLetterTopic' => $deadLetterTopic
            ],
        ]);
        $this->setPolicyRole($subscription, "subscriber");
        error_log("[INFO] Subscription created: " . $subscription->name() . " for topic: " . $topicId);
    }

    public function deleteSubscription($machineGroupName, $machineName) : void
    {
        # Delete main subscription
        $subscriptionName = $machineGroupName . '-' . $machineName . '-main';
        error_log("[INFO] Deleting subscription: " . $subscriptionName);
        $subscription = $this->pubsub->subscription($subscriptionName);
        $subscription->delete();
        error_log("[INFO] Subscription deleted: " . $subscriptionName);

        # Delete health subscription
        $subscriptionName = $machineGroupName . '-' . $machineName . '-health';
        error_log("[INFO] Deleting subscription: " . $subscriptionName);
        $subscription = $this->pubsub->subscription($subscriptionName);
        $subscription->delete();
        error_log("[INFO] Subscription deleted: " . $subscriptionName);
    }

    public function listDeadLetters()
    {
        $newDeadLetters = $this->pullFromDeadLetterSubscription();

        // Add new dead letters to database first
        error_log("[INFO] Adding new messages to database");
        foreach ($newDeadLetters as $letter) {
            $stmt = $this->db->prepare(getCronjobByName());
            $stmt->execute([':cronjob_name' => $letter['cronjob_name']]);
            $cronjobs = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $subscription = $letter['dead_letter_source_subscription'];
            foreach ($cronjobs as $cronjob) {
                $machineGroup = $cronjob['machine_group_name'];
                if (str_contains($subscription, $machineGroup)) {
                    // Parse machine name from dead_letter_source_subscription
                    $subscription = str_replace($machineGroup . '-', '', $subscription);
                    $machineName = rtrim($subscription, '-main');

                    // Get machine id from database with machine name
                    $stmt = $this->db->prepare(getInfoFromWorkerNameQuery());
                    $stmt->execute([':machine_name' => $machineName]);
                    $machine = $stmt->fetch(PDO::FETCH_ASSOC);
                    $machineId = $machine['worker_node_id'];

                    // Add this cronjob to dead letter table
                    $stmt = $this->db->prepare(insertIntoDeadLetter());
                    $stmt->execute([
                        ':cronjob_id' => $letter['id'],
                        ':cronjob_name' => $letter['cronjob_name'],
                        ':cronjob_content' => $letter['cronjob_content'],
                        ':machine_id' => $machineId,
                        ':machine_name' => $machineName,
                        ':publish_time' => $letter['dead_letter_publish_time']
                    ]);

                    $stmt = $this->db->prepare(setCronjobPublishedQuery());
                    $stmt->execute([':cronjob_name' => $letter['cronjob_name']]);
                }
            }
        }

        // Show dead letters in the database
        $stmt = $this->db->query(listDeadLettersQuery());
        $deadLetters = $stmt->fetchAll(PDO::FETCH_ASSOC);
        header('Content-Type: application/json');
        return json_encode($deadLetters);
    }

    public function listDeadLetterHealth()
    {
        $newDeadLetters = $this->pullFromDeadLetterHealthSubscription();

        // Add new dead letters to database first
        error_log("[INFO] Adding new health messages to database");
        foreach ($newDeadLetters as $letter) {
            $subscription = $letter['dead_letter_source_subscription'];

            $stmt = $this->db->prepare(getMachineGroupNameFromMachineName());
            $stmt->execute([':machine_name' => $letter['destination_machine']]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $machineGroup = $result['machine_group_name'];

            if (str_contains($subscription, $machineGroup)) {
                $subscription = str_replace($machineGroup . '-', '', $subscription);
                $machineName = rtrim($subscription, '-health');

                $stmt = $this->db->prepare(getInfoFromWorkerNameQuery());
                $stmt->execute([':machine_name' => $machineName]);
                $machine = $stmt->fetch(PDO::FETCH_ASSOC);
                $machineId = $machine['worker_node_id'];

                $this->db->beginTransaction();
                $stmt = $this->db->prepare(insertIntoDeadLetterHealth());
                $stmt->execute([
                    ':publish_time' => $letter['dead_letter_publish_time'],
                    ':machine_id' => $machineId,
                    ':machine_name' => $machineName
                ]);
                $this->db->commit();
            }
        }

        // Show dead letters in the database
        $stmt = $this->db->query(listDeadLetterHealthQuery());
        $deadLetters = $stmt->fetchAll(PDO::FETCH_ASSOC);
        header('Content-Type: application/json');
        return json_encode($deadLetters);
    }

    /** PRIVATE HELPER FUNCTIONS */
    private function publishToAllMachines($cronjob, $machineGroupId)
    {
        try {
            $stmt = $this->db->prepare(getMachineGroupName());
            $stmt->execute([':machine_group_id' => $machineGroupId]);
            $machineGroupName = $stmt->fetch(PDO::FETCH_ASSOC);

            $topicName = $this->convertMachineGroupToTopic($machineGroupName);
            $topic = $this->pubsub->topic($topicName);
            $data = [
                "id" => $cronjob['id'],
                "cronjob_name" => $cronjob['cronjob_name'],
                "cronjob_content" => $cronjob['cronjob_content'],
                "cronjob_status" => $cronjob['cronjob_status']
            ];
            $jsonData = json_encode($data);
            $messageBuilder = new MessageBuilder();
            $message = $messageBuilder->setData($jsonData)->build();
            $topic->publish($message);
        }
        catch (Exception $e) {
            error_log("Error publishing: " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to publish message"]);
        }
    }

    private function setPolicyRole($subscription, $role) : void
    {
        $policy = $subscription->iam()->policy();
        $policy['bindings'][] = [
            'role' => 'roles/pubsub.' . $role,
            'members' => [$this->deadLetterTopicServiceAccount]
        ];
        $subscription->iam()->setPolicy($policy);
    }

    private function pullFromDeadLetterSubscription() : array
    {
        error_log("[INFO] Pulling from dead letter topic: " . $this->deadLetterTopicMain);
        $subscription = $this->pubsub->subscription($this->deadLetterTopicMain . '-sub');
        $messages = $subscription->pull([
            'returnImmediately' => true,
            'maxMessages' => 20
        ]);

        $results = [];

        foreach ($messages as $message) {
            $data = json_decode($message->data(), true);

            $id = $data['id'];
            $cronjobName = $data['cronjob_name'];
            $cronjobContent = $data['cronjob_content'];
            $deadLetterSourceSubscription = $message->attribute('CloudPubSubDeadLetterSourceSubscription');
            $deadLetterPublishTime = $message->attribute('CloudPubSubDeadLetterSourceTopicPublishTime');

            $result = [
                'id' => $id,
                'cronjob_name' => $cronjobName,
                'cronjob_content' => $cronjobContent,
                'dead_letter_source_subscription' => $deadLetterSourceSubscription,
                'dead_letter_publish_time' => $deadLetterPublishTime
            ];

            $results[] = $result;
            $subscription->acknowledge($message);
        }

        error_log("[INFO] Pulled new messages: " . print_r($results, true));
        return $results;
    }

    private function pullFromDeadLetterHealthSubscription() : array
    {
        error_log("[INFO] Pulling from dead letter health topic: " . $this->deadLetterTopicHealth);
        $subscription = $this->pubsub->subscription($this->deadLetterTopicHealth . '-sub');
        $messages = $subscription->pull([
            'returnImmediately' => true,
            'maxMessages' => 20
        ]);

        $results = [];

        foreach ($messages as $message) {
            $data = json_decode($message->data(), true);
            $destinationMachine = $data['destination_machine'];
            $deadLetterSourceSubscription = $message->attribute('CloudPubSubDeadLetterSourceSubscription');
            $deadLetterPublishTime = $message->attribute('CloudPubSubDeadLetterSourceTopicPublishTime');

            $result = [
                'destination_machine' => $destinationMachine,
                'dead_letter_source_subscription' => $deadLetterSourceSubscription,
                'dead_letter_publish_time' => $deadLetterPublishTime
            ];

            $results[] = $result;
            $subscription->acknowledge($message);
        }

        error_log("[INFO] Pulled new health messages: " . print_r($results, true));
        return $results;
    }

    private function convertMachineGroupToTopic($machineGroupName) : string
    {
        return $machineGroupName['machine_group_name'] . '-main';
    }
}