from typing import Any, Dict, Optional, Sequence, Text, Tuple, Union
from google.api_core.retry import Retry

types: Any = ...

class Task:
    name: Text = ...

class CloudTasksClient(object):
    @classmethod
    def queue_path(cls, project: Text, location: Text, queue: Text) -> Text: ...

    def create_task(
        self,
        parent: Text,
        task: Union[Task, Dict[Text, Any]],
        retry: Retry,
        timeout: Optional[float] = ...,
        metadata: Optional[Sequence[Tuple[str, str]]] = ...
    ) -> Task: ...
