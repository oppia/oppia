import datetime
import re
import time

from google.cloud.ndb import context as context_module
from google.cloud.ndb import exceptions
from google.cloud.ndb import query as query_module
from google.cloud.ndb import key
from google.cloud.ndb import model
from google.cloud.ndb import _datastore_query


class GQL(object):
    """A GQL parser for NDB queries.

    GQL is a SQL-like language which supports more object-like semantics
    in a language that is familiar to SQL users.

    - reserved words are case insensitive
    - names are case sensitive

    The syntax for SELECT is fairly straightforward:

    SELECT [[DISTINCT] <property> [, <property> ...] | * | __key__ ]
        [FROM <entity>]
        [WHERE <condition> [AND <condition> ...]]
        [ORDER BY <property> [ASC | DESC] [, <property> [ASC | DESC] ...]]
        [LIMIT [<offset>,]<count>]
        [OFFSET <offset>]
        [HINT (ORDER_FIRST | FILTER_FIRST | ANCESTOR_FIRST)]
        [;]
    <condition> := <property> {< | <= | > | >= | = | != | IN | NOT IN} <value>
    <condition> := <property> {< | <= | > | >= | = | != | IN | NOT IN} CAST(<value>)
    <condition> := <property> {IN | NOT IN} (<value>, ...)
    <condition> := ANCESTOR IS <entity or key>

    The class is implemented using some basic regular expression tokenization
    to pull out reserved tokens and then the recursive descent parser will act
    as a builder for the pre-compiled query. This pre-compiled query is then
    used by google.cloud.ndb.query.gql to build an NDB Query object.
    """

    TOKENIZE_REGEX = re.compile(
        r"""
        (?:'[^'\n\r]*')+|
        <=|>=|!=|=|<|>|
        :\w+|
        ,|
        \*|
        -?\d+(?:\.\d+)?|
        \w+(?:\.\w+)*|
        (?:"[^"\s]+")+|
        \(|\)|
        \S+
        """,
        re.VERBOSE | re.IGNORECASE,
    )

    RESERVED_KEYWORDS = frozenset(
        (
            "SELECT",
            "DISTINCT",
            "FROM",
            "WHERE",
            "IN",
            "IS",
            "AND",
            "OR",
            "NOT",
            "ORDER",
            "BY",
            "ASC",
            "DESC",
            "GROUP",
            "LIMIT",
            "OFFSET",
            "HINT",
            "ORDER_FIRST",
            "FILTER_FIRST",
            "ANCESTOR_FIRST",
        )
    )

    _ANCESTOR = -1

    _kind = None
    _keys_only = False
    _projection = None
    _distinct = False
    _has_ancestor = False
    _offset = -1
    _limit = -1
    _hint = ""

    def __init__(self, query_string, _app=None, _auth_domain=None, namespace=None):
        """Parses the input query into the class as a pre-compiled query.

        Args:
            query_string (str): properly formatted GQL query string.
            namespace (str): The namespace to use for this query. Defaults to the client's value.
        Raises:
            exceptions.BadQueryError: if the query is not parsable.
        """
        self._app = _app

        self._namespace = namespace

        self._auth_domain = _auth_domain

        self._symbols = self.TOKENIZE_REGEX.findall(query_string)
        self._InitializeParseState()
        try:
            self._Select()
        except exceptions.BadQueryError as error:
            raise error

    def _InitializeParseState(self):

        self._kind = None
        self._keys_only = False
        self._projection = None
        self._distinct = False
        self._has_ancestor = False
        self._offset = -1
        self._limit = -1
        self._hint = ""

        self._filters = {}

        self._orderings = []
        self._next_symbol = 0

    def filters(self):
        """Return the compiled list of filters."""
        return self._filters

    def hint(self):
        """Return the datastore hint.

        This is not used in NDB, but added for backwards compatibility.
        """
        return self._hint

    def limit(self):
        """Return numerical result count limit."""
        return self._limit

    def offset(self):
        """Return numerical result offset."""
        if self._offset == -1:
            return 0
        else:
            return self._offset

    def orderings(self):
        """Return the result ordering list."""
        return self._orderings

    def is_keys_only(self):
        """Returns True if this query returns Keys, False if it returns
        Entities."""
        return self._keys_only

    def projection(self):
        """Returns the tuple of properties in the projection, or None."""
        return self._projection

    def is_distinct(self):
        """Returns True if this query is marked as distinct."""
        return self._distinct

    def kind(self):
        """Returns the kind for this query."""
        return self._kind

    @property
    def _entity(self):
        """Deprecated. Old way to refer to `kind`."""
        return self._kind

    _result_type_regex = re.compile(r"(\*|__key__)")
    _quoted_string_regex = re.compile(r"((?:\'[^\'\n\r]*\')+)")
    _ordinal_regex = re.compile(r":(\d+)$")
    _named_regex = re.compile(r":(\w+)$")
    _identifier_regex = re.compile(r"(\w+(?:\.\w+)*)$")

    _quoted_identifier_regex = re.compile(r'((?:"[^"\s]+")+)$')
    _conditions_regex = re.compile(r"(<=|>=|!=|=|<|>|is|in|not)$", re.IGNORECASE)
    _number_regex = re.compile(r"(\d+)$")
    _cast_regex = re.compile(r"(geopt|user|key|date|time|datetime)$", re.IGNORECASE)

    def _Error(self, error_message):
        """Generic query error.

        Args:
            error_message (str): message for the 'Parse Error' string.

        Raises:
            BadQueryError and passes on an error message from the caller. Will
                raise BadQueryError on all calls to _Error()
        """
        if self._next_symbol >= len(self._symbols):
            raise exceptions.BadQueryError(
                "Parse Error: %s at end of string" % error_message
            )
        else:
            raise exceptions.BadQueryError(
                "Parse Error: %s at symbol %s"
                % (error_message, self._symbols[self._next_symbol])
            )

    def _Accept(self, symbol_string):
        """Advance the symbol and return true if the next symbol matches input."""
        if self._next_symbol < len(self._symbols):
            if self._symbols[self._next_symbol].upper() == symbol_string:
                self._next_symbol += 1
                return True
        return False

    def _Expect(self, symbol_string):
        """Require that the next symbol matches symbol_string, or emit an error.

        Args:
            symbol_string (str): next symbol expected by the caller

        Raises:
            BadQueryError if the next symbol doesn't match the parameter passed
                in.
        """
        if not self._Accept(symbol_string):
            self._Error("Unexpected Symbol: %s" % symbol_string)

    def _AcceptRegex(self, regex):
        """Advance and return the symbol if the next symbol matches the regex.

        Args:
            regex: the compiled regular expression to attempt acceptance on.

        Returns:
            The first group in the expression to allow for convenient access
                to simple matches. Requires () around some objects in the
                regex. None if no match is found.
        """
        if self._next_symbol < len(self._symbols):
            match_symbol = self._symbols[self._next_symbol]
            match = regex.match(match_symbol)
            if match:
                self._next_symbol += 1
                matched_string = match.groups() and match.group(1) or None

                return matched_string

        return None

    def _AcceptTerminal(self):
        """Accept either a single semi-colon or an empty string.

        Returns:
            True

        Raises:
            BadQueryError if there are unconsumed symbols in the query.
        """

        self._Accept(";")

        if self._next_symbol < len(self._symbols):
            self._Error("Expected no additional symbols")
        return True

    def _Select(self):
        """Consume the SELECT clause and everything that follows it.

        Assumes SELECT * to start. Transitions to a FROM clause.

        Returns:
            True if parsing completed okay.
        """
        self._Expect("SELECT")
        if self._Accept("DISTINCT"):
            self._distinct = True
        if not self._Accept("*"):
            props = [self._ExpectIdentifier()]
            while self._Accept(","):
                props.append(self._ExpectIdentifier())
            if props == ["__key__"]:
                self._keys_only = True
            else:
                self._projection = tuple(props)
        return self._From()

    def _From(self):
        """Consume the FROM clause.

        Assumes a single well formed entity in the clause.
        Assumes FROM <Entity Name>. Transitions to a WHERE clause.

        Returns:
            True: if parsing completed okay.
        """
        if self._Accept("FROM"):
            self._kind = self._ExpectIdentifier()
        return self._Where()

    def _Where(self):
        """Consume the WHERE clause.

        These can have some recursion because of the AND symbol.

        Returns:
            True: if parsing the WHERE clause completed correctly, as well as
                all subsequent clauses.
        """
        if self._Accept("WHERE"):
            return self._FilterList()
        return self._OrderBy()

    def _FilterList(self):
        """Consume the filter list (remainder of the WHERE clause)."""
        identifier = self._Identifier()
        if not identifier:
            self._Error("Invalid WHERE Identifier")

        condition = self._AcceptRegex(self._conditions_regex)
        if not condition:
            self._Error("Invalid WHERE Condition")
        if condition.lower() == "not":
            condition += "_" + self._AcceptRegex(self._conditions_regex)

        self._CheckFilterSyntax(identifier, condition)

        if not self._AddSimpleFilter(identifier, condition, self._Reference()):

            if not self._AddSimpleFilter(identifier, condition, self._Literal()):

                type_cast = self._TypeCast()
                if not type_cast or not self._AddProcessedParameterFilter(
                    identifier, condition, *type_cast
                ):
                    self._Error("Invalid WHERE Condition")

        if self._Accept("AND"):
            return self._FilterList()

        return self._OrderBy()

    def _GetValueList(self):
        """Read in a list of parameters from the tokens and return the list.

        Reads in a set of tokens by consuming symbols. Only accepts literals,
        positional parameters, or named parameters.

        Returns:
            list: Values parsed from the input.
        """
        params = []

        while True:
            reference = self._Reference()
            if reference:
                params.append(reference)
            else:
                literal = self._Literal()
                params.append(literal)

            if not self._Accept(","):
                break

        return params

    def _CheckFilterSyntax(self, identifier, raw_condition):
        """Check that filter conditions are valid and throw errors if not.

        Args:
            identifier (str): identifier being used in comparison.
            condition (str): comparison operator used in the filter.
        """
        condition = raw_condition.lower()
        if identifier.lower() == "ancestor":
            if condition == "is":

                if self._has_ancestor:
                    self._Error('Only one ANCESTOR IS" clause allowed')
            else:
                self._Error('"IS" expected to follow "ANCESTOR"')
        elif condition == "is":
            self._Error('"IS" can only be used when comparing against "ANCESTOR"')
        elif condition.startswith("not") and condition != "not_in":
            self._Error('"NOT " can only be used as "NOT IN"')

    def _AddProcessedParameterFilter(self, identifier, condition, operator, parameters):
        """Add a filter with post-processing required.

        Args:
            identifier (str): property being compared.
            condition (str): comparison operation being used with the property
                (e.g. !=).
            operator (str): operation to perform on the parameters before
                adding the filter.
            parameters (list): list of bound parameters passed to 'operator'
                before creating the filter. When using the parameters as a
                pass-through, pass 'nop' into the operator field and the first
                value will be used unprocessed).

        Returns:
            True: if the filter was okay to add.
        """
        if parameters[0] is None:
            return False

        filter_rule = (identifier, condition)
        if identifier.lower() == "ancestor":
            self._has_ancestor = True
            filter_rule = (self._ANCESTOR, "is")
            assert condition.lower() == "is"

        if operator == "list" and condition.lower() not in ["in", "not_in"]:
            self._Error("Only IN can process a list of values, given '%s'" % condition)

        self._filters.setdefault(filter_rule, []).append((operator, parameters))
        return True

    def _AddSimpleFilter(self, identifier, condition, parameter):
        """Add a filter to the query being built (no post-processing on parameter).

        Args:
            identifier (str): identifier being used in comparison.
            condition (str): comparison operator used in the filter.
            parameter (Union[str, int, Literal]: ID of the reference being made
                or a value of type Literal

        Returns:
            bool: True if the filter could be added. False otherwise.
        """
        return self._AddProcessedParameterFilter(
            identifier, condition, "nop", [parameter]
        )

    def _Identifier(self):
        """Consume an identifier and return it.

        Returns:
            str: The identifier string. If quoted, the surrounding quotes are
                stripped.
        """
        identifier = self._AcceptRegex(self._identifier_regex)
        if identifier:
            if identifier.upper() in self.RESERVED_KEYWORDS:
                self._next_symbol -= 1
                self._Error("Identifier is a reserved keyword")
        else:
            identifier = self._AcceptRegex(self._quoted_identifier_regex)
            if identifier:
                identifier = identifier[1:-1].replace('""', '"')
        return identifier

    def _ExpectIdentifier(self):
        id = self._Identifier()
        if not id:
            self._Error("Identifier Expected")
        return id

    def _Reference(self):
        """Consume a parameter reference and return it.

        Consumes a reference to a positional parameter (:1) or a named
            parameter (:email). Only consumes a single reference (not lists).

        Returns:
            Union[str, int]: The name of the reference (integer for positional
                parameters or string for named parameters) to a bind-time
                parameter.
        """
        reference = self._AcceptRegex(self._ordinal_regex)
        if reference:
            return int(reference)
        else:
            reference = self._AcceptRegex(self._named_regex)
            if reference:
                return reference

        return None

    def _Literal(self):
        """Parse literals from our token list.

        Returns:
            Literal: The parsed literal from the input string (currently either
                a string, integer, floating point value, boolean or None).
        """

        literal = None

        if self._next_symbol < len(self._symbols):
            try:
                literal = int(self._symbols[self._next_symbol])
            except ValueError:
                pass
            else:
                self._next_symbol += 1

            if literal is None:
                try:
                    literal = float(self._symbols[self._next_symbol])
                except ValueError:
                    pass
                else:
                    self._next_symbol += 1

        if literal is None:

            literal = self._AcceptRegex(self._quoted_string_regex)
            if literal:
                literal = literal[1:-1].replace("''", "'")

        if literal is None:

            if self._Accept("TRUE"):
                literal = True
            elif self._Accept("FALSE"):
                literal = False

        if literal is not None:
            return Literal(literal)

        if self._Accept("NULL"):
            return Literal(None)
        else:
            return None

    def _TypeCast(self, can_cast_list=True):
        """Check if the next operation is a type-cast and return the cast if so.

        Casting operators look like simple function calls on their parameters.
        This code returns the cast operator found and the list of parameters
        provided by the user to complete the cast operation.

        Args:
            can_cast_list: Boolean to determine if list can be returned as one
                of the cast operators. Default value is True.

        Returns:
            tuple: (cast operator, params) which represents the cast operation
                requested and the parameters parsed from the cast clause.
                Returns :data:None if there is no TypeCast function or list is
                not allowed to be cast.
        """
        cast_op = self._AcceptRegex(self._cast_regex)
        if not cast_op:
            if can_cast_list and self._Accept("("):

                cast_op = "list"
            else:
                return None
        else:
            cast_op = cast_op.lower()
            self._Expect("(")

        params = self._GetValueList()
        self._Expect(")")

        return (cast_op, params)

    def _OrderBy(self):
        """Consume the ORDER BY clause."""
        if self._Accept("ORDER"):
            self._Expect("BY")
            return self._OrderList()
        return self._Limit()

    def _OrderList(self):
        """Consume variables and sort order for ORDER BY clause."""
        identifier = self._Identifier()
        if identifier:
            if self._Accept("DESC"):
                self._orderings.append((identifier, _datastore_query.DOWN))
            elif self._Accept("ASC"):
                self._orderings.append((identifier, _datastore_query.UP))
            else:
                self._orderings.append((identifier, _datastore_query.UP))
        else:
            self._Error("Invalid ORDER BY Property")

        if self._Accept(","):
            return self._OrderList()
        return self._Limit()

    def _Limit(self):
        """Consume the LIMIT clause."""
        if self._Accept("LIMIT"):

            maybe_limit = self._AcceptRegex(self._number_regex)

            if maybe_limit:

                if self._Accept(","):
                    self._offset = int(maybe_limit)
                    maybe_limit = self._AcceptRegex(self._number_regex)

                self._limit = int(maybe_limit)
                if self._limit < 1:
                    self._Error("Bad Limit in LIMIT Value")
            else:
                self._Error("Non-number limit in LIMIT clause")

        return self._Offset()

    def _Offset(self):
        """Consume the OFFSET clause."""
        if self._Accept("OFFSET"):
            if self._offset != -1:
                self._Error("Offset already defined in LIMIT clause")
            offset = self._AcceptRegex(self._number_regex)
            if offset:
                self._offset = int(offset)
            else:
                self._Error("Non-number offset in OFFSET clause")
        return self._Hint()

    def _Hint(self):
        """Consume the HINT clause.

        Requires one of three options (mirroring the rest of the datastore):

        - HINT ORDER_FIRST
        - HINT ANCESTOR_FIRST
        - HINT FILTER_FIRST

        Returns:
            bool: True if the hint clause and later clauses all parsed
                correctly.
        """
        if self._Accept("HINT"):
            if self._Accept("ORDER_FIRST"):
                self._hint = "ORDER_FIRST"
            elif self._Accept("FILTER_FIRST"):
                self._hint = "FILTER_FIRST"
            elif self._Accept("ANCESTOR_FIRST"):
                self._hint = "ANCESTOR_FIRST"
            else:
                self._Error("Unknown HINT")
        return self._AcceptTerminal()

    def _args_to_val(self, func, args):
        """Helper for GQL parsing to extract values from GQL expressions.

        This can extract the value from a GQL literal, return a Parameter
        for a GQL bound parameter (:1 or :foo), and interprets casts like
        KEY(...) and plain lists of values like (1, 2, 3).

        Args:
            func (str): A string indicating what kind of thing this is.
            args list[Union[int, str, Literal]]: One or more GQL values, each
                integer, string, or GQL literal.
        """
        vals = []
        for arg in args:
            if isinstance(arg, (str, int)):
                val = query_module.Parameter(arg)
            else:
                val = arg.Get()
            vals.append(val)
        if func == "nop":
            return vals[0]  # May be a Parameter
        pfunc = query_module.ParameterizedFunction(func, vals)
        if pfunc.is_parameterized():
            return pfunc
        return pfunc.resolve({}, {})

    def query_filters(self, model_class, filters):
        """Get the filters in a format compatible with the Query constructor"""
        gql_filters = self.filters()
        for name_op in sorted(gql_filters):
            name, op = name_op
            values = gql_filters[name_op]
            op = op.lower()
            for (func, args) in values:
                prop = model_class._properties.get(name)
                val = self._args_to_val(func, args)
                if isinstance(val, query_module.ParameterizedThing):
                    node = query_module.ParameterNode(prop, op, val)
                elif op == "in":
                    node = prop._IN(val)
                elif op == "not_in":
                    node = prop._NOT_IN(val)
                else:
                    node = prop._comparison(op, val)
                filters.append(node)
        if filters:
            filters = query_module.ConjunctionNode(*filters)
        else:
            filters = None
        return filters

    def get_query(self):
        """Create and return a Query instance.

        Returns:
            google.cloud.ndb.query.Query: A new query with values extracted
                from the processed GQL query string.
        """
        kind = self.kind()
        if kind is None:
            model_class = model.Model
        else:
            model_class = model.Model._lookup_model(kind)
            kind = model_class._get_kind()
        ancestor = None
        model_filters = list(model_class._default_filters())
        filters = self.query_filters(model_class, model_filters)
        default_options = None
        offset = self.offset()
        limit = self.limit()
        if limit < 0:
            limit = None
        keys_only = self.is_keys_only()
        if not keys_only:
            keys_only = None
        projection = self.projection()
        project = self._app
        namespace = self._namespace
        if self.is_distinct():
            distinct_on = projection
        else:
            distinct_on = None
        order_by = []
        for order in self.orderings():
            order_str, direction = order
            if direction == 2:
                order_str = "-{}".format(order_str)
            order_by.append(order_str)
        return query_module.Query(
            kind=kind,
            ancestor=ancestor,
            filters=filters,
            order_by=order_by,
            project=project,
            namespace=namespace,
            default_options=default_options,
            projection=projection,
            distinct_on=distinct_on,
            limit=limit,
            offset=offset,
            keys_only=keys_only,
        )


class Literal(object):
    """Class for representing literal values differently than unbound params.
    This is a simple wrapper class around basic types and datastore types.
    """

    def __init__(self, value):
        self._value = value

    def Get(self):
        """Return the value of the literal."""
        return self._value

    def __eq__(self, other):
        """A literal is equal to another if their values are the same"""
        if not isinstance(other, Literal):
            return NotImplemented
        return self.Get() == other.Get()

    def __repr__(self):
        return "Literal(%s)" % repr(self._value)


def _raise_not_implemented(func):
    def raise_inner(value):
        raise NotImplementedError("GQL function {} is not implemented".format(func))

    return raise_inner


def _raise_cast_error(message):
    raise exceptions.BadQueryError("GQL function error: {}".format(message))


def _time_function(values):
    if len(values) == 1:
        value = values[0]
        if isinstance(value, str):
            try:
                time_tuple = time.strptime(value, "%H:%M:%S")
            except ValueError as error:
                _raise_cast_error(
                    "Error during time conversion, {}, {}".format(error, values)
                )
            time_tuple = time_tuple[3:]
            time_tuple = time_tuple[0:3]
        elif isinstance(value, int):
            time_tuple = (value,)
        else:
            _raise_cast_error("Invalid argument for time(), {}".format(value))
    elif len(values) < 4:
        time_tuple = tuple(values)
    else:
        _raise_cast_error("Too many arguments for time(), {}".format(values))
    try:
        return datetime.time(*time_tuple)
    except ValueError as error:
        _raise_cast_error("Error during time conversion, {}, {}".format(error, values))


def _date_function(values):
    if len(values) == 1:
        value = values[0]
        if isinstance(value, str):
            try:
                time_tuple = time.strptime(value, "%Y-%m-%d")[0:6]
            except ValueError as error:
                _raise_cast_error(
                    "Error during date conversion, {}, {}".format(error, values)
                )
        else:
            _raise_cast_error("Invalid argument for date(), {}".format(value))
    elif len(values) == 3:
        time_tuple = (values[0], values[1], values[2], 0, 0, 0)
    else:
        _raise_cast_error("Too many arguments for date(), {}".format(values))
    try:
        return datetime.datetime(*time_tuple)
    except ValueError as error:
        _raise_cast_error("Error during date conversion, {}, {}".format(error, values))


def _datetime_function(values):
    if len(values) == 1:
        value = values[0]
        if isinstance(value, str):
            try:
                time_tuple = time.strptime(value, "%Y-%m-%d %H:%M:%S")[0:6]
            except ValueError as error:
                _raise_cast_error(
                    "Error during date conversion, {}, {}".format(error, values)
                )
        else:
            _raise_cast_error("Invalid argument for datetime(), {}".format(value))
    else:
        time_tuple = values
    try:
        return datetime.datetime(*time_tuple)
    except ValueError as error:
        _raise_cast_error(
            "Error during datetime conversion, {}, {}".format(error, values)
        )


def _geopt_function(values):
    if len(values) != 2:
        _raise_cast_error("GeoPt requires two input values, {}".format(values))
    return model.GeoPt(*values)


def _key_function(values):
    if not len(values) % 2:
        context = context_module.get_context()
        client = context.client
        return key.Key(
            *values,
            project=client.project,
            database=client.database,
            namespace=context.get_namespace(),
        )
    _raise_cast_error(
        "Key requires even number of operands or single string, {}".format(values)
    )


FUNCTIONS = {
    "list": list,
    "date": _date_function,
    "datetime": _datetime_function,
    "time": _time_function,
    # even though gql for ndb supports querying for users, datastore does
    # not, because it doesn't support passing entity representations as
    # comparison arguments. Thus, we can't implement this.
    "user": _raise_not_implemented("user"),
    "key": _key_function,
    "geopt": _geopt_function,
    "nop": _raise_not_implemented("nop"),
}
