<?php

abstract class Cronjob {

    public $cronjob_name;
    public $cronjob_status;
    public $id;
    

    public function __construct($cronjob_name, $cronjob_status) {
        // $this->id = filter_var($id, FILTER_VALIDATE_INT);
        $this->cronjob_name = htmlspecialchars($cronjob_name, ENT_QUOTES, 'UTF-8');
        $this->cronjob_status = filter_var((int)$cronjob_status, FILTER_VALIDATE_INT);
    }
}