import json
import logging

import requests

from pymilvus.exceptions import MilvusException

logger = logging.getLogger(__name__)


def list_stages(
    url: str,
    api_key: str,
    project_id: str,
    current_page: int = 1,
    page_size: int = 10,
    **kwargs,
) -> requests.Response:
    """call listStages restful interface to list stages of project

    Args:
        url (str): url of the server
        api_key (str): API key to authenticate your requests.
        project_id (str): the id of project
        current_page (int): the current page
        page_size (int): the size of each page

    Returns:
        response of the restful interface
    """
    request_url = url + "/v2/stages"

    params = {"projectId": project_id, "currentPage": current_page, "pageSize": page_size}

    resp = _get_request(url=request_url, api_key=api_key, params=params, **kwargs)
    _handle_response(request_url, resp.json())
    return resp


def create_stage(
    url: str,
    api_key: str,
    project_id: str,
    region_id: str,
    stage_name: str,
    **kwargs,
) -> requests.Response:
    """call createStage restful interface to create new stage

    Args:
        url (str): url of the server
        api_key (str): API key to authenticate your requests.
        project_id (str): id of the project
        region_id (str): id of the region
        stage_name (str): name of the stage

    Returns:
        response of the restful interface
    """
    request_url = url + "/v2/stages/create"

    params = {
        "projectId": project_id,
        "regionId": region_id,
        "stageName": stage_name,
    }

    resp = _post_request(url=request_url, api_key=api_key, params=params, **kwargs)
    _handle_response(request_url, resp.json())
    return resp


def delete_stage(
    url: str,
    api_key: str,
    stage_name: str,
    **kwargs,
) -> requests.Response:
    """call deleteStage restful interface to create stage

    Args:
        url (str): url of the server
        api_key (str): API key to authenticate your requests.
        stage_name (str): name of the stage

    Returns:
        response of the restful interface
    """
    request_url = url + "/v2/stages/" + stage_name

    resp = _delete_request(url=request_url, api_key=api_key, **kwargs)
    _handle_response(request_url, resp.json())
    return resp


def apply_stage(
    url: str,
    api_key: str,
    stage_name: str,
    path: str,
    **kwargs,
) -> requests.Response:
    """call applyStage restful interface to apply cred of stage

    Args:
        url (str): url of the server
        api_key (str): API key to authenticate your requests.
        stage_name (str): name of the stage
        path(str): path of the stage

    Returns:
        response of the restful interface
    """
    request_url = url + "/v2/stages/apply"

    params = {"stageName": stage_name, "path": path}

    resp = _post_request(url=request_url, api_key=api_key, params=params, **kwargs)
    _handle_response(request_url, resp.json())
    return resp


def _http_headers(api_key: str):
    return {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_0) AppleWebKit/535.11 (KHTML, like Gecko) "
        "Chrome/17.0.963.56 Safari/535.11",
        "Accept": "application/json",
        "Accept-Encodin": "gzip,deflate,sdch",
        "Accept-Languag": "en-US,en;q=0.5",
        "Authorization": f"Bearer {api_key}",
    }


def _throw(msg: str):
    logger.error(msg)
    raise MilvusException(message=msg)


def _handle_response(url: str, res: json):
    inner_code = res["code"]
    if inner_code != 0:
        inner_message = res["message"]
        _throw(f"Failed to request url: {url}, code: {inner_code}, message: {inner_message}")


def _get_request(
    url: str,
    api_key: str,
    params: {},
    timeout: int = 60,
    **kwargs,
) -> requests.Response:
    """Send a GET request

    Args:
        url (str): The endpoint URL
        api_key (str): API key for authentication
        params (dict): JSON parameters for the request
        timeout (int): Timeout for the request

    Returns:
        requests.Response: Response object.
    """
    try:
        resp = requests.get(
            url=url,
            headers=_http_headers(api_key),
            params=params,
            timeout=timeout,
            **kwargs,
        )
        if resp.status_code != 200:
            _throw(f"Failed to get url: {url}, status code: {resp.status_code}")
        else:
            return resp
    except Exception as err:
        _throw(f"Failed to get url: {url}, error: {err}")


def _post_request(
    url: str,
    api_key: str,
    params: {},
    timeout: int = 60,
    **kwargs,
) -> requests.Response:
    """Send a POST request

    Args:
        url (str): The endpoint URL
        api_key (str): API key for authentication
        params (dict): JSON parameters for the request
        timeout (int): Timeout for the request

    Returns:
        requests.Response: Response object.
    """
    try:
        resp = requests.post(
            url=url,
            headers=_http_headers(api_key),
            json=params,
            timeout=timeout,
            **kwargs,
        )
        if resp.status_code != 200:
            _throw(f"Failed to post url: {url}, status code: {resp.status_code}")
        else:
            return resp
    except Exception as err:
        _throw(f"Failed to post url: {url}, error: {err}")


def _delete_request(
    url: str,
    api_key: str,
    timeout: int = 60,
    **kwargs,
) -> requests.Response:
    """Send a DELETE request

    Args:
        url (str): The endpoint URL
        api_key (str): API key for authentication
        timeout (int): Timeout for the request

    Returns:
        requests.Response: Response object.
    """
    try:
        resp = requests.delete(
            url=url,
            headers=_http_headers(api_key),
            timeout=timeout,
            **kwargs,
        )
        if resp.status_code != 200:
            _throw(f"Failed to delete url: {url}, status code: {resp.status_code}")
        else:
            return resp
    except Exception as err:
        _throw(f"Failed to delete url: {url}, error: {err}")
