import struct
from typing import List


# reference: https://docs.python.org/3/library/struct.html#struct.pack
def vector_float_to_bytes(v: List[float]):
    # pack len(v) number of float
    return struct.pack(f"{len(v)}f", *v)
