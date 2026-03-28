import decimal
from typing import Union, List, Dict

AvroMessage = Union[
    None,  # 'null' Avro type
    str,  # 'string' and 'enum'
    float,  # 'float' and 'double'
    int,  # 'int' and 'long'
    decimal.Decimal,  # 'fixed'
    bool,  # 'boolean'
    bytes,  # 'bytes'
    List,  # 'array'
    Dict,  # 'map' and 'record'
]
DictSchema = Dict
Schema = Union[str, List, DictSchema]
NamedSchemas = Dict[str, Dict]
