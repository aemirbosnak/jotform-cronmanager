<?php

class CronjobReceived{

    public $id;
    public $cronjob_id;
    public $machine_id;
    public $cronjob_status;
    public $operation_status;
    public $time;

    
    public function __construct($cronjob_id, $machine_id, $cronjob_status, $operation_status, $time) {
        $this->cronjob_id = filter_var($cronjob_id, FILTER_VALIDATE_INT);
        $this->machine_id = filter_var($machine_id, FILTER_VALIDATE_INT);
        $this->cronjob_status = filter_var($cronjob_status, FILTER_VALIDATE_INT);
        $this->operation_status = filter_var($operation_status, FILTER_VALIDATE_INT);
    }

    public function toArray(){
        return [':cronjob_id' => $this->cronjob_id,
        ':machine_id' => $this->machine_id,
        ':cronjob_status' => $this->cronjob_status,
        ':operation_status' => $this->operation_status,
        ':time' => $this->time
        ];
    }
}