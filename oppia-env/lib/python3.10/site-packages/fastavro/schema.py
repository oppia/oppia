try:
    from . import _schema
except ImportError:
    from . import _schema_py as _schema  # type: ignore

from ._schema_common import UnknownType, SchemaParseException

# Private API
schema_name = _schema.schema_name  # type: ignore
extract_record_type = _schema.extract_record_type  # type: ignore
extract_logical_type = _schema.extract_logical_type  # type: ignore
is_single_record_union = _schema.is_single_record_union  # type: ignore
is_single_name_union = _schema.is_single_name_union  # type: ignore

# Public API
load_schema = _schema.load_schema
parse_schema = _schema.parse_schema
fullname = _schema.fullname
expand_schema = _schema.expand_schema
load_schema_ordered = _schema.load_schema_ordered
to_parsing_canonical_form = _schema.to_parsing_canonical_form
FINGERPRINT_ALGORITHMS = _schema.FINGERPRINT_ALGORITHMS
fingerprint = _schema.fingerprint

__all__ = [
    "UnknownType",
    "load_schema",
    "SchemaParseException",
    "parse_schema",
    "fullname",
    "expand_schema",
    "load_schema_ordered",
    "to_parsing_canonical_form",
    "FINGERPRINT_ALGORITHMS",
    "fingerprint",
]
