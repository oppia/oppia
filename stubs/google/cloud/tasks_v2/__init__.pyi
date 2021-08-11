from google import auth
from google.api_core.retry import Retry
from google.cloud.tasks_v2 import types

from typing import Any, Dict, Optional, Sequence, Tuple, Union


class CloudTasksClient(object):
    def __init__(
            self,
            credentials: auth.credentials.Credentials = ...
    ) -> None: ...

    @classmethod
    def queue_path(cls, project: str, location: str, queue: str) -> str: ...

    def create_task(
        self,
        parent: str,
        task: Union[types.Task, Dict[str, Any]],
        retry: Retry,
        timeout: Optional[float] = ...,
        metadata: Optional[Sequence[Tuple[str, str]]] = ...
    ) -> types.Task: ...


__all__ = [
    'CloudTasksClient',
    'types'
]
