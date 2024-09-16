import requests as r
from requests.models import Response
import config


content = {
    "machine_id": 1,  # which machine
    "cronjob_id": 1,  # which cronjob
    "operation_status": 0,  # 0 = success, 1=failure
    "cronjob_status": 0,  # what did we do to cronjob
}


def make_api_request(request: str, route: str, content: dict = None) -> str:
    """
    Pass route as "/route/subroute", not "route/subroute".
    .. code-block:: python
    make_api_request("POST", "/cronjob/update", content) # example
    """

    if request not in ["POST", "GET"]:
        raise Exception({"INTERNAL": "Expected request to be either POST or GET"})

    func = {
        "POST": r.post,
        "GET": r.get,
    }

    if not route.startswith("/"):
        raise Exception({"INTERNAL": "Expected route to start with a '/'"})

    _api_address = config.get("API_ADDRESS")
    destination = f"{_api_address}{route}"
    # we might need to request over http, so we should use unsecure connection
    response: Response = func[request](destination, json=content)

    return response.text


if __name__ == "__main__":
    print(make_api_request("POST", "/cronjob/receive", content))
