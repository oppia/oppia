# Copyright 2016 Google LLC All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Model a set of read-only queries to a database as a snapshot."""

import functools
import threading
from google.protobuf.struct_pb2 import Struct
from google.cloud.spanner_v1 import ExecuteSqlRequest
from google.cloud.spanner_v1 import ReadRequest
from google.cloud.spanner_v1 import TransactionOptions
from google.cloud.spanner_v1 import TransactionSelector
from google.cloud.spanner_v1 import PartitionOptions
from google.cloud.spanner_v1 import PartitionQueryRequest
from google.cloud.spanner_v1 import PartitionReadRequest

from google.api_core.exceptions import InternalServerError
from google.api_core.exceptions import ServiceUnavailable
from google.api_core.exceptions import InvalidArgument
from google.api_core import gapic_v1
from google.cloud.spanner_v1._helpers import _make_value_pb
from google.cloud.spanner_v1._helpers import _merge_query_options
from google.cloud.spanner_v1._helpers import _metadata_with_prefix
from google.cloud.spanner_v1._helpers import _SessionWrapper
from google.cloud.spanner_v1._opentelemetry_tracing import trace_call
from google.cloud.spanner_v1.streamed import StreamedResultSet
from google.cloud.spanner_v1 import RequestOptions

_STREAM_RESUMPTION_INTERNAL_ERROR_MESSAGES = (
    "RST_STREAM",
    "Received unexpected EOS on DATA frame from server",
)


def _restart_on_unavailable(
    method,
    request,
    trace_name=None,
    session=None,
    attributes=None,
    transaction=None,
    transaction_selector=None,
):
    """Restart iteration after :exc:`.ServiceUnavailable`.

    :type method: callable
    :param method: function returning iterator

    :type request: proto
    :param request: request proto to call the method with

    :type transaction: :class:`google.cloud.spanner_v1.snapshot._SnapshotBase`
    :param transaction: Snapshot or Transaction class object based on the type of transaction

    :type transaction_selector: :class:`transaction_pb2.TransactionSelector`
    :param transaction_selector: Transaction selector object to be used in request if transaction is not passed,
    if both transaction_selector and transaction are passed, then transaction is given priority.
    """

    resume_token = b""
    item_buffer = []

    if transaction is not None:
        transaction_selector = transaction._make_txn_selector()
    elif transaction_selector is None:
        raise InvalidArgument(
            "Either transaction or transaction_selector should be set"
        )

    request.transaction = transaction_selector
    with trace_call(trace_name, session, attributes):
        iterator = method(request=request)
    while True:
        try:
            for item in iterator:
                item_buffer.append(item)
                # Setting the transaction id because the transaction begin was inlined for first rpc.
                if (
                    transaction is not None
                    and transaction._transaction_id is None
                    and item.metadata is not None
                    and item.metadata.transaction is not None
                    and item.metadata.transaction.id is not None
                ):
                    transaction._transaction_id = item.metadata.transaction.id
                if item.resume_token:
                    resume_token = item.resume_token
                    break
        except ServiceUnavailable:
            del item_buffer[:]
            with trace_call(trace_name, session, attributes):
                request.resume_token = resume_token
                if transaction is not None:
                    transaction_selector = transaction._make_txn_selector()
                request.transaction = transaction_selector
                iterator = method(request=request)
            continue
        except InternalServerError as exc:
            resumable_error = any(
                resumable_message in exc.message
                for resumable_message in _STREAM_RESUMPTION_INTERNAL_ERROR_MESSAGES
            )
            if not resumable_error:
                raise
            del item_buffer[:]
            with trace_call(trace_name, session, attributes):
                request.resume_token = resume_token
                if transaction is not None:
                    transaction_selector = transaction._make_txn_selector()
                request.transaction = transaction_selector
                iterator = method(request=request)
            continue

        if len(item_buffer) == 0:
            break

        for item in item_buffer:
            yield item

        del item_buffer[:]


class _SnapshotBase(_SessionWrapper):
    """Base class for Snapshot.

    Allows reuse of API request methods with different transaction selector.

    :type session: :class:`~google.cloud.spanner_v1.session.Session`
    :param session: the session used to perform the commit
    """

    _multi_use = False
    _read_only: bool = True
    _transaction_id = None
    _read_request_count = 0
    _execute_sql_count = 0
    _lock = threading.Lock()

    def _make_txn_selector(self):
        """Helper for :meth:`read` / :meth:`execute_sql`.

        Subclasses must override, returning an instance of
        :class:`transaction_pb2.TransactionSelector`
        appropriate for making ``read`` / ``execute_sql`` requests

        :raises: NotImplementedError, always
        """
        raise NotImplementedError

    def read(
        self,
        table,
        columns,
        keyset,
        index="",
        limit=0,
        partition=None,
        request_options=None,
        *,
        retry=gapic_v1.method.DEFAULT,
        timeout=gapic_v1.method.DEFAULT,
    ):
        """Perform a ``StreamingRead`` API request for rows in a table.

        :type table: str
        :param table: name of the table from which to fetch data

        :type columns: list of str
        :param columns: names of columns to be retrieved

        :type keyset: :class:`~google.cloud.spanner_v1.keyset.KeySet`
        :param keyset: keys / ranges identifying rows to be retrieved

        :type index: str
        :param index: (Optional) name of index to use, rather than the
                      table's primary key

        :type limit: int
        :param limit: (Optional) maximum number of rows to return.
                      Incompatible with ``partition``.

        :type partition: bytes
        :param partition: (Optional) one of the partition tokens returned
                          from :meth:`partition_read`.  Incompatible with
                          ``limit``.

        :type request_options:
            :class:`google.cloud.spanner_v1.types.RequestOptions`
        :param request_options:
                (Optional) Common options for this request.
                If a dict is provided, it must be of the same form as the protobuf
                message :class:`~google.cloud.spanner_v1.types.RequestOptions`.
                Please note, the `transactionTag` setting will be ignored for
                snapshot as it's not supported for read-only transactions.

        :type retry: :class:`~google.api_core.retry.Retry`
        :param retry: (Optional) The retry settings for this request.

        :type timeout: float
        :param timeout: (Optional) The timeout for this request.

        :rtype: :class:`~google.cloud.spanner_v1.streamed.StreamedResultSet`
        :returns: a result set instance which can be used to consume rows.

        :raises ValueError:
            for reuse of single-use snapshots, or if a transaction ID is
            already pending for multiple-use snapshots.
        """
        if self._read_request_count > 0:
            if not self._multi_use:
                raise ValueError("Cannot re-use single-use snapshot.")
            if self._transaction_id is None and self._read_only:
                raise ValueError("Transaction ID pending.")

        database = self._session._database
        api = database.spanner_api
        metadata = _metadata_with_prefix(database.name)

        if request_options is None:
            request_options = RequestOptions()
        elif type(request_options) == dict:
            request_options = RequestOptions(request_options)

        if self._read_only:
            # Transaction tags are not supported for read only transactions.
            request_options.transaction_tag = None
        else:
            request_options.transaction_tag = self.transaction_tag

        request = ReadRequest(
            session=self._session.name,
            table=table,
            columns=columns,
            key_set=keyset._to_pb(),
            index=index,
            limit=limit,
            partition_token=partition,
            request_options=request_options,
        )
        restart = functools.partial(
            api.streaming_read,
            request=request,
            metadata=metadata,
            retry=retry,
            timeout=timeout,
        )

        trace_attributes = {"table_id": table, "columns": columns}

        if self._transaction_id is None:
            # lock is added to handle the inline begin for first rpc
            with self._lock:
                iterator = _restart_on_unavailable(
                    restart,
                    request,
                    "CloudSpanner.ReadOnlyTransaction",
                    self._session,
                    trace_attributes,
                    transaction=self,
                )
                self._read_request_count += 1
                if self._multi_use:
                    return StreamedResultSet(iterator, source=self)
                else:
                    return StreamedResultSet(iterator)
        else:
            iterator = _restart_on_unavailable(
                restart,
                request,
                "CloudSpanner.ReadOnlyTransaction",
                self._session,
                trace_attributes,
                transaction=self,
            )

        self._read_request_count += 1

        if self._multi_use:
            return StreamedResultSet(iterator, source=self)
        else:
            return StreamedResultSet(iterator)

    def execute_sql(
        self,
        sql,
        params=None,
        param_types=None,
        query_mode=None,
        query_options=None,
        request_options=None,
        partition=None,
        retry=gapic_v1.method.DEFAULT,
        timeout=gapic_v1.method.DEFAULT,
    ):
        """Perform an ``ExecuteStreamingSql`` API request.

        :type sql: str
        :param sql: SQL query statement

        :type params: dict, {str -> column value}
        :param params: values for parameter replacement.  Keys must match
                       the names used in ``sql``.

        :type param_types: dict[str -> Union[dict, .types.Type]]
        :param param_types:
            (Optional) maps explicit types for one or more param values;
            required if parameters are passed.

        :type query_mode:
            :class:`~google.cloud.spanner_v1.types.ExecuteSqlRequest.QueryMode`
        :param query_mode: Mode governing return of results / query plan.
            See:
            `QueryMode <https://cloud.google.com/spanner/reference/rpc/google.spanner.v1#google.spanner.v1.ExecuteSqlRequest.QueryMode>`_.

        :type query_options:
            :class:`~google.cloud.spanner_v1.types.ExecuteSqlRequest.QueryOptions`
                or :class:`dict`
        :param query_options:
                (Optional) Query optimizer configuration to use for the given query.
                If a dict is provided, it must be of the same form as the protobuf
                message :class:`~google.cloud.spanner_v1.types.QueryOptions`

        :type request_options:
            :class:`google.cloud.spanner_v1.types.RequestOptions`
        :param request_options:
                (Optional) Common options for this request.
                If a dict is provided, it must be of the same form as the protobuf
                message :class:`~google.cloud.spanner_v1.types.RequestOptions`.

        :type partition: bytes
        :param partition: (Optional) one of the partition tokens returned
                          from :meth:`partition_query`.

        :rtype: :class:`~google.cloud.spanner_v1.streamed.StreamedResultSet`
        :returns: a result set instance which can be used to consume rows.

        :type retry: :class:`~google.api_core.retry.Retry`
        :param retry: (Optional) The retry settings for this request.

        :type timeout: float
        :param timeout: (Optional) The timeout for this request.

        :raises ValueError:
            for reuse of single-use snapshots, or if a transaction ID is
            already pending for multiple-use snapshots.
        """
        if self._read_request_count > 0:
            if not self._multi_use:
                raise ValueError("Cannot re-use single-use snapshot.")
            if self._transaction_id is None and self._read_only:
                raise ValueError("Transaction ID pending.")

        if params is not None:
            if param_types is None:
                raise ValueError("Specify 'param_types' when passing 'params'.")
            params_pb = Struct(
                fields={key: _make_value_pb(value) for key, value in params.items()}
            )
        else:
            params_pb = {}

        database = self._session._database
        metadata = _metadata_with_prefix(database.name)

        api = database.spanner_api

        # Query-level options have higher precedence than client-level and
        # environment-level options
        default_query_options = database._instance._client._query_options
        query_options = _merge_query_options(default_query_options, query_options)

        if request_options is None:
            request_options = RequestOptions()
        elif type(request_options) == dict:
            request_options = RequestOptions(request_options)
        if self._read_only:
            # Transaction tags are not supported for read only transactions.
            request_options.transaction_tag = None
        else:
            request_options.transaction_tag = self.transaction_tag

        request = ExecuteSqlRequest(
            session=self._session.name,
            sql=sql,
            params=params_pb,
            param_types=param_types,
            query_mode=query_mode,
            partition_token=partition,
            seqno=self._execute_sql_count,
            query_options=query_options,
            request_options=request_options,
        )
        restart = functools.partial(
            api.execute_streaming_sql,
            request=request,
            metadata=metadata,
            retry=retry,
            timeout=timeout,
        )

        trace_attributes = {"db.statement": sql}

        if self._transaction_id is None:
            # lock is added to handle the inline begin for first rpc
            with self._lock:
                iterator = _restart_on_unavailable(
                    restart,
                    request,
                    "CloudSpanner.ReadWriteTransaction",
                    self._session,
                    trace_attributes,
                    transaction=self,
                )
                self._read_request_count += 1
                self._execute_sql_count += 1

                if self._multi_use:
                    return StreamedResultSet(iterator, source=self)
                else:
                    return StreamedResultSet(iterator)
        else:
            iterator = _restart_on_unavailable(
                restart,
                request,
                "CloudSpanner.ReadWriteTransaction",
                self._session,
                trace_attributes,
                transaction=self,
            )

        self._read_request_count += 1
        self._execute_sql_count += 1

        if self._multi_use:
            return StreamedResultSet(iterator, source=self)
        else:
            return StreamedResultSet(iterator)

    def partition_read(
        self,
        table,
        columns,
        keyset,
        index="",
        partition_size_bytes=None,
        max_partitions=None,
        *,
        retry=gapic_v1.method.DEFAULT,
        timeout=gapic_v1.method.DEFAULT,
    ):
        """Perform a ``PartitionRead`` API request for rows in a table.

        :type table: str
        :param table: name of the table from which to fetch data

        :type columns: list of str
        :param columns: names of columns to be retrieved

        :type keyset: :class:`~google.cloud.spanner_v1.keyset.KeySet`
        :param keyset: keys / ranges identifying rows to be retrieved

        :type index: str
        :param index: (Optional) name of index to use, rather than the
                      table's primary key

        :type partition_size_bytes: int
        :param partition_size_bytes:
            (Optional) desired size for each partition generated.  The service
            uses this as a hint, the actual partition size may differ.

        :type max_partitions: int
        :param max_partitions:
            (Optional) desired maximum number of partitions generated. The
            service uses this as a hint, the actual number of partitions may
            differ.

        :type retry: :class:`~google.api_core.retry.Retry`
        :param retry: (Optional) The retry settings for this request.

        :type timeout: float
        :param timeout: (Optional) The timeout for this request.

        :rtype: iterable of bytes
        :returns: a sequence of partition tokens

        :raises ValueError:
            for single-use snapshots, or if a transaction ID is
            already associated with the snapshot.
        """
        if not self._multi_use:
            raise ValueError("Cannot use single-use snapshot.")

        if self._transaction_id is None:
            raise ValueError("Transaction not started.")

        database = self._session._database
        api = database.spanner_api
        metadata = _metadata_with_prefix(database.name)
        transaction = self._make_txn_selector()
        partition_options = PartitionOptions(
            partition_size_bytes=partition_size_bytes, max_partitions=max_partitions
        )
        request = PartitionReadRequest(
            session=self._session.name,
            table=table,
            columns=columns,
            key_set=keyset._to_pb(),
            transaction=transaction,
            index=index,
            partition_options=partition_options,
        )

        trace_attributes = {"table_id": table, "columns": columns}
        with trace_call(
            "CloudSpanner.PartitionReadOnlyTransaction", self._session, trace_attributes
        ):
            response = api.partition_read(
                request=request,
                metadata=metadata,
                retry=retry,
                timeout=timeout,
            )

        return [partition.partition_token for partition in response.partitions]

    def partition_query(
        self,
        sql,
        params=None,
        param_types=None,
        partition_size_bytes=None,
        max_partitions=None,
        *,
        retry=gapic_v1.method.DEFAULT,
        timeout=gapic_v1.method.DEFAULT,
    ):
        """Perform a ``PartitionQuery`` API request.

        :type sql: str
        :param sql: SQL query statement

        :type params: dict, {str -> column value}
        :param params: values for parameter replacement.  Keys must match
                       the names used in ``sql``.

        :type param_types: dict[str -> Union[dict, .types.Type]]
        :param param_types:
            (Optional) maps explicit types for one or more param values;
            required if parameters are passed.

        :type partition_size_bytes: int
        :param partition_size_bytes:
            (Optional) desired size for each partition generated.  The service
            uses this as a hint, the actual partition size may differ.

        :type max_partitions: int
        :param max_partitions:
            (Optional) desired maximum number of partitions generated. The
            service uses this as a hint, the actual number of partitions may
            differ.

        :type retry: :class:`~google.api_core.retry.Retry`
        :param retry: (Optional) The retry settings for this request.

        :type timeout: float
        :param timeout: (Optional) The timeout for this request.

        :rtype: iterable of bytes
        :returns: a sequence of partition tokens

        :raises ValueError:
            for single-use snapshots, or if a transaction ID is
            already associated with the snapshot.
        """
        if not self._multi_use:
            raise ValueError("Cannot use single-use snapshot.")

        if self._transaction_id is None:
            raise ValueError("Transaction not started.")

        if params is not None:
            if param_types is None:
                raise ValueError("Specify 'param_types' when passing 'params'.")
            params_pb = Struct(
                fields={key: _make_value_pb(value) for (key, value) in params.items()}
            )
        else:
            params_pb = Struct()

        database = self._session._database
        api = database.spanner_api
        metadata = _metadata_with_prefix(database.name)
        transaction = self._make_txn_selector()
        partition_options = PartitionOptions(
            partition_size_bytes=partition_size_bytes, max_partitions=max_partitions
        )
        request = PartitionQueryRequest(
            session=self._session.name,
            sql=sql,
            transaction=transaction,
            params=params_pb,
            param_types=param_types,
            partition_options=partition_options,
        )

        trace_attributes = {"db.statement": sql}
        with trace_call(
            "CloudSpanner.PartitionReadWriteTransaction",
            self._session,
            trace_attributes,
        ):
            response = api.partition_query(
                request=request,
                metadata=metadata,
                retry=retry,
                timeout=timeout,
            )

        return [partition.partition_token for partition in response.partitions]


class Snapshot(_SnapshotBase):
    """Allow a set of reads / SQL statements with shared staleness.

    See
    https://cloud.google.com/spanner/reference/rpc/google.spanner.v1#google.spanner.v1.TransactionOptions.ReadOnly

    If no options are passed, reads will use the ``strong`` model, reading
    at a timestamp where all previously committed transactions are visible.

    :type session: :class:`~google.cloud.spanner_v1.session.Session`
    :param session: The session used to perform the commit.

    :type read_timestamp: :class:`datetime.datetime`
    :param read_timestamp: Execute all reads at the given timestamp.

    :type min_read_timestamp: :class:`datetime.datetime`
    :param min_read_timestamp: Execute all reads at a
                               timestamp >= ``min_read_timestamp``.

    :type max_staleness: :class:`datetime.timedelta`
    :param max_staleness: Read data at a
                          timestamp >= NOW - ``max_staleness`` seconds.

    :type exact_staleness: :class:`datetime.timedelta`
    :param exact_staleness: Execute all reads at a timestamp that is
                            ``exact_staleness`` old.

    :type multi_use: :class:`bool`
    :param multi_use: If true, multiple :meth:`read` / :meth:`execute_sql`
                      calls can be performed with the snapshot in the
                      context of a read-only transaction, used to ensure
                      isolation / consistency. Incompatible with
                      ``max_staleness`` and ``min_read_timestamp``.
    """

    def __init__(
        self,
        session,
        read_timestamp=None,
        min_read_timestamp=None,
        max_staleness=None,
        exact_staleness=None,
        multi_use=False,
    ):
        super(Snapshot, self).__init__(session)
        opts = [read_timestamp, min_read_timestamp, max_staleness, exact_staleness]
        flagged = [opt for opt in opts if opt is not None]

        if len(flagged) > 1:
            raise ValueError("Supply zero or one options.")

        if multi_use:
            if min_read_timestamp is not None or max_staleness is not None:
                raise ValueError(
                    "'multi_use' is incompatible with "
                    "'min_read_timestamp' / 'max_staleness'"
                )

        self._strong = len(flagged) == 0
        self._read_timestamp = read_timestamp
        self._min_read_timestamp = min_read_timestamp
        self._max_staleness = max_staleness
        self._exact_staleness = exact_staleness
        self._multi_use = multi_use

    def _make_txn_selector(self):
        """Helper for :meth:`read`."""
        if self._transaction_id is not None:
            return TransactionSelector(id=self._transaction_id)

        if self._read_timestamp:
            key = "read_timestamp"
            value = self._read_timestamp
        elif self._min_read_timestamp:
            key = "min_read_timestamp"
            value = self._min_read_timestamp
        elif self._max_staleness:
            key = "max_staleness"
            value = self._max_staleness
        elif self._exact_staleness:
            key = "exact_staleness"
            value = self._exact_staleness
        else:
            key = "strong"
            value = True

        options = TransactionOptions(
            read_only=TransactionOptions.ReadOnly(**{key: value})
        )

        if self._multi_use:
            return TransactionSelector(begin=options)
        else:
            return TransactionSelector(single_use=options)

    def begin(self):
        """Begin a read-only transaction on the database.

        :rtype: bytes
        :returns: the ID for the newly-begun transaction.

        :raises ValueError:
            if the transaction is already begun, committed, or rolled back.
        """
        if not self._multi_use:
            raise ValueError("Cannot call 'begin' on single-use snapshots")

        if self._transaction_id is not None:
            raise ValueError("Read-only transaction already begun")

        if self._read_request_count > 0:
            raise ValueError("Read-only transaction already pending")

        database = self._session._database
        api = database.spanner_api
        metadata = _metadata_with_prefix(database.name)
        txn_selector = self._make_txn_selector()
        with trace_call("CloudSpanner.BeginTransaction", self._session):
            response = api.begin_transaction(
                session=self._session.name,
                options=txn_selector.begin,
                metadata=metadata,
            )
        self._transaction_id = response.id
        return self._transaction_id
