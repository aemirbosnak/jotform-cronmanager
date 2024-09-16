<?php


header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

use Pecee\SimpleRouter\SimpleRouter;

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/library/routes.php';

SimpleRouter::setDefaultNamespace('\Demo\Controllers');

// Start the routing
try{
    error_log("---- Router is started ----");
    SimpleRouter::start();
}catch(Exception $e){
    error_log("Problem during router start: " . $e);
}

