from google import auth
from google.api_core.retry import Retry
from google.cloud.tasks_v2 import types

from typing import Any, Dict, Optional, Sequence, Text, Tuple, Union


class CloudTasksClient(object):
    def __init__(
            self,
            credentials: auth.credentials.Credentials = ...
    ) -> None: ...

    @classmethod
    def queue_path(cls, project: Text, location: Text, queue: Text) -> Text: ...

    def create_task(
        self,
        parent: Text,
        task: Union[types.Task, Dict[Text, Any]],
        retry: Retry,
        timeout: Optional[float] = ...,
        metadata: Optional[Sequence[Tuple[str, str]]] = ...
    ) -> types.Task: ...


__all__ = [
    'CloudTasksClient',
    'types'
]
