class _NoDefault:
    pass


NO_DEFAULT = _NoDefault()


class Symbol:
    def __init__(self, production=None, default=NO_DEFAULT):
        self.production = production
        self.default = default

    def get_default(self):
        if self.default == NO_DEFAULT:
            raise ValueError("no value and no default")
        else:
            return self.default

    def __eq__(self, other):
        return self.__class__ == other.__class__

    def __ne__(self, other):
        return not self.__eq__(other)


class Root(Symbol):
    pass


class Terminal(Symbol):
    pass


Null = type("Null", (Terminal,), {})
Boolean = type("Boolean", (Terminal,), {})
String = type("String", (Terminal,), {})
Bytes = type("Bytes", (Terminal,), {})
Int = type("Int", (Terminal,), {})
Long = type("Long", (Terminal,), {})
Float = type("Float", (Terminal,), {})
Double = type("Double", (Terminal,), {})
Fixed = type("Fixed", (Terminal,), {})

Union = type("Union", (Terminal,), {})

MapEnd = type("MapEnd", (Terminal,), {})
MapStart = type("MapStart", (Terminal,), {})
MapKeyMarker = type("MapKeyMarker", (Terminal,), {})
ItemEnd = type("ItemEnd", (Terminal,), {})

ArrayEnd = type("ArrayEnd", (Terminal,), {})
ArrayStart = type("ArrayStart", (Terminal,), {})

Enum = type("Enum", (Terminal,), {})


class Sequence(Symbol):
    def __init__(self, *symbols, default=NO_DEFAULT):
        super().__init__(list(symbols), default)


class Repeater(Symbol):
    """Arrays"""

    def __init__(self, end, *symbols, default=NO_DEFAULT):
        super().__init__(list(symbols), default)
        self.production.insert(0, self)
        self.end = end


class Alternative(Symbol):
    """Unions"""

    def __init__(self, symbols, labels, default=NO_DEFAULT):
        super().__init__(symbols, default)
        self.labels = labels

    def get_symbol(self, index):
        return self.production[index]

    def get_label(self, index):
        return self.labels[index]


class Action(Symbol):
    pass


class EnumLabels(Action):
    def __init__(self, labels):
        self.labels = labels


class UnionEnd(Action):
    pass


class RecordStart(Action):
    pass


class RecordEnd(Action):
    pass


class FieldStart(Action):
    def __init__(self, field_name):
        self.field_name = field_name


class FieldEnd(Action):
    pass
