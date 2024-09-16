<?php

class WorkerNodes{

    public $id;
    public $machine_name;
    public $machine_group_id;

    public function __construct($machine_name, $machine_group_id) {
        $this->machine_name = htmlspecialchars($machine_name, ENT_QUOTES, 'UTF-8');
        $this->machine_group_id = htmlspecialchars($machine_group_id, ENT_QUOTES, 'UTF-8');
    }

    public function toArray(){
        return [':machine_name' => $this->machine_name,
        ':machine_group_id' => $this->machine_group_id
        ];
    }
}