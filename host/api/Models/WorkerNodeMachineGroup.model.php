<?php

class WorkerNodeMachineGroup{
    public $id;
    public $machine_group_id;
    public $worker_node_id;

    public function __construct($machine_group_id, $worker_node_id) {
        $this->machine_group_id = filter_var($machine_group_id, FILTER_VALIDATE_INT);
        $this->worker_node_id = filter_var($worker_node_id, FILTER_VALIDATE_INT);
    }

    public function toArray(){
        return [':machine_group_id' => $this->machine_group_id,
        ':worker_node_id' => $this->worker_node_id
        ];
    }
}