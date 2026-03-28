"""The jsonpickle.tags module provides the custom tags
used for pickling and unpickling Python objects.

These tags are keys into the flattened dictionaries
created by the Pickler class.  The Unpickler uses
these custom key names to identify dictionaries
that need to be specially handled.
"""

BYTES = 'py/bytes'
B64 = 'py/b64'
B85 = 'py/b85'
FUNCTION = 'py/function'
ID = 'py/id'
INITARGS = 'py/initargs'
ITERATOR = 'py/iterator'
JSON_KEY = 'json://'
MODULE = 'py/mod'
NEWARGS = 'py/newargs'
NEWARGSEX = 'py/newargsex'
NEWOBJ = 'py/newobj'
OBJECT = 'py/object'
PROPERTY = 'py/property'
REDUCE = 'py/reduce'
REF = 'py/ref'
REPR = 'py/repr'
SEQ = 'py/seq'
SET = 'py/set'
STATE = 'py/state'
TUPLE = 'py/tuple'
TYPE = 'py/type'

# All reserved tag names
RESERVED = {
    BYTES,
    FUNCTION,
    ID,
    INITARGS,
    ITERATOR,
    MODULE,
    NEWARGS,
    NEWARGSEX,
    NEWOBJ,
    OBJECT,
    PROPERTY,
    REDUCE,
    REF,
    REPR,
    SEQ,
    SET,
    STATE,
    TUPLE,
    TYPE,
}
