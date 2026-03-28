import datetime
import decimal
from io import BytesIO
import os
import time
from typing import Dict, Union
import uuid
from .const import (
    MCS_PER_HOUR,
    MCS_PER_MINUTE,
    MCS_PER_SECOND,
    MLS_PER_HOUR,
    MLS_PER_MINUTE,
    MLS_PER_SECOND,
    DAYS_SHIFT,
)


is_windows = os.name == "nt"
epoch = datetime.datetime(1970, 1, 1, tzinfo=datetime.timezone.utc)
epoch_naive = datetime.datetime(1970, 1, 1)


def prepare_timestamp_millis(data, schema):
    """Converts datetime.datetime object to int timestamp with milliseconds"""
    if isinstance(data, datetime.datetime):
        if data.tzinfo is not None:
            delta = data - epoch
            return (delta.days * 24 * 3600 + delta.seconds) * MLS_PER_SECOND + int(
                delta.microseconds / 1000
            )

        # On Windows, mktime does not support pre-epoch, see e.g.
        # https://stackoverflow.com/questions/2518706/python-mktime-overflow-error
        if is_windows:
            delta = data - epoch_naive
            return (delta.days * 24 * 3600 + delta.seconds) * MLS_PER_SECOND + int(
                delta.microseconds / 1000
            )
        else:
            return int(time.mktime(data.timetuple())) * MLS_PER_SECOND + int(
                data.microsecond / 1000
            )
    else:
        return data


def prepare_local_timestamp_millis(
    data: Union[datetime.datetime, int], schema: Dict
) -> int:
    """Converts datetime.datetime object to int timestamp with milliseconds.

    The local-timestamp-millis logical type represents a timestamp in a local
    timezone, regardless of what specific time zone is considered local, with a
    precision of one millisecond.
    """
    if isinstance(data, datetime.datetime):
        delta = data.replace(tzinfo=datetime.timezone.utc) - epoch
        return (delta.days * 24 * 3600 + delta.seconds) * MLS_PER_SECOND + int(
            delta.microseconds / 1000
        )
    else:
        return data


def prepare_timestamp_micros(data, schema):
    """Converts datetime.datetime to int timestamp with microseconds"""
    if isinstance(data, datetime.datetime):
        if data.tzinfo is not None:
            delta = data - epoch
            return (
                delta.days * 24 * 3600 + delta.seconds
            ) * MCS_PER_SECOND + delta.microseconds

        # On Windows, mktime does not support pre-epoch, see e.g.
        # https://stackoverflow.com/questions/2518706/python-mktime-overflow-error
        if is_windows:
            delta = data - epoch_naive
            return (
                delta.days * 24 * 3600 + delta.seconds
            ) * MCS_PER_SECOND + delta.microseconds
        else:
            return (
                int(time.mktime(data.timetuple())) * MCS_PER_SECOND + data.microsecond
            )
    else:
        return data


def prepare_local_timestamp_micros(
    data: Union[datetime.datetime, int], schema: Dict
) -> int:
    """Converts datetime.datetime to int timestamp with microseconds

    The local-timestamp-micros logical type represents a timestamp in a local
    timezone, regardless of what specific time zone is considered local, with a
    precision of one microsecond.
    """
    if isinstance(data, datetime.datetime):
        delta = data.replace(tzinfo=datetime.timezone.utc) - epoch
        return (
            delta.days * 24 * 3600 + delta.seconds
        ) * MCS_PER_SECOND + delta.microseconds
    else:
        return data


def prepare_date(data, schema):
    """Converts datetime.date to int timestamp"""
    if isinstance(data, datetime.date):
        return data.toordinal() - DAYS_SHIFT
    elif isinstance(data, str):
        return datetime.date.fromisoformat(data).toordinal() - DAYS_SHIFT
    else:
        return data


def prepare_bytes_decimal(data, schema):
    """Convert decimal.Decimal to bytes"""
    if not isinstance(data, decimal.Decimal):
        return data
    scale = schema.get("scale", 0)
    precision = schema["precision"]

    sign, digits, exp = data.as_tuple()

    if len(digits) > precision:
        raise ValueError("The decimal precision is bigger than allowed by schema")

    delta = exp + scale

    if delta < 0:
        raise ValueError("Scale provided in schema does not match the decimal")

    unscaled_datum = 0
    for digit in digits:
        unscaled_datum = (unscaled_datum * 10) + digit

    unscaled_datum = 10**delta * unscaled_datum

    bytes_req = (unscaled_datum.bit_length() + 8) // 8

    if sign:
        unscaled_datum = -unscaled_datum

    return unscaled_datum.to_bytes(bytes_req, byteorder="big", signed=True)


def prepare_fixed_decimal(data, schema):
    """Converts decimal.Decimal to fixed length bytes array"""
    if not isinstance(data, decimal.Decimal):
        return data
    scale = schema.get("scale", 0)
    size = schema["size"]
    precision = schema["precision"]

    # based on https://github.com/apache/avro/pull/82/

    sign, digits, exp = data.as_tuple()

    if len(digits) > precision:
        raise ValueError("The decimal precision is bigger than allowed by schema")

    if -exp > scale:
        raise ValueError("Scale provided in schema does not match the decimal")

    delta = exp + scale
    if delta > 0:
        digits = digits + (0,) * delta

    unscaled_datum = 0
    for digit in digits:
        unscaled_datum = (unscaled_datum * 10) + digit

    bits_req = unscaled_datum.bit_length() + 1

    size_in_bits = size * 8
    offset_bits = size_in_bits - bits_req

    mask = 2**size_in_bits - 1
    bit = 1
    for i in range(bits_req):
        mask ^= bit
        bit <<= 1

    if bits_req < 8:
        bytes_req = 1
    else:
        bytes_req = bits_req // 8
        if bits_req % 8 != 0:
            bytes_req += 1

    tmp = BytesIO()

    if sign:
        unscaled_datum = (1 << bits_req) - unscaled_datum
        unscaled_datum = mask | unscaled_datum
        for index in range(size - 1, -1, -1):
            bits_to_write = unscaled_datum >> (8 * index)
            tmp.write(bytes([bits_to_write & 0xFF]))
    else:
        for i in range(offset_bits // 8):
            tmp.write(bytes([0]))
        for index in range(bytes_req - 1, -1, -1):
            bits_to_write = unscaled_datum >> (8 * index)
            tmp.write(bytes([bits_to_write & 0xFF]))

    return tmp.getvalue()


def prepare_uuid(data, schema):
    """Converts uuid.UUID to
    string formatted UUID xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    """
    if isinstance(data, uuid.UUID):
        return str(data)
    else:
        return data


def prepare_time_millis(data, schema):
    """Convert datetime.time to int timestamp with milliseconds"""
    if isinstance(data, datetime.time):
        return int(
            data.hour * MLS_PER_HOUR
            + data.minute * MLS_PER_MINUTE
            + data.second * MLS_PER_SECOND
            + int(data.microsecond / 1000)
        )
    else:
        return data


def prepare_time_micros(data, schema):
    """Convert datetime.time to int timestamp with microseconds"""
    if isinstance(data, datetime.time):
        return int(
            data.hour * MCS_PER_HOUR
            + data.minute * MCS_PER_MINUTE
            + data.second * MCS_PER_SECOND
            + data.microsecond
        )
    else:
        return data


LOGICAL_WRITERS = {
    "long-timestamp-millis": prepare_timestamp_millis,
    "long-local-timestamp-millis": prepare_local_timestamp_millis,
    "long-timestamp-micros": prepare_timestamp_micros,
    "long-local-timestamp-micros": prepare_local_timestamp_micros,
    "int-date": prepare_date,
    "bytes-decimal": prepare_bytes_decimal,
    "fixed-decimal": prepare_fixed_decimal,
    "string-uuid": prepare_uuid,
    "int-time-millis": prepare_time_millis,
    "long-time-micros": prepare_time_micros,
}
