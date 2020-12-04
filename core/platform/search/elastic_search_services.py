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

import json

import feconf
import python_utils

import elasticsearch

# https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules.html#index-max-result-window
# This is the maximum number of results that can be returned for any given
# search query. This number is equal to the size 'index.max_result_window' and
# defines the maximum the sum of the parameters (size + from) can be. If
# needed, we will have to change this to use the search_after parameter or
# scrolling option as mentioned in the link above.
MAXIMUM_NUMBER_OF_RESULTS = 10000
ES = elasticsearch.Elasticsearch()


def add_documents_to_index(documents, index_name):
    """Adds a document to an index.

    Args:
        documents: list(dict). Each document should be a dictionary. Every key
            in the document is a field name, and the corresponding value will be
            the field's value. There MUST be a key named 'id', its value will be
            used as the document's id.
        index_name: str. The name of the index to insert the document into.

    Raises:
        Exception. A document cannot be added to the index.
    """
    assert isinstance(index_name, python_utils.BASESTRING)

    for document in documents:
        assert 'id' in document
    for document in documents:
        response = ES.index(
            index_name, document, id=document['id'])
        if response is None or response['_shards']['failed'] > 0:
            raise Exception(
                'Failed to add document to index.')


def delete_documents_from_index(doc_ids, index_name):
    """Deletes documents from an index.

    Args:
        doc_ids: list(str). A list of document ids of documents to be deleted
            from the index.
        index_name: str. The name of the index to delete the document from.

    Raises:
        Exception. Document id does not exist.
    """
    assert isinstance(index_name, python_utils.BASESTRING)
    for doc_id in doc_ids:
        assert isinstance(doc_id, python_utils.BASESTRING)

    for doc_id in doc_ids:
        if ES.exists(index_name, doc_id):
            ES.delete(index_name, doc_id)
        else:
            raise Exception(
                'Document id does not exist: %s' % doc_id)


def clear_index(index_name):
    """Clears an index on the elastic search instance.

    Args:
        index_name: str. The name of the index to clear.
    """
    assert isinstance(index_name, python_utils.BASESTRING)
    # More details on clearing an index can be found here:
    # https://elasticsearch-py.readthedocs.io/en/master/api.html#elasticsearch.Elasticsearch.delete_by_query
    # https://stackoverflow.com/questions/57778438/delete-all-documents-from-elasticsearch-index-in-python-3-x
    ES.delete_by_query(
        index_name,
        {
            'query':
                {
                    'match_all': {}
                }
        })


def search(
        query_string, index_name, cursor=None, offset=0,
        size=feconf.SEARCH_RESULTS_PAGE_SIZE, ids_only=False):
    """Searches for documents matching the given query in the given index.
    NOTE: We cannot search through more than 10,000 results from a search by
    paginating using size and offset. If the number of items to search through
    is greater that 10,000, use the elasticsearch scroll API instead.

    TODO(#11314): Get rid of the cursor argument completely once the dependency
    on gae_search_services.py is removed from the codebase.

    Args:
        query_string: str. A JSON-encoded string representation of the
            dictionary search definition that uses Query DSL. See
            elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html
            for more details about Query DSL.
        index_name: str. The name of the index. Use '_all' or empty string to
            perform the operation on all indices.
        cursor: str|None. Not used in this implementation.
        offset: int. The offset into the index. Pass this in to start at the
            'offset' when searching through a list of results of max length
            'size'. Leave as None to start at the beginning.
        size: int. The maximum number of documents to return.
        ids_only: bool. Whether to only return document ids.

    Returns:
        2-tuple of (result_docs, resulting_offset). Where:
            result_docs: list(dict)|list(str). Represents search documents. If
                'ids_only' is True, this will be a list of strings corresponding
                to the search document ids. If 'ids_only' is False, the full
                dictionaries representing each document retrieved from the
                elastic search instance will be returned. The document id will
                be contained as the '_id' attribute in each document.
            resulting_offset: int. The resulting offset to start at for the next
                section of the results. Returns None if there are no more
                results.
    """
    assert cursor is None
    assert offset + size < MAXIMUM_NUMBER_OF_RESULTS
    query_definiton = json.loads(query_string)
    response = ES.search(
        body=query_definiton, index=index_name,
        params={
            'size': size,
            'from': offset
        })
    resulting_offset = None
    if len(response['hits']['hits']) != 0:
        resulting_offset = offset + size
    if ids_only:
        result_docs = [doc['_id'] for doc in response['hits']['hits']]
    else:
        # Each dictionary(document) stored in doc['_source'] also contains an
        # attribute '_id' which contains the document id.
        result_docs = [doc['_source'] for doc in response['hits']['hits']]
    return result_docs, resulting_offset


def get_document_from_index(doc_id, index_name):
    """Get the document with the given ID from the given index.

    Args:
        doc_id: str. The document id.
        index_name: str. The name of the index to clear.

    Returns:
        dict. The document in a dictionary format.
    """
    assert isinstance(index_name, python_utils.BASESTRING)

    res = ES.get(index_name, doc_id)
    # The actual document is stored in the '_source' field.
    return res['_source']
