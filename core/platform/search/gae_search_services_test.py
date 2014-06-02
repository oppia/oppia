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

"""Tests for the appengine search api wrapper"""

__author__ = 'Frederik Creemers'

from google.appengine.api import search

from core.platform.search import gae_search_services
from core.tests import test_utils

import feconf

import datetime


class SearchAddToIndexTests(test_utils.GenericTestBase):
    """Test inserting documents into search indexes"""

    def test_insert_document_with_id(self):
        date_today = datetime.date.today()
        # most ther methods of getting a datetime also give microseconds, which aren't preserved by the search api
        # which makes equality tests fail. In oppia, we probably don't care about microseconds
        datetime_obj = datetime.datetime.combine(date_today, datetime.datetime.min.time()) + datetime.timedelta(days=2, hours=11, seconds=15)

        doc_id = 'abcdefghijklmnop'
        doc = {'id': doc_id,
               'numberfield': 5,
               'stringfield': 'abc',
               'datefield': date_today,
               'datetimefield': datetime_obj}
        result = gae_search_services.add_documents_to_index([doc], 'my_index')
        self.assertEqual(result, [doc_id])
        result_doc = search.Index('my_index').get(doc_id)

        self.assertEqual(result_doc.doc_id, doc_id)
        self.assertEqual(result_doc.field('numberfield').value, 5)
        self.assertEqual(result_doc.field('stringfield').value, 'abc')
        #The search api returns date fields as datetime fields with time at midnight.
        self.assertEqual(result_doc.field('datefield').value, datetime.datetime.combine(date=date_today, time=datetime.datetime.min.time()))
        self.assertEqual(result_doc.field('datetimefield').value, datetime_obj)

    def test_insert_document_without_id(self):
        doc = {'abc': 'def'}
        result = gae_search_services.add_documents_to_index(documents=[doc], index='my_index')
        retrieved_doc = search.Index('my_index').get(result[0])
        self.assertEqual(retrieved_doc.field('abc').value, 'def')

    def test_insert_multiple_with_id(self):
        docs = [{'id': 'id' + str(n), 'name': 'doc' + str(n)} for n in xrange(10)]
        result = gae_search_services.add_documents_to_index(docs, 'my_index')
        index = search.Index('my_index')
        for n in xrange(10):
            retrieved_doc = index.get('id' + str(n))
            self.assertEqual(retrieved_doc.field('name').value, 'doc' + str(n))

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


class SearchRemoveFromIndexTests(test_utils.GenericTestBase):
    """Test deleting documents from search indexes"""

    def test_delete_single_document(self):
        doc = search.Document(doc_id='doc_id',fields=[search.TextField(name='k', value='v')])
        index = search.Index('my_index')
        index.put([doc])
        gae_search_services.delete_documents_from_index(['doc_id'], 'my_index')
        self.assertIsNone(index.get('doc_id'))

    def test_delete_multiple_documents(self):
        for i in xrange(10):
            doc = search.Document(doc_id='doc' + str(i), fields=[search.TextField(name='k', value='v' + str(i))])
            index = search.Index('my_index')
            index.put([doc])
        gae_search_services.delete_documents_from_index(['doc' + str(i) for i in xrange(10)], 'my_index')
        for i in xrange(10):
            self.assertIsNone(index.get('doc' + str(i)))


class SearchQueryTests(test_utils.GenericTestBase):
    """Test searching for documents in an index"""

    def test_search_all_documents(self):
        doc1 = search.Document(doc_id='doc1',fields=[search.TextField(name='k', value='abc def ghi')])
        doc2 = search.Document(doc_id='doc2',fields=[search.TextField(name='k', value='abc jkl mno')])
        doc3 = search.Document(doc_id='doc3',fields=[search.TextField(name='k', value='abc jkl ghi')])
        index = search.Index('my_index')
        index.put([doc1, doc2, doc3])
        result, cursor = gae_search_services.search('k:abc','my_index')
        self.assertIn({'id': 'doc1', 'k': 'abc def ghi'}, result)
        self.assertIn({'id': 'doc2', 'k': 'abc jkl mno'}, result)
        self.assertIn({'id': 'doc3', 'k': 'abc jkl ghi'}, result)

    def test_respect_search_query(self):
        doc1 = search.Document(doc_id='doc1',fields=[search.TextField(name='k', value='abc def ghi')])
        doc2 = search.Document(doc_id='doc2',fields=[search.TextField(name='k', value='abc jkl mno')])
        doc3 = search.Document(doc_id='doc3',fields=[search.TextField(name='k', value='abc jkl ghi')])
        index = search.Index('my_index')
        index.put([doc1, doc2, doc3])
        result, cursor = gae_search_services.search('k:jkl','my_index')
        self.assertNotIn({'id': 'doc1', 'k': 'abc def ghi'}, result)
        self.assertIn({'id': 'doc2', 'k': 'abc jkl mno'}, result)
        self.assertIn({'id': 'doc3', 'k': 'abc jkl ghi'}, result)

    def test_respect_limit(self):
        doc1 = search.Document(doc_id='doc1',fields=[search.TextField(name='k', value='abc def ghi')])
        doc2 = search.Document(doc_id='doc2',fields=[search.TextField(name='k', value='abc jkl mno')])
        doc3 = search.Document(doc_id='doc3',fields=[search.TextField(name='k', value='abc jkl ghi')])
        index = search.Index('my_index')
        index.put([doc1, doc2, doc3])
        result, cursor = gae_search_services.search('k:abc','my_index', limit=2)
        self.assertEqual(len(result), 2)

    def test_use_cursor(self):
        doc1 = search.Document(doc_id='doc1',fields=[search.TextField(name='k', value='abc def ghi')])
        doc2 = search.Document(doc_id='doc2',fields=[search.TextField(name='k', value='abc jkl mno')])
        doc3 = search.Document(doc_id='doc3',fields=[search.TextField(name='k', value='abc jkl ghi')])
        index = search.Index('my_index')
        index.put([doc1, doc2, doc3])
        result1, cursor = gae_search_services.search('k:abc','my_index', limit=2)
        result2, cursor = gae_search_services.search('k:abc','my_index', cursor=cursor)
        self.assertEqual(len(result1), 2)
        self.assertEqual(len(result2), 1)
        self.assertIn({'id': 'doc1', 'k': 'abc def ghi'}, result1 + result2)
        self.assertIn({'id': 'doc2', 'k': 'abc jkl mno'}, result1 + result2)
        self.assertIn({'id': 'doc3', 'k': 'abc jkl ghi'}, result1 + result2)

    def test_ids_only(self):
        import time
        doc1 = search.Document(doc_id='doc1',fields=[search.TextField(name='k', value='abc def ghi')])
        doc2 = search.Document(doc_id='doc2',fields=[search.TextField(name='k', value='abc jkl mno')])
        doc3 = search.Document(doc_id='doc3',fields=[search.TextField(name='k', value='abc jkl ghi')])
        index = search.Index('my_index')
        index.put([doc1, doc2, doc3])
        result, cursor = gae_search_services.search('k:abc','my_index', ids_only=True)
        self.assertIn({'id':'doc1'}, result)
        self.assertIn({'id':'doc2'}, result)
        self.assertIn({'id':'doc3'}, result)

    def test_cursor_is_none_if_no_more_results(self):
        doc1 = search.Document(doc_id='doc1',fields=[search.TextField(name='k', value='abc def ghi')])
        doc2 = search.Document(doc_id='doc2',fields=[search.TextField(name='k', value='abc jkl mno')])
        doc3 = search.Document(doc_id='doc3',fields=[search.TextField(name='k', value='abc jkl ghi')])
        index = search.Index('my_index')
        index.put([doc1, doc2, doc3])
        result, cursor = gae_search_services.search('k:abc','my_index')
        self.assertIsNone(cursor)

    def test_default_rank_is_descending_date(self):
        """Time is only saved with 1 second accuracy, so I'm putting a 1 second delay between puts."""
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
        dict1 = {'id': 'doc1', 'k': 'abc def', 'rank': 3}
        dict2 = {'id': 'doc2', 'k': 'abc ghi', 'rank': 1}
        dict3 = {'id': 'doc3', 'k': 'abc jkl', 'rank': 2}
        gae_search_services.add_documents_to_index([dict1, dict2, dict3], 'my_index')
        del dict1['rank']
        del dict2['rank']
        del dict3['rank']
        result, cursor = gae_search_services.search('k:abc', index='my_index')
        self.assertEqual(result, [dict1, dict3, dict2])

    def test_search_using_single_sort_expression(self):
        dict1 = {'id': 'doc1', 'k': 'abc ghi'}
        dict2 = {'id': 'doc2', 'k': 'abc def'}
        dict3 = {'id': 'doc3', 'k': 'abc jkl'}
        gae_search_services.add_documents_to_index([dict1, dict2, dict3], 'my_index')
        result, cursor = gae_search_services.search('k:abc', index='my_index', sort='+k')
        self.assertEqual(result, [dict2, dict1, dict3])
        result, cursor = gae_search_services.search('k:abc', index='my_index', sort='-k')
        self.assertEqual(result, [dict3, dict1, dict2])

    def test_search_using_multiple_sort_expressions(self):
        dict1 = {'id': 'doc1', 'k1': 2, 'k2': 'abc ghi'}
        dict2 = {'id': 'doc2', 'k1': 1, 'k2': 'abc def'}
        dict3 = {'id': 'doc3', 'k1': 1, 'k2': 'abc jkl'}
        gae_search_services.add_documents_to_index([dict1, dict2, dict3], 'my_index')
        result, cursor = gae_search_services.search('k2:abc', index='my_index', sort='+k1 -k2')
        self.assertEqual(result, [dict3, dict2, dict1])
