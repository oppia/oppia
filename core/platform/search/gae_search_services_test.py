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

"""Tests for the appengine search api wrapper."""

import datetime
import time

from core.platform.search import gae_search_services
from core.tests import test_utils

from google.appengine.api import search


class SearchAddToIndexTests(test_utils.GenericTestBase):
    """Test inserting documents into search indexes."""

    def test_insert_document_with_id(self):
        date = datetime.date(year=2015, month=3, day=14)
        datetime_value = datetime.datetime(
            year=1991, month=6, day=20, hour=16, minute=30, second=14)
        doc_id = 'abcdefghijklmnop'

        doc = {
            'id': doc_id,
            'numberfield': 5,
            'stringfield': 'abc',
            'datefield': date,
            'datetimefield': datetime_value
        }
        result = gae_search_services.add_documents_to_index([doc], 'my_index')
        self.assertEqual(result, [doc_id])
        result_doc = search.Index('my_index').get(doc_id)

        self.assertEqual(result_doc.doc_id, doc_id)
        self.assertEqual(result_doc.field('numberfield').value, 5)
        self.assertEqual(result_doc.field('stringfield').value, 'abc')
        # The search api returns date fields as datetime fields with
        # time at midnight.
        self.assertEqual(
            result_doc.field('datefield').value,
            datetime.datetime.combine(
                date=date,
                time=datetime.datetime.min.time()))
        self.assertEqual(
            result_doc.field('datetimefield').value, datetime_value)

    def test_insert_document_without_id(self):
        doc = {'abc': 'def'}
        result = gae_search_services.add_documents_to_index([doc], 'my_index')
        retrieved_doc = search.Index('my_index').get(result[0])
        self.assertEqual(retrieved_doc.field('abc').value, 'def')

    def test_insert_multiple_with_id(self):
        docs = [{'id': 'id%d' % n, 'name': 'doc%d' % n} for n in range(5)]
        result = gae_search_services.add_documents_to_index(docs, 'my_index')
        index = search.Index('my_index')
        for ind in range(5):
            retrieved_doc = index.get('id%d' % ind)
            self.assertEqual(retrieved_doc.field('name').value, 'doc%d' % ind)
            self.assertEqual(result[ind], 'id%d' % ind)

    def test_insert_document_with_multi_valued_property(self):
        doc = {'id': 'doc', 'prop': ['val1', 'val2', 'val3']}
        gae_search_services.add_documents_to_index([doc], 'index')
        resultdoc = search.Index('index').get('doc')
        values = set([field.value for field in resultdoc['prop']])
        self.assertEqual(values, set(['val1', 'val2', 'val3']))

    def test_disallow_unsuported_value_types(self):
        with self.assertRaises(ValueError):
            doc = {'abc': set('xyz')}
            gae_search_services.add_documents_to_index(doc, 'my_index')

    def test_add_document_with_rank(self):
        doc = {'id': 'my_doc', 'field': 'value', 'rank': 42}
        gae_search_services.add_documents_to_index([doc], 'my_index')
        index = search.Index('my_index')
        self.assertEqual(index.get('my_doc').rank, 42)

    def test_add_document_with_existing_id_updates_it(self):
        doc1 = {'id': 'doc', 'version': 1, 'rank': 10}
        doc2 = {'id': 'doc', 'version': 2, 'rank': 20}
        gae_search_services.add_documents_to_index([doc1], 'my_index')
        index = search.Index('my_index')
        self.assertEqual(index.get('doc').field('version').value, 1)
        self.assertEqual(index.get('doc').rank, 10)
        gae_search_services.add_documents_to_index([doc2], 'my_index')
        self.assertEqual(index.get('doc').field('version').value, 2)
        self.assertEqual(index.get('doc').rank, 20)

    def test_validate_list_values(self):
        doc1 = {'f': ['a', 'b', ['c', 'd']]}
        doc2 = {'f': ['a', 'b', 3, set([4, 5, 6])]}

        # The str() of list and set are passed in to ensure that we mention the
        # type the user passed in, in our error message..
        with self.assertRaisesRegexp(ValueError, str(list)):
            gae_search_services.add_documents_to_index([doc1], 'my_index')

        with self.assertRaisesRegexp(ValueError, str(set)):
            gae_search_services.add_documents_to_index([doc2], 'my_index')

    def test_index_must_be_string(self):
        index = search.Index('test')
        # Check that the error message mentions the type the user passed in.
        with self.assertRaisesRegexp(ValueError, str(type(index))):
            gae_search_services.add_documents_to_index(
                {'id': 'one', 'key': 'value'}, index)

    def _get_put_error(self, num_res, transient=None):
        """returns a PutError. with num_res results.
           If transient is given, it should be an index in the
           results array. The result at that index will have a transient
           error code."""
        non_trans_code = search.OperationResult.INVALID_REQUEST
        trans_code = search.OperationResult.TRANSIENT_ERROR
        results = [
            search.PutResult(code=non_trans_code) for _ in range(num_res)]
        if transient is not None:
            results[transient] = search.PutResult(code=trans_code)
        return search.PutError('lol', results)

    def test_use_default_num_retries(self):
        doc = {'id': 'doc', 'prop': 'val'}
        exception = self._get_put_error(1, 0)
        failing_put = test_utils.FailingFunction(
            search.Index.put,
            exception,
            gae_search_services.DEFAULT_NUM_RETRIES,
            )

        add_docs_counter = test_utils.CallCounter(
            gae_search_services.add_documents_to_index)

        put_ctx = self.swap(search.Index, 'put', failing_put)
        add_docs_ctx = self.swap(
            gae_search_services,
            'add_documents_to_index',
            add_docs_counter)
        assert_raises_ctx = self.assertRaises(
            gae_search_services.SearchFailureError)
        with put_ctx, add_docs_ctx, assert_raises_ctx as context_mgr:
            gae_search_services.add_documents_to_index([doc], 'my_index')

        self.assertEqual(context_mgr.exception.original_exception, exception)

        self.assertEqual(
            add_docs_counter.times_called,
            gae_search_services.DEFAULT_NUM_RETRIES)

    def test_use_custom_number_of_retries(self):
        doc = {'id': 'doc', 'prop': 'val'}
        exception = self._get_put_error(1, 0)
        failing_put = test_utils.FailingFunction(
            search.Index.put,
            exception,
            42)

        add_docs_counter = test_utils.CallCounter(
            gae_search_services.add_documents_to_index)

        put_ctx = self.swap(search.Index, 'put', failing_put)
        add_docs_ctx = self.swap(
            gae_search_services, 'add_documents_to_index', add_docs_counter)
        assert_raises_ctx = self.assertRaises(
            gae_search_services.SearchFailureError)
        with put_ctx, add_docs_ctx, assert_raises_ctx:
            gae_search_services.add_documents_to_index([doc], 'my_index', 42)

        self.assertEqual(add_docs_counter.times_called, 42)

    def test_arguments_are_preserved_in_retries(self):
        doc = {'id': 'doc', 'prop': 'val'}
        exception = self._get_put_error(1, 0)
        failing_put = test_utils.FailingFunction(
            search.Index.put,
            exception,
            3
        )

        add_docs_counter = test_utils.CallCounter(
            gae_search_services.add_documents_to_index)

        put_ctx = self.swap(search.Index, 'put', failing_put)
        add_docs_ctx = self.swap(
            gae_search_services,
            'add_documents_to_index',
            add_docs_counter)

        with put_ctx, add_docs_ctx:
            gae_search_services.add_documents_to_index([doc], 'my_index', 4)

        self.assertEqual(add_docs_counter.times_called, 4)
        result = search.Index('my_index').get('doc')
        self.assertEqual(result.field('prop').value, 'val')

    def test_put_error_with_transient_result(self):
        docs = [{'id': 'doc1', 'prop': 'val1'},
                {'id': 'doc2', 'prop': 'val2'},
                {'id': 'doc3', 'prop': 'val3'}]
        error = self._get_put_error(3, 1)
        failing_put = test_utils.FailingFunction(
            search.Index.put,
            error,
            4)

        add_docs_counter = test_utils.CallCounter(
            gae_search_services.add_documents_to_index)
        put_ctx = self.swap(search.Index, 'put', failing_put)
        add_docs_ctx = self.swap(
            gae_search_services,
            'add_documents_to_index',
            add_docs_counter)

        with put_ctx, add_docs_ctx:
            gae_search_services.add_documents_to_index(docs, 'my_index', 5)

        self.assertEqual(add_docs_counter.times_called, 5)
        for i in xrange(1, 4):
            result = search.Index('my_index').get('doc' + str(i))
            self.assertEqual(result.field('prop').value, 'val' + str(i))

    def test_put_error_without_transient_result(self):
        docs = [{'id': 'doc1', 'prop': 'val1'},
                {'id': 'doc2', 'prop': 'val2'},
                {'id': 'doc3', 'prop': 'val3'}]

        error = self._get_put_error(3)
        failing_put = test_utils.FailingFunction(search.Index.put, error, 1)

        add_docs_counter = test_utils.CallCounter(
            gae_search_services.add_documents_to_index)
        add_docs_ctx = self.swap(
            gae_search_services,
            'add_documents_to_index',
            add_docs_counter)
        put_ctx = self.swap(search.Index, 'put', failing_put)
        assert_raises_ctx = self.assertRaises(
            gae_search_services.SearchFailureError)
        with add_docs_ctx, put_ctx, assert_raises_ctx as e:
            gae_search_services.add_documents_to_index(docs, 'my_index')

        # assert that the method only gets called once, since the error is not
        # transient.
        self.assertEqual(add_docs_counter.times_called, 1)
        self.assertEqual(e.exception.original_exception, error)


class SearchRemoveFromIndexTests(test_utils.GenericTestBase):
    """Test deleting documents from search indexes."""

    def test_delete_single_document(self):
        doc = search.Document(doc_id='doc_id', fields=[
            search.TextField(name='k', value='v')])
        index = search.Index('my_index')
        index.put([doc])
        gae_search_services.delete_documents_from_index(['doc_id'], 'my_index')
        self.assertIsNone(index.get('doc_id'))

    def test_delete_multiple_documents(self):
        index = search.Index('my_index')
        for i in xrange(10):
            field = search.TextField(name='k', value='v%d' % i)
            doc = search.Document(doc_id='doc%d' % i, fields=[field])
            index.put([doc])
        gae_search_services.delete_documents_from_index(
            ['doc' + str(i) for i in xrange(10)], 'my_index')
        for i in xrange(10):
            self.assertIsNone(index.get('doc%d' % i))

    def test_doc_ids_must_be_strings(self):
        with self.assertRaisesRegexp(ValueError, str(dict)):
            gae_search_services.delete_documents_from_index(
                ['d1', {'id': 'd2'}],
                'index')

    def test_index_must_be_string(self):
        with self.assertRaises(ValueError):
            gae_search_services.delete_documents_from_index(
                ['doc_id'], search.Index('ind'))

    def _get_delete_error(self, num_res, transient=None):
        """returns a DeleteError. with num_res results.
           If transient is given, it should be an index in the
           results array. The result at that index will have a transient
           error code."""
        non_trans_code = search.OperationResult.INVALID_REQUEST
        trans_code = search.OperationResult.TRANSIENT_ERROR
        results = [
            search.DeleteResult(code=non_trans_code) for _ in range(num_res)]
        if transient is not None:
            results[transient] = search.PutResult(code=trans_code)
        return search.DeleteError('lol', results=results)

    def test_use_default_num_retries(self):
        exception = self._get_delete_error(1, 0)
        failing_delete = test_utils.FailingFunction(
            search.Index.delete,
            exception,
            gae_search_services.DEFAULT_NUM_RETRIES
            )

        delete_docs_counter = test_utils.CallCounter(
            gae_search_services.delete_documents_from_index)

        delete_ctx = self.swap(search.Index, 'delete', failing_delete)
        delete_docs_ctx = self.swap(
            gae_search_services,
            'delete_documents_from_index',
            delete_docs_counter)
        assert_raises_ctx = self.assertRaises(
            gae_search_services.SearchFailureError)
        with delete_ctx, delete_docs_ctx, assert_raises_ctx as context_mgr:
            gae_search_services.delete_documents_from_index(
                ['doc'], 'my_index')

        self.assertEqual(context_mgr.exception.original_exception, exception)

        self.assertEqual(
            delete_docs_counter.times_called,
            gae_search_services.DEFAULT_NUM_RETRIES)

    def test_use_custom_number_of_retries(self):
        exception = self._get_delete_error(1, 0)
        failing_delete = test_utils.FailingFunction(
            search.Index.delete, exception, 42)

        delete_docs_counter = test_utils.CallCounter(
            gae_search_services.delete_documents_from_index)

        delete_ctx = self.swap(search.Index, 'delete', failing_delete)
        delete_docs_ctx = self.swap(
            gae_search_services,
            'delete_documents_from_index',
            delete_docs_counter)
        assert_raises_ctx = self.assertRaises(
            gae_search_services.SearchFailureError)
        with delete_ctx, delete_docs_ctx, assert_raises_ctx:
            gae_search_services.delete_documents_from_index(
                ['id'], 'index', 42)

        self.assertEqual(delete_docs_counter.times_called, 42)

    def test_arguments_are_preserved_in_retries(self):
        index = search.Index('index')
        index.put([search.Document(doc_id='doc', fields=[
            search.TextField(name='prop', value='val')
        ])])
        exception = self._get_delete_error(1, 0)
        failing_delete = test_utils.FailingFunction(
            search.Index.delete, exception, 3)

        delete_docs_counter = test_utils.CallCounter(
            gae_search_services.delete_documents_from_index)

        index_ctx = self.swap(search.Index, 'delete', failing_delete)
        delete_docs_ctx = self.swap(
            gae_search_services,
            'delete_documents_from_index',
            delete_docs_counter)
        with index_ctx, delete_docs_ctx:
            gae_search_services.delete_documents_from_index(
                ['doc'], 'index', 4)

        self.assertEqual(delete_docs_counter.times_called, 4)
        result = search.Index('my_index').get('doc')
        self.assertIsNone(result)

    def test_delete_error_with_transient_result(self):
        error = self._get_delete_error(3, transient=1)
        failing_delete = test_utils.FailingFunction(
            search.Index.delete,
            error,
            4)
        delete_docs_counter = test_utils.CallCounter(
            gae_search_services.delete_documents_from_index)
        index = search.Index('my_index')
        for i in xrange(3):
            index.put(search.Document(doc_id='d' + str(i), fields=[
                search.TextField(name='prop', value='value')
            ]))

        delete_ctx = self.swap(search.Index, 'delete', failing_delete)
        delete_docs_ctx = self.swap(
            gae_search_services,
            'delete_documents_from_index',
            delete_docs_counter)
        with delete_ctx, delete_docs_ctx:
            gae_search_services.delete_documents_from_index(
                ['d0', 'd1', 'd2'],
                'my_index',
                retries=5)

        self.assertEqual(delete_docs_counter.times_called, 5)
        for i in xrange(3):
            result = search.Index('my_index').get('doc' + str(i))
            self.assertIsNone(result)

    def test_put_error_without_transient_result(self):
        error = self._get_delete_error(3)
        delete_spy = test_utils.FailingFunction(search.Index.delete, error, 1)
        delete_docs_counter = test_utils.CallCounter(
            gae_search_services.delete_documents_from_index)
        delete_docs_ctx = self.swap(
            gae_search_services,
            'delete_documents_from_index',
            delete_docs_counter)
        delete_ctx = self.swap(search.Index, 'delete', delete_spy)
        assert_raises_ctx = self.assertRaises(
            gae_search_services.SearchFailureError)
        with delete_docs_ctx, delete_ctx, assert_raises_ctx as e:
            gae_search_services.delete_documents_from_index(
                ['a', 'b', 'c'],
                'my_index')

        # assert that the method only gets called once, since the error is not
        # transient.
        self.assertEqual(delete_docs_counter.times_called, 1)
        self.assertEqual(e.exception.original_exception, error)


class SearchQueryTests(test_utils.GenericTestBase):
    """Test searching for documents in an index."""

    def test_search_all_documents(self):
        doc1 = search.Document(doc_id='doc1', language='en', rank=1, fields=[
            search.TextField(name='k', value='abc def ghi')])
        doc2 = search.Document(doc_id='doc2', language='en', rank=2, fields=[
            search.TextField(name='k', value='abc jkl mno')])
        doc3 = search.Document(doc_id='doc3', language='en', rank=3, fields=[
            search.TextField(name='k', value='abc jkl ghi')])
        index = search.Index('my_index')
        index.put([doc1, doc2, doc3])
        result = gae_search_services.search('k:abc', 'my_index')[0]
        self.assertIn({
            'id': 'doc1', 'k': 'abc def ghi', 'rank': 1, 'language_code': 'en'
        }, result)
        self.assertIn({
            'id': 'doc2', 'k': 'abc jkl mno', 'rank': 2, 'language_code': 'en'
        }, result)
        self.assertIn({
            'id': 'doc3', 'k': 'abc jkl ghi', 'rank': 3, 'language_code': 'en'
        }, result)

    def test_respect_search_query(self):
        doc1 = search.Document(doc_id='doc1', rank=1, language='en', fields=[
            search.TextField(name='k', value='abc def ghi')])
        doc2 = search.Document(doc_id='doc2', rank=1, language='en', fields=[
            search.TextField(name='k', value='abc jkl mno')])
        doc3 = search.Document(doc_id='doc3', rank=1, language='en', fields=[
            search.TextField(name='k', value='abc jkl ghi')])
        index = search.Index('my_index')
        index.put([doc1, doc2, doc3])
        result = gae_search_services.search('k:jkl', 'my_index')[0]
        self.assertNotIn({
            'id': 'doc1', 'k': 'abc def ghi', 'language_code': 'en', 'rank': 1
        }, result)
        self.assertIn({
            'id': 'doc2', 'k': 'abc jkl mno', 'language_code': 'en', 'rank': 1
        }, result)
        self.assertIn({
            'id': 'doc3', 'k': 'abc jkl ghi', 'language_code': 'en', 'rank': 1
        }, result)

    def test_respect_limit(self):
        doc1 = search.Document(doc_id='doc1', fields=[
            search.TextField(name='k', value='abc def ghi')])
        doc2 = search.Document(doc_id='doc2', fields=[
            search.TextField(name='k', value='abc jkl mno')])
        doc3 = search.Document(doc_id='doc3', fields=[
            search.TextField(name='k', value='abc jkl ghi')])
        index = search.Index('my_index')
        index.put([doc1, doc2, doc3])
        result = gae_search_services.search('k:abc', 'my_index', limit=2)[0]
        self.assertEqual(len(result), 2)

    def test_use_cursor(self):
        doc1 = search.Document(doc_id='doc1', language='en', rank=1, fields=[
            search.TextField(name='k', value='abc def ghi')])
        doc2 = search.Document(doc_id='doc2', language='en', rank=1, fields=[
            search.TextField(name='k', value='abc jkl mno')])
        doc3 = search.Document(doc_id='doc3', language='en', rank=1, fields=[
            search.TextField(name='k', value='abc jkl ghi')])
        index = search.Index('my_index')
        index.put([doc1, doc2, doc3])
        result1, cursor = gae_search_services.search(
            'k:abc', 'my_index', limit=2)
        result2, cursor = gae_search_services.search(
            'k:abc', 'my_index', cursor=cursor)
        self.assertEqual(len(result1), 2)
        self.assertEqual(len(result2), 1)
        dict1 = {'id': 'doc1', 'k': 'abc def ghi', 'language_code': 'en',
                 'rank': 1}
        self.assertIn(dict1, result1 + result2)
        dict2 = {'id': 'doc2', 'k': 'abc jkl mno', 'language_code': 'en',
                 'rank': 1}
        self.assertIn(dict2, result1 + result2)
        dict3 = {'id': 'doc3', 'k': 'abc jkl ghi', 'language_code': 'en',
                 'rank': 1}
        self.assertIn(dict3, result1 + result2)

    def test_ids_only(self):
        doc1 = search.Document(doc_id='doc1', fields=[
            search.TextField(name='k', value='abc def ghi')])
        doc2 = search.Document(doc_id='doc2', fields=[
            search.TextField(name='k', value='abc jkl mno')])
        doc3 = search.Document(doc_id='doc3', fields=[
            search.TextField(name='k', value='abc jkl ghi')])
        index = search.Index('my_index')
        index.put([doc1, doc2, doc3])
        result = gae_search_services.search(
            'k:abc', 'my_index', ids_only=True)[0]
        self.assertIn('doc1', result)
        self.assertIn('doc2', result)
        self.assertIn('doc3', result)

    def test_cursor_is_none_if_no_more_results(self):
        doc1 = search.Document(doc_id='doc1', fields=[
            search.TextField(name='k', value='abc def ghi')])
        doc2 = search.Document(doc_id='doc2', fields=[
            search.TextField(name='k', value='abc jkl mno')])
        doc3 = search.Document(doc_id='doc3', fields=[
            search.TextField(name='k', value='abc jkl ghi')])
        index = search.Index('my_index')
        index.put([doc1, doc2, doc3])
        cursor = gae_search_services.search('k:abc', 'my_index')[1]
        self.assertIsNone(cursor)

    def test_default_rank_is_descending_date(self):
        # Time is only saved with 1 second accuracy,
        # so I'm putting a 1 second delay between puts.
        dict1 = {'id': 'doc1', 'k': 'abc def'}
        dict2 = {'id': 'doc2', 'k': 'abc ghi'}
        dict3 = {'id': 'doc3', 'k': 'abc jkl'}
        gae_search_services.add_documents_to_index([dict1], 'my_index')
        time.sleep(1)
        gae_search_services.add_documents_to_index([dict2], 'my_index')
        time.sleep(1)
        gae_search_services.add_documents_to_index([dict3], 'my_index')
        result = gae_search_services.search(
            'k:abc', index='my_index', ids_only=True)[0]
        self.assertEqual(result, ['doc3', 'doc2', 'doc1'])

    def test_search_with_custom_rank_and_language(self):
        doc1 = {'id': 'doc1', 'k': 'abc def', 'rank': 3, 'language_code': 'en'}
        doc2 = {'id': 'doc2', 'k': 'abc ghi', 'rank': 1, 'language_code': 'fr'}
        doc3 = {'id': 'doc3', 'k': 'abc jkl', 'rank': 2, 'language_code': 'nl'}
        gae_search_services.add_documents_to_index([doc1, doc2, doc3], 'index')
        result = gae_search_services.search('k:abc', index='index')[0]
        self.assertEqual(result, [doc1, doc3, doc2])

    def test_search_using_single_sort_expression(self):
        doc1 = {'id': 'doc1', 'k': 'abc ghi'}
        doc2 = {'id': 'doc2', 'k': 'abc def'}
        doc3 = {'id': 'doc3', 'k': 'abc jkl'}
        gae_search_services.add_documents_to_index([doc1, doc2, doc3], 'index')

        result = gae_search_services.search('k:abc', 'index', sort='+k')[0]
        self.assertEqual(result[0].get('id'), 'doc2')
        self.assertEqual(result[1].get('id'), 'doc1')
        self.assertEqual(result[2].get('id'), 'doc3')

        result = gae_search_services.search('k:abc', 'index', sort='-k')[0]
        self.assertEqual(result[0].get('id'), 'doc3')
        self.assertEqual(result[1].get('id'), 'doc1')
        self.assertEqual(result[2].get('id'), 'doc2')

    def test_search_using_multiple_sort_expressions(self):
        doc1 = {'id': 'doc1', 'k1': 2, 'k2': 'abc ghi'}
        doc2 = {'id': 'doc2', 'k1': 1, 'k2': 'abc def'}
        doc3 = {'id': 'doc3', 'k1': 1, 'k2': 'abc jkl'}
        gae_search_services.add_documents_to_index([doc1, doc2, doc3], 'index')

        result = gae_search_services.search(
            'k2:abc', 'index', sort='+k1 -k2')[0]
        self.assertEqual(result[0].get('id'), 'doc3')
        self.assertEqual(result[1].get('id'), 'doc2')
        self.assertEqual(result[2].get('id'), 'doc1')

    def test_use_default_num_retries(self):
        exception = search.TransientError('oops')
        failing_index_search = test_utils.FailingFunction(
            search.Index.search,
            exception,
            gae_search_services.DEFAULT_NUM_RETRIES)

        search_counter = test_utils.CallCounter(gae_search_services.search)

        search_ctx = self.swap(search.Index, 'search', failing_index_search)
        search_counter_ctx = self.swap(
            gae_search_services, 'search', search_counter)
        assert_raises_ctx = self.assertRaises(
            gae_search_services.SearchFailureError)
        with search_ctx, search_counter_ctx, assert_raises_ctx as context_mgr:
            gae_search_services.search('query', 'my_index')

        self.assertEqual(context_mgr.exception.original_exception, exception)

        self.assertEqual(
            search_counter.times_called,
            gae_search_services.DEFAULT_NUM_RETRIES)

    def test_use_custom_number_of_retries(self):
        exception = search.TransientError('oops')
        failing_index_search = test_utils.FailingFunction(
            search.Index.search,
            exception,
            3)

        search_counter = test_utils.CallCounter(gae_search_services.search)

        index_ctx = self.swap(search.Index, 'search', failing_index_search)
        search_counter_ctx = self.swap(
            gae_search_services, 'search', search_counter)
        assert_raises_ctx = self.assertRaises(
            gae_search_services.SearchFailureError)
        with index_ctx, search_counter_ctx, assert_raises_ctx:
            gae_search_services.search('query', 'my_index', retries=3)

        self.assertEqual(search_counter.times_called, 3)

    def test_arguments_are_preserved_in_retries(self):
        for i in xrange(3):
            doc = search.Document(doc_id='doc%d' % i, fields=[
                search.TextField('prop', 'val'),
                search.NumberField('index', i)
            ])
            search.Index('my_index').put(doc)

        exception = search.TransientError('oops')
        failing_index_search = test_utils.FailingFunction(
            search.Index.search, exception, 3)

        search_counter = test_utils.CallCounter(gae_search_services.search)

        gae_search_ctx = self.swap(
            search.Index, 'search', failing_index_search)
        search_counter_ctx = self.swap(
            gae_search_services, 'search', search_counter)
        with gae_search_ctx, search_counter_ctx:
            result, cursor = gae_search_services.search(
                'prop:val',
                'my_index',
                sort='-index',
                limit=2,
                ids_only=True,
                retries=4)

        failing_index_search2 = test_utils.FailingFunction(
            search.Index.search,
            exception,
            3)

        search_counter2 = test_utils.CallCounter(gae_search_services.search)

        gae_search_ctx2 = self.swap(
            search.Index, 'search', failing_index_search2)
        search_counter_ctx2 = self.swap(
            gae_search_services, 'search', search_counter2)
        with gae_search_ctx2, search_counter_ctx2:
            result2, cursor = gae_search_services.search(
                'prop:val',
                'my_index',
                sort='-index',
                limit=2,
                cursor=cursor,
                ids_only=True,
                retries=4)

        self.assertEqual(search_counter.times_called, 4)
        self.assertEqual(result, ['doc2', 'doc1'])

        # also check that the cursor is preserved
        self.assertEqual(search_counter2.times_called, 4)
        self.assertEqual(result2, ['doc0'])


class SearchGetFromIndexTests(test_utils.GenericTestBase):
    def test_get_document_from_index(self):
        document = search.Document(doc_id="my_doc", fields=[
            search.TextField(name="my_field", value="value")
        ])
        search.Index('my_index').put(document)
        result = gae_search_services.get_document_from_index(
            'my_doc', 'my_index')
        self.assertEqual(result.get('id'), 'my_doc')
        self.assertEqual(result.get('my_field'), 'value')
