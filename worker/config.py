"""
Module for reading the env variables and config.yaml file.

Use the get function to get the value of a setting.

config.yaml file is read seperately every time the get function is called to allow
hot swapping values without restarting the server.
"""

import os
import yaml
from pathlib import Path

this_dir = Path(__file__).parent

google_key_file = this_dir.parent / "google-api-key.json"

# this is an environment value, so it's logical to set it in config
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(google_key_file)


def get(setting_name: str, default_value=None) -> any:
    """
    Basically an `os.getenv()` function but for the config.yaml file.

    Attempts returning the requested value from env, then from the config.yaml file.

    If the `setting_name` is not found in both env and config.yaml, the `default_value`
    is returned if provided, otherwise `None` is returned.
    """
    # Check environment variables first
    env_value = os.getenv(setting_name)
    if env_value is not None:
        return env_value

    # Fallback to config.yaml
    config_path = os.path.join(this_dir, "config.yaml")

    with open(config_path, "r", encoding="UTF_8") as file:
        # safe_load is used to prevent code execution from the file
        cfg = yaml.safe_load(file)
        file.close()  # closing the file allows the file to be modified
    try:
        return cfg[setting_name]
    except KeyError:
        return default_value
