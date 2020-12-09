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

import json

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
        documents = [
            {
                'id': correct_id
            }
        ]
        with self.swap(
            elastic_search_services.ES, 'index', mock_index):
            elastic_search_services.add_documents_to_index(
                documents, correct_index_name)

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

    def test_delete_index_using_correct_params(self):
        correct_index_name = 'index1'
        correct_id = 'id'
        def mock_delete(index, id): # pylint: disable=redefined-builtin
            self.assertEqual(index, correct_index_name)
            self.assertEqual(id, correct_id)
            return {
                '_shards': {
                    'failed': 0
                }
            }

        ids = [correct_id]

        def mock_exists(index, id): # pylint: disable=redefined-builtin
            self.assertEqual(index, correct_index_name)
            self.assertEqual(id, correct_id)
            return True

        swap_delete = self.swap(
            elastic_search_services.ES, 'delete', mock_delete)
        swap_exists = self.swap(
            elastic_search_services.ES, 'exists', mock_exists)
        with swap_delete, swap_exists:
            elastic_search_services.delete_documents_from_index(
                ids, correct_index_name)

    def test_delete_index_raises_exception_when_index_does_not_exist(self):
        correct_index_name = 'index1'
        correct_id = 'id'
        def mock_delete(index, id): # pylint: disable=redefined-builtin
            self.assertEqual(index, correct_index_name)
            self.assertEqual(id, correct_id)
            return {
                '_shards': {
                    'failed': 0
                }
            }

        ids = [correct_id]

        def mock_exists(index, id): # pylint: disable=redefined-builtin
            self.assertEqual(index, correct_index_name)
            self.assertEqual(id, correct_id)
            return False

        swap_delete = self.swap(
            elastic_search_services.ES, 'delete', mock_delete)
        swap_exists = self.swap(
            elastic_search_services.ES, 'exists', mock_exists)
        assert_raises_ctx = self.assertRaisesRegexp(
            Exception,
            'Document id does not exist: %s' % correct_id)

        with assert_raises_ctx, swap_delete, swap_exists:
            elastic_search_services.delete_documents_from_index(
                ids, correct_index_name)

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

    def test_get_document_from_index(self):
        correct_index_name = 'index1'
        correct_id = 'id'
        document = {
            'item1': 'a',
            'item2': 'b',
            'item3': 'c'
        }
        def mock_get(index, id): # pylint: disable=redefined-builtin
            self.assertEqual(index, correct_index_name)
            self.assertEqual(id, correct_id)

            return {
                '_source': document
            }

        swap_get = self.swap(
            elastic_search_services.ES, 'get', mock_get)
        with swap_get:
            response = elastic_search_services.get_document_from_index(
                correct_id, correct_index_name)

        self.assertEqual(response, document)

    def test_search_returns_ids_only(self):
        query = {
            'match_all': {}
        }
        correct_index_name = 'index1'
        json_str = json.dumps(query)
        offset = 30
        size = 50
        documents = [
            {
                '_id': 1,
                '_source': {
                    'param1': 1,
                    'param2': 2
                }
            },
            {
                '_id': 12,
                '_source': {
                    'param1': 3,
                    'param2': 4
                }
            }
        ]
        def mock_search(body, index, params):
            self.assertEqual(body, query)
            self.assertEqual(index, correct_index_name)
            self.assertEqual(params['size'], size)
            self.assertEqual(params['from'], offset)
            return {
                'hits': {
                    'hits': documents
                }
            }

        swap_search = self.swap(
            elastic_search_services.ES, 'search', mock_search)
        with swap_search:
            result, new_offset = (
                elastic_search_services.search(
                    json_str, correct_index_name, offset=offset,
                    size=size, ids_only=True))
        self.assertEqual(new_offset, size + offset)
        self.assertEqual(result, [1, 12])

    def test_search_returns_full_response(self):
        query = {
            'match_all': {}
        }
        correct_index_name = 'index1'
        json_str = json.dumps(query)
        offset = 30
        size = 50
        documents = [
            {
                '_id': 1,
                '_source': {
                    'param1': 1,
                    'param2': 2
                }
            },
            {
                '_id': 12,
                '_source': {
                    'param1': 3,
                    'param2': 4
                }
            }
        ]
        def mock_search(body, index, params):
            self.assertEqual(body, query)
            self.assertEqual(index, correct_index_name)
            self.assertEqual(params['size'], size)
            self.assertEqual(params['from'], offset)
            return {
                'hits': {
                    'hits': documents
                }
            }

        swap_search = self.swap(
            elastic_search_services.ES, 'search', mock_search)
        with swap_search:
            result, new_offset = (
                elastic_search_services.search(
                    json_str, correct_index_name, offset=offset,
                    size=size, ids_only=False))
        self.assertEqual(new_offset, offset + size)
        self.assertEqual(
            result, [document['_source'] for document in documents])

    def test_search_returns_none_when_response_is_empty(self):
        query = {
            'match_all': {}
        }
        correct_index_name = 'index1'
        json_str = json.dumps(query)
        offset = 30
        size = 50
        def mock_search(body, index, params):
            self.assertEqual(body, query)
            self.assertEqual(index, correct_index_name)
            self.assertEqual(params['size'], size)
            self.assertEqual(params['from'], offset)
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
                    json_str, correct_index_name, offset=offset,
                    size=size, ids_only=False))
        self.assertEqual(new_offset, None)
        self.assertEqual(result, [])
