CREATE TABLE `cronjobmanager`.`cronjob_list` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `time` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `cronjob_name` VARCHAR(45) NULL,
    `cronjob_content` VARCHAR(150) NULL,
    `cronjob_status` INT NULL,
    `cronjob_published` BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_cronjob_list UNIQUE (`cronjob_name`),
    CONSTRAINT pk_cronjob_list PRIMARY KEY (`id`)
);

CREATE TABLE `cronjobmanager`.`machine_groups` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `machine_group_name` VARCHAR(45) NULL,
    `machine_group_status` INT NULL,
    constraint pk_machine_groups primary key (id)
);

CREATE TABLE `cronjobmanager`.`cronjob_machine_group` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `cronjob_id` INT NOT NULL,
    `machine_group_id` INT NOT NULL,
    constraint pk_cronjob_machine_group primary key (id),
    constraint fk_cronjob_id foreign key (cronjob_id) references cronjob_list(id) ON DELETE CASCADE,
    constraint fk_machine_group_id foreign key (machine_group_id) references machine_groups(id) ON DELETE CASCADE
);

CREATE TABLE `cronjobmanager`.`worker_nodes` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `machine_name` VARCHAR(50) NULL,
    `machine_group_id` INT NOT NULL,
    constraint pk_worker_nodes primary key (id),
    constraint fk_worker_nodes_machine_groups foreign key (machine_group_id) references machine_groups(id) ON DELETE CASCADE 
);

CREATE TABLE `cronjobmanager`.`cronjob_received` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `time` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `cronjob_id` INT NOT NULL,
    `machine_id` INT NOT NULL,
    `cronjob_status` SMALLINT DEFAULT 0,
    `operation_status` BOOLEAN DEFAULT 0,
    constraint uq_machine_cronjob_pair unique (cronjob_id, machine_id),
    constraint pk_cronjob_received primary key (id),
    constraint fk_cronjob_received_cronjob_list foreign key (cronjob_id) references cronjob_list(id) ON DELETE CASCADE,
    constraint fk_cronjob_received_worker_nodes foreign key (machine_id) references worker_nodes(id) ON DELETE CASCADE 
);

CREATE TABLE `cronjobmanager`.`dead_letter` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `time` DATETIME NULL,
    `cronjob_id` INT NOT NULL,
    `cronjob_name` VARCHAR(45) NULL,
    `cronjob_content` VARCHAR(150)  NULL,
    `machine_id` INT NOT NULL,
    `machine_name` VARCHAR(50) NULL,
    constraint uq_cronjob_machine unique (cronjob_id, machine_id),
    constraint pk_dead_letter primary key (id)
);

CREATE TABLE `cronjobmanager`.`dead_letter_health` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `time` DATETIME NULL,
    `machine_id` INT NOT NULL,
    `machine_name` VARCHAR(50) NULL,
    constraint pk_dead_letter_health primary key (id)
);