<?php

class MachineGroups{
    public $id;
    public $machine_group_name;
    public $machine_group_status;

    public function __construct($machine_group_name, $machine_group_status) {
        $this->machine_group_status = filter_var($machine_group_status, FILTER_VALIDATE_INT);
        $this->machine_group_name = htmlspecialchars($machine_group_name, ENT_QUOTES, 'UTF-8');
    }

    public function toArray(){
        return [
            ':machine_group_name' => $this->machine_group_name,
            ':machine_group_status' => $this->machine_group_status
        ];
    }
}