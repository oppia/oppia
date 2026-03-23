# Copyright (C) 2019-2021 Zilliz. All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
# in compliance with the License. You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License
# is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
# or implied. See the License for the specific language governing permissions and limitations under
# the License.

import copy
from typing import Dict, Optional, TypeVar

from pymilvus.exceptions import CollectionNotExistException, ExceptionsMessage
from pymilvus.settings import Config

Index = TypeVar("Index")
Collection = TypeVar("Collection")


class Index:
    def __init__(
        self,
        collection: Collection,
        field_name: str,
        index_params: Dict,
        **kwargs,
    ) -> Index:
        """Creates index on a specified field according to the index parameters.

        Args:
            collection(Collection): The collection in which the index is created
            field_name(str): The name of the field to create an index for.
            index_params(dict): Indexing parameters.
            kwargs:
                * *index_name* (``str``) --
                  The name of index which will be created. If no index name is specified,
                  default index name will be used.

        Raises:
            MilvusException: If anything goes wrong.

        Examples:
            >>> from pymilvus import *
            >>> from pymilvus.schema import *
            >>> from pymilvus.types import DataType
            >>> connections.connect()
            <pymilvus.client.stub.Milvus object at 0x7fac15e53470>
            >>> field1 = FieldSchema("int64", DataType.INT64, is_primary=True)
            >>> field2 = FieldSchema("fvec", DataType.FLOAT_VECTOR, is_primary=False, dim=128)
            >>> schema = CollectionSchema(fields=[field1, field2])
            >>> collection = Collection(name='test_collection', schema=schema)
            >>> # insert some data
            >>> index_params = {
            ...     "index_type": "IVF_FLAT",
            ...     "metric_type": "L2",
            ...     "params": {"nlist": 128}}
            >>> index = Index(collection, "fvec", index_params)
            >>> index.params
            {'index_type': 'IVF_FLAT', 'metric_type': 'L2', 'params': {'nlist': 128}}
            >>> index.collection_name
            test_collection
            >>> index.field_name
            fvec
            >>> index.drop()
        """
        # ruff: noqa: PLC0415
        from .collection import Collection

        if not isinstance(collection, Collection):
            raise CollectionNotExistException(message=ExceptionsMessage.CollectionType)
        self._collection = collection
        self._field_name = field_name
        self._index_params = index_params
        self._index_name = kwargs.get("index_name", Config.IndexName)
        if kwargs.get("construct_only", False):
            return

        conn = self._get_connection()
        conn.create_index(self._collection.name, self._field_name, self._index_params, **kwargs)
        indexes = conn.list_indexes(self._collection.name)
        for index in indexes:
            if index.field_name == self._field_name:
                self._index_name = index.index_name
                break

    def _get_connection(self):
        return self._collection._get_connection()

    @property
    def params(self) -> dict:
        """dict: The index parameters"""
        return copy.deepcopy(self._index_params)

    @property
    def collection_name(self) -> str:
        """str: The corresponding collection name"""
        return self._collection.name

    @property
    def field_name(self) -> str:
        """str: The corresponding field name."""
        return self._field_name

    @property
    def index_name(self) -> str:
        """str: The corresponding index name."""
        return self._index_name

    def __eq__(self, other: Index) -> bool:
        """The order of the fields of index must be consistent."""
        return self.to_dict() == other.to_dict()

    def to_dict(self):
        """Put collection name, field name and index params into dict."""
        return {
            "collection": self._collection._name,
            "field": self._field_name,
            "index_name": self._index_name,
            "index_param": self.params,
        }

    def drop(self, timeout: Optional[float] = None, **kwargs):
        """Drop an index and its corresponding index files.

        Args:
            timeout(float, optional): An optional duration of time in seconds to allow
                for the RPC. When timeout is set to None, client waits until server response
                or error occur
        """
        conn = self._get_connection()
        conn.drop_index(
            collection_name=self._collection.name,
            field_name=self.field_name,
            index_name=self.index_name,
            timeout=timeout,
        )
