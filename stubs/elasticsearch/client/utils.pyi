from ..client import Elasticsearch


class NamespacedClient:
    client: Elasticsearch
    def __init__(self, client: Elasticsearch) -> None: ...
