import json
from typing import IO, List, Tuple, Any

from .parser import Parser
from .symbols import (
    Root,
    Boolean,
    Int,
    RecordStart,
    RecordEnd,
    FieldStart,
    FieldEnd,
    Null,
    String,
    Union,
    UnionEnd,
    Long,
    Float,
    Double,
    Bytes,
    MapStart,
    MapEnd,
    MapKeyMarker,
    Enum,
    Fixed,
    ArrayStart,
    ArrayEnd,
    ItemEnd,
)


class AvroJSONEncoder:
    """Encoder for the avro JSON format.

    NOTE: All attributes and methods on this class should be considered
    private.

    Parameters
    ----------
    fo
        Input stream
    write_union_type
        Determine whether to write the union type in the json message.

    """

    def __init__(self, fo: IO, *, write_union_type: bool = True):
        self._fo = fo
        self._stack: List[Tuple[Any, str]] = []
        self._current = None
        self._key = None
        self._records: List[Any] = []
        self._write_union_type = write_union_type

    def write_value(self, value):
        if isinstance(self._current, dict):
            if self._key:
                self._current[self._key] = value
            else:
                raise Exception("No key was set")
        elif isinstance(self._current, list):
            self._current.append(value)
        else:
            # If we aren't in a dict or a list then this must be a schema which
            # just has a single basic type
            self._records.append(value)

    def _push(self):
        self._stack.append((self._current, self._key))

    def _pop(self):
        prev_current, prev_key = self._stack.pop()
        if isinstance(prev_current, dict):
            prev_current[prev_key] = self._current
            self._current = prev_current
        elif isinstance(prev_current, list):
            prev_current.append(self._current)
            self._current = prev_current
        else:
            assert prev_current is None
            assert prev_key is None
            # Back at None, we should have a full record in self._current
            self._records.append(self._current)
            self._current = prev_current
            self._key = prev_key

    def write_buffer(self):
        # Newline separated
        json_data = "\n".join([json.dumps(record) for record in self._records])
        self._fo.write(json_data)

    def configure(self, schema, named_schemas):
        self._parser = Parser(schema, named_schemas, self.do_action)

    def flush(self):
        self._parser.flush()

    def do_action(self, action):
        if isinstance(action, RecordStart):
            self.write_object_start()
        elif isinstance(action, RecordEnd) or isinstance(action, UnionEnd):
            self.write_object_end()
        elif isinstance(action, FieldStart):
            self.write_object_key(action.field_name)
        elif isinstance(action, FieldEnd):
            # TODO: Do we need a FieldEnd symbol?
            pass
        elif isinstance(action, Root):
            self.write_buffer()
        else:
            raise Exception(f"Internal Exception: {action}")

    def write_null(self):
        self._parser.advance(Null())
        self.write_value(None)

    def write_boolean(self, value):
        self._parser.advance(Boolean())
        self.write_value(value)

    def write_utf8(self, value):
        self._parser.advance(String())
        if self._parser.stack[-1] == MapKeyMarker():
            self._parser.advance(MapKeyMarker())
            self.write_object_key(value)
        else:
            self.write_value(value)

    def write_int(self, value):
        self._parser.advance(Int())
        self.write_value(value)

    def write_long(self, value):
        self._parser.advance(Long())
        self.write_value(value)

    def write_float(self, value):
        self._parser.advance(Float())
        self.write_value(value)

    def write_double(self, value):
        self._parser.advance(Double())
        self.write_value(value)

    def write_bytes(self, value):
        self._parser.advance(Bytes())
        self.write_value(value.decode("iso-8859-1"))

    def write_enum(self, index):
        self._parser.advance(Enum())
        enum_labels = self._parser.pop_symbol()
        # TODO: Check symbols?
        self.write_value(enum_labels.labels[index])

    def write_fixed(self, value):
        self._parser.advance(Fixed())
        self.write_value(value.decode("iso-8859-1"))

    def write_array_start(self):
        self._parser.advance(ArrayStart())
        self._push()
        self._current = []

    def write_item_count(self, length):
        pass

    def end_item(self):
        self._parser.advance(ItemEnd())

    def write_array_end(self):
        self._parser.advance(ArrayEnd())
        self._pop()

    def write_object_start(self):
        self._push()
        self._current = {}

    def write_object_key(self, key):
        self._key = key

    def write_object_end(self):
        self._pop()

    def write_map_start(self):
        self._parser.advance(MapStart())
        self.write_object_start()

    def write_map_end(self):
        self._parser.advance(MapEnd())
        self.write_object_end()

    def write_index(self, index, schema):
        self._parser.advance(Union())
        alternative_symbol = self._parser.pop_symbol()

        symbol = alternative_symbol.get_symbol(index)

        if symbol != Null() and self._write_union_type:
            self.write_object_start()
            self.write_object_key(alternative_symbol.get_label(index))
            # TODO: Do we need this symbol?
            self._parser.push_symbol(UnionEnd())

        self._parser.push_symbol(symbol)
