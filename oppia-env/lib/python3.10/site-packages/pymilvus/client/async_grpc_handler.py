import asyncio
import base64
import json
import socket
import time
from pathlib import Path
from typing import Dict, List, Optional, Union
from urllib import parse

import grpc
from grpc._cython import cygrpc

from pymilvus.decorators import ignore_unimplemented, retry_on_rpc_failure
from pymilvus.exceptions import (
    AmbiguousIndexName,
    DescribeCollectionException,
    ErrorCode,
    ExceptionsMessage,
    MilvusException,
    ParamError,
)
from pymilvus.grpc_gen import common_pb2, milvus_pb2_grpc
from pymilvus.grpc_gen import milvus_pb2 as milvus_types
from pymilvus.settings import Config

from . import entity_helper, ts_utils, utils
from .abstract import AnnSearchRequest, BaseRanker, CollectionSchema, FieldSchema, MutationResult
from .async_interceptor import async_header_adder_interceptor
from .check import (
    check_pass_param,
    is_legal_host,
    is_legal_port,
)
from .constants import ITERATOR_SESSION_TS_FIELD
from .interceptor import _api_level_md
from .prepare import Prepare
from .search_result import SearchResult
from .types import (
    AnalyzeResult,
    CompactionState,
    DatabaseInfo,
    GrantInfo,
    HybridExtraList,
    IndexState,
    ResourceGroupConfig,
    State,
    Status,
    get_cost_extra,
)
from .utils import (
    check_invalid_binary_vector,
    check_status,
    get_server_type,
    is_successful,
    len_of,
)


class AsyncGrpcHandler:
    def __init__(
        self,
        uri: str = Config.GRPC_URI,
        host: str = "",
        port: str = "",
        channel: Optional[grpc.aio.Channel] = None,
        **kwargs,
    ) -> None:
        self._async_stub = None
        self._async_channel = channel

        addr = kwargs.get("address")
        self._address = addr if addr is not None else self.__get_address(uri, host, port)
        self._log_level = None
        self._user = kwargs.get("user")
        self._set_authorization(**kwargs)
        self._setup_db_name(kwargs.get("db_name"))
        self._setup_grpc_channel(**kwargs)
        self._is_channel_ready = False
        self.callbacks = []  # Do nothing

    def __get_address(self, uri: str, host: str, port: str) -> str:
        if host != "" and port != "" and is_legal_host(host) and is_legal_port(port):
            return f"{host}:{port}"

        try:
            parsed_uri = parse.urlparse(uri)
        except Exception as e:
            raise ParamError(message=f"Illegal uri: [{uri}], {e}") from e
        return parsed_uri.netloc

    def _set_authorization(self, **kwargs):
        secure = kwargs.get("secure", False)
        if not isinstance(secure, bool):
            raise ParamError(message="secure must be bool type")
        self._secure = secure
        self._client_pem_path = kwargs.get("client_pem_path", "")
        self._client_key_path = kwargs.get("client_key_path", "")
        self._ca_pem_path = kwargs.get("ca_pem_path", "")
        self._server_pem_path = kwargs.get("server_pem_path", "")
        self._server_name = kwargs.get("server_name", "")

        self._async_authorization_interceptor = None

    def __enter__(self):
        return self

    def __exit__(self: object, exc_type: object, exc_val: object, exc_tb: object):
        pass

    async def close(self):
        await self._async_channel.close()
        self._async_channel = None

    def _setup_authorization_interceptor(self, user: str, password: str, token: str):
        keys = []
        values = []
        if token:
            authorization = base64.b64encode(f"{token}".encode())
            keys.append("authorization")
            values.append(authorization)
        elif user and password:
            authorization = base64.b64encode(f"{user}:{password}".encode())
            keys.append("authorization")
            values.append(authorization)
        if len(keys) > 0 and len(values) > 0:
            self._async_authorization_interceptor = async_header_adder_interceptor(keys, values)
            self._final_channel._unary_unary_interceptors.append(
                self._async_authorization_interceptor
            )

    def _setup_db_name(self, db_name: str):
        if db_name is None:
            self._db_name = None
        else:
            check_pass_param(db_name=db_name)
            self._db_name = db_name

    def _setup_grpc_channel(self, **kwargs):
        if self._async_channel is None:
            opts = [
                (cygrpc.ChannelArgKey.max_send_message_length, -1),
                (cygrpc.ChannelArgKey.max_receive_message_length, -1),
                ("grpc.enable_retries", 1),
                ("grpc.keepalive_time_ms", 55000),
            ]
            if not self._secure:
                self._async_channel = grpc.aio.insecure_channel(
                    self._address,
                    options=opts,
                )
            else:
                if self._server_name != "":
                    opts.append(("grpc.ssl_target_name_override", self._server_name))

                root_cert, private_k, cert_chain = None, None, None
                if self._server_pem_path != "":
                    with Path(self._server_pem_path).open("rb") as f:
                        root_cert = f.read()
                elif (
                    self._client_pem_path != ""
                    and self._client_key_path != ""
                    and self._ca_pem_path != ""
                ):
                    with Path(self._ca_pem_path).open("rb") as f:
                        root_cert = f.read()
                    with Path(self._client_key_path).open("rb") as f:
                        private_k = f.read()
                    with Path(self._client_pem_path).open("rb") as f:
                        cert_chain = f.read()

                creds = grpc.ssl_channel_credentials(
                    root_certificates=root_cert,
                    private_key=private_k,
                    certificate_chain=cert_chain,
                )
                self._async_channel = grpc.aio.secure_channel(
                    self._address,
                    creds,
                    options=opts,
                )

        # avoid to add duplicate headers.
        self._final_channel = self._async_channel

        if self._async_authorization_interceptor:
            self._final_channel._unary_unary_interceptors.append(
                self._async_authorization_interceptor
            )
        else:
            self._setup_authorization_interceptor(
                kwargs.get("user"),
                kwargs.get("password"),
                kwargs.get("token"),
            )
        if self._db_name:
            async_db_interceptor = async_header_adder_interceptor(["dbname"], [self._db_name])
            self._final_channel._unary_unary_interceptors.append(async_db_interceptor)
        if self._log_level:
            async_log_level_interceptor = async_header_adder_interceptor(
                ["log-level"], [self._log_level]
            )
            self._final_channel._unary_unary_interceptors.append(async_log_level_interceptor)
            self._log_level = None
        self._async_stub = milvus_pb2_grpc.MilvusServiceStub(self._final_channel)

    @property
    def server_address(self):
        return self._address

    def get_server_type(self):
        return get_server_type(self.server_address.split(":")[0])

    async def ensure_channel_ready(self):
        try:
            if not self._is_channel_ready:
                # wait for channel ready
                await self._async_channel.channel_ready()
                # set identifier interceptor
                host = socket.gethostname()
                req = Prepare.register_request(self._user, host)
                response = await self._async_stub.Connect(request=req)
                check_status(response.status)
                _async_identifier_interceptor = async_header_adder_interceptor(
                    ["identifier"], [str(response.identifier)]
                )
                self._async_channel._unary_unary_interceptors.append(_async_identifier_interceptor)
                self._async_stub = milvus_pb2_grpc.MilvusServiceStub(self._async_channel)

                self._is_channel_ready = True
        except grpc.FutureTimeoutError as e:
            raise MilvusException(
                code=Status.CONNECT_FAILED,
                message=f"Fail connecting to server on {self._address}, illegal connection params or server unavailable",
            ) from e
        except Exception as e:
            raise e from e

    @retry_on_rpc_failure()
    async def create_collection(
        self, collection_name: str, fields: List, timeout: Optional[float] = None, **kwargs
    ):
        await self.ensure_channel_ready()
        check_pass_param(collection_name=collection_name, timeout=timeout)
        request = Prepare.create_collection_request(collection_name, fields, **kwargs)
        response = await self._async_stub.CreateCollection(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response)

    @retry_on_rpc_failure()
    async def drop_collection(
        self, collection_name: str, timeout: Optional[float] = None, **kwargs
    ):
        await self.ensure_channel_ready()
        check_pass_param(collection_name=collection_name, timeout=timeout)
        request = Prepare.drop_collection_request(collection_name)
        response = await self._async_stub.DropCollection(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response)

    @retry_on_rpc_failure()
    async def load_collection(
        self,
        collection_name: str,
        replica_number: Optional[int] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        await self.ensure_channel_ready()

        check_pass_param(timeout=timeout)
        request = Prepare.load_collection(collection_name, replica_number, **kwargs)
        response = await self._async_stub.LoadCollection(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response)

        await self.wait_for_loading_collection(
            collection_name=collection_name,
            is_refresh=request.refresh,
            timeout=timeout,
            **kwargs,
        )

    @retry_on_rpc_failure()
    async def wait_for_loading_collection(
        self,
        collection_name: str,
        timeout: Optional[float] = None,
        is_refresh: bool = False,
        **kwargs,
    ):
        start = time.time()

        def can_loop(t: int) -> bool:
            return True if timeout is None else t <= (start + timeout)

        while can_loop(time.time()):
            progress = await self.get_loading_progress(
                collection_name=collection_name,
                is_refresh=is_refresh,
                timeout=timeout,
                **kwargs,
            )
            if progress >= 100:
                return
            await asyncio.sleep(Config.WaitTimeDurationWhenLoad)
        raise MilvusException(
            message=f"wait for loading collection timeout, collection: {collection_name}"
        )

    @retry_on_rpc_failure()
    async def get_loading_progress(
        self,
        collection_name: str,
        partition_names: Optional[List[str]] = None,
        timeout: Optional[float] = None,
        is_refresh: bool = False,
        **kwargs,
    ):
        request = Prepare.get_loading_progress(collection_name, partition_names)
        response = await self._async_stub.GetLoadingProgress(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response.status)
        if is_refresh:
            return response.refresh_progress
        return response.progress

    @retry_on_rpc_failure()
    async def describe_collection(
        self, collection_name: str, timeout: Optional[float] = None, **kwargs
    ):
        await self.ensure_channel_ready()
        check_pass_param(collection_name=collection_name, timeout=timeout)
        request = Prepare.describe_collection_request(collection_name)
        response = await self._async_stub.DescribeCollection(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        status = response.status

        if is_successful(status):
            return CollectionSchema(raw=response).dict()

        raise DescribeCollectionException(status.code, status.reason, status.error_code)

    async def _get_info(self, collection_name: str, timeout: Optional[float] = None, **kwargs):
        schema = kwargs.get("schema")
        if not schema:
            schema = await self.describe_collection(collection_name, timeout=timeout, **kwargs)

        fields_info = schema.get("fields")
        enable_dynamic = schema.get("enable_dynamic_field", False)

        return fields_info, enable_dynamic

    @retry_on_rpc_failure()
    async def release_collection(
        self, collection_name: str, timeout: Optional[float] = None, **kwargs
    ):
        await self.ensure_channel_ready()
        check_pass_param(collection_name=collection_name, timeout=timeout)
        request = Prepare.release_collection("", collection_name)
        response = await self._async_stub.ReleaseCollection(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response)

    @retry_on_rpc_failure()
    async def insert_rows(
        self,
        collection_name: str,
        entities: Union[Dict, List[Dict]],
        partition_name: Optional[str] = None,
        schema: Optional[dict] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        await self.ensure_channel_ready()
        request = await self._prepare_row_insert_request(
            collection_name, entities, partition_name, schema, timeout, **kwargs
        )
        resp = await self._async_stub.Insert(
            request=request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp.status)
        ts_utils.update_collection_ts(collection_name, resp.timestamp)
        return MutationResult(resp)

    async def _prepare_row_insert_request(
        self,
        collection_name: str,
        entity_rows: Union[List[Dict], Dict],
        partition_name: Optional[str] = None,
        schema: Optional[dict] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        if isinstance(entity_rows, dict):
            entity_rows = [entity_rows]

        if not isinstance(schema, dict):
            schema = await self.describe_collection(collection_name, timeout=timeout, **kwargs)

        fields_info = schema.get("fields")
        enable_dynamic = schema.get("enable_dynamic_field", False)

        return Prepare.row_insert_param(
            collection_name,
            entity_rows,
            partition_name,
            fields_info,
            enable_dynamic=enable_dynamic,
        )

    @retry_on_rpc_failure()
    async def delete(
        self,
        collection_name: str,
        expression: str,
        partition_name: Optional[str] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        await self.ensure_channel_ready()
        check_pass_param(collection_name=collection_name, timeout=timeout)
        try:
            req = Prepare.delete_request(
                collection_name=collection_name,
                filter=expression,
                partition_name=partition_name,
                consistency_level=kwargs.pop("consistency_level", 0),
                **kwargs,
            )

            response = await self._async_stub.Delete(
                req, timeout=timeout, metadata=_api_level_md(**kwargs)
            )

            m = MutationResult(response)
            ts_utils.update_collection_ts(collection_name, m.timestamp)
        except Exception as err:
            raise err from err
        else:
            return m

    async def _prepare_batch_upsert_request(
        self,
        collection_name: str,
        entities: List,
        partition_name: Optional[str] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        param = kwargs.get("upsert_param")
        if param and not isinstance(param, milvus_types.UpsertRequest):
            raise ParamError(message="The value of key 'upsert_param' is invalid")
        if not isinstance(entities, list):
            raise ParamError(message="'entities' must be a list, please provide valid entity data.")

        schema = kwargs.get("schema")
        if not schema:
            schema = await self.describe_collection(collection_name, timeout=timeout, **kwargs)

        fields_info = schema["fields"]

        return (
            param
            if param
            else Prepare.batch_upsert_param(collection_name, entities, partition_name, fields_info)
        )

    @retry_on_rpc_failure()
    async def upsert(
        self,
        collection_name: str,
        entities: List,
        partition_name: Optional[str] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        await self.ensure_channel_ready()
        if not check_invalid_binary_vector(entities):
            raise ParamError(message="Invalid binary vector data exists")

        request = await self._prepare_batch_upsert_request(
            collection_name, entities, partition_name, timeout, **kwargs
        )
        response = await self._async_stub.Upsert(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response.status)
        m = MutationResult(response)
        ts_utils.update_collection_ts(collection_name, m.timestamp)
        return m

    async def _prepare_row_upsert_request(
        self,
        collection_name: str,
        rows: List,
        partition_name: Optional[str] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        if not isinstance(rows, list):
            raise ParamError(message="'rows' must be a list, please provide valid row data.")

        fields_info, enable_dynamic = await self._get_info(collection_name, timeout, **kwargs)
        return Prepare.row_upsert_param(
            collection_name,
            rows,
            partition_name,
            fields_info,
            enable_dynamic=enable_dynamic,
        )

    @retry_on_rpc_failure()
    async def upsert_rows(
        self,
        collection_name: str,
        entities: List,
        partition_name: Optional[str] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        await self.ensure_channel_ready()
        if isinstance(entities, dict):
            entities = [entities]
        request = await self._prepare_row_upsert_request(
            collection_name, entities, partition_name, timeout, **kwargs
        )
        response = await self._async_stub.Upsert(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response.status)
        m = MutationResult(response)
        ts_utils.update_collection_ts(collection_name, m.timestamp)
        return m

    async def _execute_search(
        self, request: milvus_types.SearchRequest, timeout: Optional[float] = None, **kwargs
    ):
        response = await self._async_stub.Search(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response.status)
        round_decimal = kwargs.get("round_decimal", -1)
        return SearchResult(
            response.results,
            round_decimal,
            status=response.status,
            session_ts=response.session_ts,
        )

    async def _execute_hybrid_search(
        self, request: milvus_types.HybridSearchRequest, timeout: Optional[float] = None, **kwargs
    ):
        response = await self._async_stub.HybridSearch(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response.status)
        round_decimal = kwargs.get("round_decimal", -1)
        return SearchResult(response.results, round_decimal, status=response.status)

    @retry_on_rpc_failure()
    async def search(
        self,
        collection_name: str,
        data: Union[List[List[float]], utils.SparseMatrixInputType],
        anns_field: str,
        param: Dict,
        limit: int,
        expression: Optional[str] = None,
        partition_names: Optional[List[str]] = None,
        output_fields: Optional[List[str]] = None,
        round_decimal: int = -1,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        await self.ensure_channel_ready()
        check_pass_param(
            limit=limit,
            round_decimal=round_decimal,
            anns_field=anns_field,
            search_data=data,
            partition_name_array=partition_names,
            output_fields=output_fields,
            guarantee_timestamp=kwargs.get("guarantee_timestamp"),
            timeout=timeout,
        )
        request = Prepare.search_requests_with_expr(
            collection_name,
            data,
            anns_field,
            param,
            limit,
            expression,
            partition_names,
            output_fields,
            round_decimal,
            **kwargs,
        )
        return await self._execute_search(request, timeout, round_decimal=round_decimal, **kwargs)

    @retry_on_rpc_failure()
    async def hybrid_search(
        self,
        collection_name: str,
        reqs: List[AnnSearchRequest],
        rerank: BaseRanker,
        limit: int,
        partition_names: Optional[List[str]] = None,
        output_fields: Optional[List[str]] = None,
        round_decimal: int = -1,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        await self.ensure_channel_ready()
        check_pass_param(
            limit=limit,
            round_decimal=round_decimal,
            partition_name_array=partition_names,
            output_fields=output_fields,
            guarantee_timestamp=kwargs.get("guarantee_timestamp"),
            timeout=timeout,
        )

        requests = []
        for req in reqs:
            search_request = Prepare.search_requests_with_expr(
                collection_name,
                req.data,
                req.anns_field,
                req.param,
                req.limit,
                req.expr,
                partition_names=partition_names,
                round_decimal=round_decimal,
                expr_params=req.expr_params,
                **kwargs,
            )
            requests.append(search_request)

        hybrid_search_request = Prepare.hybrid_search_request_with_ranker(
            collection_name,
            requests,
            rerank.dict(),
            limit,
            partition_names,
            output_fields,
            round_decimal,
            **kwargs,
        )
        return await self._execute_hybrid_search(
            hybrid_search_request, timeout, round_decimal=round_decimal, **kwargs
        )

    @retry_on_rpc_failure()
    async def create_index(
        self,
        collection_name: str,
        field_name: str,
        params: Dict,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        # for historical reason, index_name contained in kwargs.
        index_name = kwargs.pop("index_name", Config.IndexName)
        await self.ensure_channel_ready()

        index_param = Prepare.create_index_request(
            collection_name, field_name, params, index_name=index_name
        )

        status = await self._async_stub.CreateIndex(
            index_param, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(status)

        index_success, fail_reason = await self.wait_for_creating_index(
            collection_name=collection_name,
            index_name=index_name,
            timeout=timeout,
            field_name=field_name,
            **kwargs,
        )

        if not index_success:
            raise MilvusException(message=fail_reason)

        return Status(status.code, status.reason)

    @retry_on_rpc_failure()
    async def wait_for_creating_index(
        self, collection_name: str, index_name: str, timeout: Optional[float] = None, **kwargs
    ):
        timestamp = await self.alloc_timestamp()
        start = time.time()
        while True:
            await asyncio.sleep(0.5)
            state, fail_reason = await self.get_index_state(
                collection_name, index_name, timeout=timeout, timestamp=timestamp, **kwargs
            )
            if state == IndexState.Finished:
                return True, fail_reason
            if state == IndexState.Failed:
                return False, fail_reason
            end = time.time()
            if isinstance(timeout, int) and end - start > timeout:
                msg = (
                    f"collection {collection_name} create index {index_name} "
                    f"timeout in {timeout}s"
                )
                raise MilvusException(message=msg)

    @retry_on_rpc_failure()
    async def get_index_state(
        self,
        collection_name: str,
        index_name: str,
        timeout: Optional[float] = None,
        timestamp: Optional[int] = None,
        **kwargs,
    ):
        request = Prepare.describe_index_request(collection_name, index_name, timestamp)
        response = await self._async_stub.DescribeIndex(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        status = response.status
        check_status(status)

        if len(response.index_descriptions) == 1:
            index_desc = response.index_descriptions[0]
            return index_desc.state, index_desc.index_state_fail_reason
        # just for create_index.
        field_name = kwargs.pop("field_name", "")
        if field_name != "":
            for index_desc in response.index_descriptions:
                if index_desc.field_name == field_name:
                    return index_desc.state, index_desc.index_state_fail_reason

        raise AmbiguousIndexName(message=ExceptionsMessage.AmbiguousIndexName)

    @retry_on_rpc_failure()
    async def drop_index(
        self,
        collection_name: str,
        field_name: str,
        index_name: str,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        await self.ensure_channel_ready()
        check_pass_param(collection_name=collection_name, timeout=timeout)
        request = Prepare.drop_index_request(collection_name, field_name, index_name)
        response = await self._async_stub.DropIndex(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response)

    @retry_on_rpc_failure()
    async def create_partition(
        self, collection_name: str, partition_name: str, timeout: Optional[float] = None, **kwargs
    ):
        await self.ensure_channel_ready()
        check_pass_param(
            collection_name=collection_name, partition_name=partition_name, timeout=timeout
        )
        request = Prepare.create_partition_request(collection_name, partition_name)
        response = await self._async_stub.CreatePartition(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response)

    @retry_on_rpc_failure()
    async def drop_partition(
        self, collection_name: str, partition_name: str, timeout: Optional[float] = None, **kwargs
    ):
        await self.ensure_channel_ready()
        check_pass_param(
            collection_name=collection_name, partition_name=partition_name, timeout=timeout
        )
        request = Prepare.drop_partition_request(collection_name, partition_name)

        response = await self._async_stub.DropPartition(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response)

    @retry_on_rpc_failure()
    async def load_partitions(
        self,
        collection_name: str,
        partition_names: List[str],
        replica_number: Optional[int] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        await self.ensure_channel_ready()
        check_pass_param(timeout=timeout)

        request = Prepare.load_partitions(
            collection_name=collection_name,
            partition_names=partition_names,
            replica_number=replica_number,
            **kwargs,
        )
        response = await self._async_stub.LoadPartitions(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response)

        await self.wait_for_loading_partitions(
            collection_name=collection_name,
            partition_names=partition_names,
            is_refresh=request.is_refresh,
            timeout=timeout,
            **kwargs,
        )

    @retry_on_rpc_failure()
    async def wait_for_loading_partitions(
        self,
        collection_name: str,
        partition_names: List[str],
        timeout: Optional[float] = None,
        is_refresh: bool = False,
        **kwargs,
    ):
        start = time.time()

        def can_loop(t: int) -> bool:
            return True if timeout is None else t <= (start + timeout)

        while can_loop(time.time()):
            progress = await self.get_loading_progress(
                collection_name, partition_names, timeout=timeout, is_refresh=is_refresh, **kwargs
            )
            if progress >= 100:
                return
            await asyncio.sleep(Config.WaitTimeDurationWhenLoad)
        raise MilvusException(
            message=f"wait for loading partition timeout, collection: {collection_name}, partitions: {partition_names}"
        )

    @retry_on_rpc_failure()
    async def release_partitions(
        self,
        collection_name: str,
        partition_names: List[str],
        timeout: Optional[float] = None,
        **kwargs,
    ):
        await self.ensure_channel_ready()
        check_pass_param(
            collection_name=collection_name, partition_name_array=partition_names, timeout=timeout
        )
        request = Prepare.release_partitions("", collection_name, partition_names)
        response = await self._async_stub.ReleasePartitions(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response)

    @retry_on_rpc_failure()
    async def get(
        self,
        collection_name: str,
        ids: List[int],
        output_fields: Optional[List[str]] = None,
        partition_names: Optional[List[str]] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        # TODO: some check
        await self.ensure_channel_ready()
        request = Prepare.retrieve_request(collection_name, ids, output_fields, partition_names)
        return await self._async_stub.Retrieve.get(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )

    @retry_on_rpc_failure()
    async def query(
        self,
        collection_name: str,
        expr: str,
        output_fields: Optional[List[str]] = None,
        partition_names: Optional[List[str]] = None,
        timeout: Optional[float] = None,
        strict_float32: bool = False,
        **kwargs,
    ):
        await self.ensure_channel_ready()
        if output_fields is not None and not isinstance(output_fields, (list,)):
            raise ParamError(message="Invalid query format. 'output_fields' must be a list")
        request = Prepare.query_request(
            collection_name, expr, output_fields, partition_names, **kwargs
        )
        response = await self._async_stub.Query(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response.status)

        num_fields = len(response.fields_data)
        # check has fields
        if num_fields == 0:
            raise MilvusException(message="No fields returned")

        # check if all lists are of the same length
        it = iter(response.fields_data)
        num_entities = len_of(next(it))
        if not all(len_of(field_data) == num_entities for field_data in it):
            raise MilvusException(message="The length of fields data is inconsistent")

        _, dynamic_fields = entity_helper.extract_dynamic_field_from_result(response)
        keys = [field_data.field_name for field_data in response.fields_data]
        filtered_keys = [k for k in keys if k != "$meta"]
        results = [dict.fromkeys(filtered_keys) for _ in range(num_entities)]
        lazy_field_data = []
        for field_data in response.fields_data:
            lazy_extracted = entity_helper.extract_row_data_from_fields_data_v2(field_data, results)
            if lazy_extracted:
                lazy_field_data.append(field_data)

        extra_dict = get_cost_extra(response.status)
        extra_dict[ITERATOR_SESSION_TS_FIELD] = response.session_ts
        return HybridExtraList(
            lazy_field_data,
            results,
            extra=extra_dict,
            dynamic_fields=dynamic_fields,
            strict_float32=strict_float32,
        )

    @retry_on_rpc_failure()
    @ignore_unimplemented(0)
    async def alloc_timestamp(self, timeout: Optional[float] = None, **kwargs) -> int:
        request = milvus_types.AllocTimestampRequest()
        response = await self._async_stub.AllocTimestamp(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response.status)
        return response.timestamp

    @retry_on_rpc_failure()
    async def alter_collection_properties(
        self, collection_name: str, properties: dict, timeout: Optional[float] = None, **kwargs
    ):
        await self.ensure_channel_ready()
        check_pass_param(collection_name=collection_name, properties=properties, timeout=timeout)
        request = Prepare.alter_collection_request(collection_name, properties=properties)
        status = await self._async_stub.AlterCollection(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(status)

    @retry_on_rpc_failure()
    async def drop_collection_properties(
        self,
        collection_name: str,
        property_keys: List[str],
        timeout: Optional[float] = None,
        **kwargs,
    ):
        await self.ensure_channel_ready()
        check_pass_param(collection_name=collection_name, timeout=timeout)
        request = Prepare.alter_collection_request(collection_name, delete_keys=property_keys)
        status = await self._async_stub.AlterCollection(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(status)

    @retry_on_rpc_failure()
    async def alter_collection_field(
        self,
        collection_name: str,
        field_name: str,
        field_params: dict,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        await self.ensure_channel_ready()
        check_pass_param(collection_name=collection_name, properties=field_params, timeout=timeout)
        request = Prepare.alter_collection_field_request(
            collection_name=collection_name, field_name=field_name, field_param=field_params
        )
        status = await self._async_stub.AlterCollectionField(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(status)

    @retry_on_rpc_failure()
    async def add_collection_field(
        self,
        collection_name: str,
        field_schema: FieldSchema,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        await self.ensure_channel_ready()
        check_pass_param(collection_name=collection_name, timeout=timeout)
        request = Prepare.add_collection_field_request(collection_name, field_schema)
        status = await self._async_stub.AddCollectionField(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(status)

    @retry_on_rpc_failure()
    async def list_indexes(self, collection_name: str, timeout: Optional[float] = None, **kwargs):
        await self.ensure_channel_ready()
        check_pass_param(collection_name=collection_name, timeout=timeout)
        request = Prepare.describe_index_request(collection_name, "")

        response = await self._async_stub.DescribeIndex(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        status = response.status
        if is_successful(status):
            return response.index_descriptions
        if status.code == ErrorCode.INDEX_NOT_FOUND or status.error_code == Status.INDEX_NOT_EXIST:
            return []
        raise MilvusException(status.code, status.reason, status.error_code)

    @retry_on_rpc_failure()
    async def describe_index(
        self,
        collection_name: str,
        index_name: str,
        timeout: Optional[float] = None,
        timestamp: Optional[int] = None,
        **kwargs,
    ):
        await self.ensure_channel_ready()
        check_pass_param(collection_name=collection_name, index_name=index_name, timeout=timeout)
        request = Prepare.describe_index_request(collection_name, index_name, timestamp=timestamp)

        response = await self._async_stub.DescribeIndex(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        status = response.status
        if status.code == ErrorCode.INDEX_NOT_FOUND or status.error_code == Status.INDEX_NOT_EXIST:
            return None
        check_status(status)
        if len(response.index_descriptions) == 1:
            info_dict = {kv.key: kv.value for kv in response.index_descriptions[0].params}
            info_dict["field_name"] = response.index_descriptions[0].field_name
            info_dict["index_name"] = response.index_descriptions[0].index_name
            if info_dict.get("params"):
                info_dict["params"] = json.loads(info_dict["params"])
            info_dict["total_rows"] = response.index_descriptions[0].total_rows
            info_dict["indexed_rows"] = response.index_descriptions[0].indexed_rows
            info_dict["pending_index_rows"] = response.index_descriptions[0].pending_index_rows
            info_dict["state"] = common_pb2.IndexState.Name(response.index_descriptions[0].state)
            return info_dict

        raise AmbiguousIndexName(message=ExceptionsMessage.AmbiguousIndexName)

    @retry_on_rpc_failure()
    async def alter_index_properties(
        self,
        collection_name: str,
        index_name: str,
        properties: dict,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        await self.ensure_channel_ready()
        check_pass_param(collection_name=collection_name, index_name=index_name, timeout=timeout)
        if properties is None:
            raise ParamError(message="properties should not be None")

        request = Prepare.alter_index_properties_request(collection_name, index_name, properties)
        response = await self._async_stub.AlterIndex(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response)

    @retry_on_rpc_failure()
    async def drop_index_properties(
        self,
        collection_name: str,
        index_name: str,
        property_keys: List[str],
        timeout: Optional[float] = None,
        **kwargs,
    ):
        await self.ensure_channel_ready()
        check_pass_param(collection_name=collection_name, index_name=index_name, timeout=timeout)
        request = Prepare.drop_index_properties_request(
            collection_name, index_name, delete_keys=property_keys
        )
        response = await self._async_stub.AlterIndex(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response)

    @retry_on_rpc_failure()
    async def create_alias(
        self, collection_name: str, alias: str, timeout: Optional[float] = None, **kwargs
    ):
        await self.ensure_channel_ready()
        check_pass_param(collection_name=collection_name, timeout=timeout)
        request = Prepare.create_alias_request(collection_name, alias)
        response = await self._async_stub.CreateAlias(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response)

    @retry_on_rpc_failure()
    async def drop_alias(self, alias: str, timeout: Optional[float] = None, **kwargs):
        await self.ensure_channel_ready()
        request = Prepare.drop_alias_request(alias)
        response = await self._async_stub.DropAlias(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response)

    @retry_on_rpc_failure()
    async def alter_alias(
        self, collection_name: str, alias: str, timeout: Optional[float] = None, **kwargs
    ):
        await self.ensure_channel_ready()
        check_pass_param(collection_name=collection_name, timeout=timeout)
        request = Prepare.alter_alias_request(collection_name, alias)
        response = await self._async_stub.AlterAlias(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response)

    @retry_on_rpc_failure()
    async def describe_alias(self, alias: str, timeout: Optional[float] = None, **kwargs):
        await self.ensure_channel_ready()
        check_pass_param(alias=alias, timeout=timeout)
        request = Prepare.describe_alias_request(alias)
        response = await self._async_stub.DescribeAlias(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response.status)
        ret = {
            "alias": alias,
        }
        if response.collection:
            ret["collection_name"] = response.collection
        if response.db_name:
            ret["db_name"] = response.db_name
        return ret

    @retry_on_rpc_failure()
    async def list_aliases(self, collection_name: str, timeout: Optional[float] = None, **kwargs):
        await self.ensure_channel_ready()
        check_pass_param(collection_name=collection_name, timeout=timeout)
        request = Prepare.list_aliases_request(collection_name)
        response = await self._async_stub.ListAliases(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response.status)
        return response.aliases

    def reset_db_name(self, db_name: str):
        self._setup_db_name(db_name)
        self._setup_grpc_channel()

    @retry_on_rpc_failure()
    async def create_database(
        self,
        db_name: str,
        properties: Optional[dict] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        await self.ensure_channel_ready()
        check_pass_param(db_name=db_name, timeout=timeout)
        request = Prepare.create_database_req(db_name, properties=properties)
        status = await self._async_stub.CreateDatabase(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(status)

    @retry_on_rpc_failure()
    async def drop_database(self, db_name: str, timeout: Optional[float] = None, **kwargs):
        await self.ensure_channel_ready()
        request = Prepare.drop_database_req(db_name)
        status = await self._async_stub.DropDatabase(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(status)

    @retry_on_rpc_failure()
    async def list_database(self, timeout: Optional[float] = None, **kwargs):
        await self.ensure_channel_ready()
        check_pass_param(timeout=timeout)
        request = Prepare.list_database_req()
        response = await self._async_stub.ListDatabases(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response.status)
        return list(response.db_names)

    @retry_on_rpc_failure()
    async def alter_database(
        self, db_name: str, properties: dict, timeout: Optional[float] = None, **kwargs
    ):
        await self.ensure_channel_ready()
        request = Prepare.alter_database_properties_req(db_name, properties)
        status = await self._async_stub.AlterDatabase(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(status)

    @retry_on_rpc_failure()
    async def drop_database_properties(
        self, db_name: str, property_keys: List[str], timeout: Optional[float] = None, **kwargs
    ):
        await self.ensure_channel_ready()
        request = Prepare.drop_database_properties_req(db_name, property_keys)
        status = await self._async_stub.AlterDatabase(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(status)

    @retry_on_rpc_failure()
    async def describe_database(self, db_name: str, timeout: Optional[float] = None, **kwargs):
        await self.ensure_channel_ready()
        request = Prepare.describe_database_req(db_name=db_name)
        resp = await self._async_stub.DescribeDatabase(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp.status)
        return DatabaseInfo(resp).to_dict()

    @retry_on_rpc_failure()
    async def create_privilege_group(
        self, privilege_group: str, timeout: Optional[float] = None, **kwargs
    ):
        await self.ensure_channel_ready()
        req = Prepare.create_privilege_group_req(privilege_group)
        resp = await self._async_stub.CreatePrivilegeGroup(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    async def drop_privilege_group(
        self, privilege_group: str, timeout: Optional[float] = None, **kwargs
    ):
        await self.ensure_channel_ready()
        req = Prepare.drop_privilege_group_req(privilege_group)
        resp = await self._async_stub.DropPrivilegeGroup(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    async def list_privilege_groups(self, timeout: Optional[float] = None, **kwargs):
        await self.ensure_channel_ready()
        req = Prepare.list_privilege_groups_req()
        resp = await self._async_stub.ListPrivilegeGroups(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp.status)
        return resp.privilege_groups

    @retry_on_rpc_failure()
    async def add_privileges_to_group(
        self, privilege_group: str, privileges: List[str], timeout: Optional[float] = None, **kwargs
    ):
        await self.ensure_channel_ready()
        req = Prepare.operate_privilege_group_req(
            privilege_group, privileges, milvus_types.OperatePrivilegeGroupType.AddPrivilegesToGroup
        )
        resp = await self._async_stub.OperatePrivilegeGroup(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    async def remove_privileges_from_group(
        self, privilege_group: str, privileges: List[str], timeout: Optional[float] = None, **kwargs
    ):
        await self.ensure_channel_ready()
        req = Prepare.operate_privilege_group_req(
            privilege_group,
            privileges,
            milvus_types.OperatePrivilegeGroupType.RemovePrivilegesFromGroup,
        )
        resp = await self._async_stub.OperatePrivilegeGroup(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    async def create_user(
        self, user: str, password: str, timeout: Optional[float] = None, **kwargs
    ):
        check_pass_param(user=user, password=password, timeout=timeout)
        req = Prepare.create_user_request(user, password)
        resp = await self._async_stub.CreateCredential(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    async def drop_user(self, user: str, timeout: Optional[float] = None, **kwargs):
        req = Prepare.delete_user_request(user)
        resp = await self._async_stub.DeleteCredential(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    async def update_password(
        self,
        user: str,
        old_password: str,
        new_password: str,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        req = Prepare.update_password_request(user, old_password, new_password)
        resp = await self._async_stub.UpdateCredential(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    async def list_users(self, timeout: Optional[float] = None, **kwargs):
        req = Prepare.list_usernames_request()
        resp = await self._async_stub.ListCredUsers(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp.status)
        return resp.usernames

    @retry_on_rpc_failure()
    async def describe_user(
        self, username: str, include_role_info: bool, timeout: Optional[float] = None, **kwargs
    ):
        req = Prepare.select_user_request(username, include_role_info)
        resp = await self._async_stub.SelectUser(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp.status)
        return resp

    @retry_on_rpc_failure()
    async def create_role(self, role_name: str, timeout: Optional[float] = None, **kwargs):
        await self.ensure_channel_ready()
        req = Prepare.create_role_request(role_name)
        resp = await self._async_stub.CreateRole(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    async def drop_role(
        self, role_name: str, force_drop: bool = False, timeout: Optional[float] = None, **kwargs
    ):
        await self.ensure_channel_ready()
        req = Prepare.drop_role_request(role_name, force_drop=force_drop)
        resp = await self._async_stub.DropRole(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    async def grant_role(
        self, username: str, role_name: str, timeout: Optional[float] = None, **kwargs
    ):
        await self.ensure_channel_ready()
        req = Prepare.operate_user_role_request(
            username, role_name, milvus_types.OperateUserRoleType.AddUserToRole
        )
        resp = await self._async_stub.OperateUserRole(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    async def revoke_role(
        self, username: str, role_name: str, timeout: Optional[float] = None, **kwargs
    ):
        await self.ensure_channel_ready()
        req = Prepare.operate_user_role_request(
            username, role_name, milvus_types.OperateUserRoleType.RemoveUserFromRole
        )
        resp = await self._async_stub.OperateUserRole(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    async def describe_role(
        self, role_name: str, include_user_info: bool, timeout: Optional[float] = None, **kwargs
    ):
        await self.ensure_channel_ready()
        req = Prepare.select_role_request(role_name, include_user_info)
        resp = await self._async_stub.SelectRole(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp.status)
        return resp.results

    @retry_on_rpc_failure()
    async def list_roles(self, include_user_info: bool, timeout: Optional[float] = None, **kwargs):
        await self.ensure_channel_ready()
        req = Prepare.select_role_request(None, include_user_info)
        resp = await self._async_stub.SelectRole(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp.status)
        return resp.results

    @retry_on_rpc_failure()
    async def select_grant_for_one_role(
        self, role_name: str, db_name: str, timeout: Optional[float] = None, **kwargs
    ):
        await self.ensure_channel_ready()
        req = Prepare.select_grant_request(role_name, None, None, db_name)
        resp = await self._async_stub.SelectGrant(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp.status)

        return GrantInfo(resp.entities)

    @retry_on_rpc_failure()
    async def grant_privilege(
        self,
        role_name: str,
        object: str,
        object_name: str,
        privilege: str,
        db_name: str,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        await self.ensure_channel_ready()
        req = Prepare.operate_privilege_request(
            role_name,
            object,
            object_name,
            privilege,
            db_name,
            milvus_types.OperatePrivilegeType.Grant,
        )
        resp = await self._async_stub.OperatePrivilege(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    async def revoke_privilege(
        self,
        role_name: str,
        object: str,
        object_name: str,
        privilege: str,
        db_name: str,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        await self.ensure_channel_ready()
        req = Prepare.operate_privilege_request(
            role_name,
            object,
            object_name,
            privilege,
            db_name,
            milvus_types.OperatePrivilegeType.Revoke,
        )
        resp = await self._async_stub.OperatePrivilege(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    async def grant_privilege_v2(
        self,
        role_name: str,
        privilege: str,
        collection_name: str,
        db_name: Optional[str] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        await self.ensure_channel_ready()
        req = Prepare.operate_privilege_v2_request(
            role_name,
            privilege,
            milvus_types.OperatePrivilegeType.Grant,
            db_name,
            collection_name,
        )
        resp = await self._async_stub.OperatePrivilegeV2(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    async def revoke_privilege_v2(
        self,
        role_name: str,
        privilege: str,
        collection_name: str,
        db_name: Optional[str] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        await self.ensure_channel_ready()
        req = Prepare.operate_privilege_v2_request(
            role_name,
            privilege,
            milvus_types.OperatePrivilegeType.Revoke,
            db_name,
            collection_name,
        )
        resp = await self._async_stub.OperatePrivilegeV2(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    async def create_resource_group(self, name: str, timeout: Optional[float] = None, **kwargs):
        req = Prepare.create_resource_group(name, **kwargs)
        resp = await self._async_stub.CreateResourceGroup(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    async def drop_resource_group(self, name: str, timeout: Optional[float] = None, **kwargs):
        req = Prepare.drop_resource_group(name)
        resp = await self._async_stub.DropResourceGroup(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    async def update_resource_groups(
        self, configs: Dict[str, ResourceGroupConfig], timeout: Optional[float] = None, **kwargs
    ):
        req = Prepare.update_resource_groups(configs)
        resp = await self._async_stub.UpdateResourceGroups(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    async def describe_resource_group(self, name: str, timeout: Optional[float] = None, **kwargs):
        req = Prepare.describe_resource_group(name)
        resp = await self._async_stub.DescribeResourceGroup(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp.status)
        return resp.resource_group

    @retry_on_rpc_failure()
    async def list_resource_groups(self, timeout: Optional[float] = None, **kwargs):
        req = Prepare.list_resource_groups()
        resp = await self._async_stub.ListResourceGroups(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp.status)
        return list(resp.resource_groups)

    @retry_on_rpc_failure()
    async def transfer_replica(
        self,
        source: str,
        target: str,
        collection_name: str,
        num_replica: int,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        req = Prepare.transfer_replica(source, target, collection_name, num_replica)
        resp = await self._async_stub.TransferReplica(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    async def flush(self, collection_names: List[str], timeout: Optional[float] = None, **kwargs):
        req = Prepare.flush_param(collection_names)
        response = await self._async_stub.Flush(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response.status)
        return response

    @retry_on_rpc_failure()
    async def compact(
        self,
        collection_name: str,
        is_clustering: Optional[bool] = False,
        timeout: Optional[float] = None,
        **kwargs,
    ) -> int:
        meta = _api_level_md(**kwargs)
        request = Prepare.describe_collection_request(collection_name)
        response = await self._async_stub.DescribeCollection(
            request, timeout=timeout, metadata=meta
        )
        check_status(response.status)

        req = Prepare.manual_compaction(collection_name, is_clustering, response.collectionID)
        response = await self._async_stub.ManualCompaction(req, timeout=timeout, metadata=meta)
        check_status(response.status)

        return response.compactionID

    @retry_on_rpc_failure()
    async def get_compaction_state(
        self, compaction_id: int, timeout: Optional[float] = None, **kwargs
    ):
        req = Prepare.get_compaction_state(compaction_id)
        response = await self._async_stub.GetCompactionState(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response.status)

        return CompactionState(
            compaction_id,
            State.new(response.state),
            response.executingPlanNo,
            response.timeoutPlanNo,
            response.completedPlanNo,
        )

    @retry_on_rpc_failure()
    async def run_analyzer(
        self,
        texts: Union[str, List[str]],
        analyzer_params: Optional[Union[str, Dict]] = None,
        with_hash: bool = False,
        with_detail: bool = False,
        collection_name: Optional[str] = None,
        field_name: Optional[str] = None,
        analyzer_names: Optional[Union[str, List[str]]] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        req = Prepare.run_analyzer(
            texts,
            analyzer_params=analyzer_params,
            with_hash=with_hash,
            with_detail=with_detail,
            collection_name=collection_name,
            field_name=field_name,
            analyzer_names=analyzer_names,
        )
        resp = await self._async_stub.RunAnalyzer(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp.status)

        if isinstance(texts, str):
            return AnalyzeResult(resp.results[0], with_hash, with_detail)
        return [AnalyzeResult(result, with_hash, with_detail) for result in resp.results]
