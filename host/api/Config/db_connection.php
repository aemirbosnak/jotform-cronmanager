<?php
$servername = "localhost";
$username = "root"; 
$password = "password";
$dbname = "cronjobmanager";
$port = 3306;

// Create connection
try {
    $db = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION) ;
}
catch (PDOException $ex) {
    die("DB Connect Error : " . $ex->getMessage()) ;
}
?>
