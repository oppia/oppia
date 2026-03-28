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
    package="google.cloud.translation.v3",
    manifest={
        "OperationState",
        "GcsInputSource",
        "FileInputSource",
        "GcsOutputDestination",
        "GlossaryEntry",
        "GlossaryTerm",
    },
)


class OperationState(proto.Enum):
    r"""Possible states of long running operations.

    Values:
        OPERATION_STATE_UNSPECIFIED (0):
            Invalid.
        OPERATION_STATE_RUNNING (1):
            Request is being processed.
        OPERATION_STATE_SUCCEEDED (2):
            The operation was successful.
        OPERATION_STATE_FAILED (3):
            Failed to process operation.
        OPERATION_STATE_CANCELLING (4):
            Request is in the process of being canceled
            after caller invoked
            longrunning.Operations.CancelOperation on the
            request id.
        OPERATION_STATE_CANCELLED (5):
            The operation request was successfully
            canceled.
    """
    OPERATION_STATE_UNSPECIFIED = 0
    OPERATION_STATE_RUNNING = 1
    OPERATION_STATE_SUCCEEDED = 2
    OPERATION_STATE_FAILED = 3
    OPERATION_STATE_CANCELLING = 4
    OPERATION_STATE_CANCELLED = 5


class GcsInputSource(proto.Message):
    r"""The Google Cloud Storage location for the input content.

    Attributes:
        input_uri (str):
            Required. Source data URI. For example,
            ``gs://my_bucket/my_object``.
    """

    input_uri: str = proto.Field(
        proto.STRING,
        number=1,
    )


class FileInputSource(proto.Message):
    r"""An inlined file.

    Attributes:
        mime_type (str):
            Required. The file's mime type.
        content (bytes):
            Required. The file's byte contents.
        display_name (str):
            Required. The file's display name.
    """

    mime_type: str = proto.Field(
        proto.STRING,
        number=1,
    )
    content: bytes = proto.Field(
        proto.BYTES,
        number=2,
    )
    display_name: str = proto.Field(
        proto.STRING,
        number=3,
    )


class GcsOutputDestination(proto.Message):
    r"""The Google Cloud Storage location for the output content.

    Attributes:
        output_uri_prefix (str):
            Required. Google Cloud Storage URI to output directory. For
            example, ``gs://bucket/directory``. The requesting user must
            have write permission to the bucket. The directory will be
            created if it doesn't exist.
    """

    output_uri_prefix: str = proto.Field(
        proto.STRING,
        number=1,
    )


class GlossaryEntry(proto.Message):
    r"""Represents a single entry in a glossary.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        name (str):
            Identifier. The resource name of the entry. Format:
            ``projects/*/locations/*/glossaries/*/glossaryEntries/*``
        terms_pair (google.cloud.translate_v3.types.GlossaryEntry.GlossaryTermsPair):
            Used for an unidirectional glossary.

            This field is a member of `oneof`_ ``data``.
        terms_set (google.cloud.translate_v3.types.GlossaryEntry.GlossaryTermsSet):
            Used for an equivalent term sets glossary.

            This field is a member of `oneof`_ ``data``.
        description (str):
            Describes the glossary entry.
    """

    class GlossaryTermsPair(proto.Message):
        r"""Represents a single entry for an unidirectional glossary.

        Attributes:
            source_term (google.cloud.translate_v3.types.GlossaryTerm):
                The source term is the term that will get
                match in the text,
            target_term (google.cloud.translate_v3.types.GlossaryTerm):
                The term that will replace the match source
                term.
        """

        source_term: "GlossaryTerm" = proto.Field(
            proto.MESSAGE,
            number=1,
            message="GlossaryTerm",
        )
        target_term: "GlossaryTerm" = proto.Field(
            proto.MESSAGE,
            number=2,
            message="GlossaryTerm",
        )

    class GlossaryTermsSet(proto.Message):
        r"""Represents a single entry for an equivalent term set
        glossary. This is used for equivalent term sets where each term
        can be replaced by the other terms in the set.

        Attributes:
            terms (MutableSequence[google.cloud.translate_v3.types.GlossaryTerm]):
                Each term in the set represents a term that
                can be replaced by the other terms.
        """

        terms: MutableSequence["GlossaryTerm"] = proto.RepeatedField(
            proto.MESSAGE,
            number=1,
            message="GlossaryTerm",
        )

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    terms_pair: GlossaryTermsPair = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="data",
        message=GlossaryTermsPair,
    )
    terms_set: GlossaryTermsSet = proto.Field(
        proto.MESSAGE,
        number=3,
        oneof="data",
        message=GlossaryTermsSet,
    )
    description: str = proto.Field(
        proto.STRING,
        number=4,
    )


class GlossaryTerm(proto.Message):
    r"""Represents a single glossary term

    Attributes:
        language_code (str):
            The language for this glossary term.
        text (str):
            The text for the glossary term.
    """

    language_code: str = proto.Field(
        proto.STRING,
        number=1,
    )
    text: str = proto.Field(
        proto.STRING,
        number=2,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
