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

'''Tests for the appengine search api wrapper'''

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
        datetime_obj = datetime.datetime.combine(date_today, datetime.datetime.min.time()) + datetime.timedelta(days=2,hours=11,seconds=15)

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
        doc1 = search.Document(doc_id='doc1',fields=[search.TextField(name='k', value='abc def ghi')])
        doc2 = search.Document(doc_id='doc2',fields=[search.TextField(name='k', value='abc jkl mno')])
        doc3 = search.Document(doc_id='doc3',fields=[search.TextField(name='k', value='abc jkl ghi')])
        index = search.Index('my_index')
        index.put([doc1, doc2, doc3])
        result, cursor = gae_search_services.search('k:abc','my_index', ids_only=True)
        self.assertIn({'id':'doc1'}, result)
        self.assertIn({'id':'doc2'}, result)
        self.assertIn({'id':'doc3'}, result)
