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
# sizeations under the License.

"""Tests for the python elastic search wrapper."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform.search import elastic_search_services
from core.tests import test_utils


class ElasticSearchUnitTests(test_utils.GenericTestBase):
    """Tests for the elastic search platform API."""

    def test_create_index_with_correct_input(self):
        correct_index_name = 'index1'
        correct_id = 'id'
        def mock_index(index, body, id): # pylint: disable=redefined-builtin
            self.assertEqual(index, correct_index_name)
            self.assertEqual(id, correct_id)
            self.assertEqual(body, {
                'id': correct_id
            })
            return {
                '_shards': {
                    'failed': 0
                }
            }
        with self.swap(elastic_search_services.ES, 'index', mock_index):
            elastic_search_services.add_documents_to_index([{
                'id': correct_id
            }], correct_index_name)

    def test_create_index_raises_exception_when_insertion_fails(self):
        correct_index_name = 'index1'
        correct_id = 'id'
        def mock_index(index, body, id): # pylint: disable=redefined-builtin
            self.assertEqual(index, correct_index_name)
            self.assertEqual(id, correct_id)
            self.assertEqual(body, {
                'id': correct_id
            })
            return {
                '_shards': {
                    'failed': 2
                }
            }
        documents = [
            {
                'id': correct_id
            }
        ]
        assert_raises_ctx = self.assertRaisesRegexp(
            Exception,
            'Failed to add document to index.')
        with assert_raises_ctx, self.swap(
            elastic_search_services.ES, 'index', mock_index):
            elastic_search_services.add_documents_to_index(
                documents, correct_index_name)

    def test_delete_succeeds_when_document_exists(self):
        elastic_search_services.add_documents_to_index([{
            'id': 'doc_id',
            'title': 'hello'
        }], 'index1')
        results, _ = elastic_search_services.search('hello', 'index1', [], [])
        self.assertEqual(len(results), 1)

        # Successful deletion.
        elastic_search_services.delete_documents_from_index(
            ['doc_id'], 'index1')
        results, _ = elastic_search_services.search('hello', 'index1', [], [])
        self.assertEqual(len(results), 0)

    def test_delete_ignores_documents_that_do_not_exist(self):
        elastic_search_services.add_documents_to_index([{
            'id': 'doc_id'
        }], 'index1')
        # The doc does not exist, but no exception is thrown.
        elastic_search_services.delete_documents_from_index(
            ['not_a_real_id'], 'index1')

    def test_delete_returns_without_error_when_index_does_not_exist(self):
        elastic_search_services.delete_documents_from_index(
            ['doc_id'], 'nonexistent_index')

    def test_clear_index(self):
        correct_index_name = 'index1'
        def mock_delete_by_query(index, body):
            self.assertEqual(index, correct_index_name)
            self.assertEqual(body, {
                'query':
                {
                    'match_all': {}
                }
            })
        swap_delete_by_query = self.swap(
            elastic_search_services.ES, 'delete_by_query', mock_delete_by_query)

        with swap_delete_by_query:
            elastic_search_services.clear_index(correct_index_name)

    def test_search_returns_ids_only(self):
        correct_index_name = 'index1'
        elastic_search_services.add_documents_to_index([{
            'id': 1,
            'source': {
                'param1': 1,
                'param2': 2
            }
        }, {
            'id': 12,
            'source': {
                'param1': 3,
                'param2': 4
            }
        }], correct_index_name)

        result, new_offset = (
            elastic_search_services.search(
                '', correct_index_name, [], [], offset='0',
                size=50, ids_only=True))
        self.assertEqual(result, [1, 12])
        self.assertIsNone(new_offset)

    def test_search_returns_full_response(self):
        correct_index_name = 'index1'
        elastic_search_services.add_documents_to_index([{
            'id': 1,
            'source': {
                'param1': 1,
                'param2': 2
            }
        }, {
            'id': 12,
            'source': {
                'param1': 3,
                'param2': 4
            }
        }], correct_index_name)

        result, new_offset = elastic_search_services.search(
            '', correct_index_name, [], [], offset='0', size=50, ids_only=False)
        self.assertEqual(result, [{
            'id': 1,
            'source': {
                'param1': 1,
                'param2': 2
            }
        }, {
            'id': 12,
            'source': {
                'param1': 3,
                'param2': 4
            }
        }])
        self.assertIsNone(new_offset)

    def test_search_returns_none_when_response_is_empty(self):
        result, new_offset = elastic_search_services.search(
            '', 'index', [], [], offset='0',
            size=50, ids_only=False)
        self.assertEqual(new_offset, None)
        self.assertEqual(result, [])

    def test_search_constructs_query_with_categories_and_languages(self):
        correct_index_name = 'index1'

        def mock_search(body, index, params):
            self.assertEqual(body, {
                'query': {
                    'bool': {
                        'filter': [{
                            'match': {
                                'category': '"my_category"',
                            }
                        }, {
                            'match': {
                                'language_code': '"en" "es"'
                            }
                        }],
                        'must': [],
                    }
                }
            })
            self.assertEqual(index, correct_index_name)
            self.assertEqual(params, {
                'from': 0,
                'size': 21
            })
            return {
                'hits': {
                    'hits': []
                }
            }

        swap_search = self.swap(
            elastic_search_services.ES, 'search', mock_search)
        with swap_search:
            result, new_offset = (
                elastic_search_services.search(
                    '', correct_index_name, ['my_category'], ['en', 'es']))
        self.assertEqual(result, [])
        self.assertIsNone(new_offset)

    def test_search_constructs_nonempty_query_with_categories_and_langs(self):
        correct_index_name = 'index1'

        def mock_search(body, index, params):
            self.assertEqual(body, {
                'query': {
                    'bool': {
                        'must': [{
                            'multi_match': {
                                'query': 'query'
                            }
                        }],
                        'filter': [{
                            'match': {
                                'category': '"my_category"',
                            }
                        }, {
                            'match': {
                                'language_code': '"en" "es"'
                            }
                        }]
                    }
                }
            })
            self.assertEqual(index, correct_index_name)
            self.assertEqual(params, {
                'from': 0,
                'size': 21
            })
            return {
                'hits': {
                    'hits': []
                }
            }

        swap_search = self.swap(
            elastic_search_services.ES, 'search', mock_search)
        with swap_search:
            result, new_offset = (
                elastic_search_services.search(
                    'query', correct_index_name, ['my_category'], ['en', 'es']))
        self.assertEqual(result, [])
        self.assertIsNone(new_offset)

    def test_search_returns_the_right_number_of_docs_even_if_more_exist(self):
        elastic_search_services.add_documents_to_index([{
            'id': 'doc_id1',
            'title': 'hello world'
        }, {
            'id': 'doc_id2',
            'title': 'hello me'
        }], 'index')
        results, new_offset = elastic_search_services.search(
            'hello', 'index', [], [], size=1)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], 'doc_id1')
        self.assertEqual(new_offset, '1')

        results, new_offset = elastic_search_services.search(
            'hello', 'index', [], [], offset=1, size=1)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], 'doc_id2')
        self.assertIsNone(new_offset)

    def test_search_returns_without_error_when_index_does_not_exist(self):
        result, new_offset = elastic_search_services.search(
            'query', 'nonexistent_index', [], [])
        self.assertEqual(result, [])
        self.assertEqual(new_offset, None)
