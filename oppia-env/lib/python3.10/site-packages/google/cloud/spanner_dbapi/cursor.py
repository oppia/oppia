# Copyright 2020 Google LLC All rights reserved.
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

"""Database cursor for Google Cloud Spanner DB API."""

from collections import namedtuple

import sqlparse

from google.api_core.exceptions import Aborted
from google.api_core.exceptions import AlreadyExists
from google.api_core.exceptions import FailedPrecondition
from google.api_core.exceptions import InternalServerError
from google.api_core.exceptions import InvalidArgument
from google.api_core.exceptions import OutOfRange

from google.cloud import spanner_v1 as spanner
from google.cloud.spanner_dbapi.checksum import ResultsChecksum
from google.cloud.spanner_dbapi.exceptions import IntegrityError
from google.cloud.spanner_dbapi.exceptions import InterfaceError
from google.cloud.spanner_dbapi.exceptions import OperationalError
from google.cloud.spanner_dbapi.exceptions import ProgrammingError

from google.cloud.spanner_dbapi import _helpers
from google.cloud.spanner_dbapi._helpers import ColumnInfo
from google.cloud.spanner_dbapi._helpers import CODE_TO_DISPLAY_SIZE

from google.cloud.spanner_dbapi import parse_utils
from google.cloud.spanner_dbapi.parse_utils import get_param_types
from google.cloud.spanner_dbapi.parse_utils import sql_pyformat_args_to_spanner
from google.cloud.spanner_dbapi.utils import PeekIterator
from google.cloud.spanner_dbapi.utils import StreamedManyResultSets

from google.rpc.code_pb2 import ABORTED, OK

_UNSET_COUNT = -1

ColumnDetails = namedtuple("column_details", ["null_ok", "spanner_type"])
Statement = namedtuple("Statement", "sql, params, param_types, checksum")


def check_not_closed(function):
    """`Cursor` class methods decorator.

    Raise an exception if the cursor is closed, or not bound to a
    connection, or the parent connection is closed.

    :raises: :class:`InterfaceError` if this cursor is closed.
    :raises: :class:`ProgrammingError` if this cursor is not bound to a connection.
    """

    def wrapper(cursor, *args, **kwargs):
        if not cursor.connection:
            raise ProgrammingError("Cursor is not connected to the database")

        if cursor.is_closed:
            raise InterfaceError("Cursor and/or connection is already closed.")

        return function(cursor, *args, **kwargs)

    return wrapper


class Cursor(object):
    """Database cursor to manage the context of a fetch operation.

    :type connection: :class:`~google.cloud.spanner_dbapi.connection.Connection`
    :param connection: A DB-API connection to Google Cloud Spanner.
    """

    def __init__(self, connection):
        self._itr = None
        self._result_set = None
        self._row_count = _UNSET_COUNT
        self.lastrowid = None
        self.connection = connection
        self._is_closed = False
        # the currently running SQL statement results checksum
        self._checksum = None
        # the number of rows to fetch at a time with fetchmany()
        self.arraysize = 1

    @property
    def is_closed(self):
        """The cursor close indicator.

        :rtype: bool
        :returns: True if the cursor or the parent connection is closed,
                  otherwise False.
        """
        return self._is_closed or self.connection.is_closed

    @property
    def description(self):
        """
        Read-only attribute containing the result columns description
        of a form:

        -   ``name``
        -   ``type_code``
        -   ``display_size``
        -   ``internal_size``
        -   ``precision``
        -   ``scale``
        -   ``null_ok``

        :rtype: tuple
        :returns: The result columns' description.
        """
        if not getattr(self._result_set, "metadata", None):
            return

        columns = []
        for field in self._result_set.metadata.row_type.fields:
            columns.append(
                ColumnInfo(
                    name=field.name,
                    type_code=field.type_.code,
                    # Size of the SQL type of the column.
                    display_size=CODE_TO_DISPLAY_SIZE.get(field.type_.code),
                    # Client perceived size of the column.
                    internal_size=field._pb.ByteSize(),
                )
            )
        return tuple(columns)

    @property
    def rowcount(self):
        """The number of rows updated by the last INSERT, UPDATE, DELETE request's `execute()` call.
        For SELECT requests the rowcount returns -1.

        :rtype: int
        :returns: The number of rows updated by the last INSERT, UPDATE, DELETE request's .execute*() call.
        """

        if self._row_count != _UNSET_COUNT or self._result_set is None:
            return self._row_count

        stats = getattr(self._result_set, "stats", None)
        if stats is not None and "row_count_exact" in stats:
            return stats.row_count_exact

        return _UNSET_COUNT

    @check_not_closed
    def callproc(self, procname, args=None):
        """A no-op, raising an error if the cursor or connection is closed."""
        pass

    @check_not_closed
    def nextset(self):
        """A no-op, raising an error if the cursor or connection is closed."""
        pass

    @check_not_closed
    def setinputsizes(self, sizes):
        """A no-op, raising an error if the cursor or connection is closed."""
        pass

    @check_not_closed
    def setoutputsize(self, size, column=None):
        """A no-op, raising an error if the cursor or connection is closed."""
        pass

    def close(self):
        """Closes this cursor."""
        self._is_closed = True

    def _do_execute_update(self, transaction, sql, params):
        self._result_set = transaction.execute_sql(
            sql, params=params, param_types=get_param_types(params)
        )
        self._itr = PeekIterator(self._result_set)
        self._row_count = _UNSET_COUNT

    def _do_batch_update(self, transaction, statements, many_result_set):
        status, res = transaction.batch_update(statements)
        many_result_set.add_iter(res)

        if status.code == ABORTED:
            raise Aborted(status.message)
        elif status.code != OK:
            raise OperationalError(status.message)

        self._row_count = sum([max(val, 0) for val in res])

    def _batch_DDLs(self, sql):
        """
        Check that the given operation contains only DDL
        statements and batch them into an internal list.

        :type sql: str
        :param sql: A SQL query statement.

        :raises: :class:`ValueError` in case not a DDL statement
                 present in the operation.
        """
        statements = []
        for ddl in sqlparse.split(sql):
            if ddl:
                ddl = ddl.rstrip(";")
                if parse_utils.classify_stmt(ddl) != parse_utils.STMT_DDL:
                    raise ValueError("Only DDL statements may be batched.")

                statements.append(ddl)

        # Only queue DDL statements if they are all correctly classified.
        self.connection._ddl_statements.extend(statements)

    @check_not_closed
    def execute(self, sql, args=None):
        """Prepares and executes a Spanner database operation.

        :type sql: str
        :param sql: A SQL query statement.

        :type args: list
        :param args: Additional parameters to supplement the SQL query.
        """
        self._itr = None
        self._result_set = None
        self._row_count = _UNSET_COUNT

        try:
            if self.connection.read_only:
                self._handle_DQL(sql, args or None)
                return

            class_ = parse_utils.classify_stmt(sql)
            if class_ == parse_utils.STMT_DDL:
                self._batch_DDLs(sql)
                if self.connection.autocommit:
                    self.connection.run_prior_DDL_statements()
                return

            # For every other operation, we've got to ensure that
            # any prior DDL statements were run.
            # self._run_prior_DDL_statements()
            self.connection.run_prior_DDL_statements()

            if class_ == parse_utils.STMT_UPDATING:
                sql = parse_utils.ensure_where_clause(sql)

            sql, args = sql_pyformat_args_to_spanner(sql, args or None)

            if not self.connection.autocommit:
                statement = Statement(
                    sql,
                    args,
                    get_param_types(args or None),
                    ResultsChecksum(),
                )

                (
                    self._result_set,
                    self._checksum,
                ) = self.connection.run_statement(statement)
                while True:
                    try:
                        self._itr = PeekIterator(self._result_set)
                        break
                    except Aborted:
                        self.connection.retry_transaction()
                return

            if class_ == parse_utils.STMT_NON_UPDATING:
                self._handle_DQL(sql, args or None)
            else:
                self.connection.database.run_in_transaction(
                    self._do_execute_update,
                    sql,
                    args or None,
                )
        except (AlreadyExists, FailedPrecondition, OutOfRange) as e:
            raise IntegrityError(getattr(e, "details", e)) from e
        except InvalidArgument as e:
            raise ProgrammingError(getattr(e, "details", e)) from e
        except InternalServerError as e:
            raise OperationalError(getattr(e, "details", e)) from e

    @check_not_closed
    def executemany(self, operation, seq_of_params):
        """Execute the given SQL with every parameters set
        from the given sequence of parameters.

        :type operation: str
        :param operation: SQL code to execute.

        :type seq_of_params: list
        :param seq_of_params: Sequence of additional parameters to run
                              the query with.
        """
        self._itr = None
        self._result_set = None
        self._row_count = _UNSET_COUNT

        class_ = parse_utils.classify_stmt(operation)
        if class_ == parse_utils.STMT_DDL:
            raise ProgrammingError(
                "Executing DDL statements with executemany() method is not allowed."
            )

        many_result_set = StreamedManyResultSets()

        if class_ in (parse_utils.STMT_INSERT, parse_utils.STMT_UPDATING):
            statements = []

            for params in seq_of_params:
                sql, params = parse_utils.sql_pyformat_args_to_spanner(
                    operation, params
                )
                statements.append((sql, params, get_param_types(params)))

            if self.connection.autocommit:
                self.connection.database.run_in_transaction(
                    self._do_batch_update, statements, many_result_set
                )
            else:
                retried = False
                total_row_count = 0
                while True:
                    try:
                        transaction = self.connection.transaction_checkout()

                        res_checksum = ResultsChecksum()
                        if not retried:
                            self.connection._statements.append(
                                (statements, res_checksum)
                            )

                        status, res = transaction.batch_update(statements)
                        many_result_set.add_iter(res)
                        res_checksum.consume_result(res)
                        res_checksum.consume_result(status.code)
                        total_row_count += sum([max(val, 0) for val in res])

                        if status.code == ABORTED:
                            self.connection._transaction = None
                            raise Aborted(status.message)
                        elif status.code != OK:
                            raise OperationalError(status.message)
                        self._row_count = total_row_count
                        break
                    except Aborted:
                        self.connection.retry_transaction()
                        retried = True

        else:
            for params in seq_of_params:
                self.execute(operation, params)
                many_result_set.add_iter(self._itr)

        self._result_set = many_result_set
        self._itr = many_result_set

    @check_not_closed
    def fetchone(self):
        """Fetch the next row of a query result set, returning a single
        sequence, or None when no more data is available."""
        try:
            res = next(self)
            if not self.connection.autocommit and not self.connection.read_only:
                self._checksum.consume_result(res)
            return res
        except StopIteration:
            return
        except Aborted:
            if not self.connection.read_only:
                self.connection.retry_transaction()
                return self.fetchone()

    @check_not_closed
    def fetchall(self):
        """Fetch all (remaining) rows of a query result, returning them as
        a sequence of sequences.
        """
        res = []
        try:
            for row in self:
                if not self.connection.autocommit and not self.connection.read_only:
                    self._checksum.consume_result(row)
                res.append(row)
        except Aborted:
            if not self.connection.read_only:
                self.connection.retry_transaction()
                return self.fetchall()

        return res

    @check_not_closed
    def fetchmany(self, size=None):
        """Fetch the next set of rows of a query result, returning a sequence
        of sequences. An empty sequence is returned when no more rows are available.

        :type size: int
        :param size: (Optional) The maximum number of results to fetch.

        :raises InterfaceError:
            if the previous call to .execute*() did not produce any result set
            or if no call was issued yet.
        """
        if size is None:
            size = self.arraysize

        items = []
        for _ in range(size):
            try:
                res = next(self)
                if not self.connection.autocommit and not self.connection.read_only:
                    self._checksum.consume_result(res)
                items.append(res)
            except StopIteration:
                break
            except Aborted:
                if not self.connection.read_only:
                    self.connection.retry_transaction()
                    return self.fetchmany(size)

        return items

    def _handle_DQL_with_snapshot(self, snapshot, sql, params):
        self._result_set = snapshot.execute_sql(
            sql,
            params,
            get_param_types(params),
            request_options=self.connection.request_options,
        )
        # Read the first element so that the StreamedResultSet can
        # return the metadata after a DQL statement.
        self._itr = PeekIterator(self._result_set)
        # Unfortunately, Spanner doesn't seem to send back
        # information about the number of rows available.
        self._row_count = _UNSET_COUNT

    def _handle_DQL(self, sql, params):
        sql, params = parse_utils.sql_pyformat_args_to_spanner(sql, params)
        if self.connection.read_only and not self.connection.autocommit:
            # initiate or use the existing multi-use snapshot
            self._handle_DQL_with_snapshot(
                self.connection.snapshot_checkout(), sql, params
            )
        else:
            # execute with single-use snapshot
            with self.connection.database.snapshot(
                **self.connection.staleness
            ) as snapshot:
                self._handle_DQL_with_snapshot(snapshot, sql, params)

    def __enter__(self):
        return self

    def __exit__(self, etype, value, traceback):
        self.close()

    def __next__(self):
        if self._itr is None:
            raise ProgrammingError("no results to return")
        return next(self._itr)

    def __iter__(self):
        if self._itr is None:
            raise ProgrammingError("no results to return")
        return self._itr

    def list_tables(self):
        """List the tables of the linked Database.

        :rtype: list
        :returns: The list of tables within the Database.
        """
        return self.run_sql_in_snapshot(_helpers.SQL_LIST_TABLES)

    def run_sql_in_snapshot(self, sql, params=None, param_types=None):
        # Some SQL e.g. for INFORMATION_SCHEMA cannot be run in read-write transactions
        # hence this method exists to circumvent that limit.
        self.connection.run_prior_DDL_statements()

        with self.connection.database.snapshot() as snapshot:
            return list(snapshot.execute_sql(sql, params, param_types))

    def get_table_column_schema(self, table_name):
        rows = self.run_sql_in_snapshot(
            sql=_helpers.SQL_GET_TABLE_COLUMN_SCHEMA,
            params={"table_name": table_name},
            param_types={"table_name": spanner.param_types.STRING},
        )

        column_details = {}
        for column_name, is_nullable, spanner_type in rows:
            column_details[column_name] = ColumnDetails(
                null_ok=is_nullable == "YES", spanner_type=spanner_type
            )
        return column_details
