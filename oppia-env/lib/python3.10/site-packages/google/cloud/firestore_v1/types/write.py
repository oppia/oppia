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

from google.cloud.firestore_v1.types import bloom_filter
from google.cloud.firestore_v1.types import common
from google.cloud.firestore_v1.types import document as gf_document
from google.protobuf import timestamp_pb2  # type: ignore


__protobuf__ = proto.module(
    package="google.firestore.v1",
    manifest={
        "Write",
        "DocumentTransform",
        "WriteResult",
        "DocumentChange",
        "DocumentDelete",
        "DocumentRemove",
        "ExistenceFilter",
    },
)


class Write(proto.Message):
    r"""A write on a document.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        update (google.cloud.firestore_v1.types.Document):
            A document to write.

            This field is a member of `oneof`_ ``operation``.
        delete (str):
            A document name to delete. In the format:
            ``projects/{project_id}/databases/{database_id}/documents/{document_path}``.

            This field is a member of `oneof`_ ``operation``.
        transform (google.cloud.firestore_v1.types.DocumentTransform):
            Applies a transformation to a document.

            This field is a member of `oneof`_ ``operation``.
        update_mask (google.cloud.firestore_v1.types.DocumentMask):
            The fields to update in this write.

            This field can be set only when the operation is ``update``.
            If the mask is not set for an ``update`` and the document
            exists, any existing data will be overwritten. If the mask
            is set and the document on the server has fields not covered
            by the mask, they are left unchanged. Fields referenced in
            the mask, but not present in the input document, are deleted
            from the document on the server. The field paths in this
            mask must not contain a reserved field name.
        update_transforms (MutableSequence[google.cloud.firestore_v1.types.DocumentTransform.FieldTransform]):
            The transforms to perform after update.

            This field can be set only when the operation is ``update``.
            If present, this write is equivalent to performing
            ``update`` and ``transform`` to the same document atomically
            and in order.
        current_document (google.cloud.firestore_v1.types.Precondition):
            An optional precondition on the document.

            The write will fail if this is set and not met
            by the target document.
    """

    update: gf_document.Document = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="operation",
        message=gf_document.Document,
    )
    delete: str = proto.Field(
        proto.STRING,
        number=2,
        oneof="operation",
    )
    transform: "DocumentTransform" = proto.Field(
        proto.MESSAGE,
        number=6,
        oneof="operation",
        message="DocumentTransform",
    )
    update_mask: common.DocumentMask = proto.Field(
        proto.MESSAGE,
        number=3,
        message=common.DocumentMask,
    )
    update_transforms: MutableSequence[
        "DocumentTransform.FieldTransform"
    ] = proto.RepeatedField(
        proto.MESSAGE,
        number=7,
        message="DocumentTransform.FieldTransform",
    )
    current_document: common.Precondition = proto.Field(
        proto.MESSAGE,
        number=4,
        message=common.Precondition,
    )


class DocumentTransform(proto.Message):
    r"""A transformation of a document.

    Attributes:
        document (str):
            The name of the document to transform.
        field_transforms (MutableSequence[google.cloud.firestore_v1.types.DocumentTransform.FieldTransform]):
            The list of transformations to apply to the
            fields of the document, in order.
            This must not be empty.
    """

    class FieldTransform(proto.Message):
        r"""A transformation of a field of the document.

        This message has `oneof`_ fields (mutually exclusive fields).
        For each oneof, at most one member field can be set at the same time.
        Setting any member of the oneof automatically clears all other
        members.

        .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

        Attributes:
            field_path (str):
                The path of the field. See
                [Document.fields][google.firestore.v1.Document.fields] for
                the field path syntax reference.
            set_to_server_value (google.cloud.firestore_v1.types.DocumentTransform.FieldTransform.ServerValue):
                Sets the field to the given server value.

                This field is a member of `oneof`_ ``transform_type``.
            increment (google.cloud.firestore_v1.types.Value):
                Adds the given value to the field's current
                value.
                This must be an integer or a double value.
                If the field is not an integer or double, or if
                the field does not yet exist, the transformation
                will set the field to the given value. If either
                of the given value or the current field value
                are doubles, both values will be interpreted as
                doubles. Double arithmetic and representation of
                double values follow IEEE 754 semantics. If
                there is positive/negative integer overflow, the
                field is resolved to the largest magnitude
                positive/negative integer.

                This field is a member of `oneof`_ ``transform_type``.
            maximum (google.cloud.firestore_v1.types.Value):
                Sets the field to the maximum of its current
                value and the given value.
                This must be an integer or a double value.
                If the field is not an integer or double, or if
                the field does not yet exist, the transformation
                will set the field to the given value. If a
                maximum operation is applied where the field and
                the input value are of mixed types (that is -
                one is an integer and one is a double) the field
                takes on the type of the larger operand. If the
                operands are equivalent (e.g. 3 and 3.0), the
                field does not change. 0, 0.0, and -0.0 are all
                zero. The maximum of a zero stored value and
                zero input value is always the stored value.
                The maximum of any numeric value x and NaN is
                NaN.

                This field is a member of `oneof`_ ``transform_type``.
            minimum (google.cloud.firestore_v1.types.Value):
                Sets the field to the minimum of its current
                value and the given value.
                This must be an integer or a double value.
                If the field is not an integer or double, or if
                the field does not yet exist, the transformation
                will set the field to the input value. If a
                minimum operation is applied where the field and
                the input value are of mixed types (that is -
                one is an integer and one is a double) the field
                takes on the type of the smaller operand. If the
                operands are equivalent (e.g. 3 and 3.0), the
                field does not change. 0, 0.0, and -0.0 are all
                zero. The minimum of a zero stored value and
                zero input value is always the stored value.
                The minimum of any numeric value x and NaN is
                NaN.

                This field is a member of `oneof`_ ``transform_type``.
            append_missing_elements (google.cloud.firestore_v1.types.ArrayValue):
                Append the given elements in order if they are not already
                present in the current field value. If the field is not an
                array, or if the field does not yet exist, it is first set
                to the empty array.

                Equivalent numbers of different types (e.g. 3L and 3.0) are
                considered equal when checking if a value is missing. NaN is
                equal to NaN, and Null is equal to Null. If the input
                contains multiple equivalent values, only the first will be
                considered.

                The corresponding transform_result will be the null value.

                This field is a member of `oneof`_ ``transform_type``.
            remove_all_from_array (google.cloud.firestore_v1.types.ArrayValue):
                Remove all of the given elements from the array in the
                field. If the field is not an array, or if the field does
                not yet exist, it is set to the empty array.

                Equivalent numbers of the different types (e.g. 3L and 3.0)
                are considered equal when deciding whether an element should
                be removed. NaN is equal to NaN, and Null is equal to Null.
                This will remove all equivalent values if there are
                duplicates.

                The corresponding transform_result will be the null value.

                This field is a member of `oneof`_ ``transform_type``.
        """

        class ServerValue(proto.Enum):
            r"""A value that is calculated by the server.

            Values:
                SERVER_VALUE_UNSPECIFIED (0):
                    Unspecified. This value must not be used.
                REQUEST_TIME (1):
                    The time at which the server processed the
                    request, with millisecond precision. If used on
                    multiple fields (same or different documents) in
                    a transaction, all the fields will get the same
                    server timestamp.
            """
            SERVER_VALUE_UNSPECIFIED = 0
            REQUEST_TIME = 1

        field_path: str = proto.Field(
            proto.STRING,
            number=1,
        )
        set_to_server_value: "DocumentTransform.FieldTransform.ServerValue" = (
            proto.Field(
                proto.ENUM,
                number=2,
                oneof="transform_type",
                enum="DocumentTransform.FieldTransform.ServerValue",
            )
        )
        increment: gf_document.Value = proto.Field(
            proto.MESSAGE,
            number=3,
            oneof="transform_type",
            message=gf_document.Value,
        )
        maximum: gf_document.Value = proto.Field(
            proto.MESSAGE,
            number=4,
            oneof="transform_type",
            message=gf_document.Value,
        )
        minimum: gf_document.Value = proto.Field(
            proto.MESSAGE,
            number=5,
            oneof="transform_type",
            message=gf_document.Value,
        )
        append_missing_elements: gf_document.ArrayValue = proto.Field(
            proto.MESSAGE,
            number=6,
            oneof="transform_type",
            message=gf_document.ArrayValue,
        )
        remove_all_from_array: gf_document.ArrayValue = proto.Field(
            proto.MESSAGE,
            number=7,
            oneof="transform_type",
            message=gf_document.ArrayValue,
        )

    document: str = proto.Field(
        proto.STRING,
        number=1,
    )
    field_transforms: MutableSequence[FieldTransform] = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message=FieldTransform,
    )


class WriteResult(proto.Message):
    r"""The result of applying a write.

    Attributes:
        update_time (google.protobuf.timestamp_pb2.Timestamp):
            The last update time of the document after applying the
            write. Not set after a ``delete``.

            If the write did not actually change the document, this will
            be the previous update_time.
        transform_results (MutableSequence[google.cloud.firestore_v1.types.Value]):
            The results of applying each
            [DocumentTransform.FieldTransform][google.firestore.v1.DocumentTransform.FieldTransform],
            in the same order.
    """

    update_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=1,
        message=timestamp_pb2.Timestamp,
    )
    transform_results: MutableSequence[gf_document.Value] = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message=gf_document.Value,
    )


class DocumentChange(proto.Message):
    r"""A [Document][google.firestore.v1.Document] has changed.

    May be the result of multiple [writes][google.firestore.v1.Write],
    including deletes, that ultimately resulted in a new value for the
    [Document][google.firestore.v1.Document].

    Multiple [DocumentChange][google.firestore.v1.DocumentChange]
    messages may be returned for the same logical change, if multiple
    targets are affected.

    Attributes:
        document (google.cloud.firestore_v1.types.Document):
            The new state of the
            [Document][google.firestore.v1.Document].

            If ``mask`` is set, contains only fields that were updated
            or added.
        target_ids (MutableSequence[int]):
            A set of target IDs of targets that match
            this document.
        removed_target_ids (MutableSequence[int]):
            A set of target IDs for targets that no
            longer match this document.
    """

    document: gf_document.Document = proto.Field(
        proto.MESSAGE,
        number=1,
        message=gf_document.Document,
    )
    target_ids: MutableSequence[int] = proto.RepeatedField(
        proto.INT32,
        number=5,
    )
    removed_target_ids: MutableSequence[int] = proto.RepeatedField(
        proto.INT32,
        number=6,
    )


class DocumentDelete(proto.Message):
    r"""A [Document][google.firestore.v1.Document] has been deleted.

    May be the result of multiple [writes][google.firestore.v1.Write],
    including updates, the last of which deleted the
    [Document][google.firestore.v1.Document].

    Multiple [DocumentDelete][google.firestore.v1.DocumentDelete]
    messages may be returned for the same logical delete, if multiple
    targets are affected.

    Attributes:
        document (str):
            The resource name of the
            [Document][google.firestore.v1.Document] that was deleted.
        removed_target_ids (MutableSequence[int]):
            A set of target IDs for targets that
            previously matched this entity.
        read_time (google.protobuf.timestamp_pb2.Timestamp):
            The read timestamp at which the delete was observed.

            Greater or equal to the ``commit_time`` of the delete.
    """

    document: str = proto.Field(
        proto.STRING,
        number=1,
    )
    removed_target_ids: MutableSequence[int] = proto.RepeatedField(
        proto.INT32,
        number=6,
    )
    read_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=4,
        message=timestamp_pb2.Timestamp,
    )


class DocumentRemove(proto.Message):
    r"""A [Document][google.firestore.v1.Document] has been removed from the
    view of the targets.

    Sent if the document is no longer relevant to a target and is out of
    view. Can be sent instead of a DocumentDelete or a DocumentChange if
    the server can not send the new value of the document.

    Multiple [DocumentRemove][google.firestore.v1.DocumentRemove]
    messages may be returned for the same logical write or delete, if
    multiple targets are affected.

    Attributes:
        document (str):
            The resource name of the
            [Document][google.firestore.v1.Document] that has gone out
            of view.
        removed_target_ids (MutableSequence[int]):
            A set of target IDs for targets that
            previously matched this document.
        read_time (google.protobuf.timestamp_pb2.Timestamp):
            The read timestamp at which the remove was observed.

            Greater or equal to the ``commit_time`` of the
            change/delete/remove.
    """

    document: str = proto.Field(
        proto.STRING,
        number=1,
    )
    removed_target_ids: MutableSequence[int] = proto.RepeatedField(
        proto.INT32,
        number=2,
    )
    read_time: timestamp_pb2.Timestamp = proto.Field(
        proto.MESSAGE,
        number=4,
        message=timestamp_pb2.Timestamp,
    )


class ExistenceFilter(proto.Message):
    r"""A digest of all the documents that match a given target.

    Attributes:
        target_id (int):
            The target ID to which this filter applies.
        count (int):
            The total count of documents that match
            [target_id][google.firestore.v1.ExistenceFilter.target_id].

            If different from the count of documents in the client that
            match, the client must manually determine which documents no
            longer match the target.

            The client can use the ``unchanged_names`` bloom filter to
            assist with this determination by testing ALL the document
            names against the filter; if the document name is NOT in the
            filter, it means the document no longer matches the target.
        unchanged_names (google.cloud.firestore_v1.types.BloomFilter):
            A bloom filter that, despite its name, contains the UTF-8
            byte encodings of the resource names of ALL the documents
            that match
            [target_id][google.firestore.v1.ExistenceFilter.target_id],
            in the form
            ``projects/{project_id}/databases/{database_id}/documents/{document_path}``.

            This bloom filter may be omitted at the server's discretion,
            such as if it is deemed that the client will not make use of
            it or if it is too computationally expensive to calculate or
            transmit. Clients must gracefully handle this field being
            absent by falling back to the logic used before this field
            existed; that is, re-add the target without a resume token
            to figure out which documents in the client's cache are out
            of sync.
    """

    target_id: int = proto.Field(
        proto.INT32,
        number=1,
    )
    count: int = proto.Field(
        proto.INT32,
        number=2,
    )
    unchanged_names: bloom_filter.BloomFilter = proto.Field(
        proto.MESSAGE,
        number=3,
        message=bloom_filter.BloomFilter,
    )


__all__ = tuple(sorted(__protobuf__.manifest))
