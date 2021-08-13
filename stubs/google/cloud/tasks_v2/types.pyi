from typing import Any
from google import protobuf


class Task:
    name: str = ...

class target_pb2(protobuf.message.Message):
    class HttpMethod(protobuf.message.Message):
        POST: str = ...
