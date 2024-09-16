<?php

class JunctionController{
    
    private $db;

    public function __construct($db){
        $this->db = $db;
    }
}