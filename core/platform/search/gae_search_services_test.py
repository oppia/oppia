# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.#
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

"""Tests for the appengine search api wrapper. """

__author__ = 'Frederik Creemers'

import datetime

from google.appengine.api import search

from core.platform.search import gae_search_services
from core.tests import test_utils


class SearchAddToIndexTests(test_utils.GenericTestBase):
    """Test inserting documents into search indexes"""

    def test_insert_document_with_id(self):
        date = datetime.date(year=2015, month=3, day=14)
        dt = datetime.datetime(year=1991, month=6, day=20, hour=16, minute=30,
                               second=14)

        doc_id = 'abcdefghijklmnop'
        doc = {'id': doc_id,
               'numberfield': 5,
               'stringfield': 'abc',
               'datefield': date,
               'datetimefield': dt}
        result = gae_search_services.add_documents_to_index([doc], 'my_index')
        self.assertEqual(result, [doc_id])
        result_doc = search.Index('my_index').get(doc_id)

        self.assertEqual(result_doc.doc_id, doc_id)
        self.assertEqual(result_doc.field('numberfield').value, 5)
        self.assertEqual(result_doc.field('stringfield').value, 'abc')
        # The search api returns date fields as datetime fields with
        # time at midnight.
        self.assertEqual(result_doc.field('datefield').value,
                         datetime.datetime.combine(date=date,
                                                   time=datetime.datetime.min.time()))
        self.assertEqual(result_doc.field('datetimefield').value, dt)

    def test_insert_document_without_id(self):
        doc = {'abc': 'def'}
        result = gae_search_services.add_documents_to_index([doc], 'my_index')
        retrieved_doc = search.Index('my_index').get(result[0])
        self.assertEqual(retrieved_doc.field('abc').value, 'def')

    def test_insert_multiple_with_id(self):
        docs = [{'id': 'id' + str(n), 'name': 'doc' + str(n)} for n in range(5)]
        result = gae_search_services.add_documents_to_index(docs, 'my_index')
        index = search.Index('my_index')
        for n in range(5):
            retrieved_doc = index.get('id' + str(n))
            self.assertEqual(retrieved_doc.field('name').value, 'doc' + str(n))

    def test_insert_document_with_multi_valued_property(self):
        doc = {'id': 'doc', 'prop': ['val1', 'val2', 'val3']}
        gae_search_services.add_documents_to_index([doc], 'index', _multi=True)
        resultdoc = search.Index('index').get('doc')
        values = set([field.value for field in resultdoc['prop']])
        self.assertEqual(values, {'val1', 'val2', 'val3'})

    def test_disallow_unsuported_value_types(self):
        with self.assertRaises(ValueError):
            doc = {'abc': set('xyz')}
            gae_search_services.add_documents_to_index(doc, 'my_index')

    def test_add_document_with_rank(self):
        doc = {'id': 'my_doc', 'field': 'value', 'rank': 42}
        gae_search_services.add_documents_to_index([doc],'my_index')
        index = search.Index('my_index')
        self.assertEqual(index.get('my_doc').rank, 42)

    def test_add_document_with_existing_id_updates_it(self):
        doc1 = {'id': 'doc', 'version': 1, 'rank': 10}
        doc2 = {'id': 'doc', 'version': 2, 'rank': 20}
        gae_search_services.add_documents_to_index([doc1], 'my_index'   )
        index = search.Index('my_index')
        self.assertEqual(index.get('doc').field('version').value, 1)
        self.assertEqual(index.get('doc').rank, 10)
        gae_search_services.add_documents_to_index([doc2], 'my_index')
        self.assertEqual(index.get('doc').field('version').value, 2)
        self.assertEqual(index.get('doc').rank, 20)

    def test_index_must_be_string(self):
        with self.assertRaises(ValueError):
            gae_search_services.add_documents_to_index(
                {'id': 'one', 'key': 'value'}, search.Index('test'))

    def test_use_default_num_retries(self):
        doc = {'id': 'doc', 'prop': 'val'}
        exception = search.TransientError('oops')
        wrapped = test_utils.succeed_after_n_tries(search.Index.put,
                                        gae_search_services.DEFAULT_NUM_RETRIES,
                                        exception)

        counter = test_utils.CallCounter(gae_search_services.add_documents_to_index)

        with self.swap(search.Index, 'put', wrapped),\
             self.swap(gae_search_services, 'add_documents_to_index', counter),\
             self.assertRaises(gae_search_services.SearchFailureError) as cm:
            gae_search_services.add_documents_to_index([doc], 'my_index')

        self.assertEqual(cm.exception.original_exception, exception)

        self.assertEqual(counter.times_called,
                         gae_search_services.DEFAULT_NUM_RETRIES)

    def test_use_custom_number_of_retries(self):
        doc = {'id': 'doc', 'prop': 'val'}
        exception = search.TransientError('oops')
        wrapped = test_utils.succeed_after_n_tries(search.Index.put, 42, exception)

        counter = test_utils.CallCounter(gae_search_services.add_documents_to_index)

        with self.swap(search.Index, 'put', wrapped),\
             self.swap(gae_search_services, 'add_documents_to_index', counter),\
             self.assertRaises(gae_search_services.SearchFailureError) as cm:
            gae_search_services.add_documents_to_index([doc], 'my_index', 42)

        self.assertEqual(counter.times_called, 42)

    def test_arguments_are_preserved_in_retries(self):
        doc = {'id': 'doc', 'prop': 'val'}
        exception = search.TransientError('oops')
        wrapped = test_utils.succeed_after_n_tries(search.Index.put, 3, exception)

        counter = test_utils.CallCounter(gae_search_services.add_documents_to_index)

        with self.swap(search.Index, 'put', wrapped),\
             self.swap(gae_search_services, 'add_documents_to_index', counter):
            gae_search_services.add_documents_to_index([doc], 'my_index', 4)

        self.assertEqual(counter.times_called, 4)
        result = search.Index('my_index').get('doc')
        self.assertEqual(result.field('prop').value, 'val')

    def _get_put_error(self, num_res, transient=False):
        """returns a PutError. with num_res results.
           If transient is given, it should be an index in the
           results array. The result at that index will have a transient
           error code."""
        non_trans_code = search.OperationResult.INVALID_REQUEST
        trans_code = search.OperationResult.TRANSIENT_ERROR
        r = [search.PutResult(code=non_trans_code) for i in range(num_res)]
        if transient:
            r[transient] = search.PutResult(code=trans_code)
        return search.PutError('lol', r)

    def test_put_error_with_transient_result(self):
        docs = [{'id': 'doc1', 'prop': 'val1'},
                {'id': 'doc2', 'prop': 'val2'},
                {'id': 'doc3', 'prop': 'val3'}]
        error = self._get_put_error(3, 1)
        wrapped = test_utils.succeed_after_n_tries(search.Index.put, 4, error)
        counter = test_utils.CallCounter(gae_search_services.add_documents_to_index)
        with self.swap(search.Index, 'put', wrapped),\
             self.swap(gae_search_services, 'add_documents_to_index', counter):
            gae_search_services.add_documents_to_index(docs, 'my_index', 5)

        self.assertEqual(counter.times_called, 5)
        for i in xrange(1, 4):
            result = search.Index('my_index').get('doc' + str(i))
            self.assertEqual(result.field('prop').value, 'val' + str(i))

    def test_put_error_without_transient_result(self):
        docs = [{'id': 'doc1', 'prop': 'val1'},
                {'id': 'doc2', 'prop': 'val2'},
                {'id': 'doc3', 'prop': 'val3'}]
        error = self._get_put_error(3)
        wrapped = test_utils.succeed_after_n_tries(search.Index.put, 1, error)
        counter = test_utils.CallCounter(gae_search_services.add_documents_to_index)
        with self.swap(gae_search_services, 'add_documents_to_index', counter),\
             self.swap(search.Index, 'put', wrapped),\
             self.assertRaises(gae_search_services.SearchFailureError) as e:
            gae_search_services.add_documents_to_index(docs, 'my_index')

        # assert that the method only gets called once, since the error is not
        # transient.
        self.assertEqual(counter.times_called, 1)
        self.assertEqual(e.exception.original_exception, error)


class SearchRemoveFromIndexTests(test_utils.GenericTestBase):
    """Test deleting documents from search indexes."""

    def test_delete_single_document(self):
        doc = search.Document(doc_id='doc_id',fields=[
            search.TextField(name='k',value='v')])
        index = search.Index('my_index')
        index.put([doc])
        gae_search_services.delete_documents_from_index(['doc_id'], 'my_index')
        self.assertIsNone(index.get('doc_id'))

    def test_delete_multiple_documents(self):
        index = search.Index('my_index')
        for i in xrange(10):
            doc = search.Document(doc_id='doc' + str(i),
                                  fields=[search.TextField(name='k',
                                                           value='v' + str(i))])
            index.put([doc])
        gae_search_services.delete_documents_from_index(
            ['doc' + str(i) for i in xrange(10)], 'my_index')
        for i in xrange(10):
            self.assertIsNone(index.get('doc' + str(i)))

    def test_doc_ids_must_be_strings(self):
        with self.assertRaises(ValueError):
            gae_search_services.delete_documents_from_index(['d1',{'id': 'd2'}],
                                                            'index')

    def test_index_must_be_string(self):
        with self.assertRaises(ValueError):
            gae_search_services.delete_documents_from_index(['doc_id'],
                                                            search.Index('ind'))

    def test_use_default_num_retries(self):
        exception = search.TransientError('oops')
        wrapped = test_utils.succeed_after_n_tries(search.Index.delete,
                                        gae_search_services.DEFAULT_NUM_RETRIES,
                                        exception)

        counter = test_utils.CallCounter(gae_search_services.delete_documents_from_index)

        with self.swap(search.Index, 'delete', wrapped),\
             self.swap(gae_search_services, 'delete_documents_from_index',
                       counter),\
             self.assertRaises(gae_search_services.SearchFailureError) as cm:
            gae_search_services.delete_documents_from_index(['doc'], 'my_index')

        self.assertEqual(cm.exception.original_exception, exception)

        self.assertEqual(counter.times_called,
                         gae_search_services.DEFAULT_NUM_RETRIES)

    def test_use_custom_number_of_retries(self):
        exception = search.TransientError('oops')
        wrapped = test_utils.succeed_after_n_tries(search.Index.delete, 42, exception)

        counter = test_utils.CallCounter(gae_search_services.delete_documents_from_index)

        with self.swap(search.Index, 'delete', wrapped),\
             self.swap(gae_search_services, 'delete_documents_from_index',
                       counter),\
             self.assertRaises(gae_search_services.SearchFailureError) as cm:
            gae_search_services.delete_documents_from_index(['id'], 'index', 42)

        self.assertEqual(counter.times_called, 42)

    def test_arguments_are_preserved_in_retries(self):
        index = search.Index('index')
        index.put([search.Document(doc_id='doc', fields=[
            search.TextField(name='prop',value='val')
        ])])
        exception = search.TransientError('oops')
        wrapped = test_utils.succeed_after_n_tries(search.Index.delete, 3, exception)

        counter = test_utils.CallCounter(gae_search_services.delete_documents_from_index)

        with self.swap(search.Index, 'delete', wrapped),\
             self.swap(gae_search_services, 'delete_documents_from_index',
                       counter):
            gae_search_services.delete_documents_from_index(['doc'], 'index', 4)

        self.assertEqual(counter.times_called, 4)
        result = search.Index('my_index').get('doc')
        self.assertIsNone(result)

    def _get_delete_error(self, num_res, transient=False):
        """returns a DeleteError. with num_res results.
           If transient is given, it should be an index in the
           results array. The result at that index will have a transient
           error code."""
        non_trans_code = search.OperationResult.INVALID_REQUEST
        trans_code = search.OperationResult.TRANSIENT_ERROR
        r = [search.DeleteResult(code=non_trans_code) for i in range(num_res)]
        if transient:
            r[transient] = search.PutResult(code=trans_code)
        return search.DeleteError('lol', r)

    def test_delete_error_with_transient_result(self):
        error = self._get_delete_error(3, 1)
        wrapped = test_utils.succeed_after_n_tries(search.Index.delete, 4, error)
        counter = test_utils.CallCounter(gae_search_services.delete_documents_from_index)
        index = search.Index('my_index')
        for i in xrange(3):
            index.put(search.Document(doc_id='d' + str(i), fields=[
                search.TextField(name='prop', value='value')
            ]))

        with self.swap(search.Index, 'delete', wrapped),\
             self.swap(gae_search_services, 'delete_documents_from_index',
                       counter):
            gae_search_services.delete_documents_from_index(['d0','d1', 'd2'],
                                                            'my_index', 5)

        self.assertEqual(counter.times_called, 5)
        for i in xrange(1, 4):
            result = search.Index('my_index').get('doc' + str(i))
            self.assertIsNone(result)

    def test_put_error_without_transient_result(self):
        error = self._get_delete_error(3)
        wrapped = test_utils.succeed_after_n_tries(search.Index.delete, 1, error)
        counter = test_utils.CallCounter(gae_search_services.delete_documents_from_index)
        with self.swap(gae_search_services, 'delete_documents_from_index',
                       counter),\
             self.swap(search.Index, 'delete', wrapped),\
             self.assertRaises(gae_search_services.SearchFailureError) as e:
            gae_search_services.delete_documents_from_index(['a', 'b',' c'],
                                                            'my_index')

        # assert that the method only gets called once, since the error is not
        # transient
        self.assertEqual(counter.times_called, 1)
        self.assertEqual(e.exception.original_exception, error)


class SearchQueryTests(test_utils.GenericTestBase):
    """Test searching for documents in an index."""

    def test_search_all_documents(self):
        doc1 = search.Document(doc_id='doc1',fields=[
            search.TextField(name='k', value='abc def ghi')])
        doc2 = search.Document(doc_id='doc2',fields=[
            search.TextField(name='k', value='abc jkl mno')])
        doc3 = search.Document(doc_id='doc3',fields=[
            search.TextField(name='k', value='abc jkl ghi')])
        index = search.Index('my_index')
        index.put([doc1, doc2, doc3])
        result, cursor = gae_search_services.search('k:abc','my_index')
        self.assertIn({'id': 'doc1', 'k': 'abc def ghi'}, result)
        self.assertIn({'id': 'doc2', 'k': 'abc jkl mno'}, result)
        self.assertIn({'id': 'doc3', 'k': 'abc jkl ghi'}, result)

    def test_respect_search_query(self):
        doc1 = search.Document(doc_id='doc1',fields=[
            search.TextField(name='k', value='abc def ghi')])
        doc2 = search.Document(doc_id='doc2',fields=[
            search.TextField(name='k', value='abc jkl mno')])
        doc3 = search.Document(doc_id='doc3',fields=[
            search.TextField(name='k', value='abc jkl ghi')])
        index = search.Index('my_index')
        index.put([doc1, doc2, doc3])
        result, cursor = gae_search_services.search('k:jkl','my_index')
        self.assertNotIn({'id': 'doc1', 'k': 'abc def ghi'}, result)
        self.assertIn({'id': 'doc2', 'k': 'abc jkl mno'}, result)
        self.assertIn({'id': 'doc3', 'k': 'abc jkl ghi'}, result)

    def test_respect_limit(self):
        doc1 = search.Document(doc_id='doc1',fields=[
            search.TextField(name='k', value='abc def ghi')])
        doc2 = search.Document(doc_id='doc2',fields=[
            search.TextField(name='k', value='abc jkl mno')])
        doc3 = search.Document(doc_id='doc3',fields=[
            search.TextField(name='k', value='abc jkl ghi')])
        index = search.Index('my_index')
        index.put([doc1, doc2, doc3])
        result, cursor = gae_search_services.search('k:abc','my_index', limit=2)
        self.assertEqual(len(result), 2)

    def test_use_cursor(self):
        doc1 = search.Document(doc_id='doc1',fields=[
            search.TextField(name='k', value='abc def ghi')])
        doc2 = search.Document(doc_id='doc2',fields=[
            search.TextField(name='k', value='abc jkl mno')])
        doc3 = search.Document(doc_id='doc3',fields=[
            search.TextField(name='k', value='abc jkl ghi')])
        index = search.Index('my_index')
        index.put([doc1, doc2, doc3])
        result1, cursor = gae_search_services.search('k:abc','my_index', limit=2)
        result2, cursor = gae_search_services.search('k:abc','my_index',
                                                     cursor=cursor)
        self.assertEqual(len(result1), 2)
        self.assertEqual(len(result2), 1)
        self.assertIn({'id': 'doc1', 'k': 'abc def ghi'}, result1 + result2)
        self.assertIn({'id': 'doc2', 'k': 'abc jkl mno'}, result1 + result2)
        self.assertIn({'id': 'doc3', 'k': 'abc jkl ghi'}, result1 + result2)

    def test_ids_only(self):
        doc1 = search.Document(doc_id='doc1',fields=[
            search.TextField(name='k', value='abc def ghi')])
        doc2 = search.Document(doc_id='doc2',fields=[
            search.TextField(name='k', value='abc jkl mno')])
        doc3 = search.Document(doc_id='doc3',fields=[
            search.TextField(name='k', value='abc jkl ghi')])
        index = search.Index('my_index')
        index.put([doc1, doc2, doc3])
        result, cursor = gae_search_services.search('k:abc','my_index', ids_only=True)
        self.assertIn({'id':'doc1'}, result)
        self.assertIn({'id':'doc2'}, result)
        self.assertIn({'id':'doc3'}, result)

    def test_cursor_is_none_if_no_more_results(self):
        doc1 = search.Document(doc_id='doc1',fields=[
            search.TextField(name='k', value='abc def ghi')])
        doc2 = search.Document(doc_id='doc2',fields=[
            search.TextField(name='k', value='abc jkl mno')])
        doc3 = search.Document(doc_id='doc3',fields=[
            search.TextField(name='k', value='abc jkl ghi')])
        index = search.Index('my_index')
        index.put([doc1, doc2, doc3])
        result, cursor = gae_search_services.search('k:abc','my_index')
        self.assertIsNone(cursor)

    def test_default_rank_is_descending_date(self):
        # Time is only saved with 1 second accuracy,
        # so I'm putting a 1 second delay between puts.
        import time
        dict1 = {'id': 'doc1', 'k': 'abc def'}
        dict2 = {'id': 'doc2', 'k': 'abc ghi'}
        dict3 = {'id': 'doc3', 'k': 'abc jkl'}
        gae_search_services.add_documents_to_index([dict1], 'my_index')
        time.sleep(1)
        gae_search_services.add_documents_to_index([dict2], 'my_index')
        time.sleep(1)
        gae_search_services.add_documents_to_index([dict3], 'my_index')
        result, cursor = gae_search_services.search('k:abc', index='my_index')
        self.assertEqual(result, [dict3, dict2, dict1])

    def test_search_with_custom_rank(self):
        doc1 = {'id': 'doc1', 'k': 'abc def', 'rank': 3}
        doc2 = {'id': 'doc2', 'k': 'abc ghi', 'rank': 1}
        doc3 = {'id': 'doc3', 'k': 'abc jkl', 'rank': 2}
        gae_search_services.add_documents_to_index([doc1, doc2, doc3], 'index')
        del doc1['rank']
        del doc2['rank']
        del doc3['rank']
        result, cursor = gae_search_services.search('k:abc', index='index')
        self.assertEqual(result, [doc1, doc3, doc2])

    def test_search_using_single_sort_expression(self):
        doc1 = {'id': 'doc1', 'k': 'abc ghi'}
        doc2 = {'id': 'doc2', 'k': 'abc def'}
        doc3 = {'id': 'doc3', 'k': 'abc jkl'}
        gae_search_services.add_documents_to_index([doc1, doc2, doc3], 'index')
        result, cursor = gae_search_services.search('k:abc', 'index', sort='+k')
        self.assertEqual(result, [doc2, doc1, doc3])
        result, cursor = gae_search_services.search('k:abc', 'index', sort='-k')
        self.assertEqual(result, [doc3, doc1, doc2])

    def test_search_using_multiple_sort_expressions(self):
        doc1 = {'id': 'doc1', 'k1': 2, 'k2': 'abc ghi'}
        doc2 = {'id': 'doc2', 'k1': 1, 'k2': 'abc def'}
        doc3 = {'id': 'doc3', 'k1': 1, 'k2': 'abc jkl'}
        gae_search_services.add_documents_to_index([doc1, doc2, doc3], 'index')
        result, cursor = gae_search_services.search('k2:abc', 'index',
                                                    sort='+k1 -k2')
        self.assertEqual(result, [doc3, doc2, doc1])

    def test_use_default_num_retries(self):
        exception = search.TransientError('oops')
        wrapped = test_utils.succeed_after_n_tries(search.Index.search,
                                        gae_search_services.DEFAULT_NUM_RETRIES,
                                        exception)

        counter = test_utils.CallCounter(gae_search_services.search)

        with self.swap(search.Index, 'search', wrapped),\
             self.swap(gae_search_services, 'search', counter),\
             self.assertRaises(gae_search_services.SearchFailureError) as cm:
            gae_search_services.search('query', 'my_index')

        self.assertEqual(cm.exception.original_exception, exception)

        self.assertEqual(counter.times_called,
                         gae_search_services.DEFAULT_NUM_RETRIES)

    def test_use_custom_number_of_retries(self):
        exception = search.TransientError('oops')
        wrapped = test_utils.succeed_after_n_tries(search.Index.search, 42, exception)

        counter = test_utils.CallCounter(gae_search_services.search)

        with self.swap(search.Index, 'search', wrapped),\
             self.swap(gae_search_services, 'search', counter),\
             self.assertRaises(gae_search_services.SearchFailureError) as cm:
            gae_search_services.search('query', 'my_index', retries=42)

        self.assertEqual(counter.times_called, 42)

    def test_arguments_are_preserved_in_retries(self):
        for i in xrange(3):
            doc = search.Document(doc_id='doc' + str(i), fields=[
                search.TextField('prop','val'),
                search.NumberField('index', i)
            ])
            search.Index('my_index').put(doc)

        exception = search.TransientError('oops')
        wrapped = test_utils.succeed_after_n_tries(search.Index.search, 3, exception)

        counter = test_utils.CallCounter(gae_search_services.search)

        with self.swap(search.Index, 'search', wrapped),\
             self.swap(gae_search_services, 'search', counter):
            result, cursor = gae_search_services.search('prop:val', 'my_index',
                                                        sort='-index', limit=2,
                                                        ids_only=True, retries=4)
        # reset the counter and failing function to
        # also test that 'cursor' is preserved.
        wrapped = test_utils.succeed_after_n_tries(search.Index.search, 3, exception)

        counter2 = test_utils.CallCounter(gae_search_services.search)

        with self.swap(search.Index, 'search', wrapped),\
             self.swap(gae_search_services, 'search', counter2):
            result2, cursor = gae_search_services.search('prop:val', 'my_index',
                                                         sort='-index', limit=2,
                                                         cursor=cursor,
                                                         ids_only=True,
                                                         retries=4)

        self.assertEqual(counter.times_called, 4)
        self.assertEqual(result, [{'id': 'doc2'}, {'id': 'doc1'}])

        # also check that the cursor is preserved
        self.assertEqual(counter2.times_called, 4)
        self.assertEqual(result2, [{'id': 'doc0'}])