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

from __future__ import annotations

from core import feconf
from core.domain import (
    platform_parameter_list,
    platform_parameter_services,
    search_services,
)
from core.platform import models

import elasticsearch
from typing import Any, Dict, List, Mapping, Optional, Sequence, Tuple

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services, secrets_services

secrets_services = models.Registry.import_secrets_services()
datastore_services = models.Registry.import_datastore_services()


class ElasticSearchClient:
    """Creates an Elastic Search Client."""

    def __init__(self) -> None:
        self._client: Optional[elasticsearch.Elasticsearch] = None

    def get_client(self) -> elasticsearch.Elasticsearch:
        """Creates and returns elastic search client."""
        if self._client is None:
            with datastore_services.get_ndb_context():
                es_cloud_id = (
                    platform_parameter_services.get_platform_parameter_value(
                        platform_parameter_list.ParamName.ES_CLOUD_ID.value
                    )
                )
                es_username = (
                    platform_parameter_services.get_platform_parameter_value(
                        platform_parameter_list.ParamName.ES_USERNAME.value
                    )
                )

                es_password = secrets_services.get_secret('ES_PASSWORD') or ''

                # Use cloud setup if cloud_id is present, otherwise fall back to local.
                # Only one of cloud_id or hosts can be used with the Elasticsearch v8 client.

                cloud_id = es_cloud_id or None
                hosts = (
                    None
                    if es_cloud_id
                    else [f'http://{feconf.ES_HOST}:{feconf.ES_LOCALHOST_PORT}']
                )
                verify_certs = bool(es_cloud_id)

                self._client = elasticsearch.Elasticsearch(
                    cloud_id=cloud_id,
                    hosts=hosts,
                    basic_auth=(es_username, es_password),
                    request_timeout=30,
                    verify_certs=verify_certs,
                )

        return self._client


ES = ElasticSearchClient()


# The minimum length of a single-token query that triggers split-word
# generation. This avoids splitting short acronyms or tiny words.
_MIN_SINGLE_TOKEN_QUERY_LENGTH_FOR_SPLITS = 4
# The maximum length of a query that triggers split-word generation.
# A query of length N generates N-3 possible 2-way splits. This limit (50)
# ensures we generate at most 47 'should' clauses, which is performant
# and stays well within the default Elasticsearch 'max_clause_count' (1024)
# while covering almost any practical search concatenation (>10 words).
_MAX_SINGLE_TOKEN_QUERY_LENGTH_FOR_SPLITS = 50


class SearchException(Exception):
    """Exception used when some search operation is unsuccessful."""

    pass


# Here we use type Any because the query_definition is a dictionary having
# values of various types.
# This can be seen from the type stubs of elastic search.
# The type of 'body' is 'Any'.
# https://github.com/elastic/elasticsearch-py/blob/acf1e0d94e083c85bb079564d17ff7ee29cf28f6/elasticsearch/client/__init__.pyi#L768
def _fetch_response_from_elastic_search(
    query_definition: Dict[str, Any],
    index_name: str,
    offset: int,
    size: int,
) -> Tuple[List[str], Optional[int]]:
    """Searches for documents matching the given query in the given index.
    NOTE: We cannot search through more than 10,000 results from a search by
    paginating using size and offset. If the number of items to search through
    is greater that 10,000, use the elasticsearch scroll API instead.

    This function also creates the index if it does not exist yet.

    Args:
        query_definition: dict(str, any). The Query DSL object.
        index_name: str. The name of the index. Use '_all' or empty string to
            perform the operation on all indices.
        offset: int|None. The offset into the index. Pass this in to start at
            the 'offset' when searching through a list of results of max length
            'size'. Leave as None to start at the beginning.
        size: int. The maximum number of documents to return.

    Returns:
        2-tuple of (result_ids, resulting_offset). Where:
            result_ids: list(str). Represents search documents, this will be a
                list of strings corresponding to the search document ids.
            resulting_offset: int. The resulting offset to start at for the next
                section of the results. Returns None if there are no more
                results.
    """
    # Fetch (size + 1) results in order to decide whether a "next
    # page" offset needs to be returned.
    num_docs_to_fetch = size + 1
    try:
        response = ES.get_client().search(
            body=query_definition,
            index=index_name,
            size=num_docs_to_fetch,
            from_=offset,
        )
    except elasticsearch.NotFoundError:
        # The index does not exist yet. Create it and return an empty result.
        _create_index(index_name)
        empty_list: List[str] = []
        return empty_list, None

    matched_search_docs = response['hits']['hits']

    resulting_offset = None
    if len(matched_search_docs) == num_docs_to_fetch:
        # There is at least one more page of results to fetch. Trim the results
        # in this call to the desired size.
        matched_search_docs = matched_search_docs[:size]
        resulting_offset = int(offset) + size

    result_ids = [doc['_id'] for doc in matched_search_docs]
    return result_ids, resulting_offset


def _create_index(index_name: str) -> None:
    """Creates a new index.

    Args:
        index_name: str. The name of the index to create.

    Raises:
        elasticsearch.RequestError. The index already exists.
    """
    assert isinstance(index_name, str)
    ES.get_client().indices.create(index=index_name)


# Here we use type Any because the argument 'documents' represents the list of
# document dictionaries and there are no constraints for a document dictionary.
# This can be seen from the type stubs of elastic search.
# The type of 'body' here is Any.
# https://github.com/elastic/elasticsearch-py/blob/acf1e0d94e083c85bb079564d17ff7ee29cf28f6/elasticsearch/client/__init__.pyi#L172
def add_documents_to_index(
    documents: Sequence[Mapping[str, Any]], index_name: str
) -> None:
    """Adds a document to an index. This function also creates the index if it
    does not exist yet.

    Args:
        documents: list(dict). Each document should be a dictionary. Every key
            in the document is a field name, and the corresponding value will be
            the field's value. There MUST be a key named 'id', its value will be
            used as the document's id.
        index_name: str. The name of the index to insert the document into.

    Raises:
        SearchException. A document cannot be added to the index.
    """

    assert isinstance(index_name, str)

    for document in documents:
        assert 'id' in document
    for document in documents:
        try:
            response = ES.get_client().index(
                index=index_name, document=document, id=document['id']
            )
        except elasticsearch.NotFoundError:
            # The index does not exist yet. Create it and repeat the operation.
            _create_index(index_name)
            response = ES.get_client().index(
                index=index_name, document=document, id=document['id']
            )

        if response is None or response['_shards']['failed'] > 0:
            raise SearchException('Failed to add document to index.')


def delete_documents_from_index(doc_ids: List[str], index_name: str) -> None:
    """Deletes documents from an index. Any documents which do not already
    exist in the index are ignored.

    Args:
        doc_ids: list(str). A list of document ids of documents to be deleted
            from the index.
        index_name: str. The name of the index to delete the document from.
    """
    assert isinstance(index_name, str)
    for doc_id in doc_ids:
        assert isinstance(doc_id, str)

    for doc_id in doc_ids:
        try:
            document_exists_in_index = ES.get_client().exists(
                index=index_name, id=doc_id
            )
        except elasticsearch.NotFoundError:
            # The index does not exist yet. Create it and set
            # document_exists_in_index to False.
            _create_index(index_name)
            document_exists_in_index = False

        if document_exists_in_index:
            ES.get_client().delete(index=index_name, id=doc_id)


def clear_index(index_name: str) -> None:
    """Clears an index on the elastic search instance.

    Args:
        index_name: str. The name of the index to clear.
    """
    assert isinstance(index_name, str)
    # More details on clearing an index can be found here:
    # https://elasticsearch-py.readthedocs.io/en/master/api.html#elasticsearch.Elasticsearch.delete_by_query
    # https://stackoverflow.com/questions/57778438/delete-all-documents-from-elasticsearch-index-in-python-3-x
    ES.get_client().delete_by_query(
        index=index_name, body={'query': {'match_all': {}}}
    )


def search(
    query_string: str,
    index_name: str,
    categories: List[str],
    language_codes: List[str],
    offset: Optional[int] = None,
    size: int = feconf.SEARCH_RESULTS_PAGE_SIZE,
) -> Tuple[List[str], Optional[int]]:
    """Searches for documents (explorations or collections) matching the given
    query in the given index.

    This function also creates the index if it does not exist yet.

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
        offset: int|None. The offset into the index. Pass this in to start at
            the 'offset' when searching through a list of results of max length
            'size'. Leave as None to start at the beginning.
        size: int. The maximum number of documents to return.

    Returns:
        2-tuple of (result_ids, resulting_offset). Where:
            result_ids: list(str). Represents search documents, this
                will be a list of strings corresponding to the search document
                ids.
            resulting_offset: int. The resulting offset to start at for the next
                section of the results. Returns None if there are no more
                results.
    """
    if offset is None:
        offset = 0

    # Convert the query into a Query DSL object. See
    # elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html
    # for more details about Query DSL.
    # Here we use type Any because the query_definition is a dictionary having
    # values of various types.
    # This can be seen from the type stubs of elastic search.
    # The type of 'body' is 'Any'.
    # https://github.com/elastic/elasticsearch-py/blob/acf1e0d94e083c85bb079564d17ff7ee29cf28f6/elasticsearch/client/__init__.pyi#L768
    query_definition: Dict[str, Any] = {
        'query': {
            'bool': {
                'must': [],
                'filter': [],
            }
        },
        'sort': [
            {
                'rank': {
                    'order': 'desc',
                    'missing': '_last',
                    'unmapped_type': 'float',
                }
            }
        ],
    }
    if query_string:
        query_definition['query']['bool'].update(
            _build_query_match_clauses(query_string)
        )
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

    result_ids, resulting_offset = _fetch_response_from_elastic_search(
        query_definition, index_name, offset, size
    )

    return result_ids, resulting_offset


def blog_post_summaries_search(
    query_string: str,
    tags: List[str],
    offset: Optional[int] = None,
    size: int = feconf.SEARCH_RESULTS_PAGE_SIZE,
) -> Tuple[List[str], Optional[int]]:
    """Searches for blog post summary documents matching the given query in the
    blog post search index.
    NOTE: We cannot search through more than 10,000 results from a search by
    paginating using size and offset.

    This function also creates the blog post search index if it does not exist
    yet.

    Args:
        query_string: str. The terms that the user is searching for in the
            blog posts.
        tags: list(str). The list of tags to query for. If it is
            empty, no tag filter is applied to the results. If it is not
            empty, then a result is considered valid if it matches at least one
            of these tags.
        offset: int|None. The offset into the index. Pass this in to start at
            the 'offset' when searching through a list of results of max length
            'size'. Leave as None to start at the beginning.
        size: int. The maximum number of documents to return.

    Returns:
        2-tuple of (result_ids, resulting_offset). Where:
            result_ids: list(str). Represents search documents, this will be a
                list of strings corresponding to the search document ids.
            resulting_offset: int. The resulting offset to start at for the next
                section of the results. Returns None if there are no more
                results.
    """
    if offset is None:
        offset = 0

    # Here we use type Any because the query_definition is a dictionary having
    # values of various types.
    # This can be seen from the type stubs of elastic search.
    # The type of 'body' is 'Any'.
    # https://github.com/elastic/elasticsearch-py/blob/acf1e0d94e083c85bb079564d17ff7ee29cf28f6/elasticsearch/client/__init__.pyi#L768
    query_definition: Dict[str, Any] = {
        'query': {
            'bool': {
                'must': [],
                'filter': [],
            }
        },
        'sort': [
            {
                'rank': {
                    'order': 'desc',
                    'missing': '_last',
                    'unmapped_type': 'float',
                }
            }
        ],
    }
    if query_string:
        query_definition['query']['bool'].update(
            _build_query_match_clauses(
                query_string,
                fields=['title', 'summary'],
                match_type='bool_prefix',
                operator='and',
            )
        )
    if tags:
        for tag in tags:
            query_definition['query']['bool']['filter'].append(
                {'match': {'tags': tag}}
            )

    index_name = search_services.SEARCH_INDEX_BLOG_POSTS
    result_ids, resulting_offset = _fetch_response_from_elastic_search(
        query_definition, index_name, offset, size
    )

    return result_ids, resulting_offset


def _build_query_match_clauses(
    query_string: str,
    fields: Optional[List[str]] = None,
    match_type: Optional[str] = None,
    operator: Optional[str] = None,
) -> Dict[str, Any]:
    """Builds the 'must' or 'should' clauses for the given query string.

    For single-token queries, this generates alternative 2-way splits to
    handle concatenated keywords (e.g. "positivenumbers" -> "positive numbers").

    Args:
        query_string: str. The terms that the user is searching for.
        fields: list(str)|None. The fields to search in.
        match_type: str|None. The type of match (e.g. 'bool_prefix').
        operator: str|None. The operator to use (e.g. 'and').

    Returns:
        dict(str, any). A dictionary containing either the 'must' or 'should'
        Elasticsearch clauses.
    """
    multi_match_base: Dict[str, Any] = {
        'query': query_string,
    }
    if fields:
        multi_match_base['fields'] = fields
    if match_type:
        multi_match_base['type'] = match_type
    if operator:
        multi_match_base['operator'] = operator

    # Single-token query (no spaces) of reasonable length.
    if ' ' not in query_string and (
        _MIN_SINGLE_TOKEN_QUERY_LENGTH_FOR_SPLITS
        <= len(query_string)
        <= _MAX_SINGLE_TOKEN_QUERY_LENGTH_FOR_SPLITS
    ):
        # Generate all possible 2-way splits.
        # Examples: "abcde" -> "ab cde", "abc de", "abcd e".
        # We require each fragment to be at least 2 chars long to avoid
        # noisy one-letter splits like "p ositivenumbers".
        splits = []
        for i in range(2, len(query_string) - 1):
            splits.append(f'{query_string[:i]} {query_string[i:]}')

        # Build should clauses: the original query + all splits.
        should_clauses = [{'multi_match': multi_match_base}]
        for split_query in splits:
            should_multi_match = multi_match_base.copy()
            should_multi_match['query'] = split_query
            should_clauses.append({'multi_match': should_multi_match})

        return {
            'should': should_clauses,
            'minimum_should_match': 1,
        }

    return {'must': [{'multi_match': multi_match_base}]}
