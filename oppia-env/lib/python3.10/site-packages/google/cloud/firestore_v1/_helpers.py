# Copyright 2017 Google LLC All rights reserved.
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

"""Common helpers shared across Google Cloud Firestore modules."""
from __future__ import annotations
import datetime
import json
from typing import (
    Any,
    Dict,
    Generator,
    Iterator,
    List,
    Optional,
    Sequence,
    Tuple,
    Union,
    cast,
    TYPE_CHECKING,
)

import grpc  # type: ignore
from google.api_core import gapic_v1
from google.api_core import retry as retries
from google.api_core.datetime_helpers import DatetimeWithNanoseconds
from google.cloud._helpers import _datetime_to_pb_timestamp  # type: ignore
from google.protobuf import struct_pb2
from google.protobuf.timestamp_pb2 import Timestamp  # type: ignore
from google.type import latlng_pb2  # type: ignore

import google
from google.cloud import exceptions  # type: ignore
from google.cloud.firestore_v1 import transforms, types
from google.cloud.firestore_v1.field_path import FieldPath, parse_field_path
from google.cloud.firestore_v1.types import common, document, write
from google.cloud.firestore_v1.types.write import DocumentTransform
from google.cloud.firestore_v1.vector import Vector

if TYPE_CHECKING:  # pragma: NO COVER
    from google.cloud.firestore_v1 import DocumentSnapshot

_EmptyDict: transforms.Sentinel
_GRPC_ERROR_MAPPING: dict


BAD_PATH_TEMPLATE = "A path element must be a string. Received {}, which is a {}."
DOCUMENT_PATH_DELIMITER = "/"
INACTIVE_TXN = "Transaction not in progress, cannot be used in API requests."
READ_AFTER_WRITE_ERROR = "Attempted read after write in a transaction."
BAD_REFERENCE_ERROR = (
    "Reference value {!r} in unexpected format, expected to be of the form "
    "``projects/{{project}}/databases/{{database}}/"
    "documents/{{document_path}}``."
)
WRONG_APP_REFERENCE = (
    "Document {!r} does not correspond to the same database " "({!r}) as the client."
)
REQUEST_TIME_ENUM = DocumentTransform.FieldTransform.ServerValue.REQUEST_TIME
_GRPC_ERROR_MAPPING = {
    grpc.StatusCode.ALREADY_EXISTS: exceptions.Conflict,
    grpc.StatusCode.NOT_FOUND: exceptions.NotFound,
}


class GeoPoint(object):
    """Simple container for a geo point value.

    Args:
        latitude (float): Latitude of a point.
        longitude (float): Longitude of a point.
    """

    def __init__(self, latitude, longitude) -> None:
        self.latitude = latitude
        self.longitude = longitude

    def to_protobuf(self) -> latlng_pb2.LatLng:
        """Convert the current object to protobuf.

        Returns:
            google.type.latlng_pb2.LatLng: The current point as a protobuf.
        """
        return latlng_pb2.LatLng(latitude=self.latitude, longitude=self.longitude)

    def __eq__(self, other):
        """Compare two geo points for equality.

        Returns:
            Union[bool, NotImplemented]: :data:`True` if the points compare
            equal, else :data:`False`. (Or :data:`NotImplemented` if
            ``other`` is not a geo point.)
        """
        if not isinstance(other, GeoPoint):
            return NotImplemented

        return self.latitude == other.latitude and self.longitude == other.longitude

    def __ne__(self, other):
        """Compare two geo points for inequality.

        Returns:
            Union[bool, NotImplemented]: :data:`False` if the points compare
            equal, else :data:`True`. (Or :data:`NotImplemented` if
            ``other`` is not a geo point.)
        """
        equality_val = self.__eq__(other)
        if equality_val is NotImplemented:
            return NotImplemented
        else:
            return not equality_val


def verify_path(path, is_collection) -> None:
    """Verifies that a ``path`` has the correct form.

    Checks that all of the elements in ``path`` are strings.

    Args:
        path (Tuple[str, ...]): The components in a collection or
            document path.
        is_collection (bool): Indicates if the ``path`` represents
            a document or a collection.

    Raises:
        ValueError: if

            * the ``path`` is empty
            * ``is_collection=True`` and there are an even number of elements
            * ``is_collection=False`` and there are an odd number of elements
            * an element is not a string
    """
    num_elements = len(path)
    if num_elements == 0:
        raise ValueError("Document or collection path cannot be empty")

    if is_collection:
        if num_elements % 2 == 0:
            raise ValueError("A collection must have an odd number of path elements")

    else:
        if num_elements % 2 == 1:
            raise ValueError("A document must have an even number of path elements")

    for element in path:
        if not isinstance(element, str):
            msg = BAD_PATH_TEMPLATE.format(element, type(element))
            raise ValueError(msg)


def encode_value(value) -> types.document.Value:
    """Converts a native Python value into a Firestore protobuf ``Value``.

    Args:
        value (Union[NoneType, bool, int, float, datetime.datetime, \
            str, bytes, dict, ~google.cloud.Firestore.GeoPoint, \
            ~google.cloud.firestore_v1.vector.Vector]): A native
            Python value to convert to a protobuf field.

    Returns:
        ~google.cloud.firestore_v1.types.Value: A
        value encoded as a Firestore protobuf.

    Raises:
        TypeError: If the ``value`` is not one of the accepted types.
    """
    if value is None:
        return document.Value(null_value=struct_pb2.NULL_VALUE)

    # Must come before int since ``bool`` is an integer subtype.
    if isinstance(value, bool):
        return document.Value(boolean_value=value)

    if isinstance(value, int):
        return document.Value(integer_value=value)

    if isinstance(value, float):
        return document.Value(double_value=value)

    if isinstance(value, DatetimeWithNanoseconds):
        return document.Value(timestamp_value=value.timestamp_pb())

    if isinstance(value, datetime.datetime):
        return document.Value(timestamp_value=_datetime_to_pb_timestamp(value))

    if isinstance(value, str):
        return document.Value(string_value=value)

    if isinstance(value, bytes):
        return document.Value(bytes_value=value)

    # NOTE: We avoid doing an isinstance() check for a Document
    #       here to avoid import cycles.
    document_path = getattr(value, "_document_path", None)
    if document_path is not None:
        return document.Value(reference_value=document_path)

    if isinstance(value, GeoPoint):
        return document.Value(geo_point_value=value.to_protobuf())

    if isinstance(value, (list, tuple, set, frozenset)):
        value_list = tuple(encode_value(element) for element in value)
        value_pb = document.ArrayValue(values=value_list)
        return document.Value(array_value=value_pb)

    if isinstance(value, Vector):
        return encode_value(value.to_map_value())

    if isinstance(value, dict):
        value_dict = encode_dict(value)
        value_pb = document.MapValue(fields=value_dict)
        return document.Value(map_value=value_pb)

    raise TypeError(
        "Cannot convert to a Firestore Value", value, "Invalid type", type(value)
    )


def encode_dict(values_dict) -> dict:
    """Encode a dictionary into protobuf ``Value``-s.

    Args:
        values_dict (dict): The dictionary to encode as protobuf fields.

    Returns:
        Dict[str, ~google.cloud.firestore_v1.types.Value]: A
        dictionary of string keys and ``Value`` protobufs as dictionary
        values.
    """
    return {key: encode_value(value) for key, value in values_dict.items()}


def document_snapshot_to_protobuf(
    snapshot: "DocumentSnapshot",
) -> Optional["google.cloud.firestore_v1.types.Document"]:
    from google.cloud.firestore_v1.types import Document

    if not snapshot.exists:
        return None

    return Document(
        name=snapshot.reference._document_path,
        fields=encode_dict(snapshot._data),
        create_time=snapshot.create_time,
        update_time=snapshot.update_time,
    )


class DocumentReferenceValue:
    """DocumentReference path container with accessors for each relevant chunk.

    Usage:
        doc_ref_val = DocumentReferenceValue(
            'projects/my-proj/databases/(default)/documents/my-col/my-doc',
        )
        assert doc_ref_val.project_name == 'my-proj'
        assert doc_ref_val.collection_name == 'my-col'
        assert doc_ref_val.document_id == 'my-doc'
        assert doc_ref_val.database_name == '(default)'

    Raises:
        ValueError: If the supplied value cannot satisfy a complete path.
    """

    def __init__(self, reference_value: str):
        self._reference_value = reference_value

        # The first 5 parts are
        # projects, {project}, databases, {database}, documents
        parts = reference_value.split(DOCUMENT_PATH_DELIMITER)
        if len(parts) < 7:
            msg = BAD_REFERENCE_ERROR.format(reference_value)
            raise ValueError(msg)

        self.project_name = parts[1]
        self.collection_name = parts[5]
        self.database_name = parts[3]
        self.document_id = "/".join(parts[6:])

    @property
    def full_key(self) -> str:
        """Computed property for a DocumentReference's collection_name and
        document Id"""
        return "/".join([self.collection_name, self.document_id])

    @property
    def full_path(self) -> str:
        return self._reference_value or "/".join(
            [
                "projects",
                self.project_name,
                "databases",
                self.database_name,
                "documents",
                self.collection_name,
                self.document_id,
            ]
        )


def reference_value_to_document(reference_value, client) -> Any:
    """Convert a reference value string to a document.

    Args:
        reference_value (str): A document reference value.
        client (:class:`~google.cloud.firestore_v1.client.Client`):
            A client that has a document factory.

    Returns:
        :class:`~google.cloud.firestore_v1.document.DocumentReference`:
            The document corresponding to ``reference_value``.

    Raises:
        ValueError: If the ``reference_value`` is not of the expected
            format: ``projects/{project}/databases/{database}/documents/...``.
        ValueError: If the ``reference_value`` does not come from the same
            project / database combination as the ``client``.
    """
    from google.cloud.firestore_v1.base_document import BaseDocumentReference

    doc_ref_value = DocumentReferenceValue(reference_value)

    document: BaseDocumentReference = client.document(doc_ref_value.full_key)
    if document._document_path != reference_value:
        msg = WRONG_APP_REFERENCE.format(reference_value, client._database_string)
        raise ValueError(msg)

    return document


def decode_value(
    value, client
) -> Union[
    None, bool, int, float, list, datetime.datetime, str, bytes, dict, GeoPoint, Vector
]:
    """Converts a Firestore protobuf ``Value`` to a native Python value.

    Args:
        value (google.cloud.firestore_v1.types.Value): A
            Firestore protobuf to be decoded / parsed / converted.
        client (:class:`~google.cloud.firestore_v1.client.Client`):
            A client that has a document factory.

    Returns:
        Union[NoneType, bool, int, float, datetime.datetime, \
            str, bytes, dict, ~google.cloud.Firestore.GeoPoint]: A native
        Python value converted from the ``value``.

    Raises:
        NotImplementedError: If the ``value_type`` is ``reference_value``.
        ValueError: If the ``value_type`` is unknown.
    """
    value_pb = getattr(value, "_pb", value)
    value_type = value_pb.WhichOneof("value_type")

    if value_type == "null_value":
        return None
    elif value_type == "boolean_value":
        return value_pb.boolean_value
    elif value_type == "integer_value":
        return value_pb.integer_value
    elif value_type == "double_value":
        return value_pb.double_value
    elif value_type == "timestamp_value":
        return DatetimeWithNanoseconds.from_timestamp_pb(value_pb.timestamp_value)
    elif value_type == "string_value":
        return value_pb.string_value
    elif value_type == "bytes_value":
        return value_pb.bytes_value
    elif value_type == "reference_value":
        return reference_value_to_document(value_pb.reference_value, client)
    elif value_type == "geo_point_value":
        return GeoPoint(
            value_pb.geo_point_value.latitude, value_pb.geo_point_value.longitude
        )
    elif value_type == "array_value":
        return [
            decode_value(element, client) for element in value_pb.array_value.values
        ]
    elif value_type == "map_value":
        return decode_dict(value_pb.map_value.fields, client)
    else:
        raise ValueError("Unknown ``value_type``", value_type)


def decode_dict(value_fields, client) -> Union[dict, Vector]:
    """Converts a protobuf map of Firestore ``Value``-s.

    Args:
        value_fields (google.protobuf.pyext._message.MessageMapContainer): A
            protobuf map of Firestore ``Value``-s.
        client (:class:`~google.cloud.firestore_v1.client.Client`):
            A client that has a document factory.

    Returns:
        Dict[str, Union[NoneType, bool, int, float, datetime.datetime, \
            str, bytes, dict, ~google.cloud.Firestore.GeoPoint]]: A dictionary
        of native Python values converted from the ``value_fields``.
    """
    value_fields_pb = getattr(value_fields, "_pb", value_fields)
    res = {key: decode_value(value, client) for key, value in value_fields_pb.items()}

    if res.get("__type__", None) == "__vector__":
        # Vector data type is represented as mapping.
        # {"__type__":"__vector__", "value": [1.0, 2.0, 3.0]}.
        values = cast(Sequence[float], res["value"])
        return Vector(values)

    return res


def get_doc_id(document_pb, expected_prefix) -> str:
    """Parse a document ID from a document protobuf.

    Args:
        document_pb (google.cloud.firestore_v1.\
            document.Document): A protobuf for a document that
            was created in a ``CreateDocument`` RPC.
        expected_prefix (str): The expected collection prefix for the
            fully-qualified document name.

    Returns:
        str: The document ID from the protobuf.

    Raises:
        ValueError: If the name does not begin with the prefix.
    """
    prefix, document_id = document_pb.name.rsplit(DOCUMENT_PATH_DELIMITER, 1)
    if prefix != expected_prefix:
        raise ValueError(
            "Unexpected document name",
            document_pb.name,
            "Expected to begin with",
            expected_prefix,
        )

    return document_id


_EmptyDict = transforms.Sentinel("Marker for an empty dict value")


def extract_fields(
    document_data, prefix_path: FieldPath, expand_dots=False
) -> Generator[Tuple[Any, Any], Any, None]:
    """Do depth-first walk of tree, yielding field_path, value"""
    if not document_data:
        yield prefix_path, _EmptyDict
    else:
        for key, value in sorted(document_data.items()):
            if expand_dots:
                sub_key = FieldPath.from_string(key)
            else:
                sub_key = FieldPath(key)

            field_path = FieldPath(*(prefix_path.parts + sub_key.parts))

            if isinstance(value, dict):
                for s_path, s_value in extract_fields(value, field_path):
                    yield s_path, s_value
            else:
                yield field_path, value


def set_field_value(document_data, field_path, value) -> None:
    """Set a value into a document for a field_path"""
    current = document_data
    for element in field_path.parts[:-1]:
        current = current.setdefault(element, {})
    if value is _EmptyDict:
        value = {}
    current[field_path.parts[-1]] = value


def get_field_value(document_data, field_path) -> Any:
    if not field_path.parts:
        raise ValueError("Empty path")

    current = document_data
    for element in field_path.parts[:-1]:
        current = current[element]
    return current[field_path.parts[-1]]


class DocumentExtractor(object):
    """Break document data up into actual data and transforms.

    Handle special values such as ``DELETE_FIELD``, ``SERVER_TIMESTAMP``.

    Args:
        document_data (dict):
            Property names and values to use for sending a change to
            a document.
    """

    def __init__(self, document_data) -> None:
        self.document_data = document_data
        self.field_paths = []
        self.deleted_fields = []
        self.server_timestamps = []
        self.array_removes = {}
        self.array_unions = {}
        self.increments = {}
        self.minimums = {}
        self.maximums = {}
        self.set_fields: dict = {}
        self.empty_document = False

        prefix_path = FieldPath()
        iterator = self._get_document_iterator(prefix_path)

        for field_path, value in iterator:
            if field_path == prefix_path and value is _EmptyDict:
                self.empty_document = True

            elif value is transforms.DELETE_FIELD:
                self.deleted_fields.append(field_path)

            elif value is transforms.SERVER_TIMESTAMP:
                self.server_timestamps.append(field_path)

            elif isinstance(value, transforms.ArrayRemove):
                self.array_removes[field_path] = value.values

            elif isinstance(value, transforms.ArrayUnion):
                self.array_unions[field_path] = value.values

            elif isinstance(value, transforms.Increment):
                self.increments[field_path] = value.value

            elif isinstance(value, transforms.Maximum):
                self.maximums[field_path] = value.value

            elif isinstance(value, transforms.Minimum):
                self.minimums[field_path] = value.value

            else:
                self.field_paths.append(field_path)
                set_field_value(self.set_fields, field_path, value)

    def _get_document_iterator(
        self, prefix_path: FieldPath
    ) -> Generator[Tuple[Any, Any], Any, None]:
        return extract_fields(self.document_data, prefix_path)

    @property
    def has_transforms(self):
        return bool(
            self.server_timestamps
            or self.array_removes
            or self.array_unions
            or self.increments
            or self.maximums
            or self.minimums
        )

    @property
    def transform_paths(self):
        return sorted(
            self.server_timestamps
            + list(self.array_removes)
            + list(self.array_unions)
            + list(self.increments)
            + list(self.maximums)
            + list(self.minimums)
        )

    def _get_update_mask(
        self, allow_empty_mask=False
    ) -> Optional[types.common.DocumentMask]:
        return None

    def get_update_pb(
        self, document_path, exists=None, allow_empty_mask=False
    ) -> types.write.Write:
        if exists is not None:
            current_document = common.Precondition(exists=exists)
        else:
            current_document = None

        update_pb = write.Write(
            update=document.Document(
                name=document_path, fields=encode_dict(self.set_fields)
            ),
            update_mask=self._get_update_mask(allow_empty_mask),
            current_document=current_document,
        )

        return update_pb

    def get_field_transform_pbs(
        self, document_path
    ) -> List[types.write.DocumentTransform.FieldTransform]:
        def make_array_value(values):
            value_list = [encode_value(element) for element in values]
            return document.ArrayValue(values=value_list)

        path_field_transforms = (
            [
                (
                    path,
                    write.DocumentTransform.FieldTransform(
                        field_path=path.to_api_repr(),
                        set_to_server_value=REQUEST_TIME_ENUM,
                    ),
                )
                for path in self.server_timestamps
            ]
            + [
                (
                    path,
                    write.DocumentTransform.FieldTransform(
                        field_path=path.to_api_repr(),
                        remove_all_from_array=make_array_value(values),
                    ),
                )
                for path, values in self.array_removes.items()
            ]
            + [
                (
                    path,
                    write.DocumentTransform.FieldTransform(
                        field_path=path.to_api_repr(),
                        append_missing_elements=make_array_value(values),
                    ),
                )
                for path, values in self.array_unions.items()
            ]
            + [
                (
                    path,
                    write.DocumentTransform.FieldTransform(
                        field_path=path.to_api_repr(), increment=encode_value(value)
                    ),
                )
                for path, value in self.increments.items()
            ]
            + [
                (
                    path,
                    write.DocumentTransform.FieldTransform(
                        field_path=path.to_api_repr(), maximum=encode_value(value)
                    ),
                )
                for path, value in self.maximums.items()
            ]
            + [
                (
                    path,
                    write.DocumentTransform.FieldTransform(
                        field_path=path.to_api_repr(), minimum=encode_value(value)
                    ),
                )
                for path, value in self.minimums.items()
            ]
        )
        return [transform for path, transform in sorted(path_field_transforms)]

    def get_transform_pb(self, document_path, exists=None) -> types.write.Write:
        field_transforms = self.get_field_transform_pbs(document_path)
        transform_pb = write.Write(
            transform=write.DocumentTransform(
                document=document_path, field_transforms=field_transforms
            )
        )
        if exists is not None:
            transform_pb._pb.current_document.CopyFrom(
                common.Precondition(exists=exists)._pb
            )

        return transform_pb


def pbs_for_create(document_path, document_data) -> List[types.write.Write]:
    """Make ``Write`` protobufs for ``create()`` methods.

    Args:
        document_path (str): A fully-qualified document path.
        document_data (dict): Property names and values to use for
            creating a document.

    Returns:
        List[google.cloud.firestore_v1.types.Write]: One or two
        ``Write`` protobuf instances for ``create()``.
    """
    extractor = DocumentExtractor(document_data)

    if extractor.deleted_fields:
        raise ValueError("Cannot apply DELETE_FIELD in a create request.")

    create_pb = extractor.get_update_pb(document_path, exists=False)

    if extractor.has_transforms:
        field_transform_pbs = extractor.get_field_transform_pbs(document_path)
        create_pb.update_transforms.extend(field_transform_pbs)

    return [create_pb]


def pbs_for_set_no_merge(document_path, document_data) -> List[types.write.Write]:
    """Make ``Write`` protobufs for ``set()`` methods.

    Args:
        document_path (str): A fully-qualified document path.
        document_data (dict): Property names and values to use for
            replacing a document.

    Returns:
        List[google.cloud.firestore_v1.types.Write]: One
        or two ``Write`` protobuf instances for ``set()``.
    """
    extractor = DocumentExtractor(document_data)

    if extractor.deleted_fields:
        raise ValueError(
            "Cannot apply DELETE_FIELD in a set request without "
            "specifying 'merge=True' or 'merge=[field_paths]'."
        )

    set_pb = extractor.get_update_pb(document_path)

    if extractor.has_transforms:
        field_transform_pbs = extractor.get_field_transform_pbs(document_path)
        set_pb.update_transforms.extend(field_transform_pbs)

    return [set_pb]


class DocumentExtractorForMerge(DocumentExtractor):
    """Break document data up into actual data and transforms."""

    def __init__(self, document_data) -> None:
        super(DocumentExtractorForMerge, self).__init__(document_data)
        self.data_merge: list = []
        self.transform_merge: list = []
        self.merge: list = []

    def _apply_merge_all(self) -> None:
        self.data_merge = sorted(self.field_paths + self.deleted_fields)
        # TODO: other transforms
        self.transform_merge = self.transform_paths
        self.merge = sorted(self.data_merge + self.transform_paths)

    def _construct_merge_paths(self, merge) -> Generator[Any, Any, None]:
        for merge_field in merge:
            if isinstance(merge_field, FieldPath):
                yield merge_field
            else:
                yield FieldPath(*parse_field_path(merge_field))

    def _normalize_merge_paths(self, merge) -> list:
        merge_paths = sorted(self._construct_merge_paths(merge))

        # Raise if any merge path is a parent of another.  Leverage sorting
        # to avoid quadratic behavior.
        for index in range(len(merge_paths) - 1):
            lhs, rhs = merge_paths[index], merge_paths[index + 1]
            if lhs.eq_or_parent(rhs):
                raise ValueError("Merge paths overlap: {}, {}".format(lhs, rhs))

        for merge_path in merge_paths:
            if merge_path in self.deleted_fields:
                continue
            try:
                get_field_value(self.document_data, merge_path)
            except KeyError:
                raise ValueError("Invalid merge path: {}".format(merge_path))

        return merge_paths

    def _apply_merge_paths(self, merge) -> None:
        if self.empty_document:
            raise ValueError("Cannot merge specific fields with empty document.")

        merge_paths = self._normalize_merge_paths(merge)

        del self.data_merge[:]
        del self.transform_merge[:]
        self.merge = merge_paths

        for merge_path in merge_paths:
            if merge_path in self.transform_paths:
                self.transform_merge.append(merge_path)

            for field_path in self.field_paths:
                if merge_path.eq_or_parent(field_path):
                    self.data_merge.append(field_path)

        # Clear out data for fields not merged.
        merged_set_fields: dict = {}
        for field_path in self.data_merge:
            value = get_field_value(self.document_data, field_path)
            set_field_value(merged_set_fields, field_path, value)
        self.set_fields = merged_set_fields

        unmerged_deleted_fields = [
            field_path
            for field_path in self.deleted_fields
            if field_path not in self.merge
        ]
        if unmerged_deleted_fields:
            raise ValueError(
                "Cannot delete unmerged fields: {}".format(unmerged_deleted_fields)
            )
        self.data_merge = sorted(self.data_merge + self.deleted_fields)

        # Keep only transforms which are within merge.
        merged_transform_paths = set()
        for merge_path in self.merge:
            tranform_merge_paths = [
                transform_path
                for transform_path in self.transform_paths
                if merge_path.eq_or_parent(transform_path)
            ]
            merged_transform_paths.update(tranform_merge_paths)

        self.server_timestamps = [
            path for path in self.server_timestamps if path in merged_transform_paths
        ]

        self.array_removes = {
            path: values
            for path, values in self.array_removes.items()
            if path in merged_transform_paths
        }

        self.array_unions = {
            path: values
            for path, values in self.array_unions.items()
            if path in merged_transform_paths
        }

    def apply_merge(self, merge) -> None:
        if merge is True:  # merge all fields
            self._apply_merge_all()
        else:
            self._apply_merge_paths(merge)

    def _get_update_mask(
        self, allow_empty_mask=False
    ) -> Optional[types.common.DocumentMask]:
        # Mask uses dotted / quoted paths.
        mask_paths = [
            field_path.to_api_repr()
            for field_path in self.merge
            if field_path not in self.transform_merge
        ]

        return common.DocumentMask(field_paths=mask_paths)


def pbs_for_set_with_merge(
    document_path, document_data, merge
) -> List[types.write.Write]:
    """Make ``Write`` protobufs for ``set()`` methods.

    Args:
        document_path (str): A fully-qualified document path.
        document_data (dict): Property names and values to use for
            replacing a document.
        merge (Optional[bool] or Optional[List<apispec>]):
            If True, merge all fields; else, merge only the named fields.

    Returns:
        List[google.cloud.firestore_v1.types.Write]: One
        or two ``Write`` protobuf instances for ``set()``.
    """
    extractor = DocumentExtractorForMerge(document_data)
    extractor.apply_merge(merge)

    set_pb = extractor.get_update_pb(document_path)

    if extractor.transform_paths:
        field_transform_pbs = extractor.get_field_transform_pbs(document_path)
        set_pb.update_transforms.extend(field_transform_pbs)

    return [set_pb]


class DocumentExtractorForUpdate(DocumentExtractor):
    """Break document data up into actual data and transforms."""

    def __init__(self, document_data) -> None:
        super(DocumentExtractorForUpdate, self).__init__(document_data)
        self.top_level_paths = sorted(
            [FieldPath.from_string(key) for key in document_data]
        )
        tops = set(self.top_level_paths)
        for top_level_path in self.top_level_paths:
            for ancestor in top_level_path.lineage():
                if ancestor in tops:
                    raise ValueError(
                        "Conflicting field path: {}, {}".format(
                            top_level_path, ancestor
                        )
                    )

        for field_path in self.deleted_fields:
            if field_path not in tops:
                raise ValueError(
                    "Cannot update with nest delete: {}".format(field_path)
                )

    def _get_document_iterator(
        self, prefix_path: FieldPath
    ) -> Generator[Tuple[Any, Any], Any, None]:
        return extract_fields(self.document_data, prefix_path, expand_dots=True)

    def _get_update_mask(self, allow_empty_mask=False) -> types.common.DocumentMask:
        mask_paths = []
        for field_path in self.top_level_paths:
            if field_path not in self.transform_paths:
                mask_paths.append(field_path.to_api_repr())

        return common.DocumentMask(field_paths=mask_paths)


def pbs_for_update(document_path, field_updates, option) -> List[types.write.Write]:
    """Make ``Write`` protobufs for ``update()`` methods.

    Args:
        document_path (str): A fully-qualified document path.
        field_updates (dict): Field names or paths to update and values
            to update with.
        option (optional[:class:`~google.cloud.firestore_v1.client.WriteOption`]):
            A write option to make assertions / preconditions on the server
            state of the document before applying changes.

    Returns:
        List[google.cloud.firestore_v1.types.Write]: One
        or two ``Write`` protobuf instances for ``update()``.
    """
    extractor = DocumentExtractorForUpdate(field_updates)

    if extractor.empty_document:
        raise ValueError("Cannot update with an empty document.")

    if option is None:  # Default is to use ``exists=True``.
        option = ExistsOption(exists=True)

    update_pb = extractor.get_update_pb(document_path)
    option.modify_write(update_pb)

    if extractor.has_transforms:
        field_transform_pbs = extractor.get_field_transform_pbs(document_path)
        update_pb.update_transforms.extend(field_transform_pbs)

    return [update_pb]


def pb_for_delete(document_path, option) -> types.write.Write:
    """Make a ``Write`` protobuf for ``delete()`` methods.

    Args:
        document_path (str): A fully-qualified document path.
        option (optional[:class:`~google.cloud.firestore_v1.client.WriteOption`]):
            A write option to make assertions / preconditions on the server
            state of the document before applying changes.

    Returns:
        google.cloud.firestore_v1.types.Write: A
        ``Write`` protobuf instance for the ``delete()``.
    """
    write_pb = write.Write(delete=document_path)
    if option is not None:
        option.modify_write(write_pb)

    return write_pb


class ReadAfterWriteError(Exception):
    """Raised when a read is attempted after a write.

    Raised by "read" methods that use transactions.
    """


def get_transaction_id(transaction, read_operation=True) -> Union[bytes, None]:
    """Get the transaction ID from a ``Transaction`` object.

    Args:
        transaction (Optional[:class:`~google.cloud.firestore_v1.transaction.\
            Transaction`]):
            An existing transaction that this query will run in.
        read_operation (Optional[bool]): Indicates if the transaction ID
            will be used in a read operation. Defaults to :data:`True`.

    Returns:
        Optional[bytes]: The ID of the transaction, or :data:`None` if the
        ``transaction`` is :data:`None`.

    Raises:
        ValueError: If the ``transaction`` is not in progress (only if
            ``transaction`` is not :data:`None`).
        ReadAfterWriteError: If the ``transaction`` has writes stored on
            it and ``read_operation`` is :data:`True`.
    """
    if transaction is None:
        return None
    else:
        if not transaction.in_progress:
            raise ValueError(INACTIVE_TXN)
        if read_operation and len(transaction._write_pbs) > 0:
            raise ReadAfterWriteError(READ_AFTER_WRITE_ERROR)
        return transaction.id


def metadata_with_prefix(prefix: str, **kw) -> List[Tuple[str, str]]:
    """Create RPC metadata containing a prefix.

    Args:
        prefix (str): appropriate resource path.

    Returns:
        List[Tuple[str, str]]: RPC metadata with supplied prefix
    """
    return [("google-cloud-resource-prefix", prefix)]


class WriteOption(object):
    """Option used to assert a condition on a write operation."""

    def modify_write(self, write, no_create_msg=None) -> None:
        """Modify a ``Write`` protobuf based on the state of this write option.

        This is a virtual method intended to be implemented by subclasses.

        Args:
            write (google.cloud.firestore_v1.types.Write): A
                ``Write`` protobuf instance to be modified with a precondition
                determined by the state of this option.
            no_create_msg (Optional[str]): A message to use to indicate that
                a create operation is not allowed.

        Raises:
            NotImplementedError: Always, this method is virtual.
        """
        raise NotImplementedError


class LastUpdateOption(WriteOption):
    """Option used to assert a "last update" condition on a write operation.

    This will typically be created by
    :meth:`~google.cloud.firestore_v1.client.Client.write_option`.

    Args:
        last_update_time (google.protobuf.timestamp_pb2.Timestamp): A
            timestamp. When set, the target document must exist and have
            been last updated at that time. Protobuf ``update_time`` timestamps
            are typically returned from methods that perform write operations
            as part of a "write result" protobuf or directly.
    """

    def __init__(self, last_update_time) -> None:
        self._last_update_time = last_update_time

    def __eq__(self, other):
        if not isinstance(other, self.__class__):
            return NotImplemented
        return self._last_update_time == other._last_update_time

    def modify_write(self, write, *unused_args, **unused_kwargs) -> None:
        """Modify a ``Write`` protobuf based on the state of this write option.

        The ``last_update_time`` is added to ``write_pb`` as an "update time"
        precondition. When set, the target document must exist and have been
        last updated at that time.

        Args:
            write_pb (google.cloud.firestore_v1.types.Write): A
                ``Write`` protobuf instance to be modified with a precondition
                determined by the state of this option.
            unused_kwargs (Dict[str, Any]): Keyword arguments accepted by
                other subclasses that are unused here.
        """
        current_doc = types.Precondition(update_time=self._last_update_time)
        write._pb.current_document.CopyFrom(current_doc._pb)


class ExistsOption(WriteOption):
    """Option used to assert existence on a write operation.

    This will typically be created by
    :meth:`~google.cloud.firestore_v1.client.Client.write_option`.

    Args:
        exists (bool): Indicates if the document being modified
            should already exist.
    """

    def __init__(self, exists) -> None:
        self._exists = exists

    def __eq__(self, other):
        if not isinstance(other, self.__class__):
            return NotImplemented
        return self._exists == other._exists

    def modify_write(self, write, *unused_args, **unused_kwargs) -> None:
        """Modify a ``Write`` protobuf based on the state of this write option.

        If:

        * ``exists=True``, adds a precondition that requires existence
        * ``exists=False``, adds a precondition that requires non-existence

        Args:
            write (google.cloud.firestore_v1.types.Write): A
                ``Write`` protobuf instance to be modified with a precondition
                determined by the state of this option.
            unused_kwargs (Dict[str, Any]): Keyword arguments accepted by
                other subclasses that are unused here.
        """
        current_doc = types.Precondition(exists=self._exists)
        write._pb.current_document.CopyFrom(current_doc._pb)


def make_retry_timeout_kwargs(
    retry: retries.Retry | retries.AsyncRetry | object | None, timeout: float | None
) -> dict:
    """Helper fo API methods which take optional 'retry' / 'timeout' args."""
    kwargs = {}

    if retry is not gapic_v1.method.DEFAULT:
        kwargs["retry"] = retry

    if timeout is not None:
        kwargs["timeout"] = timeout

    return kwargs


def build_timestamp(
    dt: Optional[Union[DatetimeWithNanoseconds, datetime.datetime]] = None
) -> Timestamp:
    """Returns the supplied datetime (or "now") as a Timestamp"""
    return _datetime_to_pb_timestamp(
        dt or DatetimeWithNanoseconds.now(tz=datetime.timezone.utc)
    )


def compare_timestamps(
    ts1: Union[Timestamp, datetime.datetime],
    ts2: Union[Timestamp, datetime.datetime],
) -> int:
    ts1 = build_timestamp(ts1) if not isinstance(ts1, Timestamp) else ts1
    ts2 = build_timestamp(ts2) if not isinstance(ts2, Timestamp) else ts2
    ts1_nanos = ts1.nanos + ts1.seconds * 1e9
    ts2_nanos = ts2.nanos + ts2.seconds * 1e9
    if ts1_nanos == ts2_nanos:
        return 0
    return 1 if ts1_nanos > ts2_nanos else -1


def deserialize_bundle(
    serialized: Union[str, bytes],
    client: "google.cloud.firestore_v1.client.BaseClient",
) -> "google.cloud.firestore_bundle.FirestoreBundle":
    """Inverse operation to a `FirestoreBundle` instance's `build()` method.

    Args:
        serialized (Union[str, bytes]): The result of `FirestoreBundle.build()`.
            Should be a list of dictionaries in string format.
        client (BaseClient): A connected Client instance.

    Returns:
        FirestoreBundle: A bundle equivalent to that which called `build()` and
            initially created the `serialized` value.

    Raises:
        ValueError: If any of the dictionaries in the list contain any more than
            one top-level key.
        ValueError: If any unexpected BundleElement types are encountered.
        ValueError: If the serialized bundle ends before expected.
    """
    from google.cloud.firestore_bundle import BundleElement, FirestoreBundle

    # Outlines the legal transitions from one BundleElement to another.
    bundle_state_machine = {
        "__initial__": ["metadata"],
        "metadata": ["namedQuery", "documentMetadata", "__end__"],
        "namedQuery": ["namedQuery", "documentMetadata", "__end__"],
        "documentMetadata": ["document"],
        "document": ["documentMetadata", "__end__"],
    }
    allowed_next_element_types: List[str] = bundle_state_machine["__initial__"]

    # This must be saved and added last, since we cache it to preserve timestamps,
    # yet must flush it whenever a new document or query is added to a bundle.
    # The process of deserializing a bundle uses these methods which flush a
    # cached metadata element, and thus, it must be the last BundleElement
    # added during deserialization.
    metadata_bundle_element: Optional[BundleElement] = None

    bundle: Optional[FirestoreBundle] = None
    data: Dict
    for data in _parse_bundle_elements_data(serialized):
        # BundleElements are serialized as JSON containing one key outlining
        # the type, with all further data nested under that key
        keys: List[str] = list(data.keys())

        if len(keys) != 1:
            raise ValueError("Expected serialized BundleElement with one top-level key")

        key: str = keys[0]

        if key not in allowed_next_element_types:
            raise ValueError(
                f"Encountered BundleElement of type {key}. "
                f"Expected one of {allowed_next_element_types}"
            )

        # Create and add our BundleElement
        bundle_element: BundleElement
        try:
            bundle_element = BundleElement.from_json(json.dumps(data))
        except AttributeError as e:
            # Some bad serialization formats cannot be universally deserialized.
            if e.args[0] == "'dict' object has no attribute 'find'":  # pragma: NO COVER
                raise ValueError(
                    "Invalid serialization of datetimes. "
                    "Cannot deserialize Bundles created from the NodeJS SDK."
                )
            raise e  # pragma: NO COVER

        if bundle is None:
            # This must be the first bundle type encountered
            assert key == "metadata"
            bundle = FirestoreBundle(data[key]["id"])
            metadata_bundle_element = bundle_element

        else:
            bundle._add_bundle_element(bundle_element, client=client, type=key)

        # Update the allowed next BundleElement types
        allowed_next_element_types = bundle_state_machine[key]

    if "__end__" not in allowed_next_element_types:
        raise ValueError("Unexpected end to serialized FirestoreBundle")
    # state machine guarantees bundle and metadata have been populated
    bundle = cast(FirestoreBundle, bundle)
    metadata_bundle_element = cast(BundleElement, metadata_bundle_element)
    # Now, finally add the metadata element
    bundle._add_bundle_element(
        metadata_bundle_element,
        client=client,
        type="metadata",
    )

    return bundle


def _parse_bundle_elements_data(
    serialized: Union[str, bytes]
) -> Generator[Dict, None, None]:
    """Reads through a serialized FirestoreBundle and yields JSON chunks that
    were created via `BundleElement.to_json(bundle_element)`.

    Serialized FirestoreBundle instances are length-prefixed JSON objects, and
    so are of the form "123{...}57{...}"
    To correctly and safely read a bundle, we must first detect these length
    prefixes, read that many bytes of data, and attempt to JSON-parse that.

    Raises:
        ValueError: If a chunk of JSON ever starts without following a length
            prefix.
    """
    _serialized: Iterator[int] = iter(
        serialized if isinstance(serialized, bytes) else serialized.encode("utf-8")
    )

    length_prefix: str = ""
    while True:
        byte: Optional[int] = next(_serialized, None)

        if byte is None:
            return None

        _str: str = chr(byte)
        if _str.isnumeric():
            length_prefix += _str
        else:
            if length_prefix == "":
                raise ValueError("Expected length prefix")

            _length_prefix = int(length_prefix)
            length_prefix = ""
            _bytes = bytearray([byte])
            _counter = 1
            while _counter < _length_prefix:
                _bytes.append(next(_serialized))
                _counter += 1

            yield json.loads(_bytes.decode("utf-8"))


def _get_documents_from_bundle(
    bundle, *, query_name: Optional[str] = None
) -> Generator["DocumentSnapshot", None, None]:
    from google.cloud.firestore_bundle.bundle import _BundledDocument

    bundled_doc: _BundledDocument
    for bundled_doc in bundle.documents.values():
        if query_name and query_name not in bundled_doc.metadata.queries:
            continue
        yield bundled_doc.snapshot


def _get_document_from_bundle(
    bundle,
    *,
    document_id: str,
) -> Optional["DocumentSnapshot"]:
    bundled_doc = bundle.documents.get(document_id)
    if bundled_doc:
        return bundled_doc.snapshot
    else:
        return None
