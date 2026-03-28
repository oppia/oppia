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

from google.cloud.firestore_admin_v1.types import index


__protobuf__ = proto.module(
    package="google.firestore.admin.v1",
    manifest={
        "Field",
    },
)


class Field(proto.Message):
    r"""Represents a single field in the database.

    Fields are grouped by their "Collection Group", which represent
    all collections in the database with the same ID.

    Attributes:
        name (str):
            Required. A field name of the form:
            ``projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}/fields/{field_path}``

            A field path can be a simple field name, e.g. ``address`` or
            a path to fields within ``map_value`` , e.g.
            ``address.city``, or a special field path. The only valid
            special field is ``*``, which represents any field.

            Field paths can be quoted using :literal:`\`` (backtick).
            The only character that must be escaped within a quoted
            field path is the backtick character itself, escaped using a
            backslash. Special characters in field paths that must be
            quoted include: ``*``, ``.``, :literal:`\`` (backtick),
            ``[``, ``]``, as well as any ascii symbolic characters.

            Examples: :literal:`\`address.city\`` represents a field
            named ``address.city``, not the map key ``city`` in the
            field ``address``. :literal:`\`*\`` represents a field named
            ``*``, not any field.

            A special ``Field`` contains the default indexing settings
            for all fields. This field's resource name is:
            ``projects/{project_id}/databases/{database_id}/collectionGroups/__default__/fields/*``
            Indexes defined on this ``Field`` will be applied to all
            fields which do not have their own ``Field`` index
            configuration.
        index_config (google.cloud.firestore_admin_v1.types.Field.IndexConfig):
            The index configuration for this field. If unset, field
            indexing will revert to the configuration defined by the
            ``ancestor_field``. To explicitly remove all indexes for
            this field, specify an index config with an empty list of
            indexes.
        ttl_config (google.cloud.firestore_admin_v1.types.Field.TtlConfig):
            The TTL configuration for this ``Field``. Setting or
            unsetting this will enable or disable the TTL for documents
            that have this ``Field``.
    """

    class IndexConfig(proto.Message):
        r"""The index configuration for this field.

        Attributes:
            indexes (MutableSequence[google.cloud.firestore_admin_v1.types.Index]):
                The indexes supported for this field.
            uses_ancestor_config (bool):
                Output only. When true, the ``Field``'s index configuration
                is set from the configuration specified by the
                ``ancestor_field``. When false, the ``Field``'s index
                configuration is defined explicitly.
            ancestor_field (str):
                Output only. Specifies the resource name of the ``Field``
                from which this field's index configuration is set (when
                ``uses_ancestor_config`` is true), or from which it *would*
                be set if this field had no index configuration (when
                ``uses_ancestor_config`` is false).
            reverting (bool):
                Output only When true, the ``Field``'s index configuration
                is in the process of being reverted. Once complete, the
                index config will transition to the same state as the field
                specified by ``ancestor_field``, at which point
                ``uses_ancestor_config`` will be ``true`` and ``reverting``
                will be ``false``.
        """

        indexes: MutableSequence[index.Index] = proto.RepeatedField(
            proto.MESSAGE,
            number=1,
            message=index.Index,
        )
        uses_ancestor_config: bool = proto.Field(
            proto.BOOL,
            number=2,
        )
        ancestor_field: str = proto.Field(
            proto.STRING,
            number=3,
        )
        reverting: bool = proto.Field(
            proto.BOOL,
            number=4,
        )

    class TtlConfig(proto.Message):
        r"""The TTL (time-to-live) configuration for documents that have this
        ``Field`` set.

        Storing a timestamp value into a TTL-enabled field will be treated
        as the document's absolute expiration time. Timestamp values in the
        past indicate that the document is eligible for immediate
        expiration. Using any other data type or leaving the field absent
        will disable expiration for the individual document.

        Attributes:
            state (google.cloud.firestore_admin_v1.types.Field.TtlConfig.State):
                Output only. The state of the TTL
                configuration.
        """

        class State(proto.Enum):
            r"""The state of applying the TTL configuration to all documents.

            Values:
                STATE_UNSPECIFIED (0):
                    The state is unspecified or unknown.
                CREATING (1):
                    The TTL is being applied. There is an active
                    long-running operation to track the change.
                    Newly written documents will have TTLs applied
                    as requested. Requested TTLs on existing
                    documents are still being processed. When TTLs
                    on all existing documents have been processed,
                    the state will move to 'ACTIVE'.
                ACTIVE (2):
                    The TTL is active for all documents.
                NEEDS_REPAIR (3):
                    The TTL configuration could not be enabled for all existing
                    documents. Newly written documents will continue to have
                    their TTL applied. The LRO returned when last attempting to
                    enable TTL for this ``Field`` has failed, and may have more
                    details.
            """
            STATE_UNSPECIFIED = 0
            CREATING = 1
            ACTIVE = 2
            NEEDS_REPAIR = 3

        state: "Field.TtlConfig.State" = proto.Field(
            proto.ENUM,
            number=1,
            enum="Field.TtlConfig.State",
        )

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    index_config: IndexConfig = proto.Field(
        proto.MESSAGE,
        number=2,
        message=IndexConfig,
    )
    ttl_config: TtlConfig = proto.Field(
        proto.MESSAGE,
        number=3,
        message=TtlConfig,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
