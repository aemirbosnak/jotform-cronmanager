<?php

use Pecee\SimpleRouter\SimpleRouter;

// Controllers
require_once __DIR__ . "/../Controllers/Cronjob.controller.php";
require_once __DIR__ . "/../Controllers/GCPHelper.controller.php";
require_once __DIR__ . "/../Controllers/WorkerNodes.controller.php";
require_once __DIR__ . "/../Controllers/MachineGroups.controller.php";

//Models
require_once __DIR__ . "/../Models/Cronjob.model.php";
require_once __DIR__ . "/../Models/CronjobList.model.php";
require_once __DIR__ . "/../Config/db.php";

SimpleRouter::get('/', function()
{
    echo 'Welcome to the Cron Manager API!';
});

/* Route for Cronjob */
SimpleRouter::group(['prefix' => '/cronjob'], function() use($db)
{
    SimpleRouter::get('/{cronjobName}', function ($cronjobName) use ($db)
    {
        try {
            error_log("GET /cronjob/{cronjobName}");
            return (new CronjobController($db))->getCronjob($cronjobName);
        }
        catch (Exception $e) {
            error_log("Error during GET " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to get cronjob data"]);
        }
    });

    SimpleRouter::post('/create', function() use ($db)
    {
        try {
            error_log("POST /cronjob/create");
            return (new CronjobController($db))->createCronjob();
        }
        catch (Exception $e) {
            error_log("Error during POST " . $e);
        }
    });

    SimpleRouter::put('/edit/{cronjobName}', function($cronjobName) use ($db)
    {
        try {
            error_log("PUT /cronjob/edit");
            return (new CronjobController($db))->updateCronjob($cronjobName);
        }
        catch (Exception $e) {
            error_log("Error during PUT " . $e);
        }
    });

    SimpleRouter::delete('/remove', function() use ($db)
    {
        try {
            error_log("DELETE /cronjob/remove");
            return (new CronjobController($db))->deleteCronjob();
        }
        catch (Exception $e) {
            error_log("Error during DELETE" . $e);
        }
    });

    SimpleRouter::post('/publish', function() use ($db)
    {
        try {
            error_log("POST /cronjob/publish");
            $data = json_decode(file_get_contents("php://input"), true);
            $cronjobName = filter_var($data['cronjob_name']);
            return (new GCPHelper($db))->publishMessage($cronjobName);
        }
        catch (Exception $e) {
            error_log("Error during POST " . $e);
        }
    });
});

/* Route for Group */
SimpleRouter::group(['prefix' => '/group'], function() use($db)
{
    SimpleRouter::get('/', function () use($db){
        try {
            error_log("GET Method is called for /list/groups");
            return (new MachineGroupsController($db))->readMachineGroupsList();
        }
        catch (Exception $e) {
            error_log("Error during GET Method to /list/groups: " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to retrieve machine groups"]);
        }
    });
    SimpleRouter::post('/add', function () use($db)
    {
        try {
            error_log("POST /group/add");
            return (new MachineGroupsController($db))->createMachineGroup();
        }
        catch (Exception $e) {
            error_log("Error during POST : " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to create machine group"]);
        }
    });

    SimpleRouter::delete('/remove', function () use($db)
    {
        try {
            error_log("DELETE /group/remove");
            return (new MachineGroupsController($db))->deleteMachineGroup();
        }
        catch (Exception $e) {
            error_log("Error during DELETE " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to remove machine group"]);
        }
    });

    SimpleRouter::get('/{groupName}', function ($groupName) use ($db)
    {
        try {
            error_log("GET /group/{groupName}");
            return (new MachineGroupsController($db))->getMachineGroup($groupName);
        }
        catch (Exception $e) {
            error_log("Error during GET " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to get machine group info"]);
        }
    });
});

/* Route for Worker */
SimpleRouter::group(['prefix' => '/worker'], function() use($db)
{
    SimpleRouter::post('/add', function() use ($db)
    {
        try {
            error_log("POST /worker/add");
            return (new WorkerNodesController($db))->createWorkerNodes();
        }
        catch(Exception $e) {
            error_log("Error during POST " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to insert worker nodes"]);
        }
    });

    SimpleRouter::put('/edit/{machineName}', function($machineName) use($db)
    {
        try {
            error_log("PUT /worker/update");
            return (new WorkerNodesController($db))->editWorkerNodes($machineName);
        }
        catch(Exception $e) {
            error_log("Error during PUT " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to update worker nodes"]);
        }
    });

    SimpleRouter::post('/health', function() use($db)
    {
        try {
            error_log("POST /worker/health");
            return (new WorkerNodesController($db))->createHealthCheck();
        }
        catch(Exception $e) {
            error_log("Error during POST " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to health check worker nodes"]);
        }
    });

    SimpleRouter::delete('/remove', function() use($db)
    {
        try {
            error_log("DELETE /worker/remove");
            return (new WorkerNodesController($db))->deleteWorkerNodes();
        }
        catch(Exception $e) {
            error_log("Error during DELETE " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to delete worker nodes"]);
        }
    });

    SimpleRouter::get('/{machineName}', function ($machineName) use ($db)
    {
        return (new WorkerNodesController($db))->getInfoFromWorkerName($machineName);
    });

});

/* Route for List */
SimpleRouter::group(['prefix' => '/list'], function() use($db)
{
    SimpleRouter::get('/cronjobs', function() use($db)
    {
        try {
            error_log("GET /list/cronjobs");
            return (new CronjobController($db))->readCronjobList();
        }
        catch (Exception $e) {
            error_log("Error during GET " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to retrieve cron jobs"]);
        }
    });

    SimpleRouter::get('/workers', function() use($db)
    {
        try {
            error_log("GET /list/workers");
            return (new WorkerNodesController($db))->readWorkerNodesList();
        }
        catch (Exception $e) {
            error_log("Error during GET " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to retrieve worker nodes"]);
        }
    });

    SimpleRouter::get('/groups', function() use($db)
    {
        try {
            error_log("GET /list/groups");
            return (new MachineGroupsController($db))->readMachineGroupsList();
        }
        catch (Exception $e) {
            error_log("Error during GET " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to retrieve machine groups"]);
        }
    });

    SimpleRouter::get('/health', function() use($db)
    {
        try {
            error_log("GET /list/health");
            return (new CronjobController($db))->readCronjobRecieved();
        }
        catch (Exception $e) {
            error_log("Error during GET " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to retrieve health check"]);
        }
    });

    SimpleRouter::get('/deadLetter', function () use($db)
    {
       try {
           error_log("GET /list/deadLetter");
           return (new GCPHelper($db))->listDeadLetters();
       }
       catch (Exception $e) {
           error_log("Error during GET " . $e->getMessage());
           http_response_code(500);
           return json_encode(["error" => "Failed to retrieve dead letter"]);
       }
    });

    SimpleRouter::get('/deadLetterHealth', function () use($db)
    {
        try {
            error_log("GET /list/deadLetterHealth");
            return (new GCPHelper($db))->listDeadLetterHealth();
        }
        catch (Exception $e) {
            error_log("Error during GET " . $e->getMessage());
            http_response_code(500);
            return json_encode(["error" => "Failed to retrieve dead letter health"]);
        }
    });
});

