# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Provides platform search services implemented using the elastic search python
API.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from elasticsearch import Elasticsearch

import feconf
import json
import python_utils

# TODO: Add elastic search instance details.
es = Elasticsearch()


def create_index(index_name):
    """Creates an index on the elastic search instance.

    Args:
        index_name: str. The name of the index to insert the document into.

    Raises:
        ValueError. Invalid values are given as the index name.
    """
    if not isinstance(index_name, python_utils.BASESTRING):
        raise ValueError(
            'Index must be the unicode/str name of an index, got %s'
            % type(index_name))
    es.indices.create(index=index_name)


def add_documents_to_index(documents, index_name):
    """Adds a document to an index.

    Args:
        documents: list(dict). Each document should be a dictionary.
            Every key in the document is a field name, and the corresponding
            value will be the field's value.
            There MUST be a key named 'id', its value will be used as the
            document's id.
        index_name: str. The name of the index to insert the document into.

    Raises:
        SearchFailureError. Raised when the indexing fails.
        ValueError. Invalid values are given as the index name.
        ValueError. One or more of the documents does not contain an id.
    """
    if not isinstance(index_name, python_utils.BASESTRING):
        raise ValueError(
            'Index must be the unicode/str name of an index, got %s'
            % type(index_name))

    for document in documents:
        if 'id' not in documents:
            raise ValueError('Documents are required to have a document id.')

    for document in documents:
        response = es.index(
            index=index_name, id=document['id'], body=document)
        if response == None or response['_shards']['failed'] > 0:
            raise SearchFailureError(e)


def delete_documents_from_index(doc_ids, index_name):
    """Deletes documents from an index.

    Args:
        doc_ids: list(str). A list of document ids of documents to be deleted
            from the index.
        index_name: str. The name of the index to delete the document from.

    Raises:
        SearchFailureError. Raised when the deletion fails. If it fails for any
            document, none will be deleted.
        ValueError. The type of the index name or the document ids are not
            strings.
    """
    if not isinstance(index_name, python_utils.BASESTRING):
        raise ValueError(
            'Index must be the unicode/str name of an index, got %s'
            % type(index_name))

    for ind, doc_id in enumerate(doc_ids):
        if not isinstance(doc_id, python_utils.BASESTRING):
            raise ValueError(
                'all doc_ids must be string, got %s at index %d' % (
                    type(doc_id), ind))

    for doc_id in doc_ids:
        if es.exists(index=index_name, id=doc_id):
            res=es.delete(index=index_name, id=doc_id)
        else:
            logging.exception('Something went wrong during deletion.')
            raise SearchFailureError(e)


def clear_index(index_name):
    """Clears an index on the elastic search instance.

    Args:
        index_name: str. The name of the index to clear.

    Raises:
        ValueError. Invalid values are given as the index name.
    """
    # More details on clearing an index can be found here:
    # https://elasticsearch-py.readthedocs.io/en/master/api.html#elasticsearch.Elasticsearch.delete_by_query
    if not isinstance(index_name, python_utils.BASESTRING):
        raise ValueError(
            'Index must be the unicode/str name of an index, got %s'
            % type(index_name))

    es.delete_by_query(
        index=index_name,
        body={
            "query":
            {
                "match_all": {}
            }})


def search(
        query_string, index_name, offset=None,
        limit=feconf.SEARCH_RESULTS_PAGE_SIZE,
        ids_only=False):
    """Searches for documents matching the given query in the given index.
    NOTE: We cannot search through more than 10,000 documents by paginating
    using limit and offset. If the number of items to search through is greater,
    that 10,000, use scroll API instead.

    Args:
        query_string: str. The search definition using Query DSL.
        index_name: str. Use _all or empty string to perform the operation on
        all indices.
        offset: int. The offset. Pass this in to start at the 'offset' when
            searching through a list of results of max length 'limit'. Leave as
            None to start at the beginning.
        limit: int. The maximum number of documents to return.
        ids_only: bool. Whether to only return document ids.

    Returns:
        2-tuple of (result_docs, result_offset). Where:
            result_docs: list(dict). Represents search documents. If ids_only is
                True, this will be a list of strings, doc_ids.
            result_offset: int. The resulting offset to start at for the next
                page of results. Return None if there are no more pages.
    """
    query_definiton = json.loads(query_string)
    response = es.search(
        body=query_definiton, index=index_name, size=limit, from_=offset)
    offset = None
    if (len(response['hits']['hits']) != 0):
        offset = offset+limit

    if ids_only:
        result_docs = [doc['_id'] for doc in response['hits']['hits']]
    else:
        result_docs = [doc['_source'] for doc in response['hits']['hits']]
    return result_docs, offset



def get_document_from_index(doc_id, index_name):
    """Get the document with the given ID from the given index.

    Args:
        doc_id: str. The document id.
        index_name: str. The name of the index to clear.

    Raises:
        ValueError. Invalid values are given as the index name.
    """
    if not isinstance(index_name, python_utils.BASESTRING):
        raise ValueError(
            'Index must be the unicode/str name of an index, got %s'
            % type(index_name))

    res = es.get(index=index_name, id=doc_id)
    # The actual document is stored in the '_source' field.
    return res['_source']
