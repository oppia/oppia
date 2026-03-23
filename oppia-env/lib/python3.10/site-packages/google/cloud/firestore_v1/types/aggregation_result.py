# -*- coding: utf-8 -*-
# Copyright 2025 Google LLC
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
#
from __future__ import annotations

from typing import MutableMapping, MutableSequence

import proto  # type: ignore

from google.cloud.firestore_v1.types import document


__protobuf__ = proto.module(
    package="google.firestore.v1",
    manifest={
        "AggregationResult",
    },
)


class AggregationResult(proto.Message):
    r"""The result of a single bucket from a Firestore aggregation query.

    The keys of ``aggregate_fields`` are the same for all results in an
    aggregation query, unlike document queries which can have different
    fields present for each result.

    Attributes:
        aggregate_fields (MutableMapping[str, google.cloud.firestore_v1.types.Value]):
            The result of the aggregation functions, ex:
            ``COUNT(*) AS total_docs``.

            The key is the
            [alias][google.firestore.v1.StructuredAggregationQuery.Aggregation.alias]
            assigned to the aggregation function on input and the size
            of this map equals the number of aggregation functions in
            the query.
    """

    aggregate_fields: MutableMapping[str, document.Value] = proto.MapField(
        proto.STRING,
        proto.MESSAGE,
        number=2,
        message=document.Value,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
