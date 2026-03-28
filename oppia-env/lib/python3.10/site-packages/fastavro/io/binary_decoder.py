from struct import unpack


class BinaryDecoder:
    """Decoder for the avro binary format.

    NOTE: All attributes and methods on this class should be considered
    private.

    Parameters
    ----------
    fo: file-like
        Input stream

    """

    def __init__(self, fo):
        self.fo = fo

    def read_null(self):
        """null is written as zero bytes."""
        return None

    def read_boolean(self):
        """A boolean is written as a single byte whose value is either 0
        (false) or 1 (true).
        """

        # technically 0x01 == true and 0x00 == false, but many languages will
        # cast anything other than 0 to True and only 0 to False
        return unpack("B", self.fo.read(1))[0] != 0

    def read_long(self):
        """int and long values are written using variable-length, zig-zag
        coding."""
        c = self.fo.read(1)

        # We do EOF checking only here, since most reader start here
        if not c:
            raise EOFError

        b = ord(c)
        n = b & 0x7F
        shift = 7

        while (b & 0x80) != 0:
            b = ord(self.fo.read(1))
            n |= (b & 0x7F) << shift
            shift += 7

        return (n >> 1) ^ -(n & 1)

    read_int = read_long

    def read_float(self):
        """A float is written as 4 bytes.

        The float is converted into a 32-bit integer using a method equivalent
        to Java's floatToIntBits and then encoded in little-endian format.
        """
        return unpack("<f", self.fo.read(4))[0]

    def read_double(self):
        """A double is written as 8 bytes.

        The double is converted into a 64-bit integer using a method equivalent
        to Java's doubleToLongBits and then encoded in little-endian format.
        """
        return unpack("<d", self.fo.read(8))[0]

    def read_bytes(self):
        """Bytes are encoded as a long followed by that many bytes of data."""
        size = self.read_long()
        out = self.fo.read(size)
        if len(out) != size:
            raise EOFError(f"Expected {size} bytes, read {len(out)}")
        return out

    def read_utf8(self, handle_unicode_errors="strict"):
        """A string is encoded as a long followed by that many bytes of UTF-8
        encoded character data.
        """
        return self.read_bytes().decode(errors=handle_unicode_errors)

    def read_fixed(self, size):
        """Fixed instances are encoded using the number of bytes declared in the
        schema."""
        out = self.fo.read(size)
        if len(out) < size:
            raise EOFError(f"Expected {size} bytes, read {len(out)}")
        return out

    def read_enum(self):
        """An enum is encoded by a int, representing the zero-based position of the
        symbol in the schema.
        """
        return self.read_long()

    def read_array_start(self):
        """Arrays are encoded as a series of blocks."""
        self._block_count = self.read_long()

    def read_array_end(self):
        pass

    def _iter_array_or_map(self):
        """Each block consists of a long count value, followed by that many
        array items. A block with count zero indicates the end of the array.
        Each item is encoded per the array's item schema.

        If a block's count is negative, then the count is followed immediately
        by a long block size, indicating the number of bytes in the block.
        The actual count in this case is the absolute value of the count
        written.
        """
        while self._block_count != 0:
            if self._block_count < 0:
                self._block_count = -self._block_count
                # Read block size, unused
                self.read_long()

            for i in range(self._block_count):
                yield
            self._block_count = self.read_long()

    iter_array = _iter_array_or_map
    iter_map = _iter_array_or_map

    def read_map_start(self):
        """Maps are encoded as a series of blocks."""
        self._block_count = self.read_long()

    def read_map_end(self):
        pass

    def read_index(self):
        """A union is encoded by first writing a long value indicating the
        zero-based position within the union of the schema of its value.

        The value is then encoded per the indicated schema within the union.
        """
        return self.read_long()
