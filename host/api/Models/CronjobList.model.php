<?php
    require_once __DIR__ . "/Cronjob.model.php";

    class CronjobList extends Cronjob{

        public $cronjob_content;
        public $machine_group_id;

        public function __construct($cronjob_content, $cronjob_name, $cronjob_status) {
            parent::__construct($cronjob_name, $cronjob_status);
            
            $this->cronjob_content = $cronjob_content;
        }

        public function toArray(){
            return [
                ':cronjob_name' => $this->cronjob_name,
                ':cronjob_content' => $this->cronjob_content,
                ':cronjob_status' => $this->cronjob_status
            ];
        }
    }
?>