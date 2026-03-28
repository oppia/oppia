import base64
import json
import socket
import time
from pathlib import Path
from typing import Any, Callable, Dict, List, Mapping, Optional, Union
from urllib import parse

import grpc
from grpc._cython import cygrpc

from pymilvus.decorators import ignore_unimplemented, retry_on_rpc_failure, upgrade_reminder
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

from . import entity_helper, interceptor, ts_utils, utils
from .abstract import (
    AnnSearchRequest,
    BaseRanker,
    CollectionSchema,
    MutationResult,
)
from .asynch import (
    CreateIndexFuture,
    FlushFuture,
    MutationFuture,
    SearchFuture,
)
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
    BulkInsertState,
    CompactionPlans,
    CompactionState,
    DatabaseInfo,
    GrantInfo,
    Group,
    HybridExtraList,
    IndexState,
    LoadState,
    Plan,
    PrivilegeGroupInfo,
    Replica,
    ReplicaInfo,
    ResourceGroupConfig,
    ResourceGroupInfo,
    RoleInfo,
    Shard,
    State,
    Status,
    UserInfo,
    get_cost_extra,
)
from .utils import (
    check_invalid_binary_vector,
    check_status,
    get_server_type,
    is_successful,
    len_of,
)


class GrpcHandler:
    # pylint: disable=too-many-instance-attributes

    def __init__(
        self,
        uri: str = Config.GRPC_URI,
        host: str = "",
        port: str = "",
        channel: Optional[grpc.Channel] = None,
        **kwargs,
    ) -> None:
        self._stub = None
        self._channel = channel

        addr = kwargs.get("address")
        self._address = addr if addr is not None else self.__get_address(uri, host, port)
        self._log_level = None
        self._user = kwargs.get("user")
        self._set_authorization(**kwargs)
        self._setup_db_interceptor(kwargs.get("db_name"))
        self._setup_grpc_channel()
        self.callbacks = []
        self.schema_cache = {}

    def register_state_change_callback(self, callback: Callable):
        self.callbacks.append(callback)
        self._channel.subscribe(callback, try_to_connect=True)

    def deregister_state_change_callbacks(self):
        for callback in self.callbacks:
            self._channel.unsubscribe(callback)
        self.callbacks = []

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

        self._authorization_interceptor = None
        self._setup_authorization_interceptor(
            kwargs.get("user"),
            kwargs.get("password"),
            kwargs.get("token"),
        )

    def __enter__(self):
        return self

    def __exit__(self: object, exc_type: object, exc_val: object, exc_tb: object):
        pass

    def _wait_for_channel_ready(self, timeout: Union[float] = 10):
        if self._channel is None:
            raise MilvusException(
                code=Status.CONNECT_FAILED,
                message="No channel in handler, please setup grpc channel first",
            )

        try:
            grpc.channel_ready_future(self._channel).result(timeout=timeout)
            self._setup_identifier_interceptor(self._user, timeout=timeout)
        except grpc.FutureTimeoutError as e:
            self.close()
            raise MilvusException(
                code=Status.CONNECT_FAILED,
                message=f"Fail connecting to server on {self._address}, illegal connection params or server unavailable",
            ) from e
        except Exception as e:
            self.close()
            raise e from e

    def close(self):
        self.deregister_state_change_callbacks()
        if self._channel:
            self._channel.close()
            self._channel = None

    def reset_db_name(self, db_name: str):
        self.schema_cache.clear()
        self._setup_db_interceptor(db_name)
        self._setup_grpc_channel()
        self._setup_identifier_interceptor(self._user)

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
            self._authorization_interceptor = interceptor.header_adder_interceptor(keys, values)

    def _setup_db_interceptor(self, db_name: str):
        if db_name is None:
            self._db_interceptor = None
        else:
            check_pass_param(db_name=db_name)
            self._db_interceptor = interceptor.header_adder_interceptor(["dbname"], [db_name])

    def _setup_grpc_channel(self):
        """Create a ddl grpc channel"""
        if self._channel is None:
            opts = [
                (cygrpc.ChannelArgKey.max_send_message_length, -1),
                (cygrpc.ChannelArgKey.max_receive_message_length, -1),
                ("grpc.enable_retries", 1),
                ("grpc.keepalive_time_ms", 55000),
            ]
            if not self._secure:
                self._channel = grpc.insecure_channel(
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
                self._channel = grpc.secure_channel(
                    self._address,
                    creds,
                    options=opts,
                )

        # avoid to add duplicate headers.
        self._final_channel = self._channel
        if self._authorization_interceptor:
            self._final_channel = grpc.intercept_channel(
                self._final_channel, self._authorization_interceptor
            )
        if self._db_interceptor:
            self._final_channel = grpc.intercept_channel(self._final_channel, self._db_interceptor)
        if self._log_level:
            log_level_interceptor = interceptor.header_adder_interceptor(
                ["log_level"], [self._log_level]
            )
            self._final_channel = grpc.intercept_channel(self._final_channel, log_level_interceptor)
            self._log_level = None
        self._stub = milvus_pb2_grpc.MilvusServiceStub(self._final_channel)

    def set_onetime_loglevel(self, log_level: str):
        self._log_level = log_level
        self._setup_grpc_channel()

    def _setup_identifier_interceptor(self, user: str, timeout: int = 10):
        host = socket.gethostname()
        self._identifier = self.__internal_register(user, host, timeout=timeout)
        self._identifier_interceptor = interceptor.header_adder_interceptor(
            ["identifier"], [str(self._identifier)]
        )
        self._final_channel = grpc.intercept_channel(
            self._final_channel, self._identifier_interceptor
        )
        self._stub = milvus_pb2_grpc.MilvusServiceStub(self._final_channel)

    @property
    def server_address(self):
        """Server network address"""
        return self._address

    def get_server_type(self):
        return get_server_type(self.server_address.split(":")[0])

    def reset_password(
        self,
        user: str,
        old_password: str,
        new_password: str,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        """
        reset password and then setup the grpc channel.
        """
        self.update_password(user, old_password, new_password, timeout=timeout, **kwargs)
        self._setup_authorization_interceptor(user, new_password, None)
        self._setup_grpc_channel()

    @retry_on_rpc_failure()
    def create_collection(
        self, collection_name: str, fields: List, timeout: Optional[float] = None, **kwargs
    ):
        check_pass_param(collection_name=collection_name, timeout=timeout)
        request = Prepare.create_collection_request(collection_name, fields, **kwargs)

        rf = self._stub.CreateCollection.future(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        if kwargs.get("_async", False):
            return rf
        status = rf.result()
        check_status(status)
        return None

    @retry_on_rpc_failure()
    def drop_collection(self, collection_name: str, timeout: Optional[float] = None, **kwargs):
        check_pass_param(collection_name=collection_name, timeout=timeout)
        request = Prepare.drop_collection_request(collection_name)

        status = self._stub.DropCollection(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(status)

    @retry_on_rpc_failure()
    def alter_collection_properties(
        self, collection_name: str, properties: Dict, timeout: Optional[float] = None, **kwargs
    ):
        check_pass_param(collection_name=collection_name, properties=properties, timeout=timeout)
        request = Prepare.alter_collection_request(collection_name, properties=properties)
        status = self._stub.AlterCollection(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(status)

    @retry_on_rpc_failure()
    def alter_collection_field_properties(
        self,
        collection_name: str,
        field_name: str,
        field_params: List,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        check_pass_param(collection_name=collection_name, properties=field_params, timeout=timeout)
        request = Prepare.alter_collection_field_request(
            collection_name=collection_name, field_name=field_name, field_param=field_params
        )
        status = self._stub.AlterCollectionField(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(status)

    @retry_on_rpc_failure()
    def drop_collection_properties(
        self,
        collection_name: str,
        property_keys: List[str],
        timeout: Optional[float] = None,
        **kwargs,
    ):
        check_pass_param(collection_name=collection_name, timeout=timeout)
        request = Prepare.alter_collection_request(collection_name, delete_keys=property_keys)
        status = self._stub.AlterCollection(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(status)

    @retry_on_rpc_failure()
    def has_collection(self, collection_name: str, timeout: Optional[float] = None, **kwargs):
        check_pass_param(collection_name=collection_name, timeout=timeout)
        request = Prepare.describe_collection_request(collection_name)
        reply = self._stub.DescribeCollection(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )

        # For compatibility with Milvus less than 2.3.2, which does not support status.code.
        if (
            reply.status.error_code == common_pb2.UnexpectedError
            and "can't find collection" in reply.status.reason
        ):
            return False

        if reply.status.error_code == common_pb2.CollectionNotExists:
            return False

        if is_successful(reply.status):
            return True

        if reply.status.code == ErrorCode.COLLECTION_NOT_FOUND:
            return False

        raise MilvusException(reply.status.code, reply.status.reason, reply.status.error_code)

    @retry_on_rpc_failure()
    def describe_collection(self, collection_name: str, timeout: Optional[float] = None, **kwargs):
        check_pass_param(collection_name=collection_name, timeout=timeout)
        request = Prepare.describe_collection_request(collection_name)
        response = self._stub.DescribeCollection(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        status = response.status

        if is_successful(status):
            return CollectionSchema(raw=response).dict()

        raise DescribeCollectionException(status.code, status.reason, status.error_code)

    @retry_on_rpc_failure()
    def list_collections(self, timeout: Optional[float] = None, **kwargs):
        request = Prepare.show_collections_request()
        response = self._stub.ShowCollections(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        status = response.status
        check_status(status)
        return list(response.collection_names)

    @retry_on_rpc_failure()
    def rename_collections(
        self,
        old_name: str,
        new_name: str,
        new_db_name: str = "",
        timeout: Optional[float] = None,
        **kwargs,
    ):
        check_pass_param(collection_name=new_name, timeout=timeout)
        check_pass_param(collection_name=old_name)
        if new_db_name:
            check_pass_param(db_name=new_db_name)
        request = Prepare.rename_collections_request(old_name, new_name, new_db_name)
        status = self._stub.RenameCollection(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(status)

    @retry_on_rpc_failure()
    def create_partition(
        self, collection_name: str, partition_name: str, timeout: Optional[float] = None, **kwargs
    ):
        check_pass_param(
            collection_name=collection_name, partition_name=partition_name, timeout=timeout
        )
        request = Prepare.create_partition_request(collection_name, partition_name)
        response = self._stub.CreatePartition(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response)

    @retry_on_rpc_failure()
    def drop_partition(
        self, collection_name: str, partition_name: str, timeout: Optional[float] = None, **kwargs
    ):
        check_pass_param(
            collection_name=collection_name, partition_name=partition_name, timeout=timeout
        )
        request = Prepare.drop_partition_request(collection_name, partition_name)

        response = self._stub.DropPartition(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response)

    @retry_on_rpc_failure()
    def has_partition(
        self, collection_name: str, partition_name: str, timeout: Optional[float] = None, **kwargs
    ):
        check_pass_param(
            collection_name=collection_name, partition_name=partition_name, timeout=timeout
        )
        request = Prepare.has_partition_request(collection_name, partition_name)
        response = self._stub.HasPartition(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        status = response.status
        check_status(status)
        return response.value

    # TODO: this is not inuse
    @retry_on_rpc_failure()
    def get_partition_info(
        self, collection_name: str, partition_name: str, timeout: Optional[float] = None, **kwargs
    ):
        request = Prepare.partition_stats_request(collection_name, partition_name)
        response = self._stub.DescribePartition(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        status = response.status
        check_status(status)
        statistics = response.statistics
        info_dict = {}
        for kv in statistics:
            info_dict[kv.key] = kv.value
        return info_dict

    @retry_on_rpc_failure()
    def list_partitions(self, collection_name: str, timeout: Optional[float] = None, **kwargs):
        check_pass_param(collection_name=collection_name, timeout=timeout)
        request = Prepare.show_partitions_request(collection_name)

        response = self._stub.ShowPartitions(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        status = response.status
        check_status(status)
        return list(response.partition_names)

    @retry_on_rpc_failure()
    def get_partition_stats(
        self, collection_name: str, partition_name: str, timeout: Optional[float] = None, **kwargs
    ):
        check_pass_param(collection_name=collection_name, timeout=timeout)
        req = Prepare.get_partition_stats_request(collection_name, partition_name)
        response = self._stub.GetPartitionStatistics(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        status = response.status
        check_status(status)
        return response.stats

    # Seems not inuse
    def _get_info(self, collection_name: str, timeout: Optional[float] = None, **kwargs):
        schema = kwargs.get("schema")
        if not schema:
            schema = self.describe_collection(collection_name, timeout=timeout)

        fields_info = schema.get("fields")
        enable_dynamic = schema.get("enable_dynamic_field", False)

        return fields_info, enable_dynamic

    @retry_on_rpc_failure()
    def insert_rows(
        self,
        collection_name: str,
        entities: Union[Dict, List[Dict]],
        partition_name: Optional[str] = None,
        schema: Optional[dict] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        request = self._prepare_row_insert_request(
            collection_name, entities, partition_name, schema, timeout, **kwargs
        )
        resp = self._stub.Insert(request=request, timeout=timeout, metadata=_api_level_md(**kwargs))
        if resp.status.error_code == common_pb2.SchemaMismatch:
            schema = self.update_schema(collection_name, timeout, **kwargs)
            request = self._prepare_row_insert_request(
                collection_name, entities, partition_name, schema, timeout, **kwargs
            )
            resp = self._stub.Insert(
                request=request, timeout=timeout, metadata=_api_level_md(**kwargs)
            )
        check_status(resp.status)
        ts_utils.update_collection_ts(collection_name, resp.timestamp)
        return MutationResult(resp)

    def update_schema(self, collection_name: str, timeout: Optional[float] = None, **kwargs):
        self.schema_cache.pop(collection_name, None)
        schema = self.describe_collection(
            collection_name, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        schema_timestamp = schema.get("update_timestamp", 0)

        self.schema_cache[collection_name] = {
            "schema": schema,
            "schema_timestamp": schema_timestamp,
        }

        return schema

    def _prepare_row_insert_request(
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

        schema, schema_timestamp = self._get_schema_from_cache_or_remote(
            collection_name, schema, timeout
        )
        fields_info = schema.get("fields")
        enable_dynamic = schema.get("enable_dynamic_field", False)

        return Prepare.row_insert_param(
            collection_name,
            entity_rows,
            partition_name,
            fields_info,
            enable_dynamic=enable_dynamic,
            schema_timestamp=schema_timestamp,
        )

    def _get_schema_from_cache_or_remote(
        self, collection_name: str, schema: Optional[dict] = None, timeout: Optional[float] = None
    ):
        """
        checks the cache for the schema. If not found, it fetches it remotely and updates the cache
        """
        if collection_name in self.schema_cache:
            # Use the cached schema and timestamp
            schema = self.schema_cache[collection_name]["schema"]
            schema_timestamp = self.schema_cache[collection_name]["schema_timestamp"]
        else:
            # Fetch the schema remotely if not in cache
            if not isinstance(schema, dict):
                schema = self.describe_collection(collection_name, timeout=timeout)
            schema_timestamp = schema.get("update_timestamp", 0)

            # Cache the fetched schema and timestamp
            self.schema_cache[collection_name] = {
                "schema": schema,
                "schema_timestamp": schema_timestamp,
            }

        return schema, schema_timestamp

    def _prepare_batch_insert_request(
        self,
        collection_name: str,
        entities: List,
        partition_name: Optional[str] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        param = kwargs.get("insert_param")
        if param and not isinstance(param, milvus_types.InsertRequest):
            raise ParamError(message="The value of key 'insert_param' is invalid")
        if not isinstance(entities, list):
            raise ParamError(message="'entities' must be a list, please provide valid entity data.")

        schema = kwargs.get("schema")
        if not schema:
            schema = self.describe_collection(collection_name, timeout=timeout, **kwargs)

        fields_info = schema["fields"]

        return (
            param
            if param
            else Prepare.batch_insert_param(collection_name, entities, partition_name, fields_info)
        )

    @retry_on_rpc_failure()
    def batch_insert(
        self,
        collection_name: str,
        entities: List,
        partition_name: Optional[str] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        if not check_invalid_binary_vector(entities):
            raise ParamError(message="Invalid binary vector data exists")

        try:
            request = self._prepare_batch_insert_request(
                collection_name, entities, partition_name, timeout, **kwargs
            )
            rf = self._stub.Insert.future(
                request, timeout=timeout, metadata=_api_level_md(**kwargs)
            )
            if kwargs.get("_async", False):
                cb = kwargs.get("_callback")
                f = MutationFuture(rf, cb, timeout=timeout, **kwargs)
                f.add_callback(ts_utils.update_ts_on_mutation(collection_name))
                return f

            response = rf.result()
            check_status(response.status)
            m = MutationResult(response)
            ts_utils.update_collection_ts(collection_name, m.timestamp)
        except Exception as err:
            if kwargs.get("_async", False):
                return MutationFuture(None, None, err)
            raise err from err
        else:
            return m

    @retry_on_rpc_failure()
    def delete(
        self,
        collection_name: str,
        expression: str,
        partition_name: Optional[str] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        check_pass_param(collection_name=collection_name, timeout=timeout)
        try:
            req = Prepare.delete_request(
                collection_name=collection_name,
                filter=expression,
                partition_name=partition_name,
                consistency_level=kwargs.pop("consistency_level", 0),
                **kwargs,
            )
            future = self._stub.Delete.future(
                req, timeout=timeout, metadata=_api_level_md(**kwargs)
            )
            if kwargs.get("_async", False):
                cb = kwargs.pop("_callback", None)
                f = MutationFuture(future, cb, timeout=timeout, **kwargs)
                f.add_callback(ts_utils.update_ts_on_mutation(collection_name))
                return f

            response = future.result()
            check_status(response.status)
            m = MutationResult(response)
            ts_utils.update_collection_ts(collection_name, m.timestamp)
        except Exception as err:
            if kwargs.get("_async", False):
                return MutationFuture(None, None, err)
            raise err from err
        else:
            return m

    def _prepare_batch_upsert_request(
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
            schema = self.describe_collection(collection_name, timeout=timeout, **kwargs)

        fields_info = schema["fields"]

        return (
            param
            if param
            else Prepare.batch_upsert_param(collection_name, entities, partition_name, fields_info)
        )

    @retry_on_rpc_failure()
    def upsert(
        self,
        collection_name: str,
        entities: List,
        partition_name: Optional[str] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        if not check_invalid_binary_vector(entities):
            raise ParamError(message="Invalid binary vector data exists")

        try:
            request = self._prepare_batch_upsert_request(
                collection_name, entities, partition_name, timeout, **kwargs
            )
            rf = self._stub.Upsert.future(
                request, timeout=timeout, metadata=_api_level_md(**kwargs)
            )
            if kwargs.get("_async", False) is True:
                cb = kwargs.get("_callback")
                f = MutationFuture(rf, cb, timeout=timeout, **kwargs)
                f.add_callback(ts_utils.update_ts_on_mutation(collection_name))
                return f

            response = rf.result()
            check_status(response.status)
            m = MutationResult(response)
            ts_utils.update_collection_ts(collection_name, m.timestamp)
        except Exception as err:
            if kwargs.get("_async", False):
                return MutationFuture(None, None, err)
            raise err from err
        else:
            return m

    def _prepare_row_upsert_request(
        self,
        collection_name: str,
        rows: List,
        partition_name: Optional[str] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        if not isinstance(rows, list):
            raise ParamError(message="'rows' must be a list, please provide valid row data.")

        schema, schema_timestamp = self._get_schema_from_cache_or_remote(
            collection_name, timeout=timeout
        )
        fields_info = schema.get("fields")
        enable_dynamic = schema.get("enable_dynamic_field", False)
        return Prepare.row_upsert_param(
            collection_name,
            rows,
            partition_name,
            fields_info,
            enable_dynamic=enable_dynamic,
            schema_timestamp=schema_timestamp,
        )

    @retry_on_rpc_failure()
    def upsert_rows(
        self,
        collection_name: str,
        entities: List,
        partition_name: Optional[str] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        if isinstance(entities, dict):
            entities = [entities]
        request = self._prepare_row_upsert_request(
            collection_name, entities, partition_name, timeout, **kwargs
        )
        response = self._stub.Upsert(request, timeout=timeout, metadata=_api_level_md(**kwargs))
        if response.status.error_code == common_pb2.SchemaMismatch:
            self.update_schema(collection_name, timeout)
            request = self._prepare_row_upsert_request(
                collection_name, entities, partition_name, timeout, **kwargs
            )
            response = self._stub.Upsert(
                request=request, timeout=timeout, metadata=_api_level_md(**kwargs)
            )
        check_status(response.status)
        m = MutationResult(response)
        ts_utils.update_collection_ts(collection_name, m.timestamp)
        return m

    def _execute_search(
        self, request: milvus_types.SearchRequest, timeout: Optional[float] = None, **kwargs
    ):
        try:
            if kwargs.get("_async", False):
                future = self._stub.Search.future(
                    request, timeout=timeout, metadata=_api_level_md(**kwargs)
                )
                func = kwargs.get("_callback")
                return SearchFuture(future, func)

            response = self._stub.Search(request, timeout=timeout, metadata=_api_level_md(**kwargs))
            check_status(response.status)
            round_decimal = kwargs.get("round_decimal", -1)
            return SearchResult(
                response.results,
                round_decimal,
                status=response.status,
                session_ts=response.session_ts,
            )
        except Exception as e:
            if kwargs.get("_async", False):
                return SearchFuture(None, None, e)
            raise e from e

    def _execute_hybrid_search(
        self, request: milvus_types.HybridSearchRequest, timeout: Optional[float] = None, **kwargs
    ):
        try:
            if kwargs.get("_async", False):
                future = self._stub.HybridSearch.future(
                    request, timeout=timeout, metadata=_api_level_md(**kwargs)
                )
                func = kwargs.get("_callback")
                return SearchFuture(future, func)

            response = self._stub.HybridSearch(
                request, timeout=timeout, metadata=_api_level_md(**kwargs)
            )
            check_status(response.status)
            round_decimal = kwargs.get("round_decimal", -1)
            return SearchResult(response.results, round_decimal, status=response.status)

        except Exception as e:
            if kwargs.get("_async", False):
                return SearchFuture(None, None, e)
            raise e from e

    @retry_on_rpc_failure()
    def search(
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
        return self._execute_search(request, timeout, round_decimal=round_decimal, **kwargs)

    @retry_on_rpc_failure()
    def hybrid_search(
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
        return self._execute_hybrid_search(
            hybrid_search_request, timeout, round_decimal=round_decimal, **kwargs
        )

    @retry_on_rpc_failure()
    def get_query_segment_info(self, collection_name: str, timeout: float = 30, **kwargs):
        req = Prepare.get_query_segment_info_request(collection_name)
        response = self._stub.GetQuerySegmentInfo(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        status = response.status
        check_status(status)
        return response.infos  # todo: A wrapper class of QuerySegmentInfo

    @retry_on_rpc_failure()
    def create_alias(
        self, collection_name: str, alias: str, timeout: Optional[float] = None, **kwargs
    ):
        check_pass_param(collection_name=collection_name, timeout=timeout)
        request = Prepare.create_alias_request(collection_name, alias)
        response = self._stub.CreateAlias(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response)

    @retry_on_rpc_failure()
    def drop_alias(self, alias: str, timeout: Optional[float] = None, **kwargs):
        request = Prepare.drop_alias_request(alias)
        response = self._stub.DropAlias(request, timeout=timeout, metadata=_api_level_md(**kwargs))
        check_status(response)

    @retry_on_rpc_failure()
    def alter_alias(
        self, collection_name: str, alias: str, timeout: Optional[float] = None, **kwargs
    ):
        check_pass_param(collection_name=collection_name, timeout=timeout)
        request = Prepare.alter_alias_request(collection_name, alias)
        response = self._stub.AlterAlias(request, timeout=timeout, metadata=_api_level_md(**kwargs))
        check_status(response)

    @retry_on_rpc_failure()
    def describe_alias(self, alias: str, timeout: Optional[float] = None, **kwargs):
        check_pass_param(alias=alias, timeout=timeout)
        request = Prepare.describe_alias_request(alias)
        response = self._stub.DescribeAlias(
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
    def list_aliases(self, collection_name: str, timeout: Optional[float] = None, **kwargs):
        check_pass_param(timeout=timeout)
        if collection_name:
            check_pass_param(collection_name=collection_name)
        request = Prepare.list_aliases_request(collection_name, kwargs.get("db_name", ""))
        response = self._stub.ListAliases(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response.status)
        ret = {
            "aliases": [],
        }
        if response.collection_name:
            ret["collection_name"] = response.collection_name
        if response.db_name:
            ret["db_name"] = response.db_name
        ret["aliases"].extend(response.aliases)
        return ret

    @retry_on_rpc_failure()
    def create_index(
        self,
        collection_name: str,
        field_name: str,
        params: Dict,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        # for historical reason, index_name contained in kwargs.
        index_name = kwargs.pop("index_name", Config.IndexName)

        _async = kwargs.get("_async", False)
        kwargs["_async"] = False

        index_param = Prepare.create_index_request(
            collection_name, field_name, params, index_name=index_name
        )
        future = self._stub.CreateIndex.future(
            index_param, timeout=timeout, metadata=_api_level_md(**kwargs)
        )

        if _async:

            def _check():
                if kwargs.get("sync", True):
                    index_success, fail_reason = self.wait_for_creating_index(
                        collection_name=collection_name,
                        index_name=index_name,
                        timeout=timeout,
                        field_name=field_name,
                        **kwargs,
                    )
                    if not index_success:
                        raise MilvusException(message=fail_reason)

            index_future = CreateIndexFuture(future)
            index_future.add_callback(_check)
            user_cb = kwargs.get("_callback")
            if user_cb:
                index_future.add_callback(user_cb)
            return index_future

        status = future.result()
        check_status(status)

        if kwargs.get("sync", True):
            index_success, fail_reason = self.wait_for_creating_index(
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
    def alter_index_properties(
        self,
        collection_name: str,
        index_name: str,
        properties: dict,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        check_pass_param(collection_name=collection_name, index_name=index_name, timeout=timeout)
        if properties is None:
            raise ParamError(message="properties should not be None")

        request = Prepare.alter_index_properties_request(collection_name, index_name, properties)
        response = self._stub.AlterIndex(request, timeout=timeout, metadata=_api_level_md(**kwargs))
        check_status(response)

    @retry_on_rpc_failure()
    def drop_index_properties(
        self,
        collection_name: str,
        index_name: str,
        property_keys: List[str],
        timeout: Optional[float] = None,
        **kwargs,
    ):
        check_pass_param(collection_name=collection_name, index_name=index_name, timeout=timeout)
        request = Prepare.drop_index_properties_request(
            collection_name, index_name, delete_keys=property_keys
        )
        response = self._stub.AlterIndex(request, timeout=timeout, metadata=_api_level_md(**kwargs))
        check_status(response)

    @retry_on_rpc_failure()
    def list_indexes(self, collection_name: str, timeout: Optional[float] = None, **kwargs):
        check_pass_param(collection_name=collection_name, timeout=timeout)
        request = Prepare.describe_index_request(collection_name, "")

        response = self._stub.DescribeIndex(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        status = response.status
        if is_successful(status):
            return response.index_descriptions
        if status.code == ErrorCode.INDEX_NOT_FOUND or status.error_code == Status.INDEX_NOT_EXIST:
            return []
        raise MilvusException(status.code, status.reason, status.error_code)

    @retry_on_rpc_failure()
    def describe_index(
        self,
        collection_name: str,
        index_name: str,
        timeout: Optional[float] = None,
        timestamp: Optional[int] = None,
        **kwargs,
    ):
        check_pass_param(collection_name=collection_name, timeout=timeout)
        request = Prepare.describe_index_request(collection_name, index_name, timestamp=timestamp)

        response = self._stub.DescribeIndex(
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
    def get_index_build_progress(
        self, collection_name: str, index_name: str, timeout: Optional[float] = None, **kwargs
    ):
        request = Prepare.describe_index_request(collection_name, index_name)
        response = self._stub.DescribeIndex(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        status = response.status
        check_status(status)
        if len(response.index_descriptions) == 1:
            index_desc = response.index_descriptions[0]
            return {
                "total_rows": index_desc.total_rows,
                "indexed_rows": index_desc.indexed_rows,
                "pending_index_rows": index_desc.pending_index_rows,
                "state": common_pb2.IndexState.Name(index_desc.state),
            }
        raise AmbiguousIndexName(message=ExceptionsMessage.AmbiguousIndexName)

    @retry_on_rpc_failure()
    def get_index_state(
        self,
        collection_name: str,
        index_name: str,
        timeout: Optional[float] = None,
        timestamp: Optional[int] = None,
        **kwargs,
    ):
        request = Prepare.describe_index_request(collection_name, index_name, timestamp)
        response = self._stub.DescribeIndex(
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
    def wait_for_creating_index(
        self, collection_name: str, index_name: str, timeout: Optional[float] = None, **kwargs
    ):
        timestamp = self.alloc_timestamp()
        start = time.time()
        while True:
            time.sleep(0.5)
            state, fail_reason = self.get_index_state(
                collection_name, index_name, timeout=timeout, timestamp=timestamp, **kwargs
            )
            if state == IndexState.Finished:
                return True, fail_reason
            if state == IndexState.Failed:
                return False, fail_reason
            end = time.time()
            if isinstance(timeout, int) and end - start > timeout:
                msg = (
                    f"collection {collection_name} create index {index_name} timeout in {timeout}s"
                )
                raise MilvusException(message=msg)

    @retry_on_rpc_failure()
    def load_collection(
        self,
        collection_name: str,
        replica_number: Optional[int] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        check_pass_param(timeout=timeout)

        request = Prepare.load_collection(collection_name, replica_number, **kwargs)
        response = self._stub.LoadCollection(
            request,
            timeout=timeout,
            metadata=_api_level_md(**kwargs),
        )
        check_status(response)

        if kwargs.get("_async", False):
            return

        self.wait_for_loading_collection(
            collection_name=collection_name,
            is_refresh=request.refresh,
            timeout=timeout,
            **kwargs,
        )

    @retry_on_rpc_failure()
    def load_collection_progress(
        self,
        collection_name: str,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        """Return loading progress of collection"""
        progress = self.get_loading_progress(collection_name, timeout=timeout)
        return {
            "loading_progress": f"{progress:.0f}%",
        }

    @retry_on_rpc_failure()
    def wait_for_loading_collection(
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
            progress = self.get_loading_progress(
                collection_name,
                is_refresh=is_refresh,
                timeout=timeout,
                **kwargs,
            )
            if progress >= 100:
                return
            time.sleep(Config.WaitTimeDurationWhenLoad)
        raise MilvusException(
            message=f"wait for loading collection timeout, collection: {collection_name}"
        )

    @retry_on_rpc_failure()
    def release_collection(self, collection_name: str, timeout: Optional[float] = None, **kwargs):
        check_pass_param(collection_name=collection_name, timeout=timeout)
        request = Prepare.release_collection("", collection_name)
        response = self._stub.ReleaseCollection(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response)

    @retry_on_rpc_failure()
    def load_partitions(
        self,
        collection_name: str,
        partition_names: List[str],
        replica_number: Optional[int] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        check_pass_param(timeout=timeout)

        request = Prepare.load_partitions(
            collection_name=collection_name,
            partition_names=partition_names,
            replica_number=replica_number,
            **kwargs,
        )
        response = self._stub.LoadPartitions(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response)

        if kwargs.get("sync", True) or not kwargs.get("_async", False):
            self.wait_for_loading_partitions(
                collection_name=collection_name,
                partition_names=partition_names,
                is_refresh=request.refresh,
                timeout=timeout,
                **kwargs,
            )

    @retry_on_rpc_failure()
    def wait_for_loading_partitions(
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
            progress = self.get_loading_progress(
                collection_name=collection_name,
                partition_names=partition_names,
                timeout=timeout,
                is_refresh=is_refresh,
                **kwargs,
            )
            if progress >= 100:
                return
            time.sleep(Config.WaitTimeDurationWhenLoad)
        raise MilvusException(
            message=f"wait for loading partition timeout, collection: {collection_name}, partitions: {partition_names}"
        )

    @retry_on_rpc_failure()
    def get_loading_progress(
        self,
        collection_name: str,
        partition_names: Optional[List[str]] = None,
        timeout: Optional[float] = None,
        is_refresh: bool = False,
        **kwargs,
    ):
        request = Prepare.get_loading_progress(collection_name, partition_names)
        response = self._stub.GetLoadingProgress(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response.status)
        if is_refresh:
            return response.refresh_progress
        return response.progress

    @retry_on_rpc_failure()
    def create_database(
        self,
        db_name: str,
        properties: Optional[dict] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        check_pass_param(db_name=db_name, timeout=timeout)
        request = Prepare.create_database_req(db_name, properties=properties)
        status = self._stub.CreateDatabase(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(status)

    @retry_on_rpc_failure()
    def drop_database(self, db_name: str, timeout: Optional[float] = None, **kwargs):
        request = Prepare.drop_database_req(db_name)
        status = self._stub.DropDatabase(request, timeout=timeout, metadata=_api_level_md(**kwargs))
        check_status(status)

    @retry_on_rpc_failure()
    def list_database(self, timeout: Optional[float] = None, **kwargs):
        check_pass_param(timeout=timeout)
        request = Prepare.list_database_req()
        response = self._stub.ListDatabases(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response.status)
        return list(response.db_names)

    @retry_on_rpc_failure()
    def alter_database(
        self, db_name: str, properties: dict, timeout: Optional[float] = None, **kwargs
    ):
        request = Prepare.alter_database_properties_req(db_name, properties)
        status = self._stub.AlterDatabase(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(status)

    @retry_on_rpc_failure()
    def drop_database_properties(
        self, db_name: str, property_keys: List[str], timeout: Optional[float] = None, **kwargs
    ):
        request = Prepare.drop_database_properties_req(db_name, property_keys)
        status = self._stub.AlterDatabase(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(status)

    @retry_on_rpc_failure()
    def describe_database(self, db_name: str, timeout: Optional[float] = None, **kwargs):
        request = Prepare.describe_database_req(db_name=db_name)
        resp = self._stub.DescribeDatabase(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp.status)
        return DatabaseInfo(resp).to_dict()

    @retry_on_rpc_failure()
    def get_load_state(
        self,
        collection_name: str,
        partition_names: Optional[List[str]] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        request = Prepare.get_load_state(collection_name, partition_names)
        response = self._stub.GetLoadState(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response.status)
        return LoadState(response.state)

    @retry_on_rpc_failure()
    def load_partitions_progress(
        self,
        collection_name: str,
        partition_names: List[str],
        timeout: Optional[float] = None,
        **kwargs,
    ):
        """Return loading progress of partitions"""
        progress = self.get_loading_progress(collection_name, partition_names, timeout, **kwargs)
        return {
            "loading_progress": f"{progress:.0f}%",
        }

    @retry_on_rpc_failure()
    def release_partitions(
        self,
        collection_name: str,
        partition_names: List[str],
        timeout: Optional[float] = None,
        **kwargs,
    ):
        check_pass_param(
            collection_name=collection_name, partition_name_array=partition_names, timeout=timeout
        )
        request = Prepare.release_partitions("", collection_name, partition_names)
        response = self._stub.ReleasePartitions(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response)

    @retry_on_rpc_failure()
    def get_collection_stats(self, collection_name: str, timeout: Optional[float] = None, **kwargs):
        check_pass_param(collection_name=collection_name, timeout=timeout)
        index_param = Prepare.get_collection_stats_request(collection_name)
        response = self._stub.GetCollectionStatistics(
            index_param, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        status = response.status
        check_status(status)
        return response.stats

    @retry_on_rpc_failure()
    def get_flush_state(
        self,
        segment_ids: List[int],
        collection_name: str,
        flush_ts: int,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        req = Prepare.get_flush_state_request(segment_ids, collection_name, flush_ts)
        response = self._stub.GetFlushState(req, timeout=timeout, metadata=_api_level_md(**kwargs))
        status = response.status
        check_status(status)
        return response.flushed  # todo: A wrapper class of PersistentSegmentInfo

    @retry_on_rpc_failure()
    def get_persistent_segment_infos(
        self, collection_name: str, timeout: Optional[float] = None, **kwargs
    ):
        req = Prepare.get_persistent_segment_info_request(collection_name)
        response = self._stub.GetPersistentSegmentInfo(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response.status)
        return response.infos  # todo: A wrapper class of PersistentSegmentInfo

    def _wait_for_flushed(
        self,
        segment_ids: List[int],
        collection_name: str,
        flush_ts: int,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        flush_ret = False
        start = time.time()
        while not flush_ret:
            flush_ret = self.get_flush_state(
                segment_ids, collection_name, flush_ts, timeout, **kwargs
            )
            end = time.time()
            if timeout is not None and end - start > timeout:
                raise MilvusException(
                    message=f"wait for flush timeout, collection: {collection_name}, flusht_ts: {flush_ts}"
                )

            if not flush_ret:
                time.sleep(0.5)

    @retry_on_rpc_failure(initial_back_off=1)
    def flush(self, collection_names: list, timeout: Optional[float] = None, **kwargs):
        if collection_names in (None, []) or not isinstance(collection_names, list):
            raise ParamError(message="Collection name list can not be None or empty")

        check_pass_param(timeout=timeout)
        for name in collection_names:
            check_pass_param(collection_name=name)

        request = Prepare.flush_param(collection_names)
        future = self._stub.Flush.future(request, timeout=timeout, metadata=_api_level_md(**kwargs))
        response = future.result()
        check_status(response.status)

        def _check():
            for collection_name in collection_names:
                segment_ids = future.result().coll_segIDs[collection_name].data
                flush_ts = future.result().coll_flush_ts[collection_name]
                self._wait_for_flushed(segment_ids, collection_name, flush_ts, timeout=timeout)

        if kwargs.get("_async", False):
            flush_future = FlushFuture(future)
            flush_future.add_callback(_check)

            user_cb = kwargs.get("_callback")
            if user_cb:
                flush_future.add_callback(user_cb)

            return flush_future

        _check()
        return None

    @retry_on_rpc_failure()
    def drop_index(
        self,
        collection_name: str,
        field_name: str,
        index_name: str,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        check_pass_param(collection_name=collection_name, timeout=timeout)
        request = Prepare.drop_index_request(collection_name, field_name, index_name)
        response = self._stub.DropIndex(request, timeout=timeout, metadata=_api_level_md(**kwargs))
        check_status(response)

    @retry_on_rpc_failure()
    def dummy(self, request_type: Any, timeout: Optional[float] = None, **kwargs):
        request = Prepare.dummy_request(request_type)
        return self._stub.Dummy(request, timeout=timeout, metadata=_api_level_md(**kwargs))

    # TODO seems not in use
    @retry_on_rpc_failure()
    def fake_register_link(self, timeout: Optional[float] = None, **kwargs):
        request = Prepare.register_link_request()
        response = self._stub.RegisterLink(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        return response.status

    # TODO seems not in use
    @retry_on_rpc_failure()
    def get(
        self,
        collection_name: str,
        ids: List[int],
        output_fields: Optional[List[str]] = None,
        partition_names: Optional[List[str]] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        # TODO: some check
        request = Prepare.retrieve_request(collection_name, ids, output_fields, partition_names)
        return self._stub.Retrieve(request, timeout=timeout, metadata=_api_level_md(**kwargs))

    @retry_on_rpc_failure()
    def query(
        self,
        collection_name: str,
        expr: str,
        output_fields: Optional[List[str]] = None,
        partition_names: Optional[List[str]] = None,
        timeout: Optional[float] = None,
        strict_float32: bool = False,
        **kwargs,
    ):
        if output_fields is not None and not isinstance(output_fields, (list,)):
            raise ParamError(message="Invalid query format. 'output_fields' must be a list")
        request = Prepare.query_request(
            collection_name, expr, output_fields, partition_names, **kwargs
        )

        response = self._stub.Query(request, timeout=timeout, metadata=_api_level_md(**kwargs))
        if Status.EMPTY_COLLECTION in {response.status.code, response.status.error_code}:
            return []
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
    def load_balance(
        self,
        collection_name: str,
        src_node_id: int,
        dst_node_ids: List[int],
        sealed_segment_ids: List[int],
        timeout: Optional[float] = None,
        **kwargs,
    ):
        req = Prepare.load_balance_request(
            collection_name, src_node_id, dst_node_ids, sealed_segment_ids
        )
        status = self._stub.LoadBalance(req, timeout=timeout, metadata=_api_level_md(**kwargs))
        check_status(status)

    @retry_on_rpc_failure()
    def compact(
        self,
        collection_name: str,
        is_clustering: Optional[bool] = False,
        timeout: Optional[float] = None,
        **kwargs,
    ) -> int:
        meta = _api_level_md(**kwargs)
        # try with only collection_name
        req = Prepare.manual_compaction(collection_name, is_clustering)
        response = self._stub.ManualCompaction(req, timeout=timeout, metadata=meta)
        if response.status.error_code == common_pb2.CollectionNameNotFound:
            # should be removed, but to be compatible with old milvus server, keep it for now.
            request = Prepare.describe_collection_request(collection_name)
            response = self._stub.DescribeCollection(request, timeout=timeout, metadata=meta)
            check_status(response.status)

            req = Prepare.manual_compaction(collection_name, is_clustering, response.collectionID)
            response = self._stub.ManualCompaction(req, timeout=timeout, metadata=meta)
        check_status(response.status)
        return response.compactionID

    @retry_on_rpc_failure()
    def get_compaction_state(
        self, compaction_id: int, timeout: Optional[float] = None, **kwargs
    ) -> CompactionState:
        req = Prepare.get_compaction_state(compaction_id)
        response = self._stub.GetCompactionState(
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
    def wait_for_compaction_completed(
        self, compaction_id: int, timeout: Optional[float] = None, **kwargs
    ):
        start = time.time()
        while True:
            time.sleep(0.5)
            compaction_state = self.get_compaction_state(compaction_id, timeout, **kwargs)
            if compaction_state.state == State.Completed:
                return True
            if compaction_state == State.UndefiedState:
                return False
            end = time.time()
            if timeout is not None and end - start > timeout:
                raise MilvusException(
                    message=f"get compaction state timeout, compaction id: {compaction_id}"
                )

    @retry_on_rpc_failure()
    def get_compaction_plans(
        self, compaction_id: int, timeout: Optional[float] = None, **kwargs
    ) -> CompactionPlans:
        req = Prepare.get_compaction_state_with_plans(compaction_id)

        response = self._stub.GetCompactionStateWithPlans(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(response.status)

        cp = CompactionPlans(compaction_id, response.state)

        cp.plans = [Plan(m.sources, m.target) for m in response.mergeInfos]

        return cp

    @retry_on_rpc_failure()
    def get_replicas(
        self, collection_name: str, timeout: Optional[float] = None, **kwargs
    ) -> Replica:
        collection_id = self.describe_collection(collection_name, timeout, **kwargs)[
            "collection_id"
        ]

        req = Prepare.get_replicas(collection_id)
        response = self._stub.GetReplicas(req, timeout=timeout, metadata=_api_level_md(**kwargs))
        check_status(response.status)

        groups = []
        for replica in response.replicas:
            shards = [
                Shard(s.dm_channel_name, s.node_ids, s.leaderID) for s in replica.shard_replicas
            ]
            groups.append(
                Group(
                    replica.replicaID,
                    shards,
                    replica.node_ids,
                    replica.resource_group_name,
                    replica.num_outbound_node,
                )
            )

        return Replica(groups)

    @retry_on_rpc_failure()
    def describe_replica(
        self, collection_name: str, timeout: Optional[float] = None, **kwargs
    ) -> List[ReplicaInfo]:
        collection_id = self.describe_collection(collection_name, timeout, **kwargs)[
            "collection_id"
        ]

        req = Prepare.get_replicas(collection_id)
        response = self._stub.GetReplicas(req, timeout=timeout, metadata=_api_level_md(**kwargs))
        check_status(response.status)

        groups = []
        for replica in response.replicas:
            shards = [
                Shard(s.dm_channel_name, s.node_ids, s.leaderID) for s in replica.shard_replicas
            ]
            groups.append(
                ReplicaInfo(
                    replica.replicaID,
                    shards,
                    replica.node_ids,
                    replica.resource_group_name,
                    replica.num_outbound_node,
                )
            )

        return groups

    @retry_on_rpc_failure()
    def do_bulk_insert(
        self,
        collection_name: str,
        partition_name: str,
        files: List[str],
        timeout: Optional[float] = None,
        **kwargs,
    ) -> int:
        req = Prepare.do_bulk_insert(collection_name, partition_name, files, **kwargs)
        response = self._stub.Import(req, timeout=timeout, metadata=_api_level_md(**kwargs))
        check_status(response.status)
        if len(response.tasks) == 0:
            raise MilvusException(
                ErrorCode.UNEXPECTED_ERROR,
                "no task id returned from server",
                common_pb2.UnexpectedError,
            )
        return response.tasks[0]

    @retry_on_rpc_failure()
    def get_bulk_insert_state(
        self, task_id: int, timeout: Optional[float] = None, **kwargs
    ) -> BulkInsertState:
        req = Prepare.get_bulk_insert_state(task_id)
        resp = self._stub.GetImportState(req, timeout=timeout, metadata=_api_level_md(**kwargs))
        check_status(resp.status)
        return BulkInsertState(
            task_id, resp.state, resp.row_count, resp.id_list, resp.infos, resp.create_ts
        )

    @retry_on_rpc_failure()
    def list_bulk_insert_tasks(
        self, limit: int, collection_name: str, timeout: Optional[float] = None, **kwargs
    ) -> list:
        req = Prepare.list_bulk_insert_tasks(limit, collection_name)
        resp = self._stub.ListImportTasks(req, timeout=timeout, metadata=_api_level_md(**kwargs))
        check_status(resp.status)

        return [
            BulkInsertState(t.id, t.state, t.row_count, t.id_list, t.infos, t.create_ts)
            for t in resp.tasks
        ]

    @retry_on_rpc_failure()
    def create_user(self, user: str, password: str, timeout: Optional[float] = None, **kwargs):
        check_pass_param(user=user, password=password, timeout=timeout)
        req = Prepare.create_user_request(user, password)
        resp = self._stub.CreateCredential(req, timeout=timeout, metadata=_api_level_md(**kwargs))
        check_status(resp)

    @retry_on_rpc_failure()
    def update_password(
        self,
        user: str,
        old_password: str,
        new_password: str,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        req = Prepare.update_password_request(user, old_password, new_password)
        resp = self._stub.UpdateCredential(req, timeout=timeout, metadata=_api_level_md(**kwargs))
        check_status(resp)

    @retry_on_rpc_failure()
    def delete_user(self, user: str, timeout: Optional[float] = None, **kwargs):
        req = Prepare.delete_user_request(user)
        resp = self._stub.DeleteCredential(req, timeout=timeout, metadata=_api_level_md(**kwargs))
        check_status(resp)

    @retry_on_rpc_failure()
    def list_usernames(self, timeout: Optional[float] = None, **kwargs):
        req = Prepare.list_usernames_request()
        resp = self._stub.ListCredUsers(req, timeout=timeout, metadata=_api_level_md(**kwargs))
        check_status(resp.status)
        return resp.usernames

    @retry_on_rpc_failure()
    def create_role(self, role_name: str, timeout: Optional[float] = None, **kwargs):
        req = Prepare.create_role_request(role_name)
        resp = self._stub.CreateRole(
            req, wait_for_ready=True, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    def drop_role(
        self, role_name: str, force_drop: bool = False, timeout: Optional[float] = None, **kwargs
    ):
        req = Prepare.drop_role_request(role_name, force_drop=force_drop)
        resp = self._stub.DropRole(
            req, wait_for_ready=True, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    def add_user_to_role(
        self, username: str, role_name: str, timeout: Optional[float] = None, **kwargs
    ):
        req = Prepare.operate_user_role_request(
            username, role_name, milvus_types.OperateUserRoleType.AddUserToRole
        )
        resp = self._stub.OperateUserRole(
            req, wait_for_ready=True, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    def remove_user_from_role(
        self, username: str, role_name: str, timeout: Optional[float] = None, **kwargs
    ):
        req = Prepare.operate_user_role_request(
            username, role_name, milvus_types.OperateUserRoleType.RemoveUserFromRole
        )
        resp = self._stub.OperateUserRole(
            req, wait_for_ready=True, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    def select_one_role(
        self, role_name: str, include_user_info: bool, timeout: Optional[float] = None, **kwargs
    ):
        req = Prepare.select_role_request(role_name, include_user_info)
        resp = self._stub.SelectRole(
            req, wait_for_ready=True, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp.status)
        return RoleInfo(resp.results)

    @retry_on_rpc_failure()
    def select_all_role(self, include_user_info: bool, timeout: Optional[float] = None, **kwargs):
        req = Prepare.select_role_request(None, include_user_info)
        resp = self._stub.SelectRole(
            req, wait_for_ready=True, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp.status)
        return RoleInfo(resp.results)

    @retry_on_rpc_failure()
    def select_one_user(
        self, username: str, include_role_info: bool, timeout: Optional[float] = None, **kwargs
    ):
        req = Prepare.select_user_request(username, include_role_info)
        resp = self._stub.SelectUser(
            req, wait_for_ready=True, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp.status)
        return UserInfo(resp.results)

    @retry_on_rpc_failure()
    def select_all_user(self, include_role_info: bool, timeout: Optional[float] = None, **kwargs):
        req = Prepare.select_user_request(None, include_role_info)
        resp = self._stub.SelectUser(
            req, wait_for_ready=True, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp.status)
        return UserInfo(resp.results)

    @retry_on_rpc_failure()
    def grant_privilege(
        self,
        role_name: str,
        object: str,
        object_name: str,
        privilege: str,
        db_name: str,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        req = Prepare.operate_privilege_request(
            role_name,
            object,
            object_name,
            privilege,
            db_name,
            milvus_types.OperatePrivilegeType.Grant,
        )
        resp = self._stub.OperatePrivilege(
            req, wait_for_ready=True, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    def revoke_privilege(
        self,
        role_name: str,
        object: str,
        object_name: str,
        privilege: str,
        db_name: str,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        req = Prepare.operate_privilege_request(
            role_name,
            object,
            object_name,
            privilege,
            db_name,
            milvus_types.OperatePrivilegeType.Revoke,
        )
        resp = self._stub.OperatePrivilege(
            req, wait_for_ready=True, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    def grant_privilege_v2(
        self,
        role_name: str,
        privilege: str,
        collection_name: str,
        db_name: Optional[str] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        req = Prepare.operate_privilege_v2_request(
            role_name,
            privilege,
            milvus_types.OperatePrivilegeType.Grant,
            db_name,
            collection_name,
        )
        resp = self._stub.OperatePrivilegeV2(
            req, wait_for_ready=True, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    def revoke_privilege_v2(
        self,
        role_name: str,
        privilege: str,
        collection_name: str,
        db_name: Optional[str] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        req = Prepare.operate_privilege_v2_request(
            role_name,
            privilege,
            milvus_types.OperatePrivilegeType.Revoke,
            db_name,
            collection_name,
        )
        resp = self._stub.OperatePrivilegeV2(
            req, wait_for_ready=True, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    def select_grant_for_one_role(
        self, role_name: str, db_name: str, timeout: Optional[float] = None, **kwargs
    ):
        req = Prepare.select_grant_request(role_name, None, None, db_name)
        resp = self._stub.SelectGrant(
            req, wait_for_ready=True, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp.status)
        return GrantInfo(resp.entities)

    @retry_on_rpc_failure()
    def select_grant_for_role_and_object(
        self,
        role_name: str,
        object: str,
        object_name: str,
        db_name: str,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        req = Prepare.select_grant_request(role_name, object, object_name, db_name)
        resp = self._stub.SelectGrant(
            req, wait_for_ready=True, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp.status)
        return GrantInfo(resp.entities)

    @retry_on_rpc_failure()
    def get_server_version(self, timeout: Optional[float] = None, **kwargs) -> str:
        req = Prepare.get_server_version()
        resp = self._stub.GetVersion(req, timeout=timeout, metadata=_api_level_md(**kwargs))
        check_status(resp.status)
        return resp.version

    @retry_on_rpc_failure()
    def create_resource_group(self, name: str, timeout: Optional[float] = None, **kwargs):
        req = Prepare.create_resource_group(name, **kwargs)
        resp = self._stub.CreateResourceGroup(
            req, wait_for_ready=True, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    def update_resource_groups(
        self, configs: Mapping[str, ResourceGroupConfig], timeout: Optional[float] = None, **kwargs
    ):
        req = Prepare.update_resource_groups(configs)
        resp = self._stub.UpdateResourceGroups(
            req, wait_for_ready=True, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    def drop_resource_group(self, name: str, timeout: Optional[float] = None, **kwargs):
        req = Prepare.drop_resource_group(name)
        resp = self._stub.DropResourceGroup(
            req, wait_for_ready=True, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    def list_resource_groups(self, timeout: Optional[float] = None, **kwargs):
        req = Prepare.list_resource_groups()
        resp = self._stub.ListResourceGroups(
            req, wait_for_ready=True, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp.status)
        return list(resp.resource_groups)

    @retry_on_rpc_failure()
    def describe_resource_group(
        self, name: str, timeout: Optional[float] = None, **kwargs
    ) -> ResourceGroupInfo:
        req = Prepare.describe_resource_group(name)
        resp = self._stub.DescribeResourceGroup(
            req, wait_for_ready=True, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp.status)
        return ResourceGroupInfo(resp.resource_group)

    @retry_on_rpc_failure()
    def transfer_node(
        self, source: str, target: str, num_node: int, timeout: Optional[float] = None, **kwargs
    ):
        req = Prepare.transfer_node(source, target, num_node)
        resp = self._stub.TransferNode(
            req, wait_for_ready=True, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    def transfer_replica(
        self,
        source: str,
        target: str,
        collection_name: str,
        num_replica: int,
        timeout: Optional[float] = None,
        **kwargs,
    ):
        req = Prepare.transfer_replica(source, target, collection_name, num_replica)
        resp = self._stub.TransferReplica(
            req, wait_for_ready=True, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    def get_flush_all_state(self, flush_all_ts: int, timeout: Optional[float] = None, **kwargs):
        req = Prepare.get_flush_all_state_request(flush_all_ts, kwargs.get("db", ""))
        response = self._stub.GetFlushAllState(
            req, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        status = response.status
        check_status(status)
        return response.flushed

    def _wait_for_flush_all(self, flush_all_ts: int, timeout: Optional[float] = None, **kwargs):
        flush_ret = False
        start = time.time()
        while not flush_ret:
            flush_ret = self.get_flush_all_state(flush_all_ts, timeout, **kwargs)
            end = time.time()
            if timeout is not None and end - start > timeout:
                raise MilvusException(
                    message=f"wait for flush all timeout, flush_all_ts: {flush_all_ts}"
                )

            if not flush_ret:
                time.sleep(5)

    @retry_on_rpc_failure()
    def flush_all(self, timeout: Optional[float] = None, **kwargs):
        request = Prepare.flush_all_request(kwargs.get("db", ""))
        future = self._stub.FlushAll.future(
            request, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        response = future.result()
        check_status(response.status)

        def _check():
            self._wait_for_flush_all(response.flush_all_ts, timeout, **kwargs)

        if kwargs.get("_async", False):
            flush_future = FlushFuture(future)
            flush_future.add_callback(_check)

            user_cb = kwargs.get("_callback")
            if user_cb:
                flush_future.add_callback(user_cb)

            return flush_future

        _check()
        return None

    @retry_on_rpc_failure()
    @upgrade_reminder
    def __internal_register(self, user: str, host: str, **kwargs) -> int:
        req = Prepare.register_request(user, host)
        response = self._stub.Connect(request=req)
        check_status(response.status)
        return response.identifier

    @retry_on_rpc_failure()
    @ignore_unimplemented(0)
    def alloc_timestamp(self, timeout: Optional[float] = None, **kwargs) -> int:
        request = milvus_types.AllocTimestampRequest()
        response = self._stub.AllocTimestamp(request, timeout=timeout, metadata=_api_level_md())
        check_status(response.status)
        return response.timestamp

    @retry_on_rpc_failure()
    def create_privilege_group(
        self, privilege_group: str, timeout: Optional[float] = None, **kwargs
    ):
        req = Prepare.create_privilege_group_req(privilege_group)
        resp = self._stub.CreatePrivilegeGroup(
            req, wait_for_ready=True, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    def drop_privilege_group(self, privilege_group: str, timeout: Optional[float] = None, **kwargs):
        req = Prepare.drop_privilege_group_req(privilege_group)
        resp = self._stub.DropPrivilegeGroup(
            req, wait_for_ready=True, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    def list_privilege_groups(self, timeout: Optional[float] = None, **kwargs):
        req = Prepare.list_privilege_groups_req()
        resp = self._stub.ListPrivilegeGroups(
            req, wait_for_ready=True, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp.status)
        return PrivilegeGroupInfo(resp.privilege_groups)

    @retry_on_rpc_failure()
    def add_privileges_to_group(
        self, privilege_group: str, privileges: List[str], timeout: Optional[float] = None, **kwargs
    ):
        req = Prepare.operate_privilege_group_req(
            privilege_group, privileges, milvus_types.OperatePrivilegeGroupType.AddPrivilegesToGroup
        )
        resp = self._stub.OperatePrivilegeGroup(
            req, wait_for_ready=True, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    def remove_privileges_from_group(
        self, privilege_group: str, privileges: List[str], timeout: Optional[float] = None, **kwargs
    ):
        req = Prepare.operate_privilege_group_req(
            privilege_group,
            privileges,
            milvus_types.OperatePrivilegeGroupType.RemovePrivilegesFromGroup,
        )
        resp = self._stub.OperatePrivilegeGroup(
            req, wait_for_ready=True, timeout=timeout, metadata=_api_level_md(**kwargs)
        )
        check_status(resp)

    @retry_on_rpc_failure()
    def run_analyzer(
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
        check_pass_param(timeout=timeout)
        req = Prepare.run_analyzer(
            texts,
            analyzer_params=analyzer_params,
            with_hash=with_hash,
            with_detail=with_detail,
            collection_name=collection_name,
            field_name=field_name,
            analyzer_names=analyzer_names,
        )
        resp = self._stub.RunAnalyzer(req, timeout=timeout, metadata=_api_level_md(**kwargs))
        check_status(resp.status)

        if isinstance(texts, str):
            return AnalyzeResult(resp.results[0], with_hash, with_detail)
        return [AnalyzeResult(result, with_hash, with_detail) for result in resp.results]
