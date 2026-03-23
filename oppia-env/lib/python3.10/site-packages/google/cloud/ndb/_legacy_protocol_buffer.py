# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


import array
import struct


# Python 3 doesn't have "long" anymore
long = int


class ProtocolBufferDecodeError(Exception):
    pass


class ProtocolMessage:
    def MergePartialFromString(self, s):
        a = array.array("B")
        a.frombytes(s)
        d = Decoder(a, 0, len(a))
        self.TryMerge(d)


class Decoder:
    NUMERIC = 0
    DOUBLE = 1
    STRING = 2
    STARTGROUP = 3
    ENDGROUP = 4
    FLOAT = 5
    MAX_TYPE = 6

    def __init__(self, buf, idx, limit):
        self.buf = buf
        self.idx = idx
        self.limit = limit
        return

    def avail(self):
        return self.limit - self.idx

    def buffer(self):
        return self.buf

    def pos(self):
        return self.idx

    def skip(self, n):
        if self.idx + n > self.limit:
            raise ProtocolBufferDecodeError("truncated")
        self.idx += n
        return

    def skipData(self, tag):
        t = tag & 7
        if t == self.NUMERIC:
            self.getVarInt64()
        elif t == self.DOUBLE:
            self.skip(8)
        elif t == self.STRING:
            n = self.getVarInt32()
            self.skip(n)
        elif t == self.STARTGROUP:
            while 1:
                t = self.getVarInt32()
                if (t & 7) == self.ENDGROUP:
                    break
                else:
                    self.skipData(t)
            if (t - self.ENDGROUP) != (tag - self.STARTGROUP):
                raise ProtocolBufferDecodeError("corrupted")
        elif t == self.ENDGROUP:
            raise ProtocolBufferDecodeError("corrupted")
        elif t == self.FLOAT:
            self.skip(4)
        else:
            raise ProtocolBufferDecodeError("corrupted")

    def get8(self):
        if self.idx >= self.limit:
            raise ProtocolBufferDecodeError("truncated")
        c = self.buf[self.idx]
        self.idx += 1
        return c

    def get16(self):
        if self.idx + 2 > self.limit:
            raise ProtocolBufferDecodeError("truncated")
        c = self.buf[self.idx]
        d = self.buf[self.idx + 1]
        self.idx += 2
        return (d << 8) | c

    def get32(self):
        if self.idx + 4 > self.limit:
            raise ProtocolBufferDecodeError("truncated")
        c = self.buf[self.idx]
        d = self.buf[self.idx + 1]
        e = self.buf[self.idx + 2]
        f = long(self.buf[self.idx + 3])
        self.idx += 4
        return (f << 24) | (e << 16) | (d << 8) | c

    def get64(self):
        if self.idx + 8 > self.limit:
            raise ProtocolBufferDecodeError("truncated")
        c = self.buf[self.idx]
        d = self.buf[self.idx + 1]
        e = self.buf[self.idx + 2]
        f = long(self.buf[self.idx + 3])
        g = long(self.buf[self.idx + 4])
        h = long(self.buf[self.idx + 5])
        i = long(self.buf[self.idx + 6])
        j = long(self.buf[self.idx + 7])
        self.idx += 8
        return (
            (j << 56)
            | (i << 48)
            | (h << 40)
            | (g << 32)
            | (f << 24)
            | (e << 16)
            | (d << 8)
            | c
        )

    def getVarInt32(self):

        b = self.get8()
        if not (b & 128):
            return b

        result = long(0)
        shift = 0

        while 1:
            result |= long(b & 127) << shift
            shift += 7
            if not (b & 128):
                break
            if shift >= 64:
                raise ProtocolBufferDecodeError("corrupted")
            b = self.get8()

        if result >= 0x8000000000000000:
            result -= 0x10000000000000000

        if result >= 0x80000000 or result < -0x80000000:
            raise ProtocolBufferDecodeError("corrupted")
        return result

    def getVarInt64(self):
        result = self.getVarUint64()
        if result >= (1 << 63):
            result -= 1 << 64
        return result

    def getVarUint64(self):
        result = long(0)
        shift = 0
        while 1:
            if shift >= 64:
                raise ProtocolBufferDecodeError("corrupted")
            b = self.get8()
            result |= long(b & 127) << shift
            shift += 7
            if not (b & 128):
                return result

    def getDouble(self):
        if self.idx + 8 > self.limit:
            raise ProtocolBufferDecodeError("truncated")
        a = self.buf[self.idx : self.idx + 8]  # noqa: E203
        self.idx += 8
        return struct.unpack("<d", a)[0]

    def getBoolean(self):
        b = self.get8()
        if b != 0 and b != 1:
            raise ProtocolBufferDecodeError("corrupted")
        return b

    def getPrefixedString(self):
        length = self.getVarInt32()
        if self.idx + length > self.limit:
            raise ProtocolBufferDecodeError("truncated")
        r = self.buf[self.idx : self.idx + length]  # noqa: E203
        self.idx += length
        return r.tobytes()


__all__ = [
    "ProtocolMessage",
    "Decoder",
    "ProtocolBufferDecodeError",
]
