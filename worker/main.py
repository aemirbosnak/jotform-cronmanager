#!/usr/bin/env python3

# builtin imports
import os
import time
import json
from concurrent.futures import TimeoutError

# third party imports
from google.cloud.pubsub_v1 import SubscriberClient, PublisherClient
from google.cloud.pubsub_v1.subscriber.message import Message
from google.api_core.exceptions import NotFound

# local imports
import config
from logger import logger
from cronjob_handler import process_cron
from api_handler import make_api_request
from custom_streaming_pull_future import CustomStreamingPullFuture

logger.info(
    """
   ___ _ __ ___  _ __  _ __ ___   __ _ _ __   __ _  __ _  ___ _ __ 
  / __| '__/ _ \| '_ \| '_ ` _ \ / _` | '_ \ / _` |/ _` |/ _ \ '__|
 | (__| | | (_) | | | | | | | | | (_| | | | | (_| | (_| |  __/ |   
  \___|_|  \___/|_| |_|_| |_| |_|\__,_|_| |_|\__,_|\__, |\___|_|   
                                                   |___/
"""
)  # style points, also surprisingly helps finding the program start in the logs


# ************************************************************
# region env var setup

_project_id = config.get("PROJECT_ID")
_listening_timeout = config.get("LISTENING_TIMEOUT")
_listening_cycle_time = config.get("LISTENING_CYCLE_TIME")

logger.debug(f"Project ID: {_project_id}")
logger.debug(f"Listening timeout: {_listening_timeout}")
logger.debug(f"Listening cycle time: {_listening_cycle_time}")

_sleep_time = _listening_cycle_time - 2 * _listening_timeout

if _sleep_time <= 0:
    logger.warning("Estimated sleep time is 0 or less, disabling sleep between cycles")
    _sleep_time = 0
else:
    logger.debug(f"Sleep time: {_sleep_time}")

# endregion


# ************************************************************
# region init vars
_hostname = os.uname().nodename
logger.debug(f"Working on host: {_hostname}")

_host_id: int
_group_name: str
_workers: list[str]
_worker_id: int
_streaming_pull_futures: list[CustomStreamingPullFuture] = []

sub_client = SubscriberClient()
pub_client = PublisherClient()


def initalize_environment():
    global _host_id, _group_name, _workers, _worker_id, _streaming_pull_futures
    try:
        raw_data = make_api_request("GET", f"/worker/{_hostname}")
        data = json.loads(raw_data)
        logger.debug(f"Worker data: {data}")
        _host_id = int(
            data["worker_node_id"]
        )  # required for all operations with the API
        _group_name = data["machine_group_name"]
        logger.debug(f"Worker ID: {_host_id}")
        logger.debug(f"Group Name: {_group_name}")
    except Exception as e:
        print(e)
        os._exit(1)

    try:
        raw_data = make_api_request("GET", f"/group/{_group_name}")
        data = json.loads(raw_data)
        # sort workers by their name, alphabetically
        # this sorting will be exactly the same on all workers in the same group
        # so we can use the same logic to determine active health check targets
        _workers = data["worker_nodes"]
        _workers.sort()
        _worker_id = _workers.index(_hostname)

        if len(_workers) == 1:
            # even with a single machine in group, health check will work as expected
            logger.debug("Wish I had a friend to play with")

        logger.debug(f"Found {len(_workers)} workers in the group")
        logger.debug(f"My group index: {_worker_id}")
    except Exception as e:
        logger.error(f"Failed to get group data: {e}")
        logger.error("Exiting...")
        os._exit(1)

    _streaming_pull_futures = [
        _generate_subscription(f"{_group_name}-{_hostname}-main", _task_callback),
        _generate_subscription(f"{_group_name}-{_hostname}-health", _health_callback),
    ]


def _generate_subscription(
    subscription_id: str, callback_func
) -> CustomStreamingPullFuture:
    sub_path = sub_client.subscription_path(_project_id, subscription_id)
    logger.info(f"Adding new subscription path: /{subscription_id}")

    streaming_pull_future: CustomStreamingPullFuture = sub_client.subscribe(
        sub_path, callback=callback_func
    )
    streaming_pull_future.subscription_path = sub_path
    return streaming_pull_future


def _purge_cronjobs():
    logger.info("Purging all cronjobs")
    for cronjob in os.listdir("/etc/cron.d/"):
        if cronjob.startswith("autocron-"):
            os.remove(f"/etc/cron.d/{cronjob}")
            logger.debug(f"Removed cronjob: {cronjob}")
    logger.info("All cronjobs purged")


def process_task_message(message: Message):
    data = json.loads(message.data.decode("utf-8"))
    logger.debug(f"Data: {data}")

    try:
        logger.debug(f"cronjob_id: {data['id']}")
        logger.debug(f"cronjob_name: {data['cronjob_name']}")
        logger.debug(f"cronjob_content: {data['cronjob_content']}")
        logger.debug(f"cronjob_status: {data['cronjob_status']}")
        status = process_cron(data)
        if data["cronjob_status"] != 4:  # remove cronjob
            logger.debug(f"Sending health check for cronjob {data['id']}")
            try:
                make_api_request(
                    "POST",
                    "/worker/health",
                    {
                        "machine_id": _host_id,
                        "cronjob_id": data["id"],
                        "operation_status": status,
                        "cronjob_status": data["cronjob_status"],
                    },
                )
            except Exception as e:
                logger.error(f"Failed to send health check: {e}")
                message.nack()
                return 2  # api is down
            logger.debug("Health check sent successfully")
        message.ack()
        return 0  # success
    except KeyError:
        logger.debug("This message format is not up to spec, ignoring")
        message.nack()
        return 1  # message format is wrong


def process_health_message(message: Message):
    """
    Expected data:
    {
        current_machine: hostname,
        destination_machine: hostname,
    }
    """

    _data = json.loads(message.data.decode("utf-8"))
    logger.debug(f"Data: {_data}")

    try:
        if _data["destination_machine"] == _hostname:

            sender_machine = _data["current_machine"]
            current_destination = _data["destination_machine"]
            new_destination = _workers[(_worker_id + 1) % len(_workers)]

            logger.debug(f"Sender machine: {sender_machine}")
            logger.debug(f"Current destination machine: {current_destination}")
            logger.debug(f"New destination machine: {new_destination}")

            logger.info("Found a health check message pointing to this worker")

            topic_name = f"{_group_name}-health"

            _payload = json.dumps(
                {
                    "current_machine": _hostname,
                    "destination_machine": new_destination,
                }
            )

            try:
                time.sleep(
                    60
                )  # without a timeout all machines would send health checks all the time
                publish_obj = pub_client.publish(
                    topic=pub_client.topic_path(_project_id, topic_name),
                    data=bytes(_payload, encoding="utf-8"),
                )
                publish_obj.result()  # wait for the publish to be successful
            except NotFound:
                logger.error(f"Topic not found: {topic_name}")
                message.nack()
                return 2
            logger.debug("Health check message sent successfully")
        else:
            logger.debug("This health check message is not for this worker, ignoring")
        message.ack()
        logger.debug("Health check message acknowledged")
    except KeyError:
        logger.debug(
            "This health check message format is not up to spec, nack'ing to drop it to dead letter queue"
        )
        message.nack()
        return 1


def _task_callback(message: Message) -> None:
    logger.debug(f"Received message on task channels!")
    process_task_message(message)


def _health_callback(message: Message) -> None:
    logger.debug(f"Received message on health channel!")
    process_health_message(message)


initalize_environment()  # this is a blocking call, it will exit the program if it fails


# endregion


# main logic, or main loop, whatever you want to call it, it's the main thing
with sub_client and pub_client:

    # if you're the first worker in the group, you're the health check initiator
    if _worker_id == 0:
        logger.info(
            "I'm the first worker in the group, starting the health check chain"
        )
        topic_name = f"{_group_name}-health"

        _payload = json.dumps(
            {
                "current_machine": _hostname,
                "destination_machine": _workers[(_worker_id + 1) % len(_workers)],
            }
        )

        try:
            publish_obj = pub_client.publish(
                topic=pub_client.topic_path(_project_id, topic_name),
                data=bytes(_payload, encoding="utf-8"),
            )
            publish_obj.result()  # wait for the publish to be successful
        except NotFound:
            logger.error(f"Topic not found: {topic_name}")
            os._exit(1)
        logger.debug("Health check message sent successfully")

    while True:
        logger.debug(f"Starting a new cycle")
        for streaming_pull_future in _streaming_pull_futures:
            logger.debug(
                f"Listening on /{streaming_pull_future.subscription_path.split('/')[-1]}"
            )
            try:
                streaming_pull_future.result(timeout=_listening_timeout)
            except NotFound:
                logger.critical(
                    f"Subscription not found: /{streaming_pull_future.subscription_path.split('/')[-1]}"
                )
                logger.critical(
                    "Trying to recover by reinitializing the environment..."
                )
                old_group_name = _group_name
                initalize_environment()
                if old_group_name != _group_name:
                    logger.critical(
                        "Detected a group change, reinitialized subscriptions"
                    )
                else:
                    logger.critical(
                        "Environment reinitialization did not change anything, cannot recover from this"
                    )
                    logger.critical("Exiting...")
                    os._exit(1)
                logger.critical("Purging all cronjobs from previous group")
                _purge_cronjobs()
                logger.critical(
                    "All cronjobs from previous group purged, will continue listening"
                )
                continue
            except TimeoutError:
                logger.debug(
                    f"Timeout on /{streaming_pull_future.subscription_path.split('/')[-1]}"
                )
                continue

        if _sleep_time != 0:
            logger.debug(f"Waiting for the next cycle in {_sleep_time} seconds")
            time.sleep(_sleep_time)
