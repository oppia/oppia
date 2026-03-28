VERSION = 1
MAGIC = b"Obj" + chr(VERSION).encode()
SYNC_SIZE = 16
HEADER_SCHEMA = {
    "type": "record",
    "name": "org.apache.avro.file.Header",
    "fields": [
        {
            "name": "magic",
            "type": {"type": "fixed", "name": "magic", "size": len(MAGIC)},
        },
        {"name": "meta", "type": {"type": "map", "values": "bytes"}},
        {"name": "sync", "type": {"type": "fixed", "name": "sync", "size": SYNC_SIZE}},
    ],
}


class SchemaResolutionError(Exception):
    pass


def missing_codec_lib(codec, *libraries):
    def missing(fo):
        raise ValueError(
            f"{codec} codec is supported but you need to install one of the "
            + f"following libraries: {libraries}"
        )

    return missing
