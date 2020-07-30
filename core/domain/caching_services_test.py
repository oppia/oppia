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
from core.domain import collection_domain
from core.domain import exp_domain
from core.domain import skill_domain
from core.domain import story_domain
from core.domain import topic_domain
from core.domain import exp_fetchers
from core.domain import collection_services
from core.domain import topic_fetchers
from core.domain import skill_fetchers
from core.domain import story_fetchers
from core.tests import test_utils


class CachingServicesUnitTests(test_utils.GenericTestBase):
    """Tests for caching_services."""

    def setUp(self):
        super(CachingServicesUnitTests, self).setUp()
        self.keys = ['a', 'b', 'c']
        self.non_existent_keys = ['d', 'e']
        # Redis can only store strings so integers must be casted to correct
        # values.
        self.key_value_mapping = {'a': '1', 'b': '2', 'c': '3'}
        self.string_caching_response = caching_services.set_multi(
            self.key_value_mapping)
        self.key_base_string = 'key'
        self.default_exploration = (
            exp_domain.Exploration.create_default_exploration(
                'exp_id_1', title='A title', category='A category'))
        self.exploration_caching_response = caching_services.set_multi(
            {
                exp_fetchers.get_exploration_memcache_key(
                    self.key_base_string) : self.default_exploration
            })

    def test_flush_cache_wipes_cache_clean(self):
        caching_services.flush_memory_cache()
        self.assertEqual(
            caching_services.get_multi(self.keys), {})
        exploration_key = exp_fetchers.get_exploration_memcache_key(
            self.key_base_string)
        self.assertEqual(caching_services.get_multi([exploration_key]), {})


    def test_correct_type_retrieval_from_key(self):
        """ Tests that correct memory cache keys will return the correct
        object types associated with that key.
        """
        self.assertEqual(
            caching_services._get_correct_type_of_key(
                exp_fetchers.get_exploration_memcache_key(self.key_base_string)),
            exp_domain.Exploration)
        self.assertEqual(
            caching_services._get_correct_type_of_key(
                collection_services._get_collection_memcache_key(
                    self.key_base_string)),
            collection_domain.Collection)
        self.assertEqual(
            caching_services._get_correct_type_of_key(
                topic_fetchers.get_topic_memcache_key(self.key_base_string)),
            topic_domain.Topic)
        self.assertEqual(
            caching_services._get_correct_type_of_key(
                skill_fetchers.get_skill_memcache_key(self.key_base_string)),
            skill_domain.Skill)
        self.assertEqual(
            caching_services._get_correct_type_of_key(
                story_fetchers.get_story_memcache_key(self.key_base_string)),
            story_domain.Story)
        self.assertEqual(
            caching_services._get_correct_type_of_key(
                self.key_base_string), None)

    def test_get_multi_correctly_retrieves_cache_elements(self):
        result = caching_services.get_multi(self.keys)
        self.assertEqual(result, self.key_value_mapping)
        result = caching_services.get_multi(self.non_existent_keys)
        self.assertEqual(result, {})
        result = caching_services.get_multi([])
        self.assertEqual(result, {})
        exploration_key = exp_fetchers.get_exploration_memcache_key(
            self.key_base_string)
        result = caching_services.get_multi([exploration_key])
        self.assertEqual(
            self.default_exploration.to_dict(),
            result.get(exploration_key).to_dict())

    def test_set_multi_correctly_sets_elements(self):
        self.assertTrue(self.string_caching_response)
        self.assertTrue(self.exploration_caching_response)
        result = caching_services.set_multi({})
        self.assertTrue(result)

    def test_delete_multi_correctly_deletes_cache_elements(self):
        is_successful = caching_services.delete_multi([])
        self.assertTrue(is_successful)
        is_successful = caching_services.delete_multi(
            self.keys)
        self.assertTrue(is_successful)
        is_successful = caching_services.delete_multi(
            ['d', 'e', 'f'])
        self.assertFalse(is_successful)
        exploration_key = exp_fetchers.get_exploration_memcache_key(
            self.key_base_string)
        is_successful = caching_services.delete_multi([exploration_key])
        self.assertTrue(is_successful)
        result = caching_services.get_multi([exploration_key])
        self.assertEqual(result, {})
