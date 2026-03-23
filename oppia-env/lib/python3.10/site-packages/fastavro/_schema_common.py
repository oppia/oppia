import hashlib


PRIMITIVES = {
    "boolean",
    "bytes",
    "double",
    "float",
    "int",
    "long",
    "null",
    "string",
}

RESERVED_PROPERTIES = {
    "type",
    "name",
    "namespace",
    "fields",  # Record
    "items",  # Array
    "size",  # Fixed
    "symbols",  # Enum
    "values",  # Map
    "doc",
}

OPTIONAL_FIELD_PROPERTIES = {
    "doc",
    "aliases",
    "default",
}

RESERVED_FIELD_PROPERTIES = {"type", "name"} | OPTIONAL_FIELD_PROPERTIES

RABIN_64 = "CRC-64-AVRO"
JAVA_FINGERPRINT_MAPPING = {"SHA-256": "sha256", "MD5": "md5"}
FINGERPRINT_ALGORITHMS = (
    hashlib.algorithms_guaranteed | JAVA_FINGERPRINT_MAPPING.keys() | {RABIN_64}
)


class UnknownType(ValueError):
    def __init__(self, name):
        super().__init__(name)
        self.name = name


class SchemaParseException(Exception):
    pass


def rabin_fingerprint(data):
    empty_64 = 0xC15D213AA4D7A795

    fp_table = []
    for i in range(256):
        fp = i
        for j in range(8):
            mask = -(fp & 1)
            fp = (fp >> 1) ^ (empty_64 & mask)
        fp_table.append(fp)

    result = empty_64
    for byte in data:
        result = (result >> 8) ^ fp_table[(result ^ byte) & 0xFF]

    # Although not mentioned in the Avro specification, the Java
    # implementation gives fingerprint bytes in little-endian order
    return result.to_bytes(length=8, byteorder="little", signed=False).hex()
