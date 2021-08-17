from typing import Any, MutableMapping, Optional, Union, Collection
from .utils import NamespacedClient

class IndicesClient(NamespacedClient):
    def create(
        self,
        index: Any,
        *,
        body: Optional[Any] = ...,
        include_type_name: Optional[Any] = ...,
        master_timeout: Optional[Any] = ...,
        timeout: Optional[Any] = ...,
        wait_for_active_shards: Optional[Any] = ...,
        pretty: Optional[bool] = ...,
        human: Optional[bool] = ...,
        error_trace: Optional[bool] = ...,
        format: Optional[str] = ...,
        filter_path: Optional[Union[str, Collection[str]]] = ...,
        request_timeout: Optional[Union[int, float]] = ...,
        ignore: Optional[Union[int, Collection[int]]] = ...,
        opaque_id: Optional[str] = ...,
        params: Optional[MutableMapping[str, Any]] = ...,
        headers: Optional[MutableMapping[str, str]] = ...
    ) -> Any: ...
