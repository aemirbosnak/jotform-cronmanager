<?php

class CronjobMachineGroup{

    public $id;
    public $cronjob_id;
    public $machine_group_id;

    public function __construct($cronjob_id, $machine_group_id) {
        $this->cronjob_id = filter_var($cronjob_id, FILTER_VALIDATE_INT);
        $this->machine_group_id = filter_var($machine_group_id, FILTER_VALIDATE_INT);
    }

    public function toArray(){
        return [':cronjob_id' => $this->cronjob_id,
        ':machine_group_id' => $this->machine_group_id
        ];
    }
}