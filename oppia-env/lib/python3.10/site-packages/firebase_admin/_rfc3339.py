# Copyright 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Parse RFC3339 date strings"""

from datetime import datetime, timezone
import re

def parse_to_epoch(datestr):
    """Parse an RFC3339 date string and return the number of seconds since the
    epoch (as a float).

    In particular, this method is meant to parse the strings returned by the
    JSON mapping of protobuf google.protobuf.timestamp.Timestamp instances:
    https://github.com/protocolbuffers/protobuf/blob/4cf5bfee9546101d98754d23ff378ff718ba8438/src/google/protobuf/timestamp.proto#L99

    This method has microsecond precision; nanoseconds will be truncated.

    Args:
        datestr: A string in RFC3339 format.
    Returns:
        Float: The number of seconds since the Unix epoch.
    Raises:
        ValueError: Raised if the `datestr` is not a valid RFC3339 date string.
    """
    return _parse_to_datetime(datestr).timestamp()


def _parse_to_datetime(datestr):
    """Parse an RFC3339 date string and return a python datetime instance.

    Args:
        datestr: A string in RFC3339 format.
    Returns:
        datetime: The corresponding `datetime` (with timezone information).
    Raises:
        ValueError: Raised if the `datestr` is not a valid RFC3339 date string.
    """
    # If more than 6 digits appear in the fractional seconds position, truncate
    # to just the most significant 6. (i.e. we only have microsecond precision;
    # nanos are truncated.)
    datestr_modified = re.sub(r'(\.\d{6})\d*', r'\1', datestr)

    # This format is the one we actually expect to occur from our backend. The
    # others are only present because the spec says we *should* accept them.
    try:
        return datetime.strptime(
            datestr_modified, '%Y-%m-%dT%H:%M:%S.%fZ'
        ).replace(tzinfo=timezone.utc)
    except ValueError:
        pass

    try:
        return datetime.strptime(
            datestr_modified, '%Y-%m-%dT%H:%M:%SZ'
        ).replace(tzinfo=timezone.utc)
    except ValueError:
        pass

    # Note: %z parses timezone offsets, but requires the timezone offset *not*
    # include a separating ':'. As of python 3.7, this was relaxed.
    # TODO(rsgowman): Once python3.7 becomes our floor, we can drop the regex
    # replacement.
    datestr_modified = re.sub(r'(\d\d):(\d\d)$', r'\1\2', datestr_modified)

    try:
        return datetime.strptime(datestr_modified, '%Y-%m-%dT%H:%M:%S.%f%z')
    except ValueError:
        pass

    try:
        return datetime.strptime(datestr_modified, '%Y-%m-%dT%H:%M:%S%z')
    except ValueError:
        pass

    raise ValueError('time data {0} does not match RFC3339 format'.format(datestr))
