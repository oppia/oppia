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


__protobuf__ = proto.module(
    package="google.firestore.admin.v1",
    manifest={
        "Index",
    },
)


class Index(proto.Message):
    r"""Cloud Firestore indexes enable simple and complex queries
    against documents in a database.

    Attributes:
        name (str):
            Output only. A server defined name for this index. The form
            of this name for composite indexes will be:
            ``projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}/indexes/{composite_index_id}``
            For single field indexes, this field will be empty.
        query_scope (google.cloud.firestore_admin_v1.types.Index.QueryScope):
            Indexes with a collection query scope
            specified allow queries against a collection
            that is the child of a specific document,
            specified at query time, and that has the same
            collection ID.

            Indexes with a collection group query scope
            specified allow queries against all collections
            descended from a specific document, specified at
            query time, and that have the same collection ID
            as this index.
        api_scope (google.cloud.firestore_admin_v1.types.Index.ApiScope):
            The API scope supported by this index.
        fields (MutableSequence[google.cloud.firestore_admin_v1.types.Index.IndexField]):
            The fields supported by this index.

            For composite indexes, this requires a minimum of 2 and a
            maximum of 100 fields. The last field entry is always for
            the field path ``__name__``. If, on creation, ``__name__``
            was not specified as the last field, it will be added
            automatically with the same direction as that of the last
            field defined. If the final field in a composite index is
            not directional, the ``__name__`` will be ordered ASCENDING
            (unless explicitly specified).

            For single field indexes, this will always be exactly one
            entry with a field path equal to the field path of the
            associated field.
        state (google.cloud.firestore_admin_v1.types.Index.State):
            Output only. The serving state of the index.
        density (google.cloud.firestore_admin_v1.types.Index.Density):
            Immutable. The density configuration of the
            index.
        multikey (bool):
            Optional. Whether the index is multikey. By default, the
            index is not multikey. For non-multikey indexes, none of the
            paths in the index definition reach or traverse an array,
            except via an explicit array index. For multikey indexes, at
            most one of the paths in the index definition reach or
            traverse an array, except via an explicit array index.
            Violations will result in errors.

            Note this field only applies to index with
            MONGODB_COMPATIBLE_API ApiScope.
        shard_count (int):
            Optional. The number of shards for the index.
    """

    class QueryScope(proto.Enum):
        r"""Query Scope defines the scope at which a query is run. This is
        specified on a StructuredQuery's ``from`` field.

        Values:
            QUERY_SCOPE_UNSPECIFIED (0):
                The query scope is unspecified. Not a valid
                option.
            COLLECTION (1):
                Indexes with a collection query scope
                specified allow queries against a collection
                that is the child of a specific document,
                specified at query time, and that has the
                collection ID specified by the index.
            COLLECTION_GROUP (2):
                Indexes with a collection group query scope
                specified allow queries against all collections
                that has the collection ID specified by the
                index.
            COLLECTION_RECURSIVE (3):
                Include all the collections's ancestor in the
                index. Only available for Datastore Mode
                databases.
        """
        QUERY_SCOPE_UNSPECIFIED = 0
        COLLECTION = 1
        COLLECTION_GROUP = 2
        COLLECTION_RECURSIVE = 3

    class ApiScope(proto.Enum):
        r"""API Scope defines the APIs (Firestore Native, or Firestore in
        Datastore Mode) that are supported for queries.

        Values:
            ANY_API (0):
                The index can only be used by the Firestore
                Native query API. This is the default.
            DATASTORE_MODE_API (1):
                The index can only be used by the Firestore
                in Datastore Mode query API.
            MONGODB_COMPATIBLE_API (2):
                The index can only be used by the MONGODB_COMPATIBLE_API.
        """
        ANY_API = 0
        DATASTORE_MODE_API = 1
        MONGODB_COMPATIBLE_API = 2

    class State(proto.Enum):
        r"""The state of an index. During index creation, an index will be in
        the ``CREATING`` state. If the index is created successfully, it
        will transition to the ``READY`` state. If the index creation
        encounters a problem, the index will transition to the
        ``NEEDS_REPAIR`` state.

        Values:
            STATE_UNSPECIFIED (0):
                The state is unspecified.
            CREATING (1):
                The index is being created.
                There is an active long-running operation for
                the index. The index is updated when writing a
                document. Some index data may exist.
            READY (2):
                The index is ready to be used.
                The index is updated when writing a document.
                The index is fully populated from all stored
                documents it applies to.
            NEEDS_REPAIR (3):
                The index was being created, but something
                went wrong. There is no active long-running
                operation for the index, and the most recently
                finished long-running operation failed. The
                index is not updated when writing a document.
                Some index data may exist.
                Use the google.longrunning.Operations API to
                determine why the operation that last attempted
                to create this index failed, then re-create the
                index.
        """
        STATE_UNSPECIFIED = 0
        CREATING = 1
        READY = 2
        NEEDS_REPAIR = 3

    class Density(proto.Enum):
        r"""The density configuration for the index.

        Values:
            DENSITY_UNSPECIFIED (0):
                Unspecified. It will use database default
                setting. This value is input only.
            SPARSE_ALL (1):
                In order for an index entry to be added, the document must
                contain all fields specified in the index.

                This is the only allowed value for indexes having ApiScope
                ``ANY_API`` and ``DATASTORE_MODE_API``.
            SPARSE_ANY (2):
                In order for an index entry to be added, the
                document must contain at least one of the fields
                specified in the index. Non-existent fields are
                treated as having a NULL value when generating
                index entries.
            DENSE (3):
                An index entry will be added regardless of
                whether the document contains any of the fields
                specified in the index. Non-existent fields are
                treated as having a NULL value when generating
                index entries.
        """
        DENSITY_UNSPECIFIED = 0
        SPARSE_ALL = 1
        SPARSE_ANY = 2
        DENSE = 3

    class IndexField(proto.Message):
        r"""A field in an index. The field_path describes which field is
        indexed, the value_mode describes how the field value is indexed.

        This message has `oneof`_ fields (mutually exclusive fields).
        For each oneof, at most one member field can be set at the same time.
        Setting any member of the oneof automatically clears all other
        members.

        .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

        Attributes:
            field_path (str):
                Can be **name**. For single field indexes, this must match
                the name of the field or may be omitted.
            order (google.cloud.firestore_admin_v1.types.Index.IndexField.Order):
                Indicates that this field supports ordering
                by the specified order or comparing using =, !=,
                <, <=, >, >=.

                This field is a member of `oneof`_ ``value_mode``.
            array_config (google.cloud.firestore_admin_v1.types.Index.IndexField.ArrayConfig):
                Indicates that this field supports operations on
                ``array_value``\ s.

                This field is a member of `oneof`_ ``value_mode``.
            vector_config (google.cloud.firestore_admin_v1.types.Index.IndexField.VectorConfig):
                Indicates that this field supports nearest
                neighbor and distance operations on vector.

                This field is a member of `oneof`_ ``value_mode``.
        """

        class Order(proto.Enum):
            r"""The supported orderings.

            Values:
                ORDER_UNSPECIFIED (0):
                    The ordering is unspecified. Not a valid
                    option.
                ASCENDING (1):
                    The field is ordered by ascending field
                    value.
                DESCENDING (2):
                    The field is ordered by descending field
                    value.
            """
            ORDER_UNSPECIFIED = 0
            ASCENDING = 1
            DESCENDING = 2

        class ArrayConfig(proto.Enum):
            r"""The supported array value configurations.

            Values:
                ARRAY_CONFIG_UNSPECIFIED (0):
                    The index does not support additional array
                    queries.
                CONTAINS (1):
                    The index supports array containment queries.
            """
            ARRAY_CONFIG_UNSPECIFIED = 0
            CONTAINS = 1

        class VectorConfig(proto.Message):
            r"""The index configuration to support vector search operations

            .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

            Attributes:
                dimension (int):
                    Required. The vector dimension this
                    configuration applies to.
                    The resulting index will only include vectors of
                    this dimension, and can be used for vector
                    search with the same dimension.
                flat (google.cloud.firestore_admin_v1.types.Index.IndexField.VectorConfig.FlatIndex):
                    Indicates the vector index is a flat index.

                    This field is a member of `oneof`_ ``type``.
            """

            class FlatIndex(proto.Message):
                r"""An index that stores vectors in a flat data structure, and
                supports exhaustive search.

                """

            dimension: int = proto.Field(
                proto.INT32,
                number=1,
            )
            flat: "Index.IndexField.VectorConfig.FlatIndex" = proto.Field(
                proto.MESSAGE,
                number=2,
                oneof="type",
                message="Index.IndexField.VectorConfig.FlatIndex",
            )

        field_path: str = proto.Field(
            proto.STRING,
            number=1,
        )
        order: "Index.IndexField.Order" = proto.Field(
            proto.ENUM,
            number=2,
            oneof="value_mode",
            enum="Index.IndexField.Order",
        )
        array_config: "Index.IndexField.ArrayConfig" = proto.Field(
            proto.ENUM,
            number=3,
            oneof="value_mode",
            enum="Index.IndexField.ArrayConfig",
        )
        vector_config: "Index.IndexField.VectorConfig" = proto.Field(
            proto.MESSAGE,
            number=4,
            oneof="value_mode",
            message="Index.IndexField.VectorConfig",
        )

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    query_scope: QueryScope = proto.Field(
        proto.ENUM,
        number=2,
        enum=QueryScope,
    )
    api_scope: ApiScope = proto.Field(
        proto.ENUM,
        number=5,
        enum=ApiScope,
    )
    fields: MutableSequence[IndexField] = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message=IndexField,
    )
    state: State = proto.Field(
        proto.ENUM,
        number=4,
        enum=State,
    )
    density: Density = proto.Field(
        proto.ENUM,
        number=6,
        enum=Density,
    )
    multikey: bool = proto.Field(
        proto.BOOL,
        number=7,
    )
    shard_count: int = proto.Field(
        proto.INT32,
        number=8,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
