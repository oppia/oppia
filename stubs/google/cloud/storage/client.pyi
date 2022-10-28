from google.cloud.storage.blob import Blob
from google.cloud.storage.bucket import Bucket

from typing import Any, Iterator, Optional, Union

class Client(type):
    def __init__(*args: Any, **kwds: Any) -> None: ...
    def list_blobs(
            self, bucket_or_name: Union[Bucket, str], prefix: Optional[str]
    ) -> Iterator[Blob]: ...
    def get_bucket(self, bucket_or_name: Union[Bucket, str]) -> Bucket: ...
