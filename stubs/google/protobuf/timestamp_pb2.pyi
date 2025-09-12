# stubs/google/protobuf/timestamp_pb2.pyi
from typing import Any
from datetime import datetime

class Timestamp:
    def FromSeconds(self, seconds: int) -> None: ...
    def FromDatetime(self, dt: datetime) -> None: ...
