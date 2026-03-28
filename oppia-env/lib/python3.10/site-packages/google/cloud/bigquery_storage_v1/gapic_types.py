# -*- coding: utf-8 -*-
#
# Copyright 2020 Google LLC
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

from __future__ import absolute_import

import collections
import inspect
import sys

import proto

from google.cloud.bigquery_storage_v1.types import arrow
from google.cloud.bigquery_storage_v1.types import avro
from google.cloud.bigquery_storage_v1.types import storage
from google.cloud.bigquery_storage_v1.types import stream

from google.protobuf import message as protobuf_message
from google.protobuf import timestamp_pb2


# The current api core helper does not find new proto messages of type proto.Message,
# thus we need our own helper. Adjusted from
# https://github.com/googleapis/python-api-core/blob/8595f620e7d8295b6a379d6fd7979af3bef717e2/google/api_core/protobuf_helpers.py#L101-L118
def _get_protobuf_messages(module):
    """Discover all protobuf Message classes in a given import module.

    Args:
        module (module): A Python module; :func:`dir` will be run against this
            module to find Message subclasses.

    Returns:
        dict[str, proto.Message]: A dictionary with the
            Message class names as keys, and the Message subclasses themselves
            as values.
    """
    answer = collections.OrderedDict()
    for name in dir(module):
        candidate = getattr(module, name)
        if inspect.isclass(candidate) and issubclass(
            candidate, (proto.Enum, proto.Message, protobuf_message.Message)
        ):
            answer[name] = candidate
    return answer


_shared_modules = [
    timestamp_pb2,
]

_local_modules = [
    arrow,
    avro,
    storage,
    stream,
]

names = []

for module in _shared_modules:  # pragma: NO COVER
    for name, message in _get_protobuf_messages(module).items():
        setattr(sys.modules[__name__], name, message)
        names.append(name)
for module in _local_modules:  # pragma: NO COVER
    for name, message in _get_protobuf_messages(module).items():
        message.__module__ = "google.cloud.bigquery_storage_v1.types"
        setattr(sys.modules[__name__], name, message)
        names.append(name)


__all__ = tuple(sorted(names))
