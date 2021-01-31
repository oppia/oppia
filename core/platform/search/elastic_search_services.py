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

import feconf
import python_utils

import elasticsearch

ES = elasticsearch.Elasticsearch(
    ('localhost:%s' % feconf.ES_LOCALHOST_PORT)
    if feconf.ES_CLOUD_ID is None else None,
    cloud_id=feconf.ES_CLOUD_ID,
    http_auth=(
        (feconf.ES_USERNAME, feconf.ES_PASSWORD)
        if feconf.ES_CLOUD_ID else None))


def _create_index(index_name):
    """Creates a new index.

    Args:
        index_name: str. The name of the index to create.

    Raises:
        elasticsearch.RequestError. The index already exists.
    """
    assert isinstance(index_name, python_utils.BASESTRING)
    ES.indices.create(index_name)


def add_documents_to_index(documents, index_name):
    """Adds a document to an index. This function also creates the index if it
    does not exist yet.

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
        try:
            response = ES.index(index_name, document, id=document['id'])
        except elasticsearch.NotFoundError:
            # The index does not exist yet. Create it and repeat the operation.
            _create_index(index_name)
            response = ES.index(index_name, document, id=document['id'])

        if response is None or response['_shards']['failed'] > 0:
            raise Exception(
                'Failed to add document to index.')


def delete_documents_from_index(doc_ids, index_name):
    """Deletes documents from an index. Any documents which do not already
    exist in the index are ignored.

    Args:
        doc_ids: list(str). A list of document ids of documents to be deleted
            from the index.
        index_name: str. The name of the index to delete the document from.
    """
    assert isinstance(index_name, python_utils.BASESTRING)
    for doc_id in doc_ids:
        assert isinstance(doc_id, python_utils.BASESTRING)

    for doc_id in doc_ids:
        try:
            document_exists_in_index = ES.exists(index_name, doc_id)
        except elasticsearch.NotFoundError:
            # The index does not exist yet. Create it and set
            # document_exists_in_index to False.
            _create_index(index_name)
            document_exists_in_index = False

        if document_exists_in_index:
            ES.delete(index_name, doc_id)


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
        query_string, index_name, categories, language_codes, offset=None,
        size=feconf.SEARCH_RESULTS_PAGE_SIZE, ids_only=False):
    """Searches for documents matching the given query in the given index.
    NOTE: We cannot search through more than 10,000 results from a search by
    paginating using size and offset. If the number of items to search through
    is greater that 10,000, use the elasticsearch scroll API instead.

    This function also creates the index if it does not exist yet.

    TODO(#11314): Change the offset argument to an int once the dependency
    on gae_search_services.py is removed from the codebase.

    Args:
        query_string: str. The terms that the user is searching for.
        index_name: str. The name of the index. Use '_all' or empty string to
            perform the operation on all indices.
        categories: list(str). The list of categories to query for. If it is
            empty, no category filter is applied to the results. If it is not
            empty, then a result is considered valid if it matches at least one
            of these categories.
        language_codes: list(str). The list of language codes to query for. If
            it is empty, no language code filter is applied to the results. If
            it is not empty, then a result is considered valid if it matches at
            least one of these language codes.
        offset: str|None. The offset into the index. Pass this in to start at
            the 'offset' when searching through a list of results of max length
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
            resulting_offset: str. The resulting offset to start at for the next
                section of the results. Returns None if there are no more
                results.
    """
    if offset is None:
        offset = '0'

    # Convert the query into a Query DSL object. See
    # elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html
    # for more details about Query DSL.
    query_definition = {
        'query': {
            'bool': {
                'must': [],
                'filter': [],
            }
        },
        'sort': [{
            'rank': {
                'order': 'desc',
                'missing': '_last',
                'unmapped_type': 'float',
            }
        }],
    }
    if query_string:
        query_definition['query']['bool']['must'] = [{
            'multi_match': {
                'query': query_string,
            }
        }]
    if categories:
        category_string = ' '.join(['"%s"' % cat for cat in categories])
        query_definition['query']['bool']['filter'].append(
            {'match': {'category': category_string}}
        )
    if language_codes:
        language_code_string = ' '.join(['"%s"' % lc for lc in language_codes])
        query_definition['query']['bool']['filter'].append(
            {'match': {'language_code': language_code_string}}
        )

    # Fetch (size + 1) results in order to decide whether a "next
    # page" offset needs to be returned.
    num_docs_to_fetch = size + 1

    try:
        response = ES.search(
            body=query_definition, index=index_name,
            params={
                'size': num_docs_to_fetch,
                'from': int(offset)
            })
    except elasticsearch.NotFoundError:
        # The index does not exist yet. Create it and return an empty result.
        _create_index(index_name)
        return [], None

    matched_search_docs = response['hits']['hits']

    # TODO(#11314): Convert all offsets in this function to ints once the
    # elasticsearch migration is fully complete.
    resulting_offset = None
    if len(matched_search_docs) == num_docs_to_fetch:
        # There is at least one more page of results to fetch. Trim the results
        # in this call to the desired size.
        matched_search_docs = matched_search_docs[:size]
        resulting_offset = python_utils.UNICODE(int(offset) + size)

    if ids_only:
        result_docs = [doc['_id'] for doc in matched_search_docs]
    else:
        # Each dictionary(document) stored in doc['_source'] also contains an
        # attribute '_id' which contains the document id.
        result_docs = [doc['_source'] for doc in matched_search_docs]
    return result_docs, resulting_offset
