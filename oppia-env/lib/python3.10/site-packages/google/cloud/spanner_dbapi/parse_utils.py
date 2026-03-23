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

"SQL parsing and classification utils."

import datetime
import decimal
import re

import sqlparse
from google.cloud import spanner_v1 as spanner
from google.cloud.spanner_v1 import JsonObject

from .exceptions import Error
from .types import DateStr, TimestampStr
from .utils import sanitize_literals_for_upload

TYPES_MAP = {
    bool: spanner.param_types.BOOL,
    bytes: spanner.param_types.BYTES,
    str: spanner.param_types.STRING,
    int: spanner.param_types.INT64,
    float: spanner.param_types.FLOAT64,
    datetime.datetime: spanner.param_types.TIMESTAMP,
    datetime.date: spanner.param_types.DATE,
    DateStr: spanner.param_types.DATE,
    TimestampStr: spanner.param_types.TIMESTAMP,
    decimal.Decimal: spanner.param_types.NUMERIC,
    JsonObject: spanner.param_types.JSON,
}

SPANNER_RESERVED_KEYWORDS = {
    "ALL",
    "AND",
    "ANY",
    "ARRAY",
    "AS",
    "ASC",
    "ASSERT_ROWS_MODIFIED",
    "AT",
    "BETWEEN",
    "BY",
    "CASE",
    "CAST",
    "COLLATE",
    "CONTAINS",
    "CREATE",
    "CROSS",
    "CUBE",
    "CURRENT",
    "DEFAULT",
    "DEFINE",
    "DESC",
    "DISTINCT",
    "DROP",
    "ELSE",
    "END",
    "ENUM",
    "ESCAPE",
    "EXCEPT",
    "EXCLUDE",
    "EXISTS",
    "EXTRACT",
    "FALSE",
    "FETCH",
    "FOLLOWING",
    "FOR",
    "FROM",
    "FULL",
    "GROUP",
    "GROUPING",
    "GROUPS",
    "HASH",
    "HAVING",
    "IF",
    "IGNORE",
    "IN",
    "INNER",
    "INTERSECT",
    "INTERVAL",
    "INTO",
    "IS",
    "JOIN",
    "LATERAL",
    "LEFT",
    "LIKE",
    "LIMIT",
    "LOOKUP",
    "MERGE",
    "NATURAL",
    "NEW",
    "NO",
    "NOT",
    "NULL",
    "NULLS",
    "OF",
    "ON",
    "OR",
    "ORDER",
    "OUTER",
    "OVER",
    "PARTITION",
    "PRECEDING",
    "PROTO",
    "RANGE",
    "RECURSIVE",
    "RESPECT",
    "RIGHT",
    "ROLLUP",
    "ROWS",
    "SELECT",
    "SET",
    "SOME",
    "STRUCT",
    "TABLESAMPLE",
    "THEN",
    "TO",
    "TREAT",
    "TRUE",
    "UNBOUNDED",
    "UNION",
    "UNNEST",
    "USING",
    "WHEN",
    "WHERE",
    "WINDOW",
    "WITH",
    "WITHIN",
}

STMT_DDL = "DDL"
STMT_NON_UPDATING = "NON_UPDATING"
STMT_UPDATING = "UPDATING"
STMT_INSERT = "INSERT"

# Heuristic for identifying statements that don't need to be run as updates.
RE_NON_UPDATE = re.compile(r"^\W*(SELECT)", re.IGNORECASE)

RE_WITH = re.compile(r"^\s*(WITH)", re.IGNORECASE)

# DDL statements follow
# https://cloud.google.com/spanner/docs/data-definition-language
RE_DDL = re.compile(r"^\s*(CREATE|ALTER|DROP|GRANT|REVOKE)", re.IGNORECASE | re.DOTALL)

RE_IS_INSERT = re.compile(r"^\s*(INSERT)", re.IGNORECASE | re.DOTALL)

RE_INSERT = re.compile(
    # Only match the `INSERT INTO <table_name> (columns...)
    # otherwise the rest of the statement could be a complex
    # operation.
    r"^\s*INSERT INTO (?P<table_name>[^\s\(\)]+)\s*\((?P<columns>[^\(\)]+)\)",
    re.IGNORECASE | re.DOTALL,
)

RE_VALUES_TILL_END = re.compile(r"VALUES\s*\(.+$", re.IGNORECASE | re.DOTALL)

RE_VALUES_PYFORMAT = re.compile(
    # To match: (%s, %s,....%s)
    r"(\(\s*%s[^\(\)]+\))",
    re.DOTALL,
)

RE_PYFORMAT = re.compile(r"(%s|%\([^\(\)]+\)s)+", re.DOTALL)


def classify_stmt(query):
    """Determine SQL query type.

    :type query: str
    :param query: A SQL query.

    :rtype: str
    :returns: The query type name.
    """
    # sqlparse will strip Cloud Spanner comments,
    # still, special commenting styles, like
    # PostgreSQL dollar quoted comments are not
    # supported and will not be stripped.
    query = sqlparse.format(query, strip_comments=True).strip()

    if RE_DDL.match(query):
        return STMT_DDL

    if RE_IS_INSERT.match(query):
        return STMT_INSERT

    if RE_NON_UPDATE.match(query) or RE_WITH.match(query):
        # As of 13-March-2020, Cloud Spanner only supports WITH for DQL
        # statements and doesn't yet support WITH for DML statements.
        return STMT_NON_UPDATING

    return STMT_UPDATING


def sql_pyformat_args_to_spanner(sql, params):
    """
    Transform pyformat set SQL to named arguments for Cloud Spanner.
    It will also unescape previously escaped format specifiers
    like %%s to %s.
    For example:
        SQL:      'SELECT * from t where f1=%s, f2=%s, f3=%s'
        Params:   ('a', 23, '888***')
    becomes:
        SQL:      'SELECT * from t where f1=@a0, f2=@a1, f3=@a2'
        Params:   {'a0': 'a', 'a1': 23, 'a2': '888***'}

    OR
        SQL:      'SELECT * from t where f1=%(f1)s, f2=%(f2)s, f3=%(f3)s'
        Params:   {'f1': 'a', 'f2': 23, 'f3': '888***', 'extra': 'aye')
    becomes:
        SQL:      'SELECT * from t where f1=@a0, f2=@a1, f3=@a2'
        Params:   {'a0': 'a', 'a1': 23, 'a2': '888***'}

    :type sql: str
    :param sql: A SQL request.

    :type params: list
    :param params: A list of parameters.

    :rtype: tuple(str, dict)
    :returns: A tuple of the sanitized SQL and a dictionary of the named
              arguments.
    """
    if not params:
        return sanitize_literals_for_upload(sql), None

    found_pyformat_placeholders = RE_PYFORMAT.findall(sql)
    params_is_dict = isinstance(params, dict)

    if params_is_dict:
        if not found_pyformat_placeholders:
            return sanitize_literals_for_upload(sql), params
    else:
        n_params = len(params) if params else 0
        n_matches = len(found_pyformat_placeholders)
        if n_matches != n_params:
            raise Error(
                "pyformat_args mismatch\ngot %d args from %s\n"
                "want %d args in %s"
                % (n_matches, found_pyformat_placeholders, n_params, params)
            )

    named_args = {}
    # We've now got for example:
    # Case a) Params is a non-dict
    #   SQL:      'SELECT * from t where f1=%s, f2=%s, f3=%s'
    #   Params:   ('a', 23, '888***')
    # Case b) Params is a dict and the matches are %(value)s'
    for i, pyfmt in enumerate(found_pyformat_placeholders):
        key = "a%d" % i
        sql = sql.replace(pyfmt, "@" + key, 1)
        if params_is_dict:
            # The '%(key)s' case, so interpolate it.
            resolved_value = pyfmt % params
            named_args[key] = resolved_value
        else:
            named_args[key] = params[i]

    return sanitize_literals_for_upload(sql), named_args


def get_param_types(params):
    """Determine Cloud Spanner types for the given parameters.

    :type params: dict
    :param params: Parameters requiring to find Cloud Spanner types.

    :rtype: dict
    :returns: The types index for the given parameters.
    """
    if params is None:
        return

    param_types = {}

    for key, value in params.items():
        type_ = type(value)
        if type_ in TYPES_MAP:
            param_types[key] = TYPES_MAP[type_]

    return param_types


def ensure_where_clause(sql):
    """
    Cloud Spanner requires a WHERE clause on UPDATE and DELETE statements.
    Add a dummy WHERE clause if non detected.

    :type sql: str
    :param sql: SQL code to check.
    """
    if any(isinstance(token, sqlparse.sql.Where) for token in sqlparse.parse(sql)[0]):
        return sql

    return sql + " WHERE 1=1"


def escape_name(name):
    """
    Apply backticks to the name that either contain '-' or
    ' ', or is a Cloud Spanner's reserved keyword.

    :type name: str
    :param name: Name to escape.

    :rtype: str
    :returns: Name escaped if it has to be escaped.
    """
    if "-" in name or " " in name or name.upper() in SPANNER_RESERVED_KEYWORDS:
        return "`" + name + "`"
    return name
