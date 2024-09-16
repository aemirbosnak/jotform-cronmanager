from logger import logger
import os


def _check_cronjob_presence(cron_name: str, cron_id: int):
    logger.debug(f"[CHECK] - Checking if cronjob {cron_name} with ID {cron_id} exists")

    if os.path.isfile(f"/etc/cron.d/autocron-{cron_name}-{cron_id}"):
        logger.debug(f"[CHECK] - Cronjob {cron_name} with ID {cron_id} exists")
        return 0  # Cronjob exists

    if os.path.isfile(f"/etc/cron.d/autocron-{cron_name}-{cron_id}.disabled"):
        logger.debug(
            f"[CHECK] - Cronjob {cron_name} with ID {cron_id} exists, but is disabled"
        )
        return 2  # Cronjob exists but disabled

    logger.debug(f"[CHECK] - Cronjob {cron_name} with ID {cron_id} does not exist.")
    return 1  # Cronjob does not exist


def _add_cronjob(cron_name: str, cron_id: int, cron_content: str):
    status = _check_cronjob_presence(cron_name, cron_id)

    if status == 0:  # Cronjob already exists, do nothing
        logger.info(f"[ADD] - Cronjob {cron_name} already exists. Skipping.")
        logger.debug("[ADD] - This signal is most likely a duplicate.")
        return 0

    if status == 1:  # Cronjob does not exist
        logger.info(f"[ADD] - Attempting to add cronjob {cron_name}")
        try:  # requires root privileges
            with open(f"/etc/cron.d/autocron-{cron_name}-{cron_id}", "w") as f:
                f.write(cron_content)
            logger.info(f"[ADD] - Cronjob {cron_name} added")
            return 0
        except PermissionError:
            logger.critical(
                "[ADD] - Could not write to /etc/cron.d/, permission denied"
            )
            return 1

    if status == 2:  # Cronjob is disabled
        logger.info(
            f"[ADD] - Cronjob {cron_name} already exists but is disabled. Skipping."
        )
        return 0


def _edit_cronjob(cron_name: str, cron_id: int, cron_content: str):
    status = _check_cronjob_presence(cron_name, cron_id)

    if status == 0:  # Cronjob exists
        try:
            logger.info(f"[EDIT] - Attempting to edit cronjob {cron_name}")
            with open(f"/etc/cron.d/autocron-{cron_name}-{cron_id}", "w") as f:
                f.write(cron_content)
            logger.info(f"[EDIT] - Cronjob {cron_name} edited")
            return 0
        except PermissionError:
            logger.critical(
                f"[EDIT] - Could not edit cronjob {cron_name}, permission denied"
            )
            return 1

    if status == 1:  # Cronjob does not exist
        logger.info(f"[EDIT] - Cronjob {cron_name} does not exist. Skipping.")
        return 0

    if status == 2:  # Cronjob is disabled
        try:
            with open(f"/etc/cron.d/autocron-{cron_name}.disabled", "w") as f:
                f.write(cron_content)
            logger.info(f"[EDIT] - Cronjob {cron_name} edited, but was disabled")
            return 0
        except PermissionError:
            logger.critical(
                f"[EDIT] - Could not edit cronjob {cron_name}, permission denied"
            )
            return 1


def _enable_cronjob(cron_name: str, cron_id: int, **kwargs):
    status = _check_cronjob_presence(cron_name, cron_id)

    if status == 0:  # Cronjob exists
        logger.info(f"[ENABLE] - Cronjob {cron_name} is already enabled. Skipping.")
        logger.debug("[ENABLE] - This signal is most likely a duplicate.")
        return 0

    if status == 1:  # Cronjob does not exist
        logger.info(f"[ENABLE] - Cronjob {cron_name} does not exist. Skipping.")
        logger.warning(
            f"[ENABLE] - This signal coming to a non-existent cronjob is worrying."
        )
        return 0

    if status == 2:  # Cronjob is disabled
        try:
            logger.info(f"[ENABLE] - Attempting to enable cronjob {cron_name}")
            os.rename(
                f"/etc/cron.d/autocron-{cron_name}-{cron_id}.disabled",
                f"/etc/cron.d/autocron-{cron_name}-{cron_id}",
            )
            logger.info(f"[ENABLE] - Cronjob {cron_name} enabled")
            return 0
        except PermissionError:
            logger.critical(
                f"[ENABLE] - Could not enable cronjob {cron_name}, permission denied"
            )
            return 1


def _disable_cronjob(cron_name: str, cron_id: int, **kwargs):
    status = _check_cronjob_presence(cron_name, cron_id)

    if status == 0:  # Cronjob exists
        try:
            logger.info(f"[DISABLE] - Attempting to disable cronjob {cron_name}")
            os.rename(
                f"/etc/cron.d/autocron-{cron_name}-{cron_id}",
                f"/etc/cron.d/autocron-{cron_name}-{cron_id}.disabled",
            )
            logger.info(f"[DISABLE] - Cronjob {cron_name} disabled")
            return 0
        except PermissionError:
            logger.critical(
                f"[DISABLE] - Could not disable cronjob {cron_name}, permission denied"
            )
            return 1

    if status == 1:  # Cronjob does not exist
        logger.info(f"[DISABLE] - Cronjob {cron_name} does not exist. Skipping.")
        logger.debug(
            f"[DISABLE] - This signal coming to a non-existent cronjob is a bit worrying."
        )
        return 0

    if status == 2:  # Cronjob is already disabled
        logger.info(f"[DISABLE] - Cronjob {cron_name} is already disabled. Skipping.")
        logger.debug("[DISABLE] - This signal is most likely a duplicate.")
        return 0


def _remove_cronjob(cron_name: str, cron_id: int, **kwargs):
    status = _check_cronjob_presence(cron_name, cron_id)

    if status == 0:  # Cronjob exists
        logger.info(f"[REMOVE] - Attempting to remove cronjob {cron_name}")
        try:
            os.remove(f"/etc/cron.d/autocron-{cron_name}-{cron_id}")
            logger.info(f"[REMOVE] - Cronjob {cron_name} removed")
            return 0
        except PermissionError:
            logger.critical(
                f"[REMOVE] - Could not remove cronjob {cron_name}, permission denied"
            )
            return 1

    if status == 1:  # Cronjob does not exist
        logger.info(f"[REMOVE] - Cronjob {cron_name} does not exist. Skipping.")
        logger.debug("[REMOVE] - This signal is most likely a duplicate.")
        return 0

    if status == 2:  # Cronjob is disabled
        logger.info(
            f"[REMOVE] - Cronjob {cron_name} is disabled, attempting to remove it"
        )
        try:
            os.remove(f"/etc/cron.d/autocron-{cron_name}-{cron_id}.disabled")
            logger.info(f"[REMOVE] - Cronjob {cron_name} removed")
            return 0
        except PermissionError:
            logger.critical(
                f"[REMOVE] - Could not remove cronjob {cron_name}, permission denied"
            )
            return 1


status_func: dict = {  # map the operation status to the function to call
    0: _add_cronjob,
    1: _edit_cronjob,
    2: _enable_cronjob,
    3: _disable_cronjob,
    4: _remove_cronjob,
}


def process_cron(data: dict):
    """
    Central function to process cronjobs.
    Operation signals:
    0: Add
    1: Edit
    2: Enable
    3: Disable
    4: Remove

    Returns:
    0: Success
    1: Failure
    """
    try:
        cronjob_id:int = data["id"]
        cronjob_name:str = data["cronjob_name"]
        cronjob_content:str = data["cronjob_content"]
        cronjob_status:int = data["cronjob_status"]
    except KeyError:
        logger.critical("Data format is not up to spec")
        return 1

    cronjob_content = cronjob_content.strip() + "\n"  # ensure newline at the end

    action = status_func[cronjob_status]  # get the function to call
    operation_status = action(
        cron_name=cronjob_name, cron_id=cronjob_id, cron_content=cronjob_content
    )

    logger.info(f"Operation status: {'Success' if operation_status == 0 else 'Failed'}")

    return operation_status


if __name__ == "__main__":
    data = {
        "id": 10,
        "cronjob_name": "clear-tmp",
        "cronjob_content": "0 0 * * * root rm -rf /tmp/*\n",
        "cronjob_status": 0,
    }
    process_cron(data)
    data["cronjob_status"] = 1
    process_cron(data)
    data["cronjob_status"] = 3
    process_cron(data)
    data["cronjob_status"] = 2
    process_cron(data)
    data["cronjob_status"] = 4
    process_cron(data)
