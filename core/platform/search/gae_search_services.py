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

__author__ = 'Frederik Creemers'

import datetime
import logging
import numbers

import feconf

from google.appengine.api import search as gae_search

DEFAULT_NUM_RETRIES = 3


class SearchFailureError(Exception):
    """This error is raised when a search operation fails.
       The original_exception will point to what went wrong inside the gae sdk.
       Other platform implementations should have a similar way of revealing
       platform specific errors."""
    def __init__(self, original_exception=None):
        super(SearchFailureError, self).__init__(
            '%s: %s' % (type(original_exception), original_exception.message))
        self.original_exception = original_exception


def add_documents_to_index(documents, index, retries=DEFAULT_NUM_RETRIES):
    """Adds a document to an index.

    Args:
      - documents: a list of documents. Each document should be a dictionary.
          Every key in the document is a field name, and the corresponding value
          will be the field's value.
          If there is a key named 'id', its value will be used as the
          document's id.
          If there is a key named 'rank', its value will be used as
          the document's rank.
          By default, search results are returned ordered by descending rank.
          If there is a key named 'language_code', its value will be used as the
          document's language. Otherwise, feconf.DEFAULT_LANGUAGE_CODE is used.
      - index: the name of the index to insert the document into, a string.
      - retries: the number of times to retry inserting the documents.

    Returns:
      returns a list of document ids of the documents that were added.

    Raises:
      - SearchFailureError: raised when the indexing fails. If it fails for any
        document, none will be inserted.
      - ValueError: raised when invalid values are given.
    """
    if not isinstance(index, basestring):
        raise ValueError('Index must be the unicode/str name of an index, got %s'
                         % type(index))

    index = gae_search.Index(index)
    gae_docs = [_dict_to_search_document(d) for d in documents]

    try:
        logging.debug('adding the following docs to index %s: %s', 
                      index.name, documents)
        results = index.put(gae_docs, deadline=5)
    except gae_search.PutError as e:
        logging.exception('PutError raised.')
        if retries > 1:
            for res in e.results:
                if res.code == gae_search.OperationResult.TRANSIENT_ERROR:
                    new_retries = retries - 1
                    logging.debug('%d tries left, retrying.' % (new_retries))
                    return add_documents_to_index(
                        documents=documents, 
                        index=index.name, 
                        retries=new_retries)

        # At this pint, either we don't have any tries left, or none of the
        # results has a transient error code.
        raise SearchFailureError(e)

    return [r.id for r in results]


def _dict_to_search_document(d):
    if not isinstance(d, dict):
        raise ValueError('document should be a dictionary, got %s' % type(d))

    doc_id = d.get('id')

    rank = d.get('rank')

    language_code = d.get('language_code')

    fields = []

    for key, value in d.iteritems():
        if key == 'id' or key == 'rank' or key == 'language_code':
            continue

        fields += _make_fields(key, value)

    doc = gae_search.Document(doc_id=doc_id, fields=fields, rank=rank, language=language_code)
    return doc


def _make_fields(key, value):
    if isinstance(value, list):
        _validate_list(key, value)
        return [_make_fields(key, v)[0] for v in value]

    if isinstance(value, basestring):
        return [gae_search.TextField(name=key, value=value)]

    if isinstance(value, numbers.Number):
        return [gae_search.NumberField(name=key, value=value)]

    if isinstance(value, datetime.datetime) or isinstance(value, datetime.date):
        return [gae_search.DateField(name=key, value=value)]

    raise ValueError('Value for document field %s should be a (unicode) string, numeric type, datetime.date, '
                     'datetime.datetime or list of such types, got %s' % (key, type(value)))


def _validate_list(key, value):
    """Validates a list to be included as document fields. The key is just
    passed in to make better error messages."""

    for i in xrange(len(value)):
        element = value[i]
        if not (isinstance(element, basestring) or
                isinstance(element, datetime.date) or
                isinstance(element, datetime.datetime) or
                isinstance(element, numbers.Number)):
            raise ValueError(
                'All values of a multi-valued field must be numbers, strings, '
                'date or datetime instances, The %dth value for field %s has'
                ' type %s.' % (i, key, type(element)))


def delete_documents_from_index(doc_ids, index, retries=DEFAULT_NUM_RETRIES):
    """Deletes documents from an index.

    Args:
      - doc_ids: a list of document ids of documents to be deleted from the index.
      - index: the name of the index to delete the document from, a string.
      - retries: the number of times to retry deleting the documents.

    Raises:
      - SearchFailureError: raised when the deletion fails. If it fails for any
        document, none will be deleted.
    """
    if not isinstance(index, basestring):
        raise ValueError('Index must be the unicode/str name of an index, got %s'
                         % type(index))

    for i in xrange(len(doc_ids)):
        if not isinstance(doc_ids[i], basestring):
            raise ValueError('all doc_ids must be string, got %s at index %d' %
                             (type(doc_ids[i]), i))

    index = gae_search.Index(index)
    try:
        logging.debug('Attempting to delete documents from index %s, ids: %s' %
                      (index.name, ', '.join(doc_ids)))
        index.delete(doc_ids, deadline=5)
    except gae_search.DeleteError as e:
        logging.exception('Something went wrong during deletion.')
        if retries > 1:
            for res in e.results:
                if res.code == gae_search.OperationResult.TRANSIENT_ERROR:
                    new_retries = retries - 1
                    logging.debug('%d tries left, retrying.' % (new_retries))
                    delete_documents_from_index(
                        doc_ids=doc_ids, 
                        index=index.name, 
                        retries=new_retries)
                    return

        raise SearchFailureError(e)


def search(query_string, index, cursor=None, limit=20, sort='', ids_only=False, 
           retries=DEFAULT_NUM_RETRIES):
    """Searches for documents in an index.

    Args:
      - query_string: the search query.
        The syntax used is described here:
        https://developers.google.com/appengine/docs/python/search/query_strings
      - index: the name of the index to search.
      - cursor: a cursor string, as returned by this function. Pass this in to
        get the next 'page' of results. Leave blank to start at the beginning.
        This function returns a cursor that you can use to retrieve
        the next 'page' of search results.
      - sort: a string indicating how to sort results.
        This should be a string of space separated values.
        Each value should start with a '+' or a '-' character indicating whether
        to sort in ascending or descending
        order respectively. This character should be followed by a field name to
        sort on.
      - limit: the maximum number of documents to return.
      - ids_only: whether to only return document ids.
      - retries: the number of times to retry searching the index.

    Returns:
      returns a tuple with two elements:
        - a list of dictionaries representing search documents
        - a cursor that you can pass back in to get the next page of results.
          This wil be a web safe string that you can use in urls.
          It will be None if there is no next page.
    """
    sort_options = None

    if cursor is None:
        gae_cursor = gae_search.Cursor()
    else:
        gae_cursor = gae_search.Cursor(web_safe_string=cursor)

    if sort:
        expr = _string_to_sort_expressions(sort)
        sort_options = gae_search.SortOptions(expr)

    options = gae_search.QueryOptions(
        limit=limit, 
        cursor=gae_cursor, 
        ids_only=ids_only, 
        sort_options=sort_options)
    query = gae_search.Query(query_string, options=options)
    index = gae_search.Index(index)

    try:
        logging.debug('attempting a search with query %s' % query)
        results = index.search(query)
    except gae_search.TransientError as e:
        logging.exception('something went wrng while searching.')
        if retries > 1:
            logging.debug('%d attempts left, retrying...' % (retries - 1))
            return search(
                query_string, 
                index.name, 
                cursor=cursor, 
                limit=limit, 
                sort=sort, 
                ids_only=ids_only, 
                retries=retries - 1)
        else:
            raise SearchFailureError(e)

    result_cursor_str = None
    if results.cursor:
        result_cursor_str = results.cursor.web_safe_string

    dicts = [_search_document_to_dict(doc) for doc in results.results]
    return dicts, result_cursor_str


def _string_to_sort_expressions(s):
    sort_expressions = []
    s_tokens = s.split()
    for expression in s_tokens:
        if expression.startswith('+'):
            direction = gae_search.SortExpression.ASCENDING
        elif expression.startswith('-'):
            direction = gae_search.SortExpression.DESCENDING
        else:
            raise ValueError(
                'Fields in the sort expression must start with "+"'
                ' or "-" to indicate sort direction.'
                ' The field %s has no such indicator'
                ' in expression "%s".' % (expression, s))
        sort_expressions.append(gae_search.SortExpression(expression[1:], 
                                                          direction))
    return sort_expressions


def _search_document_to_dict(doc):
    d = {'id': doc.doc_id}

    for field in doc.fields:
        d[field.name] = field.value

    return d
