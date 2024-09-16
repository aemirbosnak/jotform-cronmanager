import os
import logging
import config


# stream_handler is for the console, docker should pick it up in the normal way things work
# file_handler is for "if" docker somehow fails, or if we're running this locally

os.environ["GRPC_VERBOSITY"] = "ERROR"

_this_dir = os.path.dirname(os.path.abspath(__file__))
_log_file = os.path.join(_this_dir, "workernode.log")
_log_level = config.get("LOG_LEVEL")  # Assuming this is 10 (DEBUG)

logger = logging.getLogger("worker")
logger.setLevel(_log_level)

formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")

file_handler = logging.FileHandler(_log_file)
stream_handler = logging.StreamHandler()

file_handler.setLevel(_log_level)
stream_handler.setLevel(_log_level)

file_handler.setFormatter(formatter)
stream_handler.setFormatter(formatter)

logger.addHandler(file_handler)
logger.addHandler(stream_handler)
