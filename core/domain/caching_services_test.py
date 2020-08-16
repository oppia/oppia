# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

from constants import constants
from core.domain import caching_domain
from core.domain import caching_services
from core.domain import collection_domain
from core.domain import exp_domain
from core.domain import platform_parameter_domain as parameter_domain
from core.domain import skill_domain
from core.domain import story_domain
from core.domain import topic_domain
from core.tests import test_utils
import feconf


class CachingServicesUnitTests(test_utils.GenericTestBase):
    """Tests for caching_services."""

    def test_retrieved_memory_profile_contains_correct_elements(self):
        memory_profile = caching_services.get_memory_cache_stats()
        self.assertIsInstance(memory_profile, caching_domain.MemoryCacheStats)
        self.assertIsNotNone(memory_profile.total_allocated_in_bytes)
        self.assertIsNotNone(memory_profile.peak_memory_usage_in_bytes)
        self.assertIsNotNone(memory_profile.total_number_of_keys_stored)

    def test_flush_cache_wipes_cache_clean(self):
        """Tests whether flushing the cache removes the elements in the
        cache.
        """
        key_value_mapping = {'a': '1', 'b': '2', 'c': '3'}
        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, key_value_mapping)
        exploration_id = 'id'
        default_exploration = (
            exp_domain.Exploration.create_default_exploration(
                'exp_id_1', title='A title', category='A category'))
        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            '0',
            {
                exploration_id: default_exploration
            })

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT, None,
                ['a', 'b', 'c']), key_value_mapping)

        self.assertIsNotNone(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_EXPLORATION,
                '0',
                [exploration_id]
            ).get(exploration_id))

        caching_services.flush_memory_cache()

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT, None,
                ['a', 'b', 'c']), {})
        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_EXPLORATION,
                '0',
                [exploration_id]),
            {})

    def test_serialization_and_deserialization_returns_the_same_object(self):
        deserialize = (
            caching_services.DESERIALIZATION_FUNCTIONS['exploration'])
        serialize = (
            caching_services.SERIALIZATION_FUNCTIONS['exploration']
        )
        default_exploration = (
            exp_domain.Exploration.create_default_exploration(
                'exp_id_1', title='A title', category='A category'))
        self.assertEqual(
            default_exploration.to_dict(),
            deserialize(serialize(default_exploration)).to_dict())

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

        invalid_sub_namespace = 'sub:namespace'
        with self.assertRaisesRegexp(
            ValueError,
            'Sub-namespace %s cannot contain \':\'.' % invalid_sub_namespace):
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT,
                invalid_sub_namespace, ['a', 'b', 'c'])

    def test_get_multi_correctly_retrieves_cache_elements(self):
        """Testing that querying the cache for elements where either all of the
        ids exist or don't exist in the cache returns reasonable output.
        """
        # Key value mapping tests that strings, numbers, booleans, floats,
        # lists, and Nonetypes are all correctly set and get from the cache.
        key_value_mapping = {
            'a': '1', 'b': 2, 'c': [True, None],
            'd': {
                'd.1': 1.2,
                'd.2': 30
            }}

        exploration_id = 'id'

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT, None,
                ['a', 'b', 'c', 'd']), {})
        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_EXPLORATION,
                '0',
                [exploration_id]),
            {})

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, key_value_mapping)
        default_exploration = (
            exp_domain.Exploration.create_default_exploration(
                'exp_id_1', title='A title', category='A category'))
        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            '0',
            {
                exploration_id: default_exploration
            })

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT, None,
                ['a', 'b', 'c', 'd']),
            key_value_mapping)

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT, None, ['e', 'f']),
            {})

        exp_ids_to_explorations = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            '0', [exploration_id])
        self.assertEqual(
            default_exploration.to_dict(),
            exp_ids_to_explorations[exploration_id].to_dict())

    def test_partial_fetches_returns_correct_elements(self):
        """Testing that querying the cache returns reasonable output for
        elements where only a subsection of the queried ids exist in the cache.
        """
        key_value_mapping = {'a': '1', 'c': '3'}
        exploration_id = 'id'
        nonexistent_exploration_id = 'id2'
        default_exploration = (
            exp_domain.Exploration.create_default_exploration(
                'exp_id_1', title='A title', category='A category'))

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_EXPLORATION,
                '0',
                [exploration_id]),
            {})

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT, None,
                ['a', 'b', 'c']), {})

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT, None, []),
            {})

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            '0',
            {
                exploration_id: default_exploration
            })

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, key_value_mapping)

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT, None,
                ['a', 'b', 'c']),
            {'a': '1', 'c': '3'})

        result = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            '0',
            [exploration_id, nonexistent_exploration_id])

        self.assertEqual(
            default_exploration.to_dict(),
            result.get(exploration_id).to_dict())

        self.assertFalse(nonexistent_exploration_id in result)

    def test_queries_to_wrong_namespace_returns_none(self):
        exploration_id = 'id'
        default_exploration = (
            exp_domain.Exploration.create_default_exploration(
                'exp_id_1', title='A title', category='A category'))

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            '0',
            {
                exploration_id: default_exploration
            })

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT,
                '0',
                [exploration_id]), {})

    def test_queries_to_wrong_sub_namespace_returns_none(self):
        exploration_id = 'id'
        default_exploration = (
            exp_domain.Exploration.create_default_exploration(
                'exp_id_1', title='A title', category='A category'))

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_EXPLORATION,
                '1',
                [exploration_id]), {})

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            '1',
            {
                exploration_id: default_exploration
            })

        existent_result = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            '1',
            [exploration_id])
        self.assertEqual(
            existent_result.get(exploration_id).to_dict(),
            default_exploration.to_dict())

    def test_set_multi_returns_true_for_successful_insert_into_cache(self):
        key_value_mapping = {'a': '1', 'b': '2', 'c': '3'}
        cache_strings_response = caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, key_value_mapping)
        self.assertTrue(cache_strings_response)

        exploration_id = 'id'
        default_exploration = (
            exp_domain.Exploration.create_default_exploration(
                'exp_id_1', title='A title', category='A category'))
        cache_exploration_response = caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            '0',
            {
                exploration_id: default_exploration
            })
        self.assertTrue(cache_exploration_response)

        cache_empty_list_response = caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, {})
        self.assertTrue(cache_empty_list_response)

    def test_delete_multi_returns_true_when_all_ids_exist(self):
        key_value_mapping = {'a': '1', 'b': '2', 'c': '3'}

        self.assertFalse(
            caching_services.delete_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT, None,
                ['a', 'b', 'c']))

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, key_value_mapping)

        exploration_id = 'id'
        default_exploration = (
            exp_domain.Exploration.create_default_exploration(
                'exp_id_1', title='A title', category='A category'))
        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            '0', {
                exploration_id: default_exploration
            })

        self.assertTrue(
            caching_services.delete_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT, None, []))

        self.assertTrue(
            caching_services.delete_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT, None,
                ['a', 'b', 'c']))

        self.assertGreater(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_EXPLORATION,
                '0', [exploration_id]),
            0)

        self.assertTrue(
            caching_services.delete_multi(
                caching_services.CACHE_NAMESPACE_EXPLORATION,
                '0', [exploration_id]))

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_EXPLORATION,
                '0', [exploration_id]),
            {})

    def test_delete_multi_returns_false_when_not_all_ids_exist(self):
        """Tests that deleting keys that don't exist returns false."""
        key_value_mapping = {'a': '1', 'b': '2', 'c': '3'}

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, key_value_mapping)

        self.assertFalse(
            caching_services.delete_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT, None,
                ['a', 'e', 'f']))

    def test_delete_multi_returns_false_when_namespace_incorrect(self):
        key_value_mapping = {'a': '1', 'b': '2', 'c': '3'}

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, key_value_mapping)

        self.assertFalse(
            caching_services.delete_multi(
                caching_services.CACHE_NAMESPACE_EXPLORATION, None,
                ['a', 'b', 'c']))

    def test_delete_multi_returns_false_when_sub_namespace_incorrect(self):
        key_value_mapping = {'a': '1', 'b': '2', 'c': '3'}

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, key_value_mapping)

        self.assertFalse(
            caching_services.delete_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT,
                'invalid_sub_namespace', ['a', 'b', 'c']))

    def test_all_namespace_strings_does_not_contain_memcache_delimiter(self):
        # SERIALIZATION_FUNCTIONS contains all the namespaces as keys in the
        # dictionary.
        for namespace in caching_services.SERIALIZATION_FUNCTIONS:
            self.assertNotIn(caching_services.MEMCACHE_KEY_DELIMITER, namespace)

    def test_unicode_characters_are_set_and_get_correctly_in_default_namespace(
            self):
        # Test to make sure that unicode characters are still inserted and
        # deleted correctly from the cache.
        key_value_mapping = {
            'a': '%#$', 'b': '\t',
            'c': '😃😄'
        }
        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT, None,
                ['a', 'b', 'c']),
            {})
        cache_strings_response = caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_DEFAULT, None, key_value_mapping)
        self.assertTrue(cache_strings_response)

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_DEFAULT, None,
                ['a', 'b', 'c']),
            {
                'a': '%#$', 'b': '\t',
                'c': '😃😄'
            })

    def test_explorations_with_unicode_characters_are_set_and_get_correctly(
            self):
        """Test to make sure that a default exploration initialized with unicode
        characters is get and set to the cache without errors.
        """
        exploration_id = 'id'

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_EXPLORATION,
                '0',
                [exploration_id]),
            {})

        default_exploration = (
            exp_domain.Exploration.create_default_exploration(
                exploration_id, title='A title',
                category='A category 😍',
                objective='Objective',
                language_code=['en', 'zh']
            ))

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            '0',
            {
                exploration_id: default_exploration
            })

        exp_ids_to_explorations = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_EXPLORATION,
            '0', [exploration_id])

        self.assertEqual(
            default_exploration.to_dict(),
            exp_ids_to_explorations[exploration_id].to_dict())

    def test_collections_with_unicode_characters_are_set_and_get_correctly(
            self):
        """Test to make sure that a default collection initialized with unicode
        characters is get and set to the cache without errors.
        """
        collection_id = 'id 😍'

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_COLLECTION,
                '0',
                [collection_id]),
            {})

        default_collection = (
            collection_domain.Collection.create_default_collection(
                collection_id))

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_COLLECTION,
            '0',
            {
                collection_id: default_collection
            })

        collections = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_COLLECTION,
            '0', [collection_id])

        self.assertEqual(
            default_collection.to_dict(),
            collections[collection_id].to_dict())

    def test_skills_with_unicode_characters_are_set_and_get_correctly(
            self):
        """Test to make sure that a default skill initialized with unicode
        characters is get and set to the cache without errors.
        """
        skill_id = 'id'

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_SKILL,
                '0',
                [skill_id]),
            {})

        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0],
                ['<p>[NOTE: Creator should fill this in]</p> 😍']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1],
                ['<p>[NOTE: Creator should fill this in]</p> 😍']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2],
                ['<p>[NOTE: Creator should fill this in]</p> 😍'])]

        default_skill = (
            skill_domain.Skill.create_default_skill(
                skill_id, 'Description 😍', rubrics))

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_SKILL,
            '0',
            {
                skill_id: default_skill
            })

        skills = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_SKILL,
            '0', [skill_id])

        self.assertEqual(
            default_skill.to_dict(),
            skills[skill_id].to_dict())

    def test_topics_with_unicode_characters_are_set_and_get_correctly(
            self):
        """Test to make sure that a default topics initialized with unicode
        characters is get and set to the cache without errors.
        """
        topic_id = 'id'

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_TOPIC,
                '0',
                [topic_id]),
            {})

        default_topic = (
            topic_domain.Topic.create_default_topic(
                topic_id, 'Name 😍', 'abbrev 😍',
                'description 😍'))

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_TOPIC,
            '0',
            {
                topic_id: default_topic
            })

        topics = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_TOPIC,
            '0', [topic_id])

        self.assertEqual(
            default_topic.to_dict(),
            topics[topic_id].to_dict())

    def test_stories_with_unicode_characters_are_set_and_get_correctly(
            self):
        """Test to make sure that a default story initialized with unicode
        characters is get and set to the cache without errors.
        """
        story_id = 'id'
        topic_id = 'topic_id'

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_STORY,
                '0',
                [story_id]),
            {})

        default_story = (
            story_domain.Story.create_default_story(
                story_id, 'Title 😍',
                'Description 😍', topic_id,
                'title 😍'))

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_STORY,
            '0',
            {
                story_id: default_story
            })

        stories = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_STORY,
            '0', [story_id])

        self.assertEqual(
            default_story.to_dict(),
            stories[story_id].to_dict())

    def test_platform_parameters_with_unicode_are_set_and_get_correctly(
            self):
        """Test to make sure that a default platform parameter initialized with
        unicode characters is get and set to the cache without errors.
        """
        platform_parameter_id = 'id'

        self.assertEqual(
            caching_services.get_multi(
                caching_services.CACHE_NAMESPACE_PLATFORM_PARAMETER,
                '0',
                [platform_parameter_id]),
            {})

        default_parameter = parameter_domain.PlatformParameter.from_dict({
            'name': 'parameter_a 😍',
            'description': '😍😍😍😍',
            'data_type': 'bool',
            'rules': [
                {
                    'filters': [
                        {'type': 'server_mode', 'conditions': [['=', 'prod']]}],
                    'value_when_matched': True
                }
            ],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': False,
            'is_feature': True,
            'feature_stage': 'test 😍',
        })

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_PLATFORM_PARAMETER,
            '0',
            {
                platform_parameter_id: default_parameter
            })

        platform_parameters = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_PLATFORM_PARAMETER,
            '0', [platform_parameter_id])

        self.assertEqual(
            default_parameter.to_dict(),
            platform_parameters[platform_parameter_id].to_dict())
