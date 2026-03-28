# -*- coding: utf-8 -*-
# Copyright 2022 Google LLC
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
#
import proto  # type: ignore

from google.cloud.spanner_v1.types import keys
from google.cloud.spanner_v1.types import mutation
from google.cloud.spanner_v1.types import result_set
from google.cloud.spanner_v1.types import transaction as gs_transaction
from google.cloud.spanner_v1.types import type as gs_type
from google.protobuf import struct_pb2  # type: ignore
from google.protobuf import timestamp_pb2  # type: ignore
from google.rpc import status_pb2  # type: ignore


__protobuf__ = proto.module(
    package="google.spanner.v1",
    manifest={
        "CreateSessionRequest",
        "BatchCreateSessionsRequest",
        "BatchCreateSessionsResponse",
        "Session",
        "GetSessionRequest",
        "ListSessionsRequest",
        "ListSessionsResponse",
        "DeleteSessionRequest",
        "RequestOptions",
        "ExecuteSqlRequest",
        "ExecuteBatchDmlRequest",
        "ExecuteBatchDmlResponse",
        "PartitionOptions",
        "PartitionQueryRequest",
        "PartitionReadRequest",
        "Partition",
        "PartitionResponse",
        "ReadRequest",
        "BeginTransactionRequest",
        "CommitRequest",
        "RollbackRequest",
    },
)


class CreateSessionRequest(proto.Message):
    r"""The request for
    [CreateSession][google.spanner.v1.Spanner.CreateSession].

    Attributes:
        database (str):
            Required. The database in which the new
            session is created.
        session (google.cloud.spanner_v1.types.Session):
            Required. The session to create.
    """

    database = proto.Field(
        proto.STRING,
        number=1,
    )
    session = proto.Field(
        proto.MESSAGE,
        number=2,
        message="Session",
    )


class BatchCreateSessionsRequest(proto.Message):
    r"""The request for
    [BatchCreateSessions][google.spanner.v1.Spanner.BatchCreateSessions].

    Attributes:
        database (str):
            Required. The database in which the new
            sessions are created.
        session_template (google.cloud.spanner_v1.types.Session):
            Parameters to be applied to each created
            session.
        session_count (int):
            Required. The number of sessions to be created in this batch
            call. The API may return fewer than the requested number of
            sessions. If a specific number of sessions are desired, the
            client can make additional calls to BatchCreateSessions
            (adjusting
            [session_count][google.spanner.v1.BatchCreateSessionsRequest.session_count]
            as necessary).
    """

    database = proto.Field(
        proto.STRING,
        number=1,
    )
    session_template = proto.Field(
        proto.MESSAGE,
        number=2,
        message="Session",
    )
    session_count = proto.Field(
        proto.INT32,
        number=3,
    )


class BatchCreateSessionsResponse(proto.Message):
    r"""The response for
    [BatchCreateSessions][google.spanner.v1.Spanner.BatchCreateSessions].

    Attributes:
        session (Sequence[google.cloud.spanner_v1.types.Session]):
            The freshly created sessions.
    """

    session = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="Session",
    )


class Session(proto.Message):
    r"""A session in the Cloud Spanner API.

    Attributes:
        name (str):
            Output only. The name of the session. This is
            always system-assigned.
        labels (Mapping[str, str]):
            The labels for the session.

            -  Label keys must be between 1 and 63 characters long and
               must conform to the following regular expression:
               ``[a-z]([-a-z0-9]*[a-z0-9])?``.
            -  Label values must be between 0 and 63 characters long and
               must conform to the regular expression
               ``([a-z]([-a-z0-9]*[a-z0-9])?)?``.
            -  No more than 64 labels can be associated with a given
               session.

            See https://goo.gl/xmQnxf for more information on and
            examples of labels.
        create_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. The timestamp when the session
            is created.
        approximate_last_use_time (google.protobuf.timestamp_pb2.Timestamp):
            Output only. The approximate timestamp when
            the session is last used. It is typically
            earlier than the actual last use time.
        creator_role (str):
            The database role which created this session.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )
    labels = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=2,
    )
    create_time = proto.Field(
        proto.MESSAGE,
        number=3,
        message=timestamp_pb2.Timestamp,
    )
    approximate_last_use_time = proto.Field(
        proto.MESSAGE,
        number=4,
        message=timestamp_pb2.Timestamp,
    )
    creator_role = proto.Field(
        proto.STRING,
        number=5,
    )


class GetSessionRequest(proto.Message):
    r"""The request for [GetSession][google.spanner.v1.Spanner.GetSession].

    Attributes:
        name (str):
            Required. The name of the session to
            retrieve.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )


class ListSessionsRequest(proto.Message):
    r"""The request for
    [ListSessions][google.spanner.v1.Spanner.ListSessions].

    Attributes:
        database (str):
            Required. The database in which to list
            sessions.
        page_size (int):
            Number of sessions to be returned in the
            response. If 0 or less, defaults to the server's
            maximum allowed page size.
        page_token (str):
            If non-empty, ``page_token`` should contain a
            [next_page_token][google.spanner.v1.ListSessionsResponse.next_page_token]
            from a previous
            [ListSessionsResponse][google.spanner.v1.ListSessionsResponse].
        filter (str):
            An expression for filtering the results of the request.
            Filter rules are case insensitive. The fields eligible for
            filtering are:

            -  ``labels.key`` where key is the name of a label

            Some examples of using filters are:

            -  ``labels.env:*`` --> The session has the label "env".
            -  ``labels.env:dev`` --> The session has the label "env"
               and the value of the label contains the string "dev".
    """

    database = proto.Field(
        proto.STRING,
        number=1,
    )
    page_size = proto.Field(
        proto.INT32,
        number=2,
    )
    page_token = proto.Field(
        proto.STRING,
        number=3,
    )
    filter = proto.Field(
        proto.STRING,
        number=4,
    )


class ListSessionsResponse(proto.Message):
    r"""The response for
    [ListSessions][google.spanner.v1.Spanner.ListSessions].

    Attributes:
        sessions (Sequence[google.cloud.spanner_v1.types.Session]):
            The list of requested sessions.
        next_page_token (str):
            ``next_page_token`` can be sent in a subsequent
            [ListSessions][google.spanner.v1.Spanner.ListSessions] call
            to fetch more of the matching sessions.
    """

    @property
    def raw_page(self):
        return self

    sessions = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="Session",
    )
    next_page_token = proto.Field(
        proto.STRING,
        number=2,
    )


class DeleteSessionRequest(proto.Message):
    r"""The request for
    [DeleteSession][google.spanner.v1.Spanner.DeleteSession].

    Attributes:
        name (str):
            Required. The name of the session to delete.
    """

    name = proto.Field(
        proto.STRING,
        number=1,
    )


class RequestOptions(proto.Message):
    r"""Common request options for various APIs.

    Attributes:
        priority (google.cloud.spanner_v1.types.RequestOptions.Priority):
            Priority for the request.
        request_tag (str):
            A per-request tag which can be applied to queries or reads,
            used for statistics collection. Both request_tag and
            transaction_tag can be specified for a read or query that
            belongs to a transaction. This field is ignored for requests
            where it's not applicable (e.g. CommitRequest). Legal
            characters for ``request_tag`` values are all printable
            characters (ASCII 32 - 126) and the length of a request_tag
            is limited to 50 characters. Values that exceed this limit
            are truncated. Any leading underscore (_) characters will be
            removed from the string.
        transaction_tag (str):
            A tag used for statistics collection about this transaction.
            Both request_tag and transaction_tag can be specified for a
            read or query that belongs to a transaction. The value of
            transaction_tag should be the same for all requests
            belonging to the same transaction. If this request doesn't
            belong to any transaction, transaction_tag will be ignored.
            Legal characters for ``transaction_tag`` values are all
            printable characters (ASCII 32 - 126) and the length of a
            transaction_tag is limited to 50 characters. Values that
            exceed this limit are truncated. Any leading underscore (_)
            characters will be removed from the string.
    """

    class Priority(proto.Enum):
        r"""The relative priority for requests. Note that priority is not
        applicable for
        [BeginTransaction][google.spanner.v1.Spanner.BeginTransaction].

        The priority acts as a hint to the Cloud Spanner scheduler and does
        not guarantee priority or order of execution. For example:

        -  Some parts of a write operation always execute at
           ``PRIORITY_HIGH``, regardless of the specified priority. This may
           cause you to see an increase in high priority workload even when
           executing a low priority request. This can also potentially cause
           a priority inversion where a lower priority request will be
           fulfilled ahead of a higher priority request.
        -  If a transaction contains multiple operations with different
           priorities, Cloud Spanner does not guarantee to process the
           higher priority operations first. There may be other constraints
           to satisfy, such as order of operations.
        """
        PRIORITY_UNSPECIFIED = 0
        PRIORITY_LOW = 1
        PRIORITY_MEDIUM = 2
        PRIORITY_HIGH = 3

    priority = proto.Field(
        proto.ENUM,
        number=1,
        enum=Priority,
    )
    request_tag = proto.Field(
        proto.STRING,
        number=2,
    )
    transaction_tag = proto.Field(
        proto.STRING,
        number=3,
    )


class ExecuteSqlRequest(proto.Message):
    r"""The request for [ExecuteSql][google.spanner.v1.Spanner.ExecuteSql]
    and
    [ExecuteStreamingSql][google.spanner.v1.Spanner.ExecuteStreamingSql].

    Attributes:
        session (str):
            Required. The session in which the SQL query
            should be performed.
        transaction (google.cloud.spanner_v1.types.TransactionSelector):
            The transaction to use.
            For queries, if none is provided, the default is
            a temporary read-only transaction with strong
            concurrency.

            Standard DML statements require a read-write
            transaction. To protect against replays,
            single-use transactions are not supported.  The
            caller must either supply an existing
            transaction ID or begin a new transaction.
            Partitioned DML requires an existing Partitioned
            DML transaction ID.
        sql (str):
            Required. The SQL string.
        params (google.protobuf.struct_pb2.Struct):
            Parameter names and values that bind to placeholders in the
            SQL string.

            A parameter placeholder consists of the ``@`` character
            followed by the parameter name (for example,
            ``@firstName``). Parameter names must conform to the naming
            requirements of identifiers as specified at
            https://cloud.google.com/spanner/docs/lexical#identifiers.

            Parameters can appear anywhere that a literal value is
            expected. The same parameter name can be used more than
            once, for example:

            ``"WHERE id > @msg_id AND id < @msg_id + 100"``

            It is an error to execute a SQL statement with unbound
            parameters.
        param_types (Mapping[str, google.cloud.spanner_v1.types.Type]):
            It is not always possible for Cloud Spanner to infer the
            right SQL type from a JSON value. For example, values of
            type ``BYTES`` and values of type ``STRING`` both appear in
            [params][google.spanner.v1.ExecuteSqlRequest.params] as JSON
            strings.

            In these cases, ``param_types`` can be used to specify the
            exact SQL type for some or all of the SQL statement
            parameters. See the definition of
            [Type][google.spanner.v1.Type] for more information about
            SQL types.
        resume_token (bytes):
            If this request is resuming a previously interrupted SQL
            statement execution, ``resume_token`` should be copied from
            the last
            [PartialResultSet][google.spanner.v1.PartialResultSet]
            yielded before the interruption. Doing this enables the new
            SQL statement execution to resume where the last one left
            off. The rest of the request parameters must exactly match
            the request that yielded this token.
        query_mode (google.cloud.spanner_v1.types.ExecuteSqlRequest.QueryMode):
            Used to control the amount of debugging information returned
            in [ResultSetStats][google.spanner.v1.ResultSetStats]. If
            [partition_token][google.spanner.v1.ExecuteSqlRequest.partition_token]
            is set,
            [query_mode][google.spanner.v1.ExecuteSqlRequest.query_mode]
            can only be set to
            [QueryMode.NORMAL][google.spanner.v1.ExecuteSqlRequest.QueryMode.NORMAL].
        partition_token (bytes):
            If present, results will be restricted to the specified
            partition previously created using PartitionQuery(). There
            must be an exact match for the values of fields common to
            this message and the PartitionQueryRequest message used to
            create this partition_token.
        seqno (int):
            A per-transaction sequence number used to
            identify this request. This field makes each
            request idempotent such that if the request is
            received multiple times, at most one will
            succeed.

            The sequence number must be monotonically
            increasing within the transaction. If a request
            arrives for the first time with an out-of-order
            sequence number, the transaction may be aborted.
            Replays of previously handled requests will
            yield the same response as the first execution.
            Required for DML statements. Ignored for
            queries.
        query_options (google.cloud.spanner_v1.types.ExecuteSqlRequest.QueryOptions):
            Query optimizer configuration to use for the
            given query.
        request_options (google.cloud.spanner_v1.types.RequestOptions):
            Common options for this request.
    """

    class QueryMode(proto.Enum):
        r"""Mode in which the statement must be processed."""
        NORMAL = 0
        PLAN = 1
        PROFILE = 2

    class QueryOptions(proto.Message):
        r"""Query optimizer configuration.

        Attributes:
            optimizer_version (str):
                An option to control the selection of optimizer version.

                This parameter allows individual queries to pick different
                query optimizer versions.

                Specifying ``latest`` as a value instructs Cloud Spanner to
                use the latest supported query optimizer version. If not
                specified, Cloud Spanner uses the optimizer version set at
                the database level options. Any other positive integer (from
                the list of supported optimizer versions) overrides the
                default optimizer version for query execution.

                The list of supported optimizer versions can be queried from
                SPANNER_SYS.SUPPORTED_OPTIMIZER_VERSIONS.

                Executing a SQL statement with an invalid optimizer version
                fails with an ``INVALID_ARGUMENT`` error.

                See
                https://cloud.google.com/spanner/docs/query-optimizer/manage-query-optimizer
                for more information on managing the query optimizer.

                The ``optimizer_version`` statement hint has precedence over
                this setting.
            optimizer_statistics_package (str):
                An option to control the selection of optimizer statistics
                package.

                This parameter allows individual queries to use a different
                query optimizer statistics package.

                Specifying ``latest`` as a value instructs Cloud Spanner to
                use the latest generated statistics package. If not
                specified, Cloud Spanner uses the statistics package set at
                the database level options, or the latest package if the
                database option is not set.

                The statistics package requested by the query has to be
                exempt from garbage collection. This can be achieved with
                the following DDL statement:

                ::

                   ALTER STATISTICS <package_name> SET OPTIONS (allow_gc=false)

                The list of available statistics packages can be queried
                from ``INFORMATION_SCHEMA.SPANNER_STATISTICS``.

                Executing a SQL statement with an invalid optimizer
                statistics package or with a statistics package that allows
                garbage collection fails with an ``INVALID_ARGUMENT`` error.
        """

        optimizer_version = proto.Field(
            proto.STRING,
            number=1,
        )
        optimizer_statistics_package = proto.Field(
            proto.STRING,
            number=2,
        )

    session = proto.Field(
        proto.STRING,
        number=1,
    )
    transaction = proto.Field(
        proto.MESSAGE,
        number=2,
        message=gs_transaction.TransactionSelector,
    )
    sql = proto.Field(
        proto.STRING,
        number=3,
    )
    params = proto.Field(
        proto.MESSAGE,
        number=4,
        message=struct_pb2.Struct,
    )
    param_types = proto.MapField(
        proto.STRING,
        proto.MESSAGE,
        number=5,
        message=gs_type.Type,
    )
    resume_token = proto.Field(
        proto.BYTES,
        number=6,
    )
    query_mode = proto.Field(
        proto.ENUM,
        number=7,
        enum=QueryMode,
    )
    partition_token = proto.Field(
        proto.BYTES,
        number=8,
    )
    seqno = proto.Field(
        proto.INT64,
        number=9,
    )
    query_options = proto.Field(
        proto.MESSAGE,
        number=10,
        message=QueryOptions,
    )
    request_options = proto.Field(
        proto.MESSAGE,
        number=11,
        message="RequestOptions",
    )


class ExecuteBatchDmlRequest(proto.Message):
    r"""The request for
    [ExecuteBatchDml][google.spanner.v1.Spanner.ExecuteBatchDml].

    Attributes:
        session (str):
            Required. The session in which the DML
            statements should be performed.
        transaction (google.cloud.spanner_v1.types.TransactionSelector):
            Required. The transaction to use. Must be a
            read-write transaction.
            To protect against replays, single-use
            transactions are not supported. The caller must
            either supply an existing transaction ID or
            begin a new transaction.
        statements (Sequence[google.cloud.spanner_v1.types.ExecuteBatchDmlRequest.Statement]):
            Required. The list of statements to execute in this batch.
            Statements are executed serially, such that the effects of
            statement ``i`` are visible to statement ``i+1``. Each
            statement must be a DML statement. Execution stops at the
            first failed statement; the remaining statements are not
            executed.

            Callers must provide at least one statement.
        seqno (int):
            Required. A per-transaction sequence number
            used to identify this request. This field makes
            each request idempotent such that if the request
            is received multiple times, at most one will
            succeed.

            The sequence number must be monotonically
            increasing within the transaction. If a request
            arrives for the first time with an out-of-order
            sequence number, the transaction may be aborted.
            Replays of previously handled requests will
            yield the same response as the first execution.
        request_options (google.cloud.spanner_v1.types.RequestOptions):
            Common options for this request.
    """

    class Statement(proto.Message):
        r"""A single DML statement.

        Attributes:
            sql (str):
                Required. The DML string.
            params (google.protobuf.struct_pb2.Struct):
                Parameter names and values that bind to placeholders in the
                DML string.

                A parameter placeholder consists of the ``@`` character
                followed by the parameter name (for example,
                ``@firstName``). Parameter names can contain letters,
                numbers, and underscores.

                Parameters can appear anywhere that a literal value is
                expected. The same parameter name can be used more than
                once, for example:

                ``"WHERE id > @msg_id AND id < @msg_id + 100"``

                It is an error to execute a SQL statement with unbound
                parameters.
            param_types (Mapping[str, google.cloud.spanner_v1.types.Type]):
                It is not always possible for Cloud Spanner to infer the
                right SQL type from a JSON value. For example, values of
                type ``BYTES`` and values of type ``STRING`` both appear in
                [params][google.spanner.v1.ExecuteBatchDmlRequest.Statement.params]
                as JSON strings.

                In these cases, ``param_types`` can be used to specify the
                exact SQL type for some or all of the SQL statement
                parameters. See the definition of
                [Type][google.spanner.v1.Type] for more information about
                SQL types.
        """

        sql = proto.Field(
            proto.STRING,
            number=1,
        )
        params = proto.Field(
            proto.MESSAGE,
            number=2,
            message=struct_pb2.Struct,
        )
        param_types = proto.MapField(
            proto.STRING,
            proto.MESSAGE,
            number=3,
            message=gs_type.Type,
        )

    session = proto.Field(
        proto.STRING,
        number=1,
    )
    transaction = proto.Field(
        proto.MESSAGE,
        number=2,
        message=gs_transaction.TransactionSelector,
    )
    statements = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message=Statement,
    )
    seqno = proto.Field(
        proto.INT64,
        number=4,
    )
    request_options = proto.Field(
        proto.MESSAGE,
        number=5,
        message="RequestOptions",
    )


class ExecuteBatchDmlResponse(proto.Message):
    r"""The response for
    [ExecuteBatchDml][google.spanner.v1.Spanner.ExecuteBatchDml].
    Contains a list of [ResultSet][google.spanner.v1.ResultSet]
    messages, one for each DML statement that has successfully executed,
    in the same order as the statements in the request. If a statement
    fails, the status in the response body identifies the cause of the
    failure.

    To check for DML statements that failed, use the following approach:

    1. Check the status in the response message. The
       [google.rpc.Code][google.rpc.Code] enum value ``OK`` indicates
       that all statements were executed successfully.
    2. If the status was not ``OK``, check the number of result sets in
       the response. If the response contains ``N``
       [ResultSet][google.spanner.v1.ResultSet] messages, then statement
       ``N+1`` in the request failed.

    Example 1:

    -  Request: 5 DML statements, all executed successfully.
    -  Response: 5 [ResultSet][google.spanner.v1.ResultSet] messages,
       with the status ``OK``.

    Example 2:

    -  Request: 5 DML statements. The third statement has a syntax
       error.
    -  Response: 2 [ResultSet][google.spanner.v1.ResultSet] messages,
       and a syntax error (``INVALID_ARGUMENT``) status. The number of
       [ResultSet][google.spanner.v1.ResultSet] messages indicates that
       the third statement failed, and the fourth and fifth statements
       were not executed.

    Attributes:
        result_sets (Sequence[google.cloud.spanner_v1.types.ResultSet]):
            One [ResultSet][google.spanner.v1.ResultSet] for each
            statement in the request that ran successfully, in the same
            order as the statements in the request. Each
            [ResultSet][google.spanner.v1.ResultSet] does not contain
            any rows. The
            [ResultSetStats][google.spanner.v1.ResultSetStats] in each
            [ResultSet][google.spanner.v1.ResultSet] contain the number
            of rows modified by the statement.

            Only the first [ResultSet][google.spanner.v1.ResultSet] in
            the response contains valid
            [ResultSetMetadata][google.spanner.v1.ResultSetMetadata].
        status (google.rpc.status_pb2.Status):
            If all DML statements are executed successfully, the status
            is ``OK``. Otherwise, the error status of the first failed
            statement.
    """

    result_sets = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message=result_set.ResultSet,
    )
    status = proto.Field(
        proto.MESSAGE,
        number=2,
        message=status_pb2.Status,
    )


class PartitionOptions(proto.Message):
    r"""Options for a PartitionQueryRequest and
    PartitionReadRequest.

    Attributes:
        partition_size_bytes (int):
            **Note:** This hint is currently ignored by PartitionQuery
            and PartitionRead requests.

            The desired data size for each partition generated. The
            default for this option is currently 1 GiB. This is only a
            hint. The actual size of each partition may be smaller or
            larger than this size request.
        max_partitions (int):
            **Note:** This hint is currently ignored by PartitionQuery
            and PartitionRead requests.

            The desired maximum number of partitions to return. For
            example, this may be set to the number of workers available.
            The default for this option is currently 10,000. The maximum
            value is currently 200,000. This is only a hint. The actual
            number of partitions returned may be smaller or larger than
            this maximum count request.
    """

    partition_size_bytes = proto.Field(
        proto.INT64,
        number=1,
    )
    max_partitions = proto.Field(
        proto.INT64,
        number=2,
    )


class PartitionQueryRequest(proto.Message):
    r"""The request for
    [PartitionQuery][google.spanner.v1.Spanner.PartitionQuery]

    Attributes:
        session (str):
            Required. The session used to create the
            partitions.
        transaction (google.cloud.spanner_v1.types.TransactionSelector):
            Read only snapshot transactions are
            supported, read/write and single use
            transactions are not.
        sql (str):
            Required. The query request to generate partitions for. The
            request will fail if the query is not root partitionable.
            The query plan of a root partitionable query has a single
            distributed union operator. A distributed union operator
            conceptually divides one or more tables into multiple
            splits, remotely evaluates a subquery independently on each
            split, and then unions all results.

            This must not contain DML commands, such as INSERT, UPDATE,
            or DELETE. Use
            [ExecuteStreamingSql][google.spanner.v1.Spanner.ExecuteStreamingSql]
            with a PartitionedDml transaction for large,
            partition-friendly DML operations.
        params (google.protobuf.struct_pb2.Struct):
            Parameter names and values that bind to placeholders in the
            SQL string.

            A parameter placeholder consists of the ``@`` character
            followed by the parameter name (for example,
            ``@firstName``). Parameter names can contain letters,
            numbers, and underscores.

            Parameters can appear anywhere that a literal value is
            expected. The same parameter name can be used more than
            once, for example:

            ``"WHERE id > @msg_id AND id < @msg_id + 100"``

            It is an error to execute a SQL statement with unbound
            parameters.
        param_types (Mapping[str, google.cloud.spanner_v1.types.Type]):
            It is not always possible for Cloud Spanner to infer the
            right SQL type from a JSON value. For example, values of
            type ``BYTES`` and values of type ``STRING`` both appear in
            [params][google.spanner.v1.PartitionQueryRequest.params] as
            JSON strings.

            In these cases, ``param_types`` can be used to specify the
            exact SQL type for some or all of the SQL query parameters.
            See the definition of [Type][google.spanner.v1.Type] for
            more information about SQL types.
        partition_options (google.cloud.spanner_v1.types.PartitionOptions):
            Additional options that affect how many
            partitions are created.
    """

    session = proto.Field(
        proto.STRING,
        number=1,
    )
    transaction = proto.Field(
        proto.MESSAGE,
        number=2,
        message=gs_transaction.TransactionSelector,
    )
    sql = proto.Field(
        proto.STRING,
        number=3,
    )
    params = proto.Field(
        proto.MESSAGE,
        number=4,
        message=struct_pb2.Struct,
    )
    param_types = proto.MapField(
        proto.STRING,
        proto.MESSAGE,
        number=5,
        message=gs_type.Type,
    )
    partition_options = proto.Field(
        proto.MESSAGE,
        number=6,
        message="PartitionOptions",
    )


class PartitionReadRequest(proto.Message):
    r"""The request for
    [PartitionRead][google.spanner.v1.Spanner.PartitionRead]

    Attributes:
        session (str):
            Required. The session used to create the
            partitions.
        transaction (google.cloud.spanner_v1.types.TransactionSelector):
            Read only snapshot transactions are
            supported, read/write and single use
            transactions are not.
        table (str):
            Required. The name of the table in the
            database to be read.
        index (str):
            If non-empty, the name of an index on
            [table][google.spanner.v1.PartitionReadRequest.table]. This
            index is used instead of the table primary key when
            interpreting
            [key_set][google.spanner.v1.PartitionReadRequest.key_set]
            and sorting result rows. See
            [key_set][google.spanner.v1.PartitionReadRequest.key_set]
            for further information.
        columns (Sequence[str]):
            The columns of
            [table][google.spanner.v1.PartitionReadRequest.table] to be
            returned for each row matching this request.
        key_set (google.cloud.spanner_v1.types.KeySet):
            Required. ``key_set`` identifies the rows to be yielded.
            ``key_set`` names the primary keys of the rows in
            [table][google.spanner.v1.PartitionReadRequest.table] to be
            yielded, unless
            [index][google.spanner.v1.PartitionReadRequest.index] is
            present. If
            [index][google.spanner.v1.PartitionReadRequest.index] is
            present, then
            [key_set][google.spanner.v1.PartitionReadRequest.key_set]
            instead names index keys in
            [index][google.spanner.v1.PartitionReadRequest.index].

            It is not an error for the ``key_set`` to name rows that do
            not exist in the database. Read yields nothing for
            nonexistent rows.
        partition_options (google.cloud.spanner_v1.types.PartitionOptions):
            Additional options that affect how many
            partitions are created.
    """

    session = proto.Field(
        proto.STRING,
        number=1,
    )
    transaction = proto.Field(
        proto.MESSAGE,
        number=2,
        message=gs_transaction.TransactionSelector,
    )
    table = proto.Field(
        proto.STRING,
        number=3,
    )
    index = proto.Field(
        proto.STRING,
        number=4,
    )
    columns = proto.RepeatedField(
        proto.STRING,
        number=5,
    )
    key_set = proto.Field(
        proto.MESSAGE,
        number=6,
        message=keys.KeySet,
    )
    partition_options = proto.Field(
        proto.MESSAGE,
        number=9,
        message="PartitionOptions",
    )


class Partition(proto.Message):
    r"""Information returned for each partition returned in a
    PartitionResponse.

    Attributes:
        partition_token (bytes):
            This token can be passed to Read,
            StreamingRead, ExecuteSql, or
            ExecuteStreamingSql requests to restrict the
            results to those identified by this partition
            token.
    """

    partition_token = proto.Field(
        proto.BYTES,
        number=1,
    )


class PartitionResponse(proto.Message):
    r"""The response for
    [PartitionQuery][google.spanner.v1.Spanner.PartitionQuery] or
    [PartitionRead][google.spanner.v1.Spanner.PartitionRead]

    Attributes:
        partitions (Sequence[google.cloud.spanner_v1.types.Partition]):
            Partitions created by this request.
        transaction (google.cloud.spanner_v1.types.Transaction):
            Transaction created by this request.
    """

    partitions = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="Partition",
    )
    transaction = proto.Field(
        proto.MESSAGE,
        number=2,
        message=gs_transaction.Transaction,
    )


class ReadRequest(proto.Message):
    r"""The request for [Read][google.spanner.v1.Spanner.Read] and
    [StreamingRead][google.spanner.v1.Spanner.StreamingRead].

    Attributes:
        session (str):
            Required. The session in which the read
            should be performed.
        transaction (google.cloud.spanner_v1.types.TransactionSelector):
            The transaction to use. If none is provided,
            the default is a temporary read-only transaction
            with strong concurrency.
        table (str):
            Required. The name of the table in the
            database to be read.
        index (str):
            If non-empty, the name of an index on
            [table][google.spanner.v1.ReadRequest.table]. This index is
            used instead of the table primary key when interpreting
            [key_set][google.spanner.v1.ReadRequest.key_set] and sorting
            result rows. See
            [key_set][google.spanner.v1.ReadRequest.key_set] for further
            information.
        columns (Sequence[str]):
            Required. The columns of
            [table][google.spanner.v1.ReadRequest.table] to be returned
            for each row matching this request.
        key_set (google.cloud.spanner_v1.types.KeySet):
            Required. ``key_set`` identifies the rows to be yielded.
            ``key_set`` names the primary keys of the rows in
            [table][google.spanner.v1.ReadRequest.table] to be yielded,
            unless [index][google.spanner.v1.ReadRequest.index] is
            present. If [index][google.spanner.v1.ReadRequest.index] is
            present, then
            [key_set][google.spanner.v1.ReadRequest.key_set] instead
            names index keys in
            [index][google.spanner.v1.ReadRequest.index].

            If the
            [partition_token][google.spanner.v1.ReadRequest.partition_token]
            field is empty, rows are yielded in table primary key order
            (if [index][google.spanner.v1.ReadRequest.index] is empty)
            or index key order (if
            [index][google.spanner.v1.ReadRequest.index] is non-empty).
            If the
            [partition_token][google.spanner.v1.ReadRequest.partition_token]
            field is not empty, rows will be yielded in an unspecified
            order.

            It is not an error for the ``key_set`` to name rows that do
            not exist in the database. Read yields nothing for
            nonexistent rows.
        limit (int):
            If greater than zero, only the first ``limit`` rows are
            yielded. If ``limit`` is zero, the default is no limit. A
            limit cannot be specified if ``partition_token`` is set.
        resume_token (bytes):
            If this request is resuming a previously interrupted read,
            ``resume_token`` should be copied from the last
            [PartialResultSet][google.spanner.v1.PartialResultSet]
            yielded before the interruption. Doing this enables the new
            read to resume where the last read left off. The rest of the
            request parameters must exactly match the request that
            yielded this token.
        partition_token (bytes):
            If present, results will be restricted to the specified
            partition previously created using PartitionRead(). There
            must be an exact match for the values of fields common to
            this message and the PartitionReadRequest message used to
            create this partition_token.
        request_options (google.cloud.spanner_v1.types.RequestOptions):
            Common options for this request.
    """

    session = proto.Field(
        proto.STRING,
        number=1,
    )
    transaction = proto.Field(
        proto.MESSAGE,
        number=2,
        message=gs_transaction.TransactionSelector,
    )
    table = proto.Field(
        proto.STRING,
        number=3,
    )
    index = proto.Field(
        proto.STRING,
        number=4,
    )
    columns = proto.RepeatedField(
        proto.STRING,
        number=5,
    )
    key_set = proto.Field(
        proto.MESSAGE,
        number=6,
        message=keys.KeySet,
    )
    limit = proto.Field(
        proto.INT64,
        number=8,
    )
    resume_token = proto.Field(
        proto.BYTES,
        number=9,
    )
    partition_token = proto.Field(
        proto.BYTES,
        number=10,
    )
    request_options = proto.Field(
        proto.MESSAGE,
        number=11,
        message="RequestOptions",
    )


class BeginTransactionRequest(proto.Message):
    r"""The request for
    [BeginTransaction][google.spanner.v1.Spanner.BeginTransaction].

    Attributes:
        session (str):
            Required. The session in which the
            transaction runs.
        options (google.cloud.spanner_v1.types.TransactionOptions):
            Required. Options for the new transaction.
        request_options (google.cloud.spanner_v1.types.RequestOptions):
            Common options for this request. Priority is ignored for
            this request. Setting the priority in this request_options
            struct will not do anything. To set the priority for a
            transaction, set it on the reads and writes that are part of
            this transaction instead.
    """

    session = proto.Field(
        proto.STRING,
        number=1,
    )
    options = proto.Field(
        proto.MESSAGE,
        number=2,
        message=gs_transaction.TransactionOptions,
    )
    request_options = proto.Field(
        proto.MESSAGE,
        number=3,
        message="RequestOptions",
    )


class CommitRequest(proto.Message):
    r"""The request for [Commit][google.spanner.v1.Spanner.Commit].

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        session (str):
            Required. The session in which the
            transaction to be committed is running.
        transaction_id (bytes):
            Commit a previously-started transaction.

            This field is a member of `oneof`_ ``transaction``.
        single_use_transaction (google.cloud.spanner_v1.types.TransactionOptions):
            Execute mutations in a temporary transaction. Note that
            unlike commit of a previously-started transaction, commit
            with a temporary transaction is non-idempotent. That is, if
            the ``CommitRequest`` is sent to Cloud Spanner more than
            once (for instance, due to retries in the application, or in
            the transport library), it is possible that the mutations
            are executed more than once. If this is undesirable, use
            [BeginTransaction][google.spanner.v1.Spanner.BeginTransaction]
            and [Commit][google.spanner.v1.Spanner.Commit] instead.

            This field is a member of `oneof`_ ``transaction``.
        mutations (Sequence[google.cloud.spanner_v1.types.Mutation]):
            The mutations to be executed when this
            transaction commits. All mutations are applied
            atomically, in the order they appear in this
            list.
        return_commit_stats (bool):
            If ``true``, then statistics related to the transaction will
            be included in the
            [CommitResponse][google.spanner.v1.CommitResponse.commit_stats].
            Default value is ``false``.
        request_options (google.cloud.spanner_v1.types.RequestOptions):
            Common options for this request.
    """

    session = proto.Field(
        proto.STRING,
        number=1,
    )
    transaction_id = proto.Field(
        proto.BYTES,
        number=2,
        oneof="transaction",
    )
    single_use_transaction = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="transaction",
        message=gs_transaction.TransactionOptions,
    )
    mutations = proto.RepeatedField(
        proto.MESSAGE,
        number=4,
        message=mutation.Mutation,
    )
    return_commit_stats = proto.Field(
        proto.BOOL,
        number=5,
    )
    request_options = proto.Field(
        proto.MESSAGE,
        number=6,
        message="RequestOptions",
    )


class RollbackRequest(proto.Message):
    r"""The request for [Rollback][google.spanner.v1.Spanner.Rollback].

    Attributes:
        session (str):
            Required. The session in which the
            transaction to roll back is running.
        transaction_id (bytes):
            Required. The transaction to roll back.
    """

    session = proto.Field(
        proto.STRING,
        number=1,
    )
    transaction_id = proto.Field(
        proto.BYTES,
        number=2,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
