# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for methods in core.domain.caching_services"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import caching_services
from core.domain import exp_domain
from core.tests import test_utils

import python_utils


class CachingServicesUnitTests(test_utils.GenericTestBase):
    """Tests for caching_services."""

    def test_flush_cache_wipes_cache_clean(self):
        """Tests whether flushing the cache removes the elements in the
        cache.
        """
        key_value_mapping = {'a': '1', 'b': '2', 'c': '3'}
        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, key_value_mapping)
        exploration_key = 'key'
        default_exploration = (
            exp_domain.Exploration.create_default_exploration(
                'exp_id_1', title='A title', category='A category'))
        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            python_utils.convert_to_bytes(0),
            {
                exploration_key: default_exploration
            })
        caching_services.flush_memory_cache()
        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT, None,
                ['a', 'b', 'c']), {})
        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_EXPLORATION,
                python_utils.convert_to_bytes(0),
                [exploration_key]),
            {})

    def test_invalid_namespace_raises_error(self):
        invalid_namespace = 'invalid'
        key_value_mapping = {'a': '1', 'b': '2', 'c': '3'}

        with self.assertRaisesRegexp(
            ValueError,
            'Invalid namespace: %s.' % invalid_namespace):
            caching_services.set_multi(
                invalid_namespace, None,
                key_value_mapping)

        with self.assertRaisesRegexp(
            ValueError,
            'Invalid namespace: %s.' % invalid_namespace):
            caching_services.get_multi(
                invalid_namespace, None,
                ['a', 'b', 'c'])

        with self.assertRaisesRegexp(
            ValueError,
            'Invalid namespace: %s.' % invalid_namespace):
            caching_services.delete_multi(
                invalid_namespace, None, ['a', 'b', 'c'])

    def test_get_multi_correctly_retrieves_cache_elements(self):
        key_value_mapping = {'a': '1', 'b': '2', 'c': '3'}
        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, key_value_mapping)
        exploration_key = 'key'
        default_exploration = (
            exp_domain.Exploration.create_default_exploration(
                'exp_id_1', title='A title', category='A category'))
        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            python_utils.convert_to_bytes(0),
            {
                exploration_key: default_exploration
            })
        result = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, ['a', 'b', 'c'])
        self.assertEqual(result, key_value_mapping)
        result = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, ['d', 'e'])
        self.assertEqual(result, {})
        result = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, [])
        self.assertEqual(result, {})
        result = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            python_utils.convert_to_bytes(0), [exploration_key])
        self.assertEqual(
            default_exploration.to_dict(),
            result.get(exploration_key).to_dict())

    def test_set_multi_correctly_sets_elements(self):
        key_value_mapping = {'a': '1', 'b': '2', 'c': '3'}
        cache_strings_response = caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, key_value_mapping)
        self.assertTrue(cache_strings_response)

        exploration_key = 'key'
        default_exploration = (
            exp_domain.Exploration.create_default_exploration(
                'exp_id_1', title='A title', category='A category'))
        cache_exploration_response = caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            python_utils.convert_to_bytes(0),
            {
                exploration_key: default_exploration
            })
        self.assertTrue(cache_exploration_response)

        cache_empty_list_response = caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, {})
        self.assertTrue(cache_empty_list_response)

    def test_delete_multi_correctly_deletes_cache_elements(self):
        key_value_mapping = {'a': '1', 'b': '2', 'c': '3'}
        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, key_value_mapping)

        exploration_key = 'key'
        default_exploration = (
            exp_domain.Exploration.create_default_exploration(
                'exp_id_1', title='A title', category='A category'))
        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            python_utils.convert_to_bytes(0), {
                exploration_key: default_exploration
            })

        is_successful = caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, [])
        self.assertTrue(is_successful)

        is_successful = caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, ['a', 'b', 'c'])
        self.assertTrue(is_successful)

        is_successful = caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, ['d', 'e', 'f'])
        self.assertFalse(is_successful)

        is_successful = caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            python_utils.convert_to_bytes(0), [exploration_key])
        self.assertTrue(is_successful)

        result = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            python_utils.convert_to_bytes(0), [exploration_key])
        self.assertEqual(result, {})
