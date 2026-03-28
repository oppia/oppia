import uuid
from datetime import datetime, time, date, timezone, timedelta
from decimal import Context
from .const import (
    MCS_PER_HOUR,
    MCS_PER_MINUTE,
    MCS_PER_SECOND,
    MLS_PER_HOUR,
    MLS_PER_MINUTE,
    MLS_PER_SECOND,
    DAYS_SHIFT,
)

decimal_context = Context()
epoch = datetime(1970, 1, 1, tzinfo=timezone.utc)
epoch_naive = datetime(1970, 1, 1)


def read_timestamp_millis(data, writer_schema=None, reader_schema=None):
    # Cannot use datetime.fromtimestamp: https://bugs.python.org/issue36439
    return epoch + timedelta(microseconds=data * 1000)


def read_local_timestamp_millis(
    data: int, writer_schema=None, reader_schema=None
) -> datetime:
    # Cannot use datetime.fromtimestamp: https://bugs.python.org/issue36439
    return epoch_naive + timedelta(microseconds=data * 1000)


def read_timestamp_micros(data, writer_schema=None, reader_schema=None):
    # Cannot use datetime.fromtimestamp: https://bugs.python.org/issue36439
    return epoch + timedelta(microseconds=data)


def read_local_timestamp_micros(
    data: int, writer_schema=None, reader_schema=None
) -> datetime:
    # Cannot use datetime.fromtimestamp: https://bugs.python.org/issue36439
    return epoch_naive + timedelta(microseconds=data)


def read_date(data, writer_schema=None, reader_schema=None):
    return date.fromordinal(data + DAYS_SHIFT)


def read_uuid(data, writer_schema=None, reader_schema=None):
    return uuid.UUID(data)


def read_decimal(data, writer_schema=None, reader_schema=None):
    scale = writer_schema.get("scale", 0)
    precision = writer_schema["precision"]

    unscaled_datum = int.from_bytes(data, byteorder="big", signed=True)

    decimal_context.prec = precision
    return decimal_context.create_decimal(unscaled_datum).scaleb(
        -scale, decimal_context
    )


def read_time_millis(data, writer_schema=None, reader_schema=None):
    h = int(data / MLS_PER_HOUR)
    m = int(data / MLS_PER_MINUTE) % 60
    s = int(data / MLS_PER_SECOND) % 60
    mls = int(data % MLS_PER_SECOND) * 1000
    return time(h, m, s, mls)


def read_time_micros(data, writer_schema=None, reader_schema=None):
    h = int(data / MCS_PER_HOUR)
    m = int(data / MCS_PER_MINUTE) % 60
    s = int(data / MCS_PER_SECOND) % 60
    mcs = data % MCS_PER_SECOND
    return time(h, m, s, mcs)


LOGICAL_READERS = {
    "long-timestamp-millis": read_timestamp_millis,
    "long-local-timestamp-millis": read_local_timestamp_millis,
    "long-timestamp-micros": read_timestamp_micros,
    "long-local-timestamp-micros": read_local_timestamp_micros,
    "int-date": read_date,
    "bytes-decimal": read_decimal,
    "fixed-decimal": read_decimal,
    "string-uuid": read_uuid,
    "int-time-millis": read_time_millis,
    "long-time-micros": read_time_micros,
}
