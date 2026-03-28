from .symbols import (
    Root,
    Terminal,
    Boolean,
    Sequence,
    Repeater,
    Action,
    RecordStart,
    RecordEnd,
    FieldStart,
    FieldEnd,
    Int,
    Null,
    String,
    Alternative,
    Union,
    Long,
    Float,
    Double,
    Bytes,
    MapEnd,
    MapStart,
    MapKeyMarker,
    Enum,
    EnumLabels,
    Fixed,
    ArrayStart,
    ArrayEnd,
    ItemEnd,
    NO_DEFAULT,
)
from ..schema import extract_record_type


class Parser:
    def __init__(self, schema, named_schemas, action_function):
        self.schema = schema
        self._processed_records = []
        self.named_schemas = named_schemas
        self.action_function = action_function
        self.stack = self.parse()

    def parse(self):
        symbol = self._parse(self.schema)
        root = Root([symbol])
        root.production.insert(0, root)
        return [root, symbol]

    def _process_record(self, schema, default, schema_name=None):
        production = []

        production.append(RecordStart(default=default))
        for field in schema["fields"]:
            field_name = field["name"]
            production.insert(0, FieldStart(field_name))

            if schema_name is not None and schema_name in field["type"]:
                # this meanns a recursive relationship, so we force a `null`
                internal_record = Sequence(
                    Alternative([Null()], ["null"], default=None), Union()
                )
            else:
                internal_record = self._parse(
                    field["type"], field.get("default", NO_DEFAULT)
                )

            production.insert(0, internal_record)
            production.insert(0, FieldEnd())
        production.insert(0, RecordEnd())

        return production

    def _parse(self, schema, default=NO_DEFAULT):
        record_type = extract_record_type(schema)

        if record_type == "record":
            production = []
            schema_name = schema["name"]

            if schema_name not in self._processed_records:
                self._processed_records.append(schema_name)
                production = self._process_record(schema, default)
            else:
                production = self._process_record(
                    schema, default, schema_name=schema_name
                )

            seq = Sequence(*production)
            return seq

        elif record_type == "union":
            symbols = []
            labels = []
            for candidate_schema in schema:
                symbols.append(self._parse(candidate_schema))
                if isinstance(candidate_schema, dict):
                    labels.append(
                        candidate_schema.get("name", candidate_schema.get("type"))
                    )
                else:
                    labels.append(candidate_schema)

            return Sequence(Alternative(symbols, labels, default=default), Union())

        elif record_type == "map":
            repeat = Repeater(
                MapEnd(),
                # ItemEnd(),  # TODO: Maybe need this?
                self._parse(schema["values"]),
                MapKeyMarker(),
                String(),
            )
            return Sequence(repeat, MapStart(default=default))

        elif record_type == "array":
            repeat = Repeater(
                ArrayEnd(),
                ItemEnd(),
                self._parse(schema["items"]),
            )
            return Sequence(repeat, ArrayStart(default=default))

        elif record_type == "enum":
            return Sequence(EnumLabels(schema["symbols"]), Enum(default=default))

        elif record_type == "null":
            return Null()
        elif record_type == "boolean":
            return Boolean(default=default)
        elif record_type == "string":
            return String(default=default)
        elif record_type == "bytes":
            return Bytes(default=default)
        elif record_type == "int":
            return Int(default=default)
        elif record_type == "long":
            return Long(default=default)
        elif record_type == "float":
            return Float(default=default)
        elif record_type == "double":
            return Double(default=default)
        elif record_type == "fixed":
            return Fixed(default=default)
        elif record_type in self.named_schemas:
            return self._parse(self.named_schemas[record_type])
        else:
            raise Exception(f"Unhandled type: {record_type}")

    def advance(self, symbol):
        while True:
            top = self.stack.pop()

            if top == symbol:
                return top
            elif isinstance(top, Action):
                self.action_function(top)
            elif isinstance(top, Terminal):
                raise Exception(f"Internal Parser Exception: {top}")
            elif isinstance(top, Repeater) and top.end == symbol:
                return symbol
            else:
                self.stack.extend(top.production)

    def drain_actions(self):
        while True:
            top = self.stack.pop()

            if isinstance(top, Root):
                self.push_symbol(top)
                break
            elif isinstance(top, Action):
                self.action_function(top)
            elif not isinstance(top, Terminal):
                self.stack.extend(top.production)
            else:
                raise Exception(f"Internal Parser Exception: {top}")

    def pop_symbol(self):
        return self.stack.pop()

    def push_symbol(self, symbol):
        self.stack.append(symbol)

    def flush(self):
        while len(self.stack) > 0:
            top = self.stack.pop()

            if isinstance(top, Action) or isinstance(top, Root):
                self.action_function(top)
            else:
                raise Exception(f"Internal Parser Exception: {top}")
