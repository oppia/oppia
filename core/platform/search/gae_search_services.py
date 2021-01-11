# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Provides search services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import logging
import numbers

import feconf
import python_utils

from google.appengine.api import search as gae_search


def _dict_to_search_document(d):
    """Returns and converts the document dict into objects.

    Args:
        d: dict. A dict containing field names as keys and
            corresponding field values as values.

    Returns:
        Document. The document containing fields.

    Raises:
        ValueError. The given document is not in the dict format.
    """
    if not isinstance(d, dict):
        raise ValueError('document should be a dictionary, got %s' % type(d))

    doc_id = d.get('id')

    rank = d.get('rank')

    language_code = d.get('language_code')

    fields = []
    for key, value in d.items():
        if key not in ['id', 'rank']:
            fields += _make_fields(key, value)

    doc = gae_search.Document(
        doc_id=doc_id, fields=fields, rank=rank, language=language_code)
    return doc


def _make_fields(key, value):
    """Returns the fields corresponding to the key value pair according to the
    type of value.

    Args:
        key: str. The name of the field.
        value: *. The field value.

    Returns:
        list(*). A list of fields.

    Raises:
        ValueError. The type of field value is not list, str, Number or
            datetime.
    """
    if isinstance(value, list):
        _validate_list(key, value)
        return [_make_fields(key, v)[0] for v in value]

    if isinstance(value, python_utils.BASESTRING):
        return [gae_search.TextField(name=key, value=value)]

    if isinstance(value, numbers.Number):
        return [gae_search.NumberField(name=key, value=value)]

    if isinstance(value, (datetime.datetime, datetime.date)):
        return [gae_search.DateField(name=key, value=value)]

    raise ValueError(
        'Value for document field %s should be a (unicode) string, numeric '
        'type, datetime.date, datetime.datetime or list of such types, got %s'
        % (key, type(value)))


def _validate_list(key, value):
    """Validates a list to be included as document fields. The key is just
    passed in to make better error messages.

    Args:
        key: str. A string that represents the descriptor of this
            particular list.
        value: list(*). The list to be validated. Each element of a valid list
            must be either a python_utils.BASESTRING, datetime.date,
            datetime.datetime, numbers.Number.
    """

    for ind, element in enumerate(value):
        if not isinstance(element, (
                python_utils.BASESTRING, datetime.date, datetime.datetime,
                numbers.Number)):
            raise ValueError(
                'All values of a multi-valued field must be numbers, strings, '
                'date or datetime instances, The %dth value for field %s has'
                ' type %s.' % (ind, key, type(element)))


def _search_document_to_dict(doc):
    """Converts and returns the search document into a dict format.

    Args:
        doc: Document. The document to be converted into dict format.

    Returns:
        dict(str, str). The document in dict format.
    """
    d = {'id': doc.doc_id, 'language_code': doc.language, 'rank': doc.rank}

    for field in doc.fields:
        d[field.name] = field.value

    return d


class SearchFailureError(Exception):
    """This error is raised when a search operation fails.
       The original_exception will point to what went wrong inside the gae sdk.
       Other platform implementations should have a similar way of revealing
       platform specific errors.
    """

    def __init__(self, original_exception=None):
        super(SearchFailureError, self).__init__(
            '%s: %s' % (type(original_exception), original_exception.message))
        self.original_exception = original_exception


def add_documents_to_index(documents, index_name):
    """Adds a document to an index.

    Args:
        documents: list(dict). Each document should be a dictionary.
            Every key in the document is a field name, and the corresponding
            value will be the field's value.
            If there is a key named 'id', its value will be used as the
            document's id.
            If there is a key named 'rank', its value will be used as
            the document's rank.
            By default, search results are returned ordered by descending rank.
            If there is a key named 'language_code', its value will be used as
            the document's language. Otherwise, constants.DEFAULT_LANGUAGE_CODE
            is used.
        index_name: str. The name of the index to insert the document into.

    Raises:
        SearchFailureError. Raised when the indexing fails. If it fails for any
            document, none will be inserted.
    """
    assert isinstance(index_name, python_utils.BASESTRING)

    index = gae_search.Index(index_name)
    gae_docs = [_dict_to_search_document(d) for d in documents]

    try:
        logging.debug(
            'adding the following docs to index %s: %s', index.name, documents)
        index.put(gae_docs, deadline=5)
    except gae_search.PutError as e:
        logging.exception('PutError raised.')

        # At this point, either we don't have any tries left, or none of the
        # results has a transient error code.
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
    """
    assert isinstance(index_name, python_utils.BASESTRING)
    for doc_id in doc_ids:
        assert isinstance(doc_id, python_utils.BASESTRING)

    index = gae_search.Index(index_name)
    try:
        logging.debug(
            'Attempting to delete documents from index %s, ids: %s' %
            (index.name, ', '.join(doc_ids)))
        index.delete(doc_ids, deadline=5)
    except gae_search.DeleteError as e:
        logging.exception('Something went wrong during deletion.')
        raise SearchFailureError(e)


def clear_index(index_name):
    """Clears an index completely.

    WARNING: This does all the clearing in-request, and may therefore fail if
    there are too many entries in the index.

    Args:
        index_name: str. The name of the index to delete the document from.
    """
    assert isinstance(index_name, python_utils.BASESTRING)
    index = gae_search.Index(index_name)

    while True:
        doc_ids = [
            document.doc_id for document in index.get_range(ids_only=True)]
        if not doc_ids:
            break

        index.delete(doc_ids)


def search(
        query_string, index_name, categories, language_codes, offset=None,
        size=feconf.SEARCH_RESULTS_PAGE_SIZE, ids_only=False):
    """Searches for documents in an index.

    Args:
        query_string: str. The search query.
        index_name: str. The name of the index to search.
        categories: list(str). The list of categories to query for. If it is
            empty, no category filter is applied to the results. If it is not
            empty, then a result is considered valid if it matches at least one
            of these categories.
        language_codes: list(str). The list of language codes to query for. If
            it is empty, no language code filter is applied to the results. If
            it is not empty, then a result is considered valid if it matches at
            least one of these language codes.
        offset: str. An offset string, as returned by this function. Pass this
            in to get the next 'page' of results. Leave as None to start at the
            beginning.
        size: int. The maximum number of documents to return.
        ids_only: bool. Whether to only return document ids.

    Returns:
        2-tuple of (result_docs, result_cursor). Where:
            result_docs: list(dict). Represents search documents. If ids_only is
                True, this will be a list of strings, doc_ids.
            result_offset: str. An offset that you can pass back in to get
                the next page of results. This wil be a web safe string that you
                can use in urls. It will be None if there is no next page.
    """
    if offset is None:
        gae_cursor = gae_search.Cursor()
    else:
        gae_cursor = gae_search.Cursor(web_safe_string=offset)

    options = gae_search.QueryOptions(
        limit=size,
        cursor=gae_cursor,
        ids_only=ids_only)

    # Convert the query to a query_string accepted by GAE. The syntax used is
    # described here:
    #   https://developers.google.com/appengine/docs/python/search/query_strings
    category_suffix = (
        ' category=("' + '" OR "'.join(categories) + '")'
        if categories else '')
    language_code_suffix = (
        ' language_code=("' + '" OR "'.join(language_codes) + '")'
        if language_codes else '')
    gae_query_string = query_string + category_suffix + language_code_suffix

    try:
        query = gae_search.Query(gae_query_string, options=options)
    except gae_search.QueryError as e:
        # This can happen for query strings like "NOT" or a string that
        # contains backslashes.
        logging.exception('Could not parse query string %s' % gae_query_string)
        return [], None

    index = gae_search.Index(index_name)

    try:
        logging.debug('attempting a search with query %s' % query)
        results = index.search(query)
    except Exception as e:
        logging.exception('something went wrong while searching.')
        raise SearchFailureError(e)

    result_offset = (
        results.cursor.web_safe_string if results.cursor else None)

    if ids_only:
        result_docs = [doc.doc_id for doc in results.results]
    else:
        result_docs = [
            _search_document_to_dict(doc) for doc in results.results]

    return result_docs, result_offset
