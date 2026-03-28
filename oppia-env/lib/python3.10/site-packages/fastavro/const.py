import datetime

MCS_PER_SECOND = 1000000
MCS_PER_MINUTE = MCS_PER_SECOND * 60
MCS_PER_HOUR = MCS_PER_MINUTE * 60

MLS_PER_SECOND = 1000
MLS_PER_MINUTE = MLS_PER_SECOND * 60
MLS_PER_HOUR = MLS_PER_MINUTE * 60

# A date logical type annotates an Avro int, where the int stores the number
# of days from the unix epoch, 1 January 1970 (ISO calendar).
DAYS_SHIFT = datetime.date(1970, 1, 1).toordinal()

# Validation has these as common checks
INT_MIN_VALUE = -(1 << 31)
INT_MAX_VALUE = (1 << 31) - 1
LONG_MIN_VALUE = -(1 << 63)
LONG_MAX_VALUE = (1 << 63) - 1

NAMED_TYPES = {"record", "enum", "fixed", "error"}
AVRO_TYPES = {
    "boolean",
    "bytes",
    "double",
    "float",
    "int",
    "long",
    "null",
    "string",
    "fixed",
    "enum",
    "record",
    "error",
    "array",
    "map",
    "union",
    "request",
    "error_union",
}
