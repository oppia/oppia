import json
from typing import IO, Any, Tuple, List

from .parser import Parser
from .symbols import (
    RecordStart,
    FieldStart,
    Boolean,
    Int,
    Null,
    String,
    Long,
    Float,
    Double,
    Bytes,
    FieldEnd,
    RecordEnd,
    Union,
    UnionEnd,
    MapStart,
    MapEnd,
    MapKeyMarker,
    Fixed,
    ArrayStart,
    ArrayEnd,
    Enum,
    ItemEnd,
)


class AvroJSONDecoder:
    """Decoder for the avro JSON format.

    NOTE: All attributes and methods on this class should be considered
    private.

    Parameters
    ----------
    fo
        File-like object to reader from

    """

    def __init__(self, fo: IO):
        self._fo = fo
        self._stack: List[Tuple[Any, str]] = []
        self._json_data = [json.loads(line.strip()) for line in fo]
        if self._json_data:
            self._current = self._json_data.pop(0)
            self.done = False
        else:
            self.done = True
        self._key = None

    def read_value(self, symbol):
        if isinstance(self._current, dict):
            if self._key not in self._current:
                # Use the default value
                return symbol.get_default()
            else:
                return self._current[self._key]
        else:
            # If we aren't in a dict or a list then this must be a schema which
            # just has a single basic type
            return self._current

    def _push(self):
        self._stack.append((self._current, self._key))

    def _push_and_adjust(self, symbol=None):
        self._push()
        if isinstance(self._current, dict) and self._key is not None:
            if self._key not in self._current:
                self._current = symbol.get_default()
            else:
                # self._current = self._current.pop(self._key)
                self._current = self._current[self._key]

    def _pop(self):
        self._current, self._key = self._stack.pop()

    def configure(self, schema, named_schemas):
        self._parser = Parser(schema, named_schemas, self.do_action)

    def do_action(self, action):
        if isinstance(action, RecordStart):
            self._push_and_adjust(action)
        elif isinstance(action, RecordEnd):
            self._pop()
        elif isinstance(action, FieldStart):
            self.read_object_key(action.field_name)
        elif isinstance(action, FieldEnd) or isinstance(action, UnionEnd):
            # TODO: Do we need a FieldEnd and UnionEnd symbol?
            pass
        else:
            raise Exception(f"cannot handle: {action}")

    def drain(self):
        self._parser.drain_actions()
        if self._json_data:
            self._current = self._json_data.pop(0)
            self._key = None
        else:
            self.done = True

    def read_null(self):
        symbol = self._parser.advance(Null())
        return self.read_value(symbol)

    def read_boolean(self):
        symbol = self._parser.advance(Boolean())
        return self.read_value(symbol)

    def read_utf8(self, handle_unicode_errors="strict"):
        symbol = self._parser.advance(String())
        if self._parser.stack[-1] == MapKeyMarker():
            self._parser.advance(MapKeyMarker())
            for key in self._current:
                self._key = key
                break
            return self._key
        else:
            return self.read_value(symbol)

    def read_bytes(self):
        symbol = self._parser.advance(Bytes())
        return self.read_value(symbol).encode("iso-8859-1")

    def read_int(self):
        symbol = self._parser.advance(Int())
        return self.read_value(symbol)

    def read_long(self):
        symbol = self._parser.advance(Long())
        return self.read_value(symbol)

    def read_float(self):
        symbol = self._parser.advance(Float())
        return self.read_value(symbol)

    def read_double(self):
        symbol = self._parser.advance(Double())
        return self.read_value(symbol)

    def read_enum(self):
        symbol = self._parser.advance(Enum())
        enum_labels = self._parser.pop_symbol()  # pop the enumlabels
        # TODO: Should we verify the value is one of the symbols?
        label = self.read_value(symbol)
        return enum_labels.labels.index(label)

    def read_fixed(self, size):
        symbol = self._parser.advance(Fixed())
        return self.read_value(symbol).encode("iso-8859-1")

    def read_map_start(self):
        symbol = self._parser.advance(MapStart())
        self._push_and_adjust(symbol)

    def read_object_key(self, key):
        self._key = key

    def iter_map(self):
        while len(self._current) > 0:
            self._push()
            for key in self._current:
                break
            yield
            self._pop()
            del self._current[key]

    def read_map_end(self):
        self._parser.advance(MapEnd())
        self._pop()

    def read_array_start(self):
        symbol = self._parser.advance(ArrayStart())
        self._push_and_adjust(symbol)
        self._key = None

    def read_array_end(self):
        self._parser.advance(ArrayEnd())
        self._pop()

    def iter_array(self):
        while len(self._current) > 0:
            self._push()
            self._current = self._current.pop(0)
            yield
            self._pop()
            self._parser.advance(ItemEnd())

    def read_index(self):
        self._parser.advance(Union())
        alternative_symbol = self._parser.pop_symbol()

        # TODO: Try to clean this up.
        # A JSON union is encoded like this: {"union_field": {int: 32}} and so
        # what we are doing is trying to change that into {"union_field": 32}
        # before eventually reading the value of "union_field"
        if self._key is None:
            # If self._key is None, self._current is an item in an array
            if self._current is None:
                label = "null"
            else:
                label, data = self._current.popitem()
                self._current = data
                # TODO: Do we need to do this?
                self._parser.push_symbol(UnionEnd())
        else:
            # self._current is a JSON object and self._key should be the name
            # of the union field
            if self._key not in self._current:
                self._current[self._key] = {
                    alternative_symbol.labels[0]: alternative_symbol.get_default()
                }

            if self._current[self._key] is None:
                label = "null"
            else:
                label, data = self._current[self._key].popitem()
                self._current[self._key] = data
                # TODO: Do we need to do this?
                self._parser.push_symbol(UnionEnd())

        index = alternative_symbol.labels.index(label)
        symbol = alternative_symbol.get_symbol(index)
        self._parser.push_symbol(symbol)
        return index
