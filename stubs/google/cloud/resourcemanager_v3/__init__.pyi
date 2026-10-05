from google.auth import credentials as ga_credentials
from google.protobuf import timestamp_pb2

from typing import Any, Dict, MutableMapping, Optional, Sequence, Tuple, Union

class Project:
    class State:
        STATE_UNSPECIFIED: int
        ACTIVE: int
        DELETE_REQUESTED: int

    name: str
    parent: str
    project_id: str
    state: State
    display_name: str
    create_time: timestamp_pb2.Timestamp
    update_time: timestamp_pb2.Timestamp
    delete_time: timestamp_pb2.Timestamp
    etag: str
    labels: MutableMapping[str, str]
    def __init__(self, *, name: str = ..., project_id: str = ...) -> None: ...

class GetProjectRequest:
    name: str
    def __init__(self, *, name: str = ...) -> None: ...

class ProjectsClient:
    def __init__(
        self,
        *,
        credentials: Optional[ga_credentials.Credentials] = ...,
    ) -> None: ...
    @staticmethod
    def project_path(project: str) -> str: ...
    @staticmethod
    def parse_project_path(path: str) -> Dict[str, str]: ...
    def get_project(
        self,
        request: Optional[Union[GetProjectRequest, Dict[str, Any]]] = ...,
        *,
        name: Optional[str] = ...,
        timeout: Union[float, object] = ...,
        metadata: Sequence[Tuple[str, Union[str, bytes]]] = ...,
    ) -> Project: ...

__all__ = ['GetProjectRequest', 'Project', 'ProjectsClient']
